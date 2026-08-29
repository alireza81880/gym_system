import { 
  PaymentRecord, 
  ExpenseRecord, 
  FinancialCharge, 
  FinancialKPIs, 
  PaymentMethod, 
  Student
} from '../../types';
import { PaymentRepository } from '../repositories/paymentRepository';
import { ChargeRepository } from '../repositories/chargeRepository';
import { MemberRepository } from '../repositories/memberRepository';
import { MembershipRepository, Membership } from '../repositories/membershipRepository';
import { DateService } from '../dateService';
import { generateFinancialId, generateReceiptNumber } from '../../utils/idGenerator';
import { AuditService } from '../auditService';

export interface SaleBreakdownResult {
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  receivedAmount: number;
  remainingDebt: number;
  isOverpaid: boolean;
  overpaidAmount: number;
  isFullPayment: boolean;
  isFree: boolean;
  isZeroPayment: boolean;
}

export interface MemberFinancialSummary {
  member: Student;
  currentMembership?: Membership;
  activeCharges: FinancialCharge[];
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  totalPaid: number;
  totalOutstanding: number;
  paymentHistory: PaymentRecord[];
  isFree: boolean;
  hasDebt: boolean;
}

export interface DailyTimeSeriesItem {
  date: string;
  jalaliFormatted: string;
  collected: number;
  sales: number;
  outstanding: number;
  refunds: number;
  expenses: number;
}

export class FinanceService {
  /**
   * Pure calculation function for sale breakdown & discounting
   */
  static calculateSaleBreakdown(
    basePrice: number,
    discountAmount: number = 0,
    receivedAmount: number = 0
  ): SaleBreakdownResult {
    const safeBase = Math.max(0, Math.round(Number(basePrice) || 0));
    const safeDiscount = Math.min(safeBase, Math.max(0, Math.round(Number(discountAmount) || 0)));
    const finalPrice = safeBase - safeDiscount;
    const safeReceived = Math.max(0, Math.round(Number(receivedAmount) || 0));

    const remainingDebt = Math.max(0, finalPrice - safeReceived);
    const isOverpaid = safeReceived > finalPrice && finalPrice > 0;
    const overpaidAmount = isOverpaid ? safeReceived - finalPrice : 0;
    const isFullPayment = safeReceived >= finalPrice && finalPrice > 0;
    const isFree = finalPrice === 0;
    const isZeroPayment = safeReceived === 0;

    return {
      basePrice: safeBase,
      discountAmount: safeDiscount,
      finalPrice,
      receivedAmount: safeReceived,
      remainingDebt,
      isOverpaid,
      overpaidAmount,
      isFullPayment,
      isFree,
      isZeroPayment,
    };
  }

