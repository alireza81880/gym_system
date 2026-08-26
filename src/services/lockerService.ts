import { SmartLocker, LockerZone, Student, LockerAssignment } from '../types';

export interface LockerAllocationResult {
  success: boolean;
  lockerNumber?: number;
  locker?: SmartLocker;
  updatedLockers: SmartLocker[];
  assignmentRecord?: LockerAssignment;
  errorReason?: 'ALREADY_ASSIGNED' | 'NO_LOCKER_AVAILABLE' | 'ZONE_EXHAUSTED' | 'LOCKER_MAINTENANCE';
  messageFa: string;
}

export class LockerEngine {
  /**
   * Dynamically generate lockers from 1 to count
   */
  static generateLockers(
    count: number,
    defaultZone: LockerZone = 'general',
    tenantId: string = 'gym-org-1',
    branchId: string = 'branch-main'
  ): SmartLocker[] {
    const validCount = Math.max(1, Math.min(1000, count));
    const lockers: SmartLocker[] = [];

    for (let i = 1; i <= validCount; i++) {
      let zone: LockerZone = defaultZone;
      // If default general, allocate some VIP and gender zones gracefully
      if (defaultZone === 'general') {
        if (i <= Math.floor(validCount * 0.15)) {
          zone = 'vip';
        } else if (i <= Math.floor(validCount * 0.55)) {
          zone = 'men';
        } else {
          zone = 'women';
        }
      }

      lockers.push({
        id: `lck-${tenantId}-${i}`,
        tenantId,
        branchId,
        number: i,
        zone,
        status: 'available',
        isLocked: true,
        lockType: 'rfid_relay',
        relayPort: ((i - 1) % 16) + 1,
        controllerId: `ctrl-node-${Math.floor((i - 1) / 16) + 1}`,
      });
    }

    return lockers;
  }

  /**
   * Safe dynamic resizing:
   * 100 -> 120 adds 20 new lockers.
   * 120 -> 80 does not delete lockers with active assignments; warns safely.
   */
  static resizeLockers(
    currentLockers: SmartLocker[],
    newCount: number,
    defaultZone: LockerZone = 'general',
    tenantId: string = 'gym-org-1',
    branchId: string = 'branch-main'
  ): { updatedLockers: SmartLocker[]; warning?: string } {
    const safeTargetCount = Math.max(1, newCount);
    const currentMax = currentLockers.length > 0 ? Math.max(...currentLockers.map(l => l.number)) : 0;

    if (safeTargetCount === currentMax) {
      return { updatedLockers: currentLockers };
    }

    // Increasing count: add new lockers
    if (safeTargetCount > currentMax) {
      const additionalLockers: SmartLocker[] = [];
      for (let i = currentMax + 1; i <= safeTargetCount; i++) {
        additionalLockers.push({
          id: `lck-${tenantId}-${i}`,
          tenantId,
          branchId,
          number: i,
          zone: defaultZone,
          status: 'available',
          isLocked: true,
          lockType: 'rfid_relay',
          relayPort: ((i - 1) % 16) + 1,
          controllerId: `ctrl-node-${Math.floor((i - 1) / 16) + 1}`,
        });
      }
      return {
        updatedLockers: [...currentLockers, ...additionalLockers].sort((a, b) => a.number - b.number),
      };
    }

    // Decreasing count: safe reduction
    // Check if any locker with number > safeTargetCount is currently occupied
    const occupiedBeyond = currentLockers.filter(
      l => l.number > safeTargetCount && l.status === 'occupied'
    );

    if (occupiedBeyond.length > 0) {
      const occupiedNumbers = occupiedBeyond.map(l => `#${l.number}`).join(', ');
      // Filter out only unassigned available lockers beyond safeTargetCount, keep occupied
      const preservedLockers = currentLockers.filter(
        l => l.number <= safeTargetCount || l.status === 'occupied'
      );

      return {
        updatedLockers: preservedLockers.sort((a, b) => a.number - b.number),
        warning: `تعداد کمدها کاهش یافت اما کمدهای (${occupiedNumbers}) به دلیل تحویل به ورزشکار تا زمان آزادسازی حفظ شدند.`,
      };
    }

    // Safe removal of unassigned lockers beyond safeTargetCount
    const reducedLockers = currentLockers.filter(l => l.number <= safeTargetCount);
    return {
      updatedLockers: reducedLockers.sort((a, b) => a.number - b.number),
    };
  }

