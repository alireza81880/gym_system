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
