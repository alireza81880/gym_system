import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { Student, PaymentMethod, PackageType } from '../types';
import { MemberRepository, MemberQueryParams, PaginatedResult } from '../services/repositories/memberRepository';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { FinanceService } from '../services/finance/financeService';
import { notifyFinanceChange } from './financeStore';
import { notifyLockerChange } from './lockerStore';
import { generateFinancialId } from '../utils/idGenerator';
import { DateService } from '../services/dateService';
import { RBACService } from '../services/rbacService';
import { AuditService } from '../services/auditService';
import { settingsStore } from './settingsStore';

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
    paymentMethod: PaymentMethod = 'pos',
    financialOptions?: {
      basePrice?: number;
      discountAmount?: number;
      discountReason?: string;
    }
  ): Student {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('members.create', actor, {
      actionName: 'MEMBER_ADD',
      entityType: 'member',
      description: `ثبت‌نام ورزشکار جدید: ${studentData.fullName}`,
    });

    const studentId = generateFinancialId('std');
    const basePrice = financialOptions?.basePrice !== undefined 
      ? Math.max(0, Math.round(Number(financialOptions.basePrice) || 0))
      : Math.max(0, Math.round(Number(studentData.totalFee) || 0));
    const discountAmount = Math.min(basePrice, Math.max(0, Math.round(Number(financialOptions?.discountAmount) || 0)));
    const finalPrice = basePrice - discountAmount;
    const safeInitial = Math.max(0, Math.round(Number(initialPayment) || 0));
    const remainingDebt = Math.max(0, finalPrice - safeInitial);

    const newStudent: Student = {
      ...studentData,
      id: studentId,
      totalFee: finalPrice,
      paidAmount: safeInitial,
      remainingDebt,
    };

    MemberRepository.addMember(newStudent);

    // Find matching package snapshot if available
    const packages = settingsStore.getState().packages;
    const matchedPkg = packages.find(p => p.id === newStudent.packageType || p.type === newStudent.packageType || p.name === newStudent.packageType);

    // Record Financial Charge & Payment with full price breakdown & snapshot
    FinanceService.recordMembershipSale({
      memberId: studentId,
      memberName: newStudent.fullName,
      packageType: newStudent.packageType,
      packageId: matchedPkg?.id,
      packageName: matchedPkg?.name || newStudent.packageType,
      packageSnapshot: matchedPkg ? { ...matchedPkg } : undefined,
      durationDays: matchedPkg?.durationDays || (matchedPkg?.durationMonths ? matchedPkg.durationMonths * 30 : 30),
      basePrice,
      discountAmount,
      discountReason: financialOptions?.discountReason,
      initialPayment: safeInitial,
      paymentMethod,
      startDate: newStudent.registrationDate || DateService.getTodayJalali(),
      expireDate: newStudent.expireDate || DateService.addDaysToJalali(DateService.getTodayJalali(), 30),
      sessionsTotal: newStudent.sessionsTotal || matchedPkg?.sessionsCount || 12,
      coachId: newStudent.coachId,
      branchId: newStudent.branchId || 'branch-tehran-central',
      tenantId: newStudent.tenantId || 'gym-org-1',
    });

    AuditService.logSensitiveMutation({
      actor,
      action: 'MEMBER_REGISTERED',
      entityType: 'member',
      entityId: studentId,
      description: `عضو جدید «${newStudent.fullName}» با شهریه ${newStudent.totalFee} ثبت شد.`,
      afterState: newStudent,
      result: 'success',
    });

    notifyMemberChange();
    notifyFinanceChange();
    return newStudent;
  },

  updateStudent(id: string, partial: Partial<Student>): Student | undefined {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('members.edit', actor, {
      actionName: 'MEMBER_UPDATE',
      entityType: 'member',
      entityId: id,
      description: `ویرایش پرونده ورزشکار ${id}`,
    });

    const prev = MemberRepository.getById(id);
    const updated = MemberRepository.updateMember(id, partial);
    
    if (updated && prev) {
      AuditService.logSensitiveMutation({
        actor,
        action: 'MEMBER_UPDATED',
        entityType: 'member',
        entityId: id,
        description: `مشخصات پرونده «${updated.fullName}» ویرایش شد.`,
        beforeState: prev,
        afterState: updated,
        result: 'success',
      });
    }

    notifyMemberChange();
    return updated;
  },

  deleteStudent(id: string): boolean {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('members.delete', actor, {
      actionName: 'MEMBER_DELETE',
      entityType: 'member',
      entityId: id,
      description: `حذف ورزشکار با شناسه ${id}`,
    });

    const prev = MemberRepository.getById(id);
    const res = MemberRepository.deleteMember(id);
    if (res && prev) {
      // Release any active smart locker assigned to this member
      try {
        LockerRepository.initialize();
        const lockers = LockerRepository.getAll();
        let lockerReleased = false;
        lockers.forEach(l => {
          if (l.currentStudentId === id && l.status === 'occupied') {
            LockerRepository.releaseLocker(l.number);
            lockerReleased = true;
          }
        });
        if (lockerReleased) {
          notifyLockerChange();
        }
      } catch {}

      AuditService.logSensitiveMutation({
        actor,
        action: 'MEMBER_DELETED',
        entityType: 'member',
        entityId: id,
        description: `پرونده عضو «${prev.fullName}» حذف شد.`,
        beforeState: prev,
        result: 'success',
      });
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
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('finance.create', actor, {
      actionName: 'MEMBER_PAYMENT_RECORD',
      entityType: 'payment',
      entityId: studentId,
      description: `ثبت دریافت وجه شهریه برای عضو ${studentId}`,
    });

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

    const packages = settingsStore.getState().packages;
    const matchedPkg = packages.find(p => p.id === packageType || p.type === packageType || p.name === packageType);

    FinanceService.recordMembershipSale({
      memberId: studentId,
      memberName: student.fullName,
      packageType: String(packageType),
      packageId: matchedPkg?.id,
      packageName: matchedPkg?.name || String(packageType),
      packageSnapshot: matchedPkg ? { ...matchedPkg } : undefined,
      durationDays: matchedPkg?.durationDays || (matchedPkg?.durationMonths ? matchedPkg.durationMonths * 30 : 30),
      basePrice: safeTotal,
      discountAmount: 0,
      initialPayment: safePaid,
      paymentMethod,
      startDate: todayJalali,
      expireDate: newExpireDate,
      sessionsTotal: matchedPkg?.sessionsCount || student.sessionsTotal || 12,
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
 * Hook for easy access to member domain state and actions
 */
export function useMembers() {
  const version = useStore(memberStore, s => s.version);
  const totalCount = useStore(memberStore, s => s.totalCount);
  const activeCount = useStore(memberStore, s => s.activeCount);
  const expiringCount = useStore(memberStore, s => s.expiringCount);
  const totalDebt = useStore(memberStore, s => s.totalDebt);
  const students = useMemo(() => MemberRepository.getAll(), [version]);

  return {
    version,
    totalCount,
    activeCount,
    expiringCount,
    totalDebt,
    students,
    members: students,
    ...memberActions,
  };
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
