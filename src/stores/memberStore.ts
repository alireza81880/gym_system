import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { Student, PaymentMethod, PackageType } from '../types';
import { MemberRepository, MemberQueryParams, PaginatedResult } from '../services/repositories/memberRepository';
import { PaymentRepository } from '../services/repositories/paymentRepository';

export interface MemberState {
  version: number;
  totalCount: number;
  activeCount: number;
  totalDebt: number;
  expiringCount: number;
}

export const memberStore = createStore<MemberState>({
  version: 1,
  totalCount: MemberRepository.getCount(),
  activeCount: MemberRepository.getActiveCount(),
  totalDebt: MemberRepository.getTotalDebt(),
  expiringCount: MemberRepository.getExpiringCount(),
});

function notifyMemberChange(): void {
  memberStore.setState({
    version: memberStore.getState().version + 1,
    totalCount: MemberRepository.getCount(),
    activeCount: MemberRepository.getActiveCount(),
    totalDebt: MemberRepository.getTotalDebt(),
    expiringCount: MemberRepository.getExpiringCount(),
  });
}

export const memberActions = {
  addStudent(
    studentData: Omit<Student, 'id' | 'remainingDebt'>,
    initialPayment = 0,
    paymentMethod: PaymentMethod = 'pos'
  ): Student {
    const studentId = `std-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const remainingDebt = Math.max(0, studentData.totalFee - initialPayment);

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      paidAmount: initialPayment,
      remainingDebt,
    };

    MemberRepository.addMember(newStudent);

    if (initialPayment > 0) {
      PaymentRepository.addPayment({
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: newStudent.tenantId || 'gym-org-1',
        branchId: newStudent.branchId || 'branch-tehran-central',
        studentId,
        studentName: newStudent.fullName,
        amount: initialPayment,
        date: new Date().toLocaleDateString('fa-IR'),
        paymentMethod,
        type: 'tuition',
        description: `شهریه ثبت‌نام اولیه (${newStudent.packageType})`,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        recordedBy: 'پذیرش',
      });
    }

    notifyMemberChange();
    return newStudent;
  },

  updateStudent(id: string, partial: Partial<Student>): Student | undefined {
    const updated = MemberRepository.updateMember(id, partial);
    notifyMemberChange();
    return updated;
  },

  deleteStudent(id: string): boolean {
    const res = MemberRepository.deleteMember(id);
    if (res) notifyMemberChange();
    return res;
  },

  recordStudentPayment(
    studentId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    description = ''
  ): void {
    const student = MemberRepository.getById(studentId);
    if (!student || amount <= 0) return;

    const newPaid = (student.paidAmount || 0) + amount;
    const newDebt = Math.max(0, (student.remainingDebt || 0) - amount);

    MemberRepository.updateMember(studentId, {
      paidAmount: newPaid,
      remainingDebt: newDebt,
    });

    PaymentRepository.addPayment({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: student.tenantId || 'gym-org-1',
      branchId: student.branchId || 'branch-tehran-central',
      studentId,
      studentName: student.fullName,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      paymentMethod,
      type: 'tuition',
      description: description || `تسویه بدهی شهریه (${student.fullName})`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: 'پذیرش',
    });

    notifyMemberChange();
  },

  renewStudentMembership(
    studentId: string,
    packageType: PackageType | string,
    totalFee: number,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    newExpireDate: string
  ): void {
    const student = MemberRepository.getById(studentId);
    if (!student) return;

    const remainingDebt = Math.max(0, totalFee - paidAmount);

    MemberRepository.updateMember(studentId, {
      packageType: packageType as PackageType,
      registrationDate: new Date().toLocaleDateString('fa-IR'),
      expireDate: newExpireDate,
      totalFee,
      paidAmount,
      remainingDebt,
      status: 'active',
      sessionsAttended: 0,
    });

    if (paidAmount > 0) {
      PaymentRepository.addPayment({
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId: student.tenantId || 'gym-org-1',
        branchId: student.branchId || 'branch-tehran-central',
        studentId,
        studentName: student.fullName,
        amount: paidAmount,
        date: new Date().toLocaleDateString('fa-IR'),
        paymentMethod,
        type: 'tuition',
        description: `تمدید اشتراک دوره جدید (${packageType})`,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        recordedBy: 'پذیرش',
      });
    }

    notifyMemberChange();
  },

  batchSet(students: Student[]): void {
    MemberRepository.batchSet(students);
    notifyMemberChange();
  },

  generatePerformanceDataset(count: number): { durationMs: number; count: number } {
    const result = MemberRepository.generatePerformanceDataset(count);
    notifyMemberChange();
    return result;
  },

  restoreSampleData(): void {
    MemberRepository.restoreSampleData();
    notifyMemberChange();
  }
};

export function useMemberStore<S = MemberState>(selector?: (state: MemberState) => S): S {
  return useStore(memberStore, selector);
}

/**
 * Hook for paginated and filtered member list
 */
export function usePaginatedMembers(params: MemberQueryParams): PaginatedResult<Student> {
  const version = useStore(memberStore, s => s.version);
  return useMemo(() => {
    return MemberRepository.queryPaginated(params);
  }, [
    version,
    params.page,
    params.pageSize,
    params.search,
    params.status,
    params.coachId,
    params.debtFilter,
  ]);
}
