/**
 * Payment Transaction Service (PART 52)
 * Ensures consistency between Payment Record, Member Balance, Membership Debt, and Audit Logs.
 */

import { PaymentRecord, PaymentMethod, StaffUser } from '../../types';
import { MemberRepository } from '../repositories/memberRepository';
import { PaymentRepository } from '../repositories/paymentRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { AuditService } from '../auditService';
import { LocalDatabase } from '../database/localDatabase';

export interface RecordPaymentParams {
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  type?: 'tuition' | 'personal_training' | 'buffet' | 'locker_rent' | 'guest_entry' | 'penalty';
  currentUser?: StaffUser;
}

export class PaymentTransaction {
  static async execute(params: RecordPaymentParams): Promise<PaymentRecord | null> {
    const { studentId, amount, paymentMethod, description = '', type = 'tuition', currentUser } = params;

    const student = MemberRepository.getById(studentId);
    if (!student || amount <= 0) return null;

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newPaid = (student.paidAmount || 0) + amount;
    const newDebt = Math.max(0, (student.remainingDebt || 0) - amount);

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      tenantId: student.tenantId || 'gym-org-1',
      branchId: student.branchId || 'branch-tehran-central',
      studentId,
      studentName: student.fullName,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      paymentMethod,
      type,
      description: description || `دریافت وجه / تسویه بدهی (${student.fullName})`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: currentUser?.fullName || 'پذیرش',
    };

    return await LocalDatabase.transaction(async (tx) => {
      // 1. Update Member in Repo & DB
      MemberRepository.updateMember(studentId, {
        paidAmount: newPaid,
        remainingDebt: newDebt,
      });
      await tx.update('members', studentId, {
        paidAmount: newPaid,
        remainingDebt: newDebt,
      });

      // 2. Update Active Membership if tuition
      if (type === 'tuition') {
        const activeMembership = MembershipRepository.getActiveByMember(studentId);
        if (activeMembership) {
          const mshPaid = (activeMembership.paidAmount || 0) + amount;
          const mshDebt = Math.max(0, (activeMembership.remainingDebt || 0) - amount);
          await MembershipRepository.update(activeMembership.id, {
            paidAmount: mshPaid,
            remainingDebt: mshDebt,
          });
        }
      }

      // 3. Save Payment
      PaymentRepository.addPayment(paymentRecord);
      await tx.insert('payments', paymentRecord);

      // 4. Audit Log
      if (currentUser) {
        AuditService.createLog(
          currentUser,
          'PAYMENT_RECORDED',
          'payment',
          `تراکنش مالی به مبلغ ${amount.toLocaleString('fa-IR')} تومان برای «${student.fullName}» ثبت شد.`
        );
      }

      return paymentRecord;
    });
  }
}
