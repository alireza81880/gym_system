import { PaymentRecord, ExpenseRecord } from '../../types';
import { initialPayments, initialExpenses } from '../../data/initialData';
import { LocalDbRepository } from '../localDb';
import { ChargeRepository } from './chargeRepository';
import { PaginatedResult } from './memberRepository';
import { generateFinancialId, generateReceiptNumber } from '../../utils/idGenerator';
import { DateService } from '../dateService';

export interface FinanceSummaryMetrics {
  totalRevenue: number;
  totalCoachPayouts: number;
  totalOperationalExpenses: number;
  totalExpensesAll: number;
  netProfit: number;
}

export class PaymentRepository {
  private static paymentsList: PaymentRecord[] = [];
  private static expensesList: ExpenseRecord[] = [];
  private static isInitialized = false;

  // Cached summary
  private static cachedSummary: FinanceSummaryMetrics = {
    totalRevenue: 0,
    totalCoachPayouts: 0,
    totalOperationalExpenses: 0,
    totalExpensesAll: 0,
    netProfit: 0,
  };

  static initialize(): void {
    if (this.isInitialized) return;

    const hasPersistedPayments = LocalDbRepository.hasKey('payments');
    const hasPersistedExpenses = LocalDbRepository.hasKey('expenses');

    let storedPayments: PaymentRecord[];
    let storedExpenses: ExpenseRecord[];

    if (hasPersistedPayments) {
      storedPayments = LocalDbRepository.get<PaymentRecord[]>('payments', []);
    } else if (!LocalDbRepository.isDatabaseInitialized()) {
      storedPayments = initialPayments;
      LocalDbRepository.setImmediate('payments', storedPayments);
    } else {
      storedPayments = [];
    }

    if (hasPersistedExpenses) {
      storedExpenses = LocalDbRepository.get<ExpenseRecord[]>('expenses', []);
    } else if (!LocalDbRepository.isDatabaseInitialized()) {
      storedExpenses = initialExpenses;
      LocalDbRepository.setImmediate('expenses', storedExpenses);
    } else {
      storedExpenses = [];
    }

    this.rebuildIndex(storedPayments, storedExpenses);
    this.isInitialized = true;
  }

  static rebuildIndex(payments: PaymentRecord[], expenses: ExpenseRecord[]): void {
    this.paymentsList = [...payments];
    this.expensesList = [...expenses];
    this.recalculateSummary();
  }

  private static recalculateSummary(): void {
    let rev = 0;
    let coachPayouts = 0;

    for (const p of this.paymentsList) {
      if (p.status === 'voided') continue; // Exclude voided payments from totals

      if (p.type === 'coach_settlement') {
        coachPayouts += p.amount;
      } else if (p.type === 'refund' || p.amount < 0) {
        rev -= Math.abs(p.amount);
      } else {
        rev += p.amount;
      }
    }

    let operational = 0;
    for (const e of this.expensesList) {
      operational += e.amount;
    }

    const totalExp = operational + coachPayouts;
    const profit = rev - totalExp;

    this.cachedSummary = {
      totalRevenue: rev,
      totalCoachPayouts: coachPayouts,
      totalOperationalExpenses: operational,
      totalExpensesAll: totalExp,
      netProfit: profit,
    };
  }

  static getAllPayments(): PaymentRecord[] {
    this.initialize();
    return [...this.paymentsList];
  }

  static getAllExpenses(): ExpenseRecord[] {
    this.initialize();
    return [...this.expensesList];
  }

  static getSummary(): FinanceSummaryMetrics {
    this.initialize();
    return this.cachedSummary;
  }

  static getFinancialMetrics(): { totalRevenue: number; totalCoachPayouts: number; totalExpenses: number; netProfit: number } {
    this.initialize();
    return {
      totalRevenue: this.cachedSummary.totalRevenue,
      totalCoachPayouts: this.cachedSummary.totalCoachPayouts,
      totalExpenses: this.cachedSummary.totalExpensesAll,
      netProfit: this.cachedSummary.netProfit,
    };
  }

  static listByMember(studentId: string): PaymentRecord[] {
    return this.getMemberPayments(studentId);
  }

  static listByDateRange(startDate: string, endDate: string): PaymentRecord[] {
    this.initialize();
    return this.paymentsList.filter(p => {
      if (!p.date) return false;
      return p.date >= startDate && p.date <= endDate;
    });
  }

  static getOutstanding(): number {
    this.initialize();
    ChargeRepository.initialize();
    const allCharges = ChargeRepository.getAll();
    return allCharges
      .filter(c => c.status !== 'cancelled' && c.status !== 'free' && c.status !== 'settled')
      .reduce((sum, c) => sum + (c.outstandingAmount !== undefined ? c.outstandingAmount : Math.max(0, c.finalPrice - (c.paidAmount || 0))), 0);
  }