  /**
   * Compute authoritative Dashboard Financial Metrics & KPIs
   * Follows strict Financial Truth rules:
   * - Sales Today: final price of sales created today (in gym timezone / target Jalali date)
   * - Collected Today: completed payments received today minus refunds today
   * - Outstanding Created Today: new unpaid debt created by today's sales
   * - Total Outstanding: total unpaid balances across all active charges/memberships
   * - Refunded Today: sum of refunds processed today
   */
  static getFinancialMetrics(options: {
    branchId?: string;
    tenantId?: string;
    targetDate?: string;
    startDate?: string;
    endDate?: string;
  } = {}): FinancialKPIs {
    const targetDate = options.targetDate || DateService.getTodayJalali();
    const branchId = options.branchId;
    const tenantId = options.tenantId;

    // 1. Initialize repositories
    PaymentRepository.initialize();
    ChargeRepository.initialize();
    MemberRepository.initialize();

    const allCharges = ChargeRepository.getAll();
    const allPayments = PaymentRepository.getAllPayments();
    const allExpenses = PaymentRepository.getAllExpenses();

    // 2. Filter charges by branch/tenant
    const scopedCharges = allCharges.filter(c => {
      if (branchId && c.branchId && c.branchId !== branchId) return false;
      if (tenantId && c.tenantId && c.tenantId !== tenantId) return false;
      return true;
    });

    // 3. Filter payments by branch/tenant
    const scopedPayments = allPayments.filter(p => {
      if (branchId && p.branchId && p.branchId !== branchId) return false;
      if (tenantId && p.tenantId && p.tenantId !== tenantId) return false;
      return true;
    });

    // 4. Sales metrics
    let salesToday = 0;
    let outstandingCreatedToday = 0;
    let totalOutstanding = 0;

    for (const c of scopedCharges) {
      if (c.status === 'cancelled') continue;

      // Charge created today
      if (c.date === targetDate) {
        salesToday += c.finalPrice;
        // The unpaid portion created on this sale today
        const initialUnpaid = Math.max(0, c.finalPrice - (c.paidAmount || 0));
        outstandingCreatedToday += initialUnpaid;
      }

      // Total outstanding across all active/unsettled charges
      if (c.status !== 'settled' && c.status !== 'free') {
        const out = Math.max(0, c.finalPrice - (c.paidAmount || 0));
        totalOutstanding += out;
      }
    }

    // 5. Collection and Refund metrics
    let collectedToday = 0;
    let refundedToday = 0;
    let totalRevenue = 0;
    let totalCoachPayouts = 0;

    for (const p of scopedPayments) {
      // Exclude voided payments
      if (p.status === 'voided') continue;

      const isToday = p.date === targetDate;

      if (p.type === 'coach_settlement') {
        totalCoachPayouts += p.amount;
        continue;
      }

      if (p.type === 'refund' || p.amount < 0) {
        const refundVal = Math.abs(p.amount);
        if (isToday) {
          refundedToday += refundVal;
          collectedToday -= refundVal;
        }
        totalRevenue -= refundVal;
      } else {
        // Normal positive payment
        const effectiveAmount = p.amount;
        if (isToday) {
          collectedToday += effectiveAmount;
        }
        totalRevenue += effectiveAmount;

        // Check if any partial refund happened today on this payment
        if (p.refunds && p.refunds.length > 0) {
          for (const rf of p.refunds) {
            if (rf.date === targetDate) {
              refundedToday += rf.amount;
              collectedToday -= rf.amount;
            }
          }
        }
      }
    }

    // 6. Expenses
    let totalOperationalExpenses = 0;
    for (const e of allExpenses) {
      if (branchId && e.branchId && e.branchId !== branchId) return;
      totalOperationalExpenses += e.amount;
    }

    const netProfit = totalRevenue - (totalOperationalExpenses + totalCoachPayouts);

    // Count debtors
    const members = MemberRepository.getAll();
    const debtors = members.filter(m => {
      if (branchId && m.branchId && m.branchId !== branchId) return false;
      return m.remainingDebt > 0;
    });

    return {
      salesToday,
      collectedToday: Math.max(0, collectedToday),
      outstandingCreatedToday,
      totalOutstanding,
      refundedToday,
      totalRevenue,
      totalOperationalExpenses,
      totalCoachPayouts,
      netProfit,
      debtorCount: debtors.length,
    };
  }

