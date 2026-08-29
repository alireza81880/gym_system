import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { Student, PaymentMethod, PackageType } from '../types';
import { MemberRepository, MemberQueryParams, PaginatedResult } from '../services/repositories/memberRepository';
import { FinanceService } from '../services/finance/financeService';
import { notifyFinanceChange } from './financeStore';
import { generateFinancialId } from '../utils/idGenerator';
import { DateService } from '../services/dateService';

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

export function notifyMemberChange(): void {
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
    const studentId = generateFinancialId('std');
    const totalFee = Math.max(0, Math.round(Number(studentData.totalFee) || 0));
    const safeInitial = Math.max(0, Math.round(Number(initialPayment) || 0));
    const remainingDebt = Math.max(0, totalFee - safeInitial);

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      totalFee,
      paidAmount: safeInitial,
      remainingDebt,
    };

    MemberRepository.addMember(newStudent);

    // Record Financial Charge & Payment
    FinanceService.recordMembershipSale({
      memberId: studentId,
      memberName: newStudent.fullName,
      packageType: newStudent.packageType,
      packageName: newStudent.packageType,
      basePrice: totalFee,
      discountAmount: 0,
      initialPayment: safeInitial,
      paymentMethod,
      startDate: newStudent.registrationDate || DateService.getTodayJalali(),
      expireDate: newStudent.expireDate || DateService.addDaysToJalali(DateService.getTodayJalali(), 30),
      sessionsTotal: newStudent.sessionsTotal || 12,
      coachId: newStudent.coachId,
      branchId: newStudent.branchId || 'branch-tehran-central',
      tenantId: newStudent.tenantId || 'gym-org-1',
    });

    notifyMemberChange();
    notifyFinanceChange();
    return newStudent;
  },

  updateStudent(id: string, partial: Partial<Student>): Student | undefined {
    const updated = MemberRepository.updateMember(id, partial);
    notifyMemberChange();
    return updated;
  },

  deleteStudent(id: string): boolean {
    const res = MemberRepository.deleteMember(id);
    if (res) {
      notifyMemberChange();
      notifyFinanceChange();
    }
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

    FinanceService.allocatePayment({
      memberId: studentId,
      amount,
      paymentMethod,
      description,
      branchId: student.branchId,
      tenantId: student.tenantId,
    });

    notifyMemberChange();
    notifyFinanceChange();
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

    const safeTotal = Math.max(0, Math.round(Number(totalFee) || 0));
    const safePaid = Math.max(0, Math.round(Number(paidAmount) || 0));
    const todayJalali = DateService.getTodayJalali();

    FinanceService.recordMembershipSale({
      memberId: studentId,
      memberName: student.fullName,
      packageType: String(packageType),
      packageName: String(packageType),
      basePrice: safeTotal,
      discountAmount: 0,
      initialPayment: safePaid,
      paymentMethod,
      startDate: todayJalali,
      expireDate: newExpireDate,
      sessionsTotal: student.sessionsTotal || 12,
      coachId: student.coachId,
      branchId: student.branchId,
      tenantId: student.tenantId,
    });

    notifyMemberChange();
    notifyFinanceChange();
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
    notifyFinanceChange();
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
