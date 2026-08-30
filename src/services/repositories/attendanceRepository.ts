import { AttendanceRecord } from '../../types';
import { initialAttendance } from '../../data/initialData';
import { LocalDbRepository } from '../localDb';
import { PaginatedResult } from './memberRepository';

export interface LiveVisitor {
  studentId: string;
  studentName: string;
  checkInTime: string;
  lockerNumber?: number;
  method?: string;
}

export class AttendanceRepository {
  private static attendanceList: AttendanceRecord[] = [];
  private static liveVisitorsMap = new Map<string, LiveVisitor>();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    
    const hasPersisted = LocalDbRepository.hasKey('attendance');
    let stored: AttendanceRecord[];

    if (hasPersisted) {
      stored = LocalDbRepository.get<AttendanceRecord[]>('attendance', []);
    } else if (!LocalDbRepository.isDatabaseInitialized()) {
      stored = initialAttendance;
      LocalDbRepository.setImmediate('attendance', stored);
    } else {
      stored = [];
    }

    this.rebuildIndex(stored);
    this.isInitialized = true;
  }

  static rebuildIndex(records: AttendanceRecord[]): void {
    this.attendanceList = [...records];
    this.liveVisitorsMap.clear();

    const todayStr = new Date().toISOString().slice(0, 10);

    // Populate live visitors from today's attendance that haven't checked out
    for (const record of this.attendanceList) {
      if (record.date.includes('25') || record.date === todayStr) {
        this.liveVisitorsMap.set(record.studentId, {
          studentId: record.studentId,
          studentName: record.studentName,
          checkInTime: record.checkInTime,
          lockerNumber: record.lockerNumber,
          method: record.method,
        });
      }
    }
  }

  static getAll(): AttendanceRecord[] {
    this.initialize();
    return [...this.attendanceList];
  }

  static recordEntry(record: AttendanceRecord): void {
    this.recordCheckIn(record);
  }

  static recordExit(studentId: string): void {
    this.recordCheckOut(studentId);
  }

  static getToday(): AttendanceRecord[] {
    return this.getTodayAttendance();
  }

  static getByMember(studentId: string): AttendanceRecord[] {
    return this.getMemberAttendance(studentId);
  }

  static getByDateRange(startDate: string, endDate: string): AttendanceRecord[] {
    this.initialize();
    return this.attendanceList.filter(a => a.date >= startDate && a.date <= endDate);
  }

  static getCurrentlyInside(): LiveVisitor[] {
    return this.getLiveVisitors();
  }

  static getTodayAttendance(): AttendanceRecord[] {
    this.initialize();
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.attendanceList.filter(a => a.date.includes('25') || a.date === todayStr);
  }

  static getTodayCount(): number {
    this.initialize();
    const todayStr = new Date().toISOString().slice(0, 10);
    return this.attendanceList.filter(a => a.date.includes('25') || a.date === todayStr).length;
  }

  static getLiveInsideCount(): number {
    this.initialize();
    return this.liveVisitorsMap.size;
  }

  static getLiveVisitors(): LiveVisitor[] {
    this.initialize();
    return Array.from(this.liveVisitorsMap.values());
  }

  static getMemberAttendance(studentId: string): AttendanceRecord[] {
    this.initialize();
    return this.attendanceList.filter(a => a.studentId === studentId);
  }

  static recordCheckIn(record: AttendanceRecord): void {
    this.initialize();
    this.attendanceList = [record, ...this.attendanceList];
    this.liveVisitorsMap.set(record.studentId, {
      studentId: record.studentId,
      studentName: record.studentName,
      checkInTime: record.checkInTime,
      lockerNumber: record.lockerNumber,
      method: record.method,
    });

    LocalDbRepository.setImmediate('attendance', this.attendanceList);
  }

  static recordCheckOut(studentId: string): void {
    this.initialize();
    this.liveVisitorsMap.delete(studentId);
  }

  static queryPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    date?: string;
  } = {}): PaginatedResult<AttendanceRecord> {
    this.initialize();
    const { page = 1, pageSize = 25, search = '', date = 'all' } = params;

    let filtered = this.attendanceList;
    const hasSearch = search && search.trim() !== '';
    const hasDate = date && date !== 'all';

    if (hasSearch || hasDate) {
      const q = hasSearch ? search.trim().toLowerCase() : '';
      filtered = this.attendanceList.filter(a => {
        if (hasSearch) {
          const match = a.studentName.toLowerCase().includes(q) || (a.lockerNumber && String(a.lockerNumber).includes(q));
          if (!match) return false;
        }
        if (hasDate && a.date !== date) return false;
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: safePage,
      pageSize,
    };
  }

  static batchSet(records: AttendanceRecord[]): void {
    this.rebuildIndex(records);
    LocalDbRepository.setImmediate('attendance', this.attendanceList);
  }
}
