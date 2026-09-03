import { SmartLocker, LockerZone, LockerAssignment } from '../../types';
import { initialSmartLockers } from '../../data/initialData';
import { LocalDbRepository } from '../localDb';
import { LockerEngine } from '../lockerService';

export class LockerRepository {
  private static lockersList: SmartLocker[] = [];
  private static byNumberMap = new Map<number, SmartLocker>();
  private static assignmentHistory: LockerAssignment[] = [];
  private static isInitialized = false;

  private static cachedAvailableCount = 0;
  private static cachedOccupiedCount = 0;

  static initialize(): void {
    if (this.isInitialized) return;

    const hasPersisted = LocalDbRepository.hasKey('smart_lockers');
    let stored: SmartLocker[];

    if (hasPersisted) {
      stored = LocalDbRepository.get<SmartLocker[]>('smart_lockers', []);
    } else if (!LocalDbRepository.isDatabaseInitialized()) {
      stored = initialSmartLockers;
      LocalDbRepository.setImmediate('smart_lockers', stored);
    } else {
      stored = [];
    }

    this.assignmentHistory = LocalDbRepository.get<LockerAssignment[]>('locker_assignments_history', []);
    this.rebuildIndex(stored);
    this.isInitialized = true;
  }

  static rebuildIndex(lockers: SmartLocker[]): void {
    this.lockersList = [...lockers];
    this.byNumberMap.clear();
    let avail = 0;
    let occ = 0;

    for (const locker of this.lockersList) {
      this.byNumberMap.set(locker.number, locker);
      if (locker.status === 'available') avail++;
      if (locker.status === 'occupied') occ++;
    }

    this.cachedAvailableCount = avail;
    this.cachedOccupiedCount = occ;
  }

  static reset(lockers: SmartLocker[] = []): void {
    this.rebuildIndex(lockers);
    this.assignmentHistory = [];
    LocalDbRepository.setImmediate('smart_lockers', lockers);
    LocalDbRepository.setImmediate('locker_assignments_history', []);
    this.isInitialized = true;
  }

  static getAll(): SmartLocker[] {
    this.initialize();
    return [...this.lockersList];
  }

  static getAvailable(): SmartLocker[] {
    this.initialize();
    return this.lockersList.filter(l => l.status === 'available');
  }

  static getAvailableCount(): number {
    this.initialize();
    return this.cachedAvailableCount;
  }

  static getOccupiedCount(): number {
    this.initialize();
    return this.cachedOccupiedCount;
  }

  static getMetrics(): { total: number; available: number; occupied: number; maintenance: number } {
    this.initialize();
    const maintenance = this.lockersList.filter(l => l.status === 'maintenance').length;
    return {
      total: this.lockersList.length,
      available: this.cachedAvailableCount,
      occupied: this.cachedOccupiedCount,
      maintenance,
    };
  }

  static getByNumber(num: number): SmartLocker | undefined {
    this.initialize();
    return this.byNumberMap.get(num);
  }

  static getAssignmentHistory(limit = 50): LockerAssignment[] {
    this.initialize();
    return this.assignmentHistory.slice(0, limit);
  }

  static recordAssignment(assignment: LockerAssignment): void {
    this.initialize();
    this.assignmentHistory = [assignment, ...this.assignmentHistory].slice(0, 100);
    LocalDbRepository.setImmediate('locker_assignments_history', this.assignmentHistory);
  }

  static assignLocker(num: number, studentId: string, studentName?: string, zone?: LockerZone): boolean {
    this.initialize();
    const locker = this.byNumberMap.get(num);
    if (!locker || locker.status !== 'available') return false;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated: SmartLocker = {
      ...locker,
      status: 'occupied',
      currentStudentId: studentId,
      currentStudentName: studentName,
      assignedAt: timeStr,
      isLocked: false,
      lastUnlockedAt: new Date().toISOString(),
      ...(zone ? { zone } : {}),
    };

    this.updateLockerInList(updated);

    if (studentName) {
      this.recordAssignment({
        id: `lck-asn-${Date.now()}-${num}`,
        lockerNumber: num,
        memberId: studentId,
        memberName: studentName,
        assignedAt: timeStr,
        assignedBy: 'auto_gate',
        zone: locker.zone,
      });
    }

    return true;
  }

  static releaseLocker(num: number): boolean {
    this.initialize();
    const locker = this.byNumberMap.get(num);
    if (!locker) return false;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Mark released in history
    this.assignmentHistory = this.assignmentHistory.map(item => {
      if (item.lockerNumber === num && !item.releasedAt) {
        return { ...item, releasedAt: timeStr };
      }
      return item;
    });
    LocalDbRepository.setImmediate('locker_assignments_history', this.assignmentHistory);

    const updated: SmartLocker = {
      ...locker,
      status: 'available',
      currentStudentId: undefined,
      currentStudentName: undefined,
      assignedAt: undefined,
      isLocked: true,
      lastUnlockedAt: new Date().toISOString(),
    };

    this.updateLockerInList(updated);
    return true;
  }

  static toggleMaintenance(num: number): void {
    this.initialize();
    const locker = this.byNumberMap.get(num);
    if (!locker) return;

    const nextStatus = locker.status === 'maintenance' ? 'available' : 'maintenance';
    const updated: SmartLocker = {
      ...locker,
      status: nextStatus,
      currentStudentId: undefined,
      currentStudentName: undefined,
      assignedAt: undefined,
    };

    this.updateLockerInList(updated);
  }

  private static updateLockerInList(updated: SmartLocker): void {
    const idx = this.lockersList.findIndex(l => l.number === updated.number);
    if (idx !== -1) {
      this.lockersList[idx] = updated;
      this.rebuildIndex(this.lockersList);
      LocalDbRepository.setImmediate('smart_lockers', this.lockersList);
    }
  }

  static setCount(newCount: number, defaultZone: LockerZone = 'general'): { success: boolean; warning?: string } {
    this.initialize();
    const result = LockerEngine.resizeLockers(this.lockersList, newCount, defaultZone);
    this.rebuildIndex(result.updatedLockers);
    LocalDbRepository.setImmediate('smart_lockers', this.lockersList);
    return { success: true, warning: result.warning };
  }

  static batchSet(lockers: SmartLocker[]): void {
    this.rebuildIndex(lockers);
    LocalDbRepository.setImmediate('smart_lockers', this.lockersList);
  }
}