  /**
   * Allocate a locker atomically based on member profile, VIP status, and zone preference.
   */
  static allocateLocker(
    lockers: SmartLocker[],
    member: Student,
    preferredZone?: LockerZone
  ): LockerAllocationResult {
    // 1. Check if member already has an assigned locker that is currently occupied
    const existingLocker = lockers.find(
      l => l.currentStudentId === member.id && l.status === 'occupied'
    );
    if (existingLocker) {
      return {
        success: true,
        lockerNumber: existingLocker.number,
        locker: existingLocker,
        updatedLockers: lockers,
        messageFa: `ورزشکار پیش‌تر کمد شماره #${existingLocker.number} را تحویل گرفته است.`,
      };
    }

    // 2. Determine appropriate zone
    let targetZone: LockerZone = preferredZone || 'general';
    if (member.isVip) {
      targetZone = 'vip';
    }

    // 3. Find available locker in target zone, fallback to general if target not VIP
    let availableLocker = lockers.find(
      l => l.status === 'available' && l.zone === targetZone
    );

    if (!availableLocker && targetZone !== 'general' && !member.isVip) {
      // Fallback to general zone if gender/specific zone is full
      availableLocker = lockers.find(
        l => l.status === 'available' && l.zone === 'general'
      );
    }

    if (!availableLocker) {
      return {
        success: false,
        updatedLockers: lockers,
        errorReason: 'NO_LOCKER_AVAILABLE',
        messageFa: 'تمامی کمدهای سالن در حال حاضر پر هستند و کمد خالی موجود نیست.',
      };
    }

    const assignedAt = new Date().toISOString();
    const updatedLocker: SmartLocker = {
      ...availableLocker,
      status: 'occupied',
      currentStudentId: member.id,
      currentStudentName: member.fullName,
      assignedAt,
      isLocked: false,
      lastUnlockedAt: assignedAt,
    };

    const updatedLockers = lockers.map(l => 
      l.number === availableLocker!.number ? updatedLocker : l
    );

    const assignmentRecord: LockerAssignment = {
      id: `lck-asn-${Date.now()}-${availableLocker.number}`,
      lockerNumber: availableLocker.number,
      memberId: member.id,
      memberName: member.fullName,
      assignedAt,
      assignedBy: 'auto_gate',
      zone: availableLocker.zone,
    };

    return {
      success: true,
      lockerNumber: availableLocker.number,
      locker: updatedLocker,
      updatedLockers,
      assignmentRecord,
      messageFa: `کمد شماره #${availableLocker.number} (زون ${availableLocker.zone.toUpperCase()}) با موفقیت اختصاص داده شد.`,
    };
  }

  /**
   * Release an occupied locker
   */
  static releaseLocker(
    lockers: SmartLocker[],
    lockerNumber: number
  ): { updatedLockers: SmartLocker[]; releasedStudentName?: string } {
    let releasedStudentName: string | undefined;

    const updatedLockers = lockers.map(l => {
      if (l.number === lockerNumber) {
        releasedStudentName = l.currentStudentName;
        return {
          ...l,
          status: 'available' as const,
          currentStudentId: undefined,
          currentStudentName: undefined,
          assignedAt: undefined,
          isLocked: true,
          lastUnlockedAt: new Date().toISOString(),
        };
      }
      return l;
    });

    return { updatedLockers, releasedStudentName };
  }

  /**
   * Master Emergency Unlock with double confirmation safety
   */
  static masterEmergencyUnlockAll(
    lockers: SmartLocker[]
  ): SmartLocker[] {
    const timestamp = new Date().toISOString();
    return lockers.map(l => ({
      ...l,
      isLocked: false,
      lastUnlockedAt: timestamp,
    }));
  }
}
