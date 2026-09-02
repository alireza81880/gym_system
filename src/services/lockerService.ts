import { 
  SmartLocker, 
  LockerZone, 
  Student, 
  LockerAssignment, 
  MembershipPackage, 
  AccessDecision, 
  AccessPolicyConfig,
  HardwareEventType
} from '../types';
import { AccessPolicyEngine, defaultAccessPolicyConfig } from './accessPolicyService';
import { LockerRepository } from './repositories/lockerRepository';
import { AttendanceRepository } from './repositories/attendanceRepository';
import { MemberRepository } from './repositories/memberRepository';
import { HardwareRepository } from './repositories/hardwareRepository';
import { LockerAdapterFactory, LockerPulseResult } from './lockerAdapters';
import { createNormalizedHardwareEvent } from './hardwareAdapters';

export interface LockerAllocationResult {
  success: boolean;
  lockerNumber?: number;
  locker?: SmartLocker;
  updatedLockers: SmartLocker[];
  assignmentRecord?: LockerAssignment;
  errorReason?: 'ALREADY_ASSIGNED' | 'NO_LOCKER_AVAILABLE' | 'ZONE_EXHAUSTED' | 'PACKAGE_NO_LOCKER' | 'LOCKER_MAINTENANCE';
  messageFa: string;
}

export interface AccessPipelineResult {
  success: boolean;
  decision: AccessDecision;
  member?: Student;
  lockerNumber?: number;
  assignedLocker?: SmartLocker;
  pulseResult?: LockerPulseResult;
  turnstileUnlocked: boolean;
  attendanceRecorded: boolean;
  correlationId: string;
  timestamp: string;
  summaryMessageFa: string;
}

