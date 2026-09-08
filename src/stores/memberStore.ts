import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { Student, PaymentMethod, PackageType } from '../types';
import { MemberRepository, MemberQueryParams, PaginatedResult } from '../services/repositories/memberRepository';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { MembershipRepository } from '../services/repositories/membershipRepository';
import { ChargeRepository } from '../services/repositories/chargeRepository';
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
      packageId?: string;
      packageName?: string;
      packageSnapshot?: {
        packageId?: string;
        name?: string;
        price?: number;
        sessionsCount?: number;
        durationDays?: number;
        type?: string;
      };
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

    // Find matching package snapshot: prioritize explicit packageId from financialOptions or studentData
    const packages = settingsStore.getState().packages;
    const requestedPkgId = financialOptions?.packageId || (newStudent as any).packageId;
    const matchedPkg = (requestedPkgId ? packages.find(p => p.id === requestedPkgId) : null)
      || packages.find(p => p.id === newStudent.packageType || p.type === newStudent.packageType || p.name === newStudent.packageType);

    const snapshotToStore = financialOptions?.packageSnapshot || (matchedPkg ? {
      packageId: matchedPkg.id,
      name: matchedPkg.name,
      price: matchedPkg.price,
      sessionsCount: matchedPkg.sessionsCount || 0,
      durationDays: matchedPkg.durationDays || 30,
      type: matchedPkg.type || matchedPkg.name,
    } : undefined);

    // Record Financial Charge & Payment with full price breakdown & snapshot
    FinanceService.recordMembershipSale({
      memberId: studentId,
      memberName: newStudent.fullName,
      packageType: newStudent.packageType,
      packageId: matchedPkg?.id || requestedPkgId,
      packageName: matchedPkg?.name || financialOptions?.packageName || newStudent.packageType,
      packageSnapshot: snapshotToStore,
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
      // 1. If package changed, synchronize active membership record and snapshot
      const packages = settingsStore.getState().packages;
      const targetPackageId = (partial as any).packageId;
      const targetPackageType = partial.packageType;
      
      const activeMsh = MembershipRepository.getActiveByMember(id);
      if (activeMsh && (targetPackageId || targetPackageType)) {
        const newPkg = (targetPackageId ? packages.find(p => p.id === targetPackageId) : null)
          || packages.find(p => p.id === targetPackageType || p.type === targetPackageType || p.name === targetPackageType);

        if (newPkg) {
          MembershipRepository.update(activeMsh.id, {
            packageId: newPkg.id,
            packageType: (newPkg.type || newPkg.name) as any,
            packageNameSnapshot: newPkg.name,
            packageSnapshot: {
              id: newPkg.id,
              name: newPkg.name,
              price: newPkg.price,
              sessionsCount: newPkg.sessionsCount || 0,
              durationDays: newPkg.durationDays || 30,
              type: newPkg.type || newPkg.name,
            },
            durationDays: newPkg.durationDays || activeMsh.durationDays,
            sessionsTotal: newPkg.sessionsCount ?? activeMsh.sessionsTotal,
            expireDate: partial.expireDate || activeMsh.expireDate,
          });
        }
      }

      // 2. If totalFee was changed, calculate the difference and record an adjustment charge
      if (partial.totalFee !== undefined && prev.totalFee !== undefined && partial.totalFee !== prev.totalFee) {
        const feeDiff = partial.totalFee - prev.totalFee;
        const adjChargeId = generateFinancialId('CHG');
        ChargeRepository.create({
          id: adjChargeId,
          tenantId: updated.tenantId || 'gym-org-1',
          branchId: updated.branchId || 'branch-tehran-central',
          memberId: updated.id,
          memberName: updated.fullName,
          packageType: updated.packageType,
          packageName: targetPackageType || updated.packageType,
          basePrice: feeDiff,
          discountAmount: 0,
          finalPrice: feeDiff,
          paidAmount: 0,
          outstandingAmount: feeDiff > 0 ? feeDiff : 0,
          date: DateService.getTodayJalali(),
          timestamp: new Date().toISOString(),
          status: feeDiff > 0 ? 'active' : 'settled',
          createdAt: new Date().toISOString(),
          notes: feeDiff > 0 
            ? `تعدیل افزایشی شهریه (تغییر تعرفه/پکیج) - ${updated.fullName}`
            : `تعدیل کاهشی شهریه (تغییر تعرفه/پکیج) - ${updated.fullName}`,
        });
      }

      // 3. If paidAmount was increased, record a differential payment
      if (partial.paidAmount !== undefined && prev.paidAmount !== undefined && partial.paidAmount > prev.paidAmount) {
        const paidDiff = partial.paidAmount - prev.paidAmount;
        FinanceService.allocatePayment({
          memberId: updated.id,
          amount: paidDiff,
          paymentMethod: 'pos',
          description: `دریافتی مابه‌التفاوت هنگام ویرایش پکیج (${updated.fullName})`,
        });
      }

      // Reconcile member balance and notify
      FinanceService.reconcileMemberFinancials(updated.id);
      notifyFinanceChange();

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
