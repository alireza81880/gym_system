/**
 * Atomic Locker Assignment Transaction (PART 54)
 * Prevents race conditions and double-allocations during peak gym check-in hours.
 */

import { SmartLocker, LockerZone } from '../../types';
import { LockerRepository } from '../repositories/lockerRepository';
import { LocalDatabase } from '../database/localDatabase';

export interface AssignLockerParams {
  lockerNumber: number;
  studentId: string;
  studentName: string;
  zone?: LockerZone;
  assignedBy?: string;
}

export class LockerTransaction {
  static async allocate(params: AssignLockerParams): Promise<{ success: boolean; locker?: SmartLocker; error?: string }> {
    const { lockerNumber, studentId, studentName, zone, assignedBy = 'auto_gate' } = params;

    return await LocalDatabase.transaction(async (tx) => {
      const locker = LockerRepository.getByNumber(lockerNumber);
      if (!locker) {
        return { success: false, error: `کمد شماره ${lockerNumber} وجود ندارد.` };
      }

      if (locker.status !== 'available') {
        return { 
          success: false, 
          error: `کمد شماره ${lockerNumber} در حال حاضر اشغال است (اختصاص یافته به: ${locker.currentStudentName || 'کاربر دیگر'}).` 
        };
      }

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const updatedLocker: SmartLocker = {
        ...locker,
        status: 'occupied',
        currentStudentId: studentId,
        currentStudentName: studentName,
        assignedAt: timeStr,
        isLocked: false,
        lastUnlockedAt: new Date().toISOString(),
      };

      // Atomic commit to repository and persistent DB
      LockerRepository.assignLocker(lockerNumber, studentId, studentName, zone);
      await tx.update('lockers', lockerNumber, updatedLocker);

      return {
        success: true,
        locker: updatedLocker,
      };
    });
  }

  static async release(lockerNumber: number): Promise<boolean> {
    return await LocalDatabase.transaction(async (tx) => {
      const locker = LockerRepository.getByNumber(lockerNumber);
      if (!locker) return false;

      const success = LockerRepository.releaseLocker(lockerNumber);
      const updated = LockerRepository.getByNumber(lockerNumber);
      if (updated) {
        await tx.update('lockers', lockerNumber, updated);
      }
      return success;
    });
  }
}