  static reverse(paymentId: string, reason = 'ابطال فاکتور'): PaymentRecord | null {
    this.initialize();
    const existing = this.paymentsList.find(p => p.id === paymentId);
    if (!existing) return null;

    // Create a reversal entry rather than hard-deleting
    const reversal: PaymentRecord = {
      id: generateFinancialId('rev'),
      tenantId: existing.tenantId,
      branchId: existing.branchId,
      studentId: existing.studentId,
      studentName: existing.studentName,
      amount: -Math.abs(existing.amount),
      date: DateService.getTodayJalali(),
      timestamp: new Date().toISOString(),
      paymentMethod: existing.paymentMethod,
      type: existing.type,
      description: `برگشت/ابطال تراکنش #${existing.receiptNumber || existing.id}: ${reason}`,
      receiptNumber: generateReceiptNumber('REV'),
      recordedBy: 'مدیر مالی',
      status: 'completed',
      relatedPaymentId: existing.id,
    };

    this.addPayment(reversal);
    return reversal;
  }

  static refund(paymentId: string, refundAmount: number, reason = 'استرداد وجه'): PaymentRecord | null {
    this.initialize();
    const existing = this.paymentsList.find(p => p.id === paymentId);
    if (!existing || refundAmount <= 0) return null;

    const refundEntry: PaymentRecord = {
      id: generateFinancialId('ref'),
      tenantId: existing.tenantId,
      branchId: existing.branchId,
      studentId: existing.studentId,
      studentName: existing.studentName,
      amount: -Math.abs(refundAmount),
      date: DateService.getTodayJalali(),
      timestamp: new Date().toISOString(),
      paymentMethod: existing.paymentMethod,
      type: 'refund',
      description: `استرداد وجه برای #${existing.receiptNumber || existing.id}: ${reason}`,
      receiptNumber: generateReceiptNumber('REF'),
      recordedBy: 'مدیر مالی',
      status: 'completed',
      relatedPaymentId: existing.id,
    };

    this.addPayment(refundEntry);
    return refundEntry;
  }

  static getMemberPayments(studentId: string): PaymentRecord[] {
    this.initialize();
    return this.paymentsList.filter(p => p.studentId === studentId);
  }

  static addPayment(payment: PaymentRecord): void {
    this.initialize();
    this.paymentsList = [payment, ...this.paymentsList];
    this.recalculateSummary();
    LocalDbRepository.setImmediate('payments', this.paymentsList);
  }

  static updatePayment(id: string, partial: Partial<PaymentRecord>): PaymentRecord | undefined {
    this.initialize();
    const idx = this.paymentsList.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.paymentsList[idx] = { ...this.paymentsList[idx], ...partial };
      this.recalculateSummary();
      LocalDbRepository.setImmediate('payments', this.paymentsList);
      return this.paymentsList[idx];
    }
    return undefined;
  }

  static deletePayment(id: string): void {
    this.initialize();
    this.paymentsList = this.paymentsList.filter(p => p.id !== id);
    this.recalculateSummary();
    LocalDbRepository.setImmediate('payments', this.paymentsList);
  }

  static addExpense(expense: ExpenseRecord): void {
    this.initialize();
    this.expensesList = [expense, ...this.expensesList];
    this.recalculateSummary();
    LocalDbRepository.setImmediate('expenses', this.expensesList);
  }

  static updateExpense(id: string, partial: Partial<ExpenseRecord>): void {
    this.initialize();
    const idx = this.expensesList.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.expensesList[idx] = { ...this.expensesList[idx], ...partial };
      this.recalculateSummary();
      LocalDbRepository.setImmediate('expenses', this.expensesList);
    }
  }

  static deleteExpense(id: string): void {
    this.initialize();
    this.expensesList = this.expensesList.filter(e => e.id !== id);
    this.recalculateSummary();
    LocalDbRepository.setImmediate('expenses', this.expensesList);
  }

  static queryPaymentsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
  } = {}): PaginatedResult<PaymentRecord> {
    this.initialize();
    const { page = 1, pageSize = 25, search = '', type = 'all' } = params;

    let filtered = this.paymentsList;
    const hasSearch = search && search.trim() !== '';
    const hasType = type && type !== 'all';

    if (hasSearch || hasType) {
      const q = hasSearch ? search.trim().toLowerCase() : '';
      filtered = this.paymentsList.filter(p => {
        if (hasSearch) {
          const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
          const matchStd = p.studentId ? p.studentId.toLowerCase().includes(q) : false;
          if (!matchDesc && !matchStd) return false;
        }
        if (hasType && p.type !== type) return false;
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: safePage,
      pageSize,
    };
  }

  static batchSet(payments: PaymentRecord[], expenses: ExpenseRecord[]): void {
    this.rebuildIndex(payments, expenses);
    LocalDbRepository.setImmediate('payments', this.paymentsList);
    LocalDbRepository.setImmediate('expenses', this.expensesList);
  }
}