  /**
   * Get Daily Time Series for multi-line / area charts
   */
  static getDailyTimeSeries(options: {
    daysCount?: number;
    branchId?: string;
    tenantId?: string;
  } = {}): DailyTimeSeriesItem[] {
    const daysCount = options.daysCount || 7;
    const branchId = options.branchId;
    const tenantId = options.tenantId;

    PaymentRepository.initialize();
    ChargeRepository.initialize();

    const allPayments = PaymentRepository.getAllPayments();
    const allCharges = ChargeRepository.getAll();
    const allExpenses = PaymentRepository.getAllExpenses();

    const result: DailyTimeSeriesItem[] = [];
    const todayJalali = DateService.getTodayJalali();

    for (let i = daysCount - 1; i >= 0; i--) {
      const dateStr = i === 0 ? todayJalali : DateService.addDaysToJalali(todayJalali, -i);
      
      // Calculate sales for dateStr
      let sales = 0;
      let outstanding = 0;
      for (const c of allCharges) {
        if (c.status === 'cancelled') continue;
        if (branchId && c.branchId && c.branchId !== branchId) continue;
        if (tenantId && c.tenantId && c.tenantId !== tenantId) continue;

        if (c.date === dateStr) {
          sales += c.finalPrice;
          outstanding += Math.max(0, c.finalPrice - (c.paidAmount || 0));
        }
      }

      // Calculate collections, refunds, and expenses for dateStr
      let collected = 0;
      let refunds = 0;
      for (const p of allPayments) {
        if (p.status === 'voided') continue;
        if (branchId && p.branchId && p.branchId !== branchId) continue;
        if (tenantId && p.tenantId && p.tenantId !== tenantId) continue;

        if (p.date === dateStr) {
          if (p.type === 'refund' || p.amount < 0) {
            refunds += Math.abs(p.amount);
          } else if (p.type !== 'coach_settlement') {
            collected += p.amount;
          }
        }
      }

      let exp = 0;
      for (const e of allExpenses) {
        if (branchId && e.branchId && e.branchId !== branchId) continue;
        if (e.date === dateStr) {
          exp += e.amount;
        }
      }

      result.push({
        date: dateStr,
        jalaliFormatted: DateService.formatJalaliReadable(dateStr),
        collected: Math.max(0, collected - refunds),
        sales,
        outstanding,
        refunds,
        expenses: exp,
      });
    }

    return result;
  }

  /**
   * Get comprehensive Financial Summary for a single Member
   */
  static getMemberFinancialSummary(memberId: string): MemberFinancialSummary | null {
    MemberRepository.initialize();
    ChargeRepository.initialize();
    PaymentRepository.initialize();
    MembershipRepository.initialize();

    const member = MemberRepository.getById(memberId);
    if (!member) return null;

    const currentMembership = MembershipRepository.getActiveByMember(memberId);
    const activeCharges = ChargeRepository.getByMemberId(memberId).filter(c => c.status !== 'cancelled');
    const paymentHistory = PaymentRepository.getMemberPayments(memberId);

    let totalPrice = 0;
    let totalDiscount = 0;
    let totalFinal = 0;
    let totalPaid = 0;

    for (const c of activeCharges) {
      totalPrice += c.basePrice;
      totalDiscount += c.discountAmount;
      totalFinal += c.finalPrice;
      totalPaid += c.paidAmount;
    }

    // If no charges found (e.g. legacy imported member), derive from member entity
    if (activeCharges.length === 0) {
      totalPrice = member.totalFee || 0;
      totalFinal = member.totalFee || 0;
      totalPaid = member.paidAmount || 0;
    }

    const totalOutstanding = Math.max(0, totalFinal - totalPaid);
    const isFree = totalFinal === 0;

    return {
      member,
      currentMembership,
      activeCharges,
      basePrice: totalPrice,
      discountAmount: totalDiscount,
      finalPrice: totalFinal,
      totalPaid,
      totalOutstanding,
      paymentHistory,
      isFree,
      hasDebt: totalOutstanding > 0,
    };
  }

