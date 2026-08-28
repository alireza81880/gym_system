/**
 * Member Registration Transaction
 * Atomic operation combining Member Creation, Membership Creation, Financial Charge,
 * Initial Payment, and Audit Logging in a single consistent flow.
 */

import { Student, PaymentMethod, StaffUser } from '../../types';
import { MemberRepository } from '../repositories/memberRepository';
import { MembershipRepository } from '../repositories/membershipRepository';
import { PaymentRepository } from '../repositories/paymentRepository';
import { AuditService } from '../auditService';
import { LocalDatabase } from '../database/localDatabase';

export interface RegisterMemberParams {
  studentData: Omit<Student, 'id' | 'remainingDebt'>;
  initialPayment?: number;
  paymentMethod?: PaymentMethod;
  currentUser?: StaffUser;
}

export interface RegisterMemberResult {
  student: Student;
  paymentId?: string;
  membershipId: string;
}

export class MemberRegistrationTransaction {
  static async execute(params: RegisterMemberParams): Promise<RegisterMemberResult> {
    const { studentData, initialPayment = 0, paymentMethod = 'pos', currentUser } = params;

    const studentId = `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const remainingDebt = Math.max(0, studentData.totalFee - initialPayment);

    // 1. Transaction-safe sequential member number allocation
    let memberNumber = studentData.memberNumber;
    if (!memberNumber || memberNumber.trim() === '') {
      memberNumber = await MemberRepository.getNextSequentialMemberNumber();
    }

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      memberNumber,
      paidAmount: initialPayment,
      remainingDebt,
    };

    // 2. Membership Entity
    const membershipId = `msh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // Run within atomic database transaction
    return await LocalDatabase.transaction(async (tx) => {
      // a. Save Member
      MemberRepository.addMember(newStudent);
      await tx.insert('members', newStudent);

      // b. Save Membership
      const membership = {
        id: membershipId,
        tenantId: newStudent.tenantId || 'gym-org-1',
        branchId: newStudent.branchId || 'branch-tehran-central',
        studentId,
        packageType: newStudent.packageType,
        startDate: newStudent.registrationDate,
        expireDate: newStudent.expireDate,
        status: newStudent.status,
        totalFee: newStudent.totalFee,
        paidAmount: initialPayment,
        remainingDebt,
        sessionsTotal: newStudent.sessionsTotal || 24,
        sessionsAttended: 0,
        coachId: newStudent.coachId,
        coachFee: newStudent.coachFee,
        hasWorkoutPlan: newStudent.wantsWorkoutPlan,
        hasDietPlan: newStudent.wantsDietPlan,
        createdAt: new Date().toISOString(),
      };
      await MembershipRepository.create(membership);

      // c. Save Initial Payment if any
      let paymentId: string | undefined;
      if (initialPayment > 0) {
        paymentId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const paymentRecord = {
          id: paymentId,
          tenantId: newStudent.tenantId || 'gym-org-1',
          branchId: newStudent.branchId || 'branch-tehran-central',
          studentId,
          studentName: newStudent.fullName,
          amount: initialPayment,
          date: new Date().toLocaleDateString('fa-IR'),
          paymentMethod,
          type: 'tuition' as const,
          description: `شهریه ثبت‌نام اولیه (${newStudent.packageType})`,
          receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          recordedBy: currentUser?.fullName || 'پذیرش',
        };
        PaymentRepository.addPayment(paymentRecord);
        await tx.insert('payments', paymentRecord);
      }

      // d. Audit Log
      if (currentUser) {
        AuditService.createLog(
          currentUser,
          'MEMBER_CREATED',
          'member',
          `ورزشکار جدید «${newStudent.fullName}» با پرونده #${newStudent.memberNumber} ثبت‌نام شد.`
        );
      }

      return {
        student: newStudent,
        paymentId,
        membershipId,
      };
    });
  }
}
