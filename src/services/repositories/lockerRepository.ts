import { SmartLocker, LockerZone } from '../../types';
import { initialSmartLockers } from '../../data/initialData';
import { PersistenceManager } from './persistenceManager';
import { LockerEngine } from '../lockerService';

export class LockerRepository {
  private static lockersList: SmartLocker[] = [];
  private static byNumberMap = new Map<number, SmartLocker>();
  private static isInitialized = false;

  private static cachedAvailableCount = 0;
  private static cachedOccupiedCount = 0;

  static initialize(): void {
    if (this.isInitialized) return;
    const stored = PersistenceManager.get<SmartLocker[]>('smart_lockers', initialSmartLockers);
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

  static getAll(): SmartLocker[] {
    this.initialize();
    return this.lockersList;
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

  static assignLocker(num: number, studentId: string): boolean {
    this.initialize();
    const locker = this.byNumberMap.get(num);
    if (!locker || locker.status !== 'available') return false;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated: SmartLocker = {
      ...locker,
      status: 'occupied',
      currentStudentId: studentId,
      assignedAt: timeStr,
    };

    this.updateLockerInList(updated);
    return true;
  }

  static releaseLocker(num: number): boolean {
    this.initialize();
    const locker = this.byNumberMap.get(num);
    if (!locker) return false;

    const updated: SmartLocker = {
      ...locker,
      status: 'available',
      currentStudentId: undefined,
      assignedAt: undefined,
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
      assignedAt: undefined,
    };

    this.updateLockerInList(updated);
  }

  private static updateLockerInList(updated: SmartLocker): void {
    const idx = this.lockersList.findIndex(l => l.number === updated.number);
    if (idx !== -1) {
      this.lockersList[idx] = updated;
      this.rebuildIndex(this.lockersList);
      PersistenceManager.setBatched('smart_lockers', this.lockersList);
    }
  }

  static setCount(newCount: number, defaultZone: LockerZone = 'general'): { success: boolean; warning?: string } {
    this.initialize();
    const result = LockerEngine.resizeLockers(this.lockersList, newCount, defaultZone);
    this.rebuildIndex(result.updatedLockers);
    PersistenceManager.setBatched('smart_lockers', this.lockersList);
    return { success: true, warning: result.warning };
  }

  static batchSet(lockers: SmartLocker[]): void {
    this.rebuildIndex(lockers);
    PersistenceManager.setBatched('smart_lockers', this.lockersList);
  }
}