  /**
   * Record a Membership Sale / Charge (with optional initial payment and discount)
   */
  static recordMembershipSale(params: {
    memberId: string;
    memberName?: string;
    packageType: string;
    packageName?: string;
    basePrice: number;
    discountAmount?: number;
    discountReason?: string;
    approvedBy?: string;
    initialPayment: number;
    paymentMethod?: PaymentMethod;
    startDate: string;
    expireDate: string;
    sessionsTotal: number;
    coachId?: string;
    coachFee?: number;
    branchId?: string;
    tenantId?: string;
    recordedBy?: string;
    receiptNumber?: string;
  }): { charge: FinancialCharge; payment?: PaymentRecord } {
    ChargeRepository.initialize();
    PaymentRepository.initialize();
    MemberRepository.initialize();

    const breakdown = this.calculateSaleBreakdown(
      params.basePrice,
      params.discountAmount || 0,
      params.initialPayment || 0
    );

    const chargeId = generateFinancialId('chg');
    const todayJalali = params.startDate || DateService.getTodayJalali();
    const branchId = params.branchId || 'branch-tehran-central';
    const tenantId = params.tenantId || 'gym-org-1';

    // 1. Create Sale / Charge Record
    const charge: FinancialCharge = {
      id: chargeId,
      tenantId,
      branchId,
      memberId: params.memberId,
      memberName: params.memberName,
      packageType: params.packageType,
      packageName: params.packageName || params.packageType,
      basePrice: breakdown.basePrice,
      discountAmount: breakdown.discountAmount,
      discountReason: params.discountReason,
      approvedBy: params.approvedBy,
      finalPrice: breakdown.finalPrice,
      paidAmount: breakdown.receivedAmount,
      outstandingAmount: breakdown.remainingDebt,
      date: todayJalali,
      timestamp: new Date().toISOString(),
      status: breakdown.isFree ? 'free' : breakdown.remainingDebt === 0 ? 'settled' : 'active',
      isFree: breakdown.isFree,
      createdAt: new Date().toISOString(),
    };

    ChargeRepository.create(charge);

    // 2. Create Payment Record if initialPayment > 0
    let payment: PaymentRecord | undefined;
    if (breakdown.receivedAmount > 0) {
      payment = {
        id: generateFinancialId('pay'),
        tenantId,
        branchId,
        studentId: params.memberId,
        studentName: params.memberName,
        chargeId: charge.id,
        amount: breakdown.receivedAmount,
        date: todayJalali,
        timestamp: new Date().toISOString(),
        paymentMethod: params.paymentMethod || 'pos',
        type: 'tuition',
        description: `شهریه ثبت‌نام (${params.packageName || params.packageType})`,
        receiptNumber: params.receiptNumber || generateReceiptNumber(),
        recordedBy: params.recordedBy || 'پذیرش',
        status: 'completed',
      };
      PaymentRepository.addPayment(payment);
    }

    // 3. Update Member entity cached financial balances
    const member = MemberRepository.getById(params.memberId);
    if (member) {
      MemberRepository.updateMember(params.memberId, {
        totalFee: breakdown.finalPrice,
        paidAmount: breakdown.receivedAmount,
        remainingDebt: breakdown.remainingDebt,
        packageType: params.packageType,
        expireDate: params.expireDate,
        sessionsTotal: params.sessionsTotal,
        sessionsAttended: 0,
        status: 'active',
      });
    }

    // 4. Audit Log
    AuditService.logEvent({
      action: 'MEMBER_REGISTER',
      category: 'FINANCE',
      details: `فروش دوره ${params.packageName || params.packageType} برای ${params.memberName || params.memberId}: مبلغ نهایی ${breakdown.finalPrice}، دریافتی ${breakdown.receivedAmount}، مانده ${breakdown.remainingDebt}`,
      targetId: params.memberId,
      branchId,
    });

    return { charge, payment };
  }