// ----------------------------------------------------
// 1. Locker Engine (Core Math & Matrix Transformation)
// ----------------------------------------------------
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
    const validCount = Math.max(0, Math.min(1000, count));
    if (validCount === 0) return [];
    const lockers: SmartLocker[] = [];

    for (let i = 1; i <= validCount; i++) {
      let zone: LockerZone = defaultZone;
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
        relayPort: ((i - 1) % 32) + 1,
        controllerId: `ctrl-node-${Math.floor((i - 1) / 32) + 1}`,
      });
    }

    return lockers;
  }

  /**
   * Safe dynamic resizing without breaking active assignments
   */
  static resizeLockers(
    currentLockers: SmartLocker[],
    newCount: number,
    defaultZone: LockerZone = 'general',
    tenantId: string = 'gym-org-1',
    branchId: string = 'branch-main'
  ): { updatedLockers: SmartLocker[]; warning?: string } {
    const safeTargetCount = Math.max(0, newCount);
    const currentMax = currentLockers.length > 0 ? Math.max(...currentLockers.map(l => l.number)) : 0;

    if (safeTargetCount === currentMax) {
      return { updatedLockers: currentLockers };
    }

    // Decreasing to zero or lower
    if (safeTargetCount === 0) {
      const occupiedBeyond = currentLockers.filter(l => l.status === 'occupied');
      if (occupiedBeyond.length > 0) {
        const occupiedNumbers = occupiedBeyond.map(l => `#${l.number}`).join(', ');
        return {
          updatedLockers: occupiedBeyond.sort((a, b) => a.number - b.number),
          warning: `ظرفیت کمدها به صفر تنظیم شد، اما کمدهای (${occupiedNumbers}) به دلیل تحویل فعال به ورزشکار تا زمان آزادسازی حفظ شدند.`,
        };
      }
      return { updatedLockers: [] };
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
          relayPort: ((i - 1) % 32) + 1,
          controllerId: `ctrl-node-${Math.floor((i - 1) / 32) + 1}`,
        });
      }
      return {
        updatedLockers: [...currentLockers, ...additionalLockers].sort((a, b) => a.number - b.number),
      };
    }

    // Decreasing count: safe reduction preserving occupied lockers
    const occupiedBeyond = currentLockers.filter(
      l => l.number > safeTargetCount && l.status === 'occupied'
    );

    if (occupiedBeyond.length > 0) {
      const occupiedNumbers = occupiedBeyond.map(l => `#${l.number}`).join(', ');
      const preservedLockers = currentLockers.filter(
        l => l.number <= safeTargetCount || l.status === 'occupied'
      );

      return {
        updatedLockers: preservedLockers.sort((a, b) => a.number - b.number),
        warning: `تعداد کمدها کاهش یافت اما کمدهای (${occupiedNumbers}) به دلیل تحویل به ورزشکار تا زمان آزادسازی حفظ شدند.`,
      };
    }

    const reducedLockers = currentLockers.filter(l => l.number <= safeTargetCount);
    return {
      updatedLockers: reducedLockers.sort((a, b) => a.number - b.number),
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
   * Master Emergency Unlock
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

// ----------------------------------------------------
// 2. Locker Assignment Service (Smart Deterministic Allocation)
// ----------------------------------------------------
export class LockerAssignmentService {
  /**
   * Allocate a locker atomically based on member profile, VIP privileges, and zone preference.
   * Deterministic algorithm: uses lowest available number in preferred zone.
   */
  static allocateLocker(
    lockers: SmartLocker[],
    member: Student,
    pkg?: MembershipPackage,
    preferredZone?: LockerZone
  ): LockerAllocationResult {
    // 1. Check if package explicitly disallows locker
    if (pkg && pkg.includesLocker === false) {
      return {
        success: false,
        updatedLockers: lockers,
        errorReason: 'PACKAGE_NO_LOCKER',
        messageFa: 'پکیج عضویت این ورزشکار فاقد دسترسی به کمد هوشمند می‌باشد.',
      };
    }

    // 2. Check if member already has an assigned locker currently occupied
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

    // 3. Determine prioritized target zones
    const prioritizedZones: LockerZone[] = [];

    if (member.isVip || (pkg && pkg.isVip)) {
      prioritizedZones.push('vip');
    }

    if (preferredZone) {
      if (!prioritizedZones.includes(preferredZone)) prioritizedZones.push(preferredZone);
    } else if (member.zone && ['general', 'vip', 'men', 'women'].includes(member.zone)) {
      const mz = member.zone as LockerZone;
      if (!prioritizedZones.includes(mz)) prioritizedZones.push(mz);
    } else if (member.gender === 'female') {
      prioritizedZones.push('women');
    } else if (member.gender === 'male') {
      prioritizedZones.push('men');
    }

    // Always include general as final fallback (unless strictly VIP required)
    if (!prioritizedZones.includes('general') && !member.isVip) {
      prioritizedZones.push('general');
    }
    // Also include other non-VIP zones as ultimate fallback
    if (!prioritizedZones.includes('men')) prioritizedZones.push('men');
    if (!prioritizedZones.includes('women')) prioritizedZones.push('women');

    // 4. Find first available locker matching zone priority (lowest number first)
    let selectedLocker: SmartLocker | undefined;

    for (const zone of prioritizedZones) {
      const candidates = lockers
        .filter(l => l.status === 'available' && l.zone === zone)
        .sort((a, b) => a.number - b.number);

      if (candidates.length > 0) {
        selectedLocker = candidates[0];
        break;
      }
    }

    // 5. If no zone matched, take any available locker in whole facility
    if (!selectedLocker) {
      const anyAvailable = lockers
        .filter(l => l.status === 'available')
        .sort((a, b) => a.number - b.number);
      if (anyAvailable.length > 0) {
        selectedLocker = anyAvailable[0];
      }
    }

    if (!selectedLocker) {
      return {
        success: false,
        updatedLockers: lockers,
        errorReason: 'NO_LOCKER_AVAILABLE',
        messageFa: 'تمامی کمدهای سالن در حال حاضر پر هستند و کمد خالی موجود نیست.',
      };
    }

    const assignedAt = new Date().toISOString();
    const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    const updatedLocker: SmartLocker = {
      ...selectedLocker,
      status: 'occupied',
      currentStudentId: member.id,
      currentStudentName: member.fullName,
      assignedAt: timeStr,
      isLocked: false,
      lastUnlockedAt: assignedAt,
    };

    const updatedLockers = lockers.map(l => 
      l.number === selectedLocker!.number ? updatedLocker : l
    );

    const assignmentRecord: LockerAssignment = {
      id: `lck-asn-${Date.now()}-${selectedLocker.number}`,
      lockerNumber: selectedLocker.number,
      memberId: member.id,
      memberName: member.fullName,
      assignedAt: timeStr,
      assignedBy: 'auto_gate',
      zone: selectedLocker.zone,
    };

    return {
      success: true,
      lockerNumber: selectedLocker.number,
      locker: updatedLocker,
      updatedLockers,
      assignmentRecord,
      messageFa: `کمد شماره #${selectedLocker.number} (${selectedLocker.zone === 'vip' ? 'VIP' : selectedLocker.zone === 'women' ? 'بانوان' : selectedLocker.zone === 'men' ? 'آقایان' : 'عمومی'}) با موفقیت تحویل داده شد.`,
    };
  }
}

// ----------------------------------------------------
// 3. Complete Access Attendance Locker Pipeline
// ----------------------------------------------------
export class AccessAttendanceLockerPipeline {
  /**
   * Executes the full end-to-end access flow:
   * 1. Identification & Credential Verification
   * 2. Access Decision Engine Policy Evaluation
   * 3. Attendance Recording
   * 4. Smart Locker Allocation & Relay Pulse Actuation
   * 5. Audit Logging & Normalized Hardware Events with Correlation ID
   */
  static async processAccessAttempt(params: {
    credentialType: 'rfid' | 'face' | 'fingerprint' | 'qr' | 'pin' | 'manual';
    identifier?: string;
    memberId?: string;
    packages: MembershipPackage[];
    config?: AccessPolicyConfig;
    operatorName?: string;
    preferredZone?: LockerZone;
  }): Promise<AccessPipelineResult> {
    const timestamp = new Date().toISOString();
    const correlationId = `corr-access-${Date.now()}`;
    const operatorName = params.operatorName || 'گیت ورود هوشمند';

    // 1. Identify Member
    let member: Student | undefined;
    if (params.memberId) {
      member = MemberRepository.getById(params.memberId);
    } else if (params.identifier) {
      if (params.credentialType === 'rfid') {
        member = MemberRepository.getAll().find(s => s.rfidCardUid === params.identifier || s.phone.endsWith(params.identifier || ''));
      } else if (params.credentialType === 'face') {
        member = MemberRepository.getAll().find(s => s.fullName.includes(params.identifier || ''));
      } else {
        member = MemberRepository.getByNationalId(params.identifier) || MemberRepository.getByMemberNumber(params.identifier);
      }
    }

    // 2. Evaluate Policy
    const decision = AccessPolicyEngine.evaluate(
      member,
      params.packages,
      params.config || defaultAccessPolicyConfig
    );

    // If Denied, log event and return
    if (decision.result === 'DENY') {
      HardwareRepository.addEvent(
        createNormalizedHardwareEvent('gate-entry-1', 'ACCESS_DENIED', {
          memberName: member?.fullName || 'ناشناس',
          memberId: member?.id,
          credentialType: params.credentialType === 'manual' ? 'pin' : params.credentialType,
          accessResult: 'denied',
          accessReason: decision.messageFa,
        })
      );

      return {
        success: false,
        decision,
        member,
        turnstileUnlocked: false,
        attendanceRecorded: false,
        correlationId,
        timestamp,
        summaryMessageFa: decision.messageFa,
      };
    }

    // 3. Access Granted: Record Attendance
    let attendanceRecorded = false;
    if (member) {
      try {
        const timeNow = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
        const todayStr = new Date().toISOString().slice(0, 10);
        AttendanceRepository.recordCheckIn({
          id: `att-${Date.now()}-${member.id}`,
          studentId: member.id,
          studentName: member.fullName,
          coachName: member.coachId ? 'مربی اختصاصی' : 'بدون مربی',
          date: todayStr,
          checkInTime: timeNow,
          method: params.credentialType === 'rfid' ? 'rfid_wristband' : params.credentialType === 'face' ? 'face_scan' : params.credentialType === 'fingerprint' ? 'fingerprint' : 'qr_code',
        });
        attendanceRecorded = true;
      } catch (err) {
        console.warn('[Pipeline] Attendance check-in error:', err);
      }
    }

    // 4. Allocate Locker
    let assignedLocker: SmartLocker | undefined;
    let lockerNumber: number | undefined;
    let pulseResult: LockerPulseResult | undefined;

    if (member) {
      const pkg = params.packages.find(p => p.id === member!.packageType || p.type === member!.packageType);
      const currentLockers = LockerRepository.getAll();
      const allocation = LockerAssignmentService.allocateLocker(
        currentLockers,
        member,
        pkg,
        params.preferredZone
      );

      if (allocation.success && allocation.locker) {
        assignedLocker = allocation.locker;
        lockerNumber = allocation.locker.number;

        // Persist in repository
        LockerRepository.assignLocker(
          allocation.locker.number,
          member.id,
          member.fullName,
          allocation.locker.zone
        );

        // Actuate Locker Relay through Hardware Adapter
        try {
          const adapter = LockerAdapterFactory.getAdapter(allocation.locker);
          pulseResult = await adapter.pulseUnlock(allocation.locker, 800, operatorName);
        } catch (err) {
          console.error('[Pipeline] Locker pulse failure:', err);
        }
      }
    }

    // 5. Emit Granted Events & Audit
    HardwareRepository.addEvent(
      createNormalizedHardwareEvent('gate-entry-1', 'ACCESS_GRANTED', {
        memberName: member?.fullName,
        memberId: member?.id,
        credentialType: params.credentialType === 'manual' ? 'pin' : params.credentialType,
        accessResult: 'granted',
        accessReason: lockerNumber 
          ? `تردد تایید شد • کمد #${lockerNumber} اختصاص یافت` 
          : 'تردد تایید شد • بدون کمد',
      })
    );

    const summaryMessageFa = lockerNumber
      ? `خوش آمدید «${member?.fullName}»! کمد شماره #${lockerNumber} باز شد.`
      : `خوش آمدید «${member?.fullName}»! ورود با موفقیت ثبت گردید.`;

    return {
      success: true,
      decision,
      member,
      lockerNumber,
      assignedLocker,
      pulseResult,
      turnstileUnlocked: true,
      attendanceRecorded,
      correlationId,
      timestamp,
      summaryMessageFa,
    };
  }
}
