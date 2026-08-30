import { createStore, useStore } from './createStore';
import { SmartLocker, LockerZone } from '../types';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { LockerEngine } from '../services/lockerService';
import { AuditService } from '../services/auditService';
import { RBACService } from '../services/rbacService';
import { settingsStore } from './settingsStore';

export interface LockerState {
  version: number;
  availableCount: number;
  occupiedCount: number;
  totalCount: number;
  lockers: SmartLocker[];
}

export const lockerStore = createStore<LockerState>({
  version: 1,
  availableCount: LockerRepository.getAvailableCount(),
  occupiedCount: LockerRepository.getOccupiedCount(),
  totalCount: LockerRepository.getAll().length,
  lockers: LockerRepository.getAll(),
});

export function notifyLockerChange(): void {
  lockerStore.setState({
    version: lockerStore.getState().version + 1,
    availableCount: LockerRepository.getAvailableCount(),
    occupiedCount: LockerRepository.getOccupiedCount(),
    totalCount: LockerRepository.getAll().length,
    lockers: LockerRepository.getAll(),
  });
}

export const lockerActions = {
  assignLocker(lockerNumber: number, studentId: string): boolean {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('lockers.open', actor, {
      actionName: 'LOCKER_ASSIGN',
      entityType: 'locker',
      entityId: String(lockerNumber),
      description: `تخصیص کمد شماره #${lockerNumber}`,
    });

    const res = LockerRepository.assignLocker(lockerNumber, studentId);
    if (res) notifyLockerChange();
    return res;
  },

  releaseLocker(lockerNumber: number, recordedBy?: string): boolean {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('lockers.open', actor, {
      actionName: 'LOCKER_RELEASE',
      entityType: 'locker',
      entityId: String(lockerNumber),
      description: `آزادسازی کمد شماره #${lockerNumber}`,
    });

    const res = LockerRepository.releaseLocker(lockerNumber);
    if (res) {
      AuditService.logEvent({
        action: 'LOCKER_RELEASED',
        category: 'locker',
        details: `کمد شماره #${lockerNumber} آزاد شد.`,
        userName: recordedBy || actor.fullName,
        actor,
      });
      notifyLockerChange();
    }
    return res;
  },

  openLocker(lockerNumber: number, reason = 'بازگشایی از پذیرش', recordedBy?: string): boolean {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('lockers.open', actor, {
      actionName: 'LOCKER_OPEN',
      entityType: 'locker',
      entityId: String(lockerNumber),
      description: `بازگشایی دستی کمد شماره #${lockerNumber}`,
    });

    const lockers = LockerRepository.getAll();
    const timestamp = new Date().toISOString();
    const updated = lockers.map(l => l.number === lockerNumber ? {
      ...l,
      isLocked: false,
      lastUnlockedAt: timestamp,
    } : l);
    LockerRepository.batchSet(updated);
    AuditService.logEvent({
      action: 'LOCKER_OPENED',
      category: 'locker',
      details: `کمد شماره #${lockerNumber} بازگشایی شد (${reason}).`,
      userName: recordedBy || actor.fullName,
      actor,
    });
    notifyLockerChange();
    return true;
  },

  toggleMaintenance(lockerNumber: number): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('lockers.open', actor, {
      actionName: 'LOCKER_MAINTENANCE_TOGGLE',
      entityType: 'locker',
      entityId: String(lockerNumber),
      description: `تغییر وضعیت تعمیرات کمد #${lockerNumber}`,
    });

    LockerRepository.toggleMaintenance(lockerNumber);
    notifyLockerChange();
  },

  toggleLockerMaintenance(lockerNumber: number): void {
    this.toggleMaintenance(lockerNumber);
  },

  triggerMasterUnlock(reason = 'بازگشایی اضطراری کلیه کمدها', recordedBy?: string): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('lockers.masterUnlock', actor, {
      actionName: 'MASTER_LOCKER_UNLOCK',
      entityType: 'locker',
      description: 'بازگشایی سراسری تمام کمدها (Emergency Master Unlock)',
    });

    const current = LockerRepository.getAll();
    const updated = LockerEngine.masterEmergencyUnlockAll(current);
    LockerRepository.batchSet(updated);
    AuditService.logSensitiveMutation({
      actor,
      action: 'MASTER_LOCKER_UNLOCK_EMERGENCY',
      entityType: 'locker',
      description: `هشدار امنیتی: بازگشایی سراسری تمام ${current.length} کمد توسط «${actor.fullName}» اجرا شد. دلیل: ${reason}`,
      metadata: { reason, totalCount: current.length, executedBy: actor.fullName, executedAt: new Date().toISOString() },
      result: 'success',
    });
    notifyLockerChange();
  },

  addLocker(lockerData: Omit<SmartLocker, 'id'>): SmartLocker {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('settings.manage', actor, {
      actionName: 'ADD_LOCKER',
      entityType: 'locker',
      description: 'افزودن کمد جدید',
    });

    const current = LockerRepository.getAll();
    const newLocker: SmartLocker = {
      ...lockerData,
      id: `lck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const next = [...current, newLocker].sort((a, b) => a.number - b.number);
    LockerRepository.batchSet(next);
    notifyLockerChange();
    return newLocker;
  },

  updateLocker(id: string, updates: Partial<SmartLocker>): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('settings.manage', actor, {
      actionName: 'UPDATE_LOCKER',
      entityType: 'locker',
      entityId: id,
      description: 'ویرایش مشخصات کمد',
    });

    const current = LockerRepository.getAll();
    const next = current.map(l => l.id === id ? { ...l, ...updates } : l);
    LockerRepository.batchSet(next);
    notifyLockerChange();
  },

  deleteLocker(id: string): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('settings.manage', actor, {
      actionName: 'DELETE_LOCKER',
      entityType: 'locker',
      entityId: id,
      description: 'حذف کمد',
    });

    const current = LockerRepository.getAll();
    const next = current.filter(l => l.id !== id);
    LockerRepository.batchSet(next);
    notifyLockerChange();
  },

  setLockerCount(newCount: number, defaultZone?: LockerZone): { success: boolean; warning?: string } {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('settings.manage', actor, {
      actionName: 'RESIZE_LOCKERS',
      entityType: 'locker',
      description: `تنظیم تعداد کل کمدها به ${newCount}`,
    });

    const res = LockerRepository.setCount(newCount, defaultZone);
    notifyLockerChange();
    return res;
  },

  batchSet(lockers: SmartLocker[]): void {
    LockerRepository.batchSet(lockers);
    notifyLockerChange();
  }
};

export function useLockerStore<S = LockerState>(selector?: (state: LockerState) => S): S {
  return useStore(lockerStore, selector);
}

export function useLockers() {
  const version = useStore(lockerStore, s => s.version);
  const availableCount = useStore(lockerStore, s => s.availableCount);
  const occupiedCount = useStore(lockerStore, s => s.occupiedCount);
  const totalCount = useStore(lockerStore, s => s.totalCount);
  const lockers = useStore(lockerStore, s => s.lockers);

  return {
    version,
    availableCount,
    occupiedCount,
    totalCount,
    lockers,
    ...lockerActions,
  };
}