  /**
   * Allocate a later Payment to a Member's outstanding debt (Oldest Debt First Policy)
   */
  static allocatePayment(params: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    description?: string;
    receiptNumber?: string;
    recordedBy?: string;
    branchId?: string;
    tenantId?: string;
  }): { payment: PaymentRecord; updatedCharges: FinancialCharge[] } {
    PaymentRepository.initialize();
    ChargeRepository.initialize();
    MemberRepository.initialize();

    const safeAmount = Math.max(0, Math.round(Number(params.amount) || 0));
    if (safeAmount <= 0) {
      throw new Error('مبلغ پرداختی باید بیشتر از صفر باشد.');
    }

    const member = MemberRepository.getById(params.memberId);
    const todayJalali = DateService.getTodayJalali();
    const branchId = params.branchId || member?.branchId || 'branch-tehran-central';
    const tenantId = params.tenantId || member?.tenantId || 'gym-org-1';

    // 1. Create Payment Transaction
    const paymentId = generateFinancialId('pay');
    const payment: PaymentRecord = {
      id: paymentId,
      tenantId,
      branchId,
      studentId: params.memberId,
      studentName: member?.fullName,
      amount: safeAmount,
      date: todayJalali,
      timestamp: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      type: 'tuition',
      description: params.description || `تسویه مانده بدهی (${member?.fullName || params.memberId})`,
      receiptNumber: params.receiptNumber || generateReceiptNumber(),
      recordedBy: params.recordedBy || 'پذیرش',
      status: 'completed',
    };

    PaymentRepository.addPayment(payment);

    // 2. Allocate across member's open charges (Oldest First)
    const memberCharges = ChargeRepository.getByMemberId(params.memberId)
      .filter(c => c.status !== 'cancelled' && c.outstandingAmount > 0)
      .sort((a, b) => (a.createdAt || a.date).localeCompare(b.createdAt || b.date));

    let remainingToAllocate = safeAmount;
    const updatedCharges: FinancialCharge[] = [];

    for (const chg of memberCharges) {
      if (remainingToAllocate <= 0) break;

      const allocation = Math.min(chg.outstandingAmount, remainingToAllocate);
      const newPaid = chg.paidAmount + allocation;
      const newOutstanding = Math.max(0, chg.finalPrice - newPaid);

      const updated = ChargeRepository.update(chg.id, {
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status: newOutstanding === 0 ? 'settled' : 'active',
      });

      if (updated) {
        updatedCharges.push(updated);
      }
      remainingToAllocate -= allocation;
    }

    // 3. Update Member entity cached financial balances
    if (member) {
      const newMemberPaid = (member.paidAmount || 0) + safeAmount;
      const newMemberDebt = Math.max(0, (member.remainingDebt || 0) - safeAmount);

      MemberRepository.updateMember(params.memberId, {
        paidAmount: newMemberPaid,
        remainingDebt: newMemberDebt,
      });
    }

    // 4. Audit Log
    AuditService.logEvent({
      action: 'PAYMENT_RECEIVE',
      category: 'FINANCE',
      details: `دریافت مانده شهریه به مبلغ ${safeAmount} برای ${member?.fullName || params.memberId}`,
      targetId: params.memberId,
      branchId,
    });

    return { payment, updatedCharges };
  }

  /**
   * Refund an existing payment (Partially or Fully)
   */
  static refundPayment(params: {
    paymentId: string;
    refundAmount: number;
    reason: string;
    recordedBy?: string;
  }): { refundTransaction: PaymentRecord; originalPayment: PaymentRecord } {
    PaymentRepository.initialize();
    ChargeRepository.initialize();
    MemberRepository.initialize();

    const originalPayment = PaymentRepository.getAllPayments().find(p => p.id === params.paymentId);
    if (!originalPayment) {
      throw new Error('تراکنش پرداخت یافت نشد.');
    }

    if (originalPayment.status === 'voided') {
      throw new Error('امکان استرداد تراکنش ابطال‌شده وجود ندارد.');
    }

    const alreadyRefunded = originalPayment.refundedAmount || 0;
    const refundableBalance = originalPayment.amount - alreadyRefunded;
    const requestedRefund = Math.max(0, Math.round(Number(params.refundAmount) || 0));

    if (requestedRefund <= 0) {
      throw new Error('مبلغ استرداد باید بیشتر از صفر باشد.');
    }

    if (requestedRefund > refundableBalance) {
      throw new Error(`مبلغ درخواستی (${requestedRefund}) بیشتر از سقف قابل استرداد (${refundableBalance}) است.`);
    }

    const todayJalali = DateService.getTodayJalali();
    const recordedBy = params.recordedBy || 'مدیر مالی';

    // 1. Create a distinct refund transaction
    const refundTransactionId = generateFinancialId('ref');
    const refundTransaction: PaymentRecord = {
      id: refundTransactionId,
      tenantId: originalPayment.tenantId,
      branchId: originalPayment.branchId,
      studentId: originalPayment.studentId,
      studentName: originalPayment.studentName,
      chargeId: originalPayment.chargeId,
      amount: -requestedRefund,
      date: todayJalali,
      timestamp: new Date().toISOString(),
      paymentMethod: originalPayment.paymentMethod,
      type: 'refund',
      description: `استرداد وجه برای رسید #${originalPayment.receiptNumber}: ${params.reason}`,
      receiptNumber: generateReceiptNumber('REF'),
      recordedBy,
      status: 'completed',
      relatedPaymentId: originalPayment.id,
    };

    PaymentRepository.addPayment(refundTransaction);

    // 2. Update original payment's refundedAmount and refund array
    const newRefundedTotal = alreadyRefunded + requestedRefund;
    const isFullyRefunded = newRefundedTotal >= originalPayment.amount;

    const updatedRefunds = [
      ...(originalPayment.refunds || []),
      {
        id: refundTransactionId,
        amount: requestedRefund,
        date: todayJalali,
        timestamp: new Date().toISOString(),
        reason: params.reason,
        recordedBy,
      },
    ];

    PaymentRepository.updatePayment(originalPayment.id, {
      refundedAmount: newRefundedTotal,
      status: isFullyRefunded ? 'refunded' : 'completed',
      refunds: updatedRefunds,
    });

    // 3. Restore member and charge outstanding balances
    if (originalPayment.studentId) {
      const member = MemberRepository.getById(originalPayment.studentId);
      if (member) {
        MemberRepository.updateMember(originalPayment.studentId, {
          paidAmount: Math.max(0, (member.paidAmount || 0) - requestedRefund),
          remainingDebt: (member.remainingDebt || 0) + requestedRefund,
        });
      }

      if (originalPayment.chargeId) {
        const charge = ChargeRepository.getById(originalPayment.chargeId);
        if (charge) {
          const newChargePaid = Math.max(0, charge.paidAmount - requestedRefund);
          ChargeRepository.update(charge.id, {
            paidAmount: newChargePaid,
            outstandingAmount: Math.max(0, charge.finalPrice - newChargePaid),
            status: 'active',
          });
        }
      }
    }

    // 4. Audit Log
    AuditService.logEvent({
      action: 'PAYMENT_REFUND',
      category: 'FINANCE',
      details: `استرداد وجه به مبلغ ${requestedRefund} برای تراکنش #${originalPayment.receiptNumber} به دلیل: ${params.reason}`,
      targetId: originalPayment.studentId,
      branchId: originalPayment.branchId,
    });

    return { refundTransaction, originalPayment };
  }

  /**
   * Void a payment entirely (reverses its financial impact without hard-deleting)
   */
  static voidPayment(params: {
    paymentId: string;
    reason: string;
    voidedBy?: string;
  }): PaymentRecord {
    PaymentRepository.initialize();
    ChargeRepository.initialize();
    MemberRepository.initialize();

    const payment = PaymentRepository.getAllPayments().find(p => p.id === params.paymentId);
    if (!payment) {
      throw new Error('تراکنش پرداخت یافت نشد.');
    }

    if (payment.status === 'voided') {
      throw new Error('این تراکنش قبلاً ابطال شده است.');
    }

    const voidedBy = params.voidedBy || 'مدیر مالی';
    const voidedAt = new Date().toISOString();

    // 1. Mark status as voided
    PaymentRepository.updatePayment(payment.id, {
      status: 'voided',
      voidReason: params.reason,
      voidedAt,
      voidedBy,
    });

    // 2. Reverse impact on member balances
    if (payment.studentId && payment.amount > 0) {
      const member = MemberRepository.getById(payment.studentId);
      if (member) {
        MemberRepository.updateMember(payment.studentId, {
          paidAmount: Math.max(0, (member.paidAmount || 0) - payment.amount),
          remainingDebt: (member.remainingDebt || 0) + payment.amount,
        });
      }

      if (payment.chargeId) {
        const charge = ChargeRepository.getById(payment.chargeId);
        if (charge) {
          const newPaid = Math.max(0, charge.paidAmount - payment.amount);
          ChargeRepository.update(charge.id, {
            paidAmount: newPaid,
            outstandingAmount: Math.max(0, charge.finalPrice - newPaid),
            status: 'active',
          });
        }
      }
    }

    // 3. Audit Log
    AuditService.logEvent({
      action: 'PAYMENT_VOID',
      category: 'FINANCE',
      details: `ابطال تراکنش #${payment.receiptNumber} به مبلغ ${payment.amount} به دلیل: ${params.reason}`,
      targetId: payment.studentId,
      branchId: payment.branchId,
    });

    return payment;
  }
}
