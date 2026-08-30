import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { AttendanceRecord, Student, AccessDecision } from '../types';
import { AttendanceRepository, LiveVisitor } from '../services/repositories/attendanceRepository';
import { MemberRepository } from '../services/repositories/memberRepository';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { HardwareRepository } from '../services/repositories/hardwareRepository';
import { createNormalizedHardwareEvent } from '../services/hardwareAdapters';
import { PaginatedResult } from '../services/repositories/memberRepository';
import { AccessPolicyEngine } from '../services/accessPolicyService';
import { settingsStore } from './settingsStore';

export interface ScanResult {
  success: boolean;
  student?: Student;
  lockerNumber?: number;
  message: string;
  alertType: 'success' | 'warning' | 'error';
  method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code' | 'manual_override';
  decisionCode?: string;
}

export interface AttendanceState {
  version: number;
  todayCount: number;
  liveInsideCount: number;
}

export const attendanceStore = createStore<AttendanceState>({
  version: 1,
  todayCount: AttendanceRepository.getTodayCount(),
  liveInsideCount: AttendanceRepository.getLiveInsideCount(),
});

export function notifyAttendanceChange(): void {
  attendanceStore.setState({
    version: attendanceStore.getState().version + 1,
    todayCount: AttendanceRepository.getTodayCount(),
    liveInsideCount: AttendanceRepository.getLiveInsideCount(),
  });
}

export const attendanceActions = {
  evaluateMemberAccess(studentId: string): AccessDecision {
    const student = MemberRepository.getById(studentId);
    const { packages, accessPolicyConfig } = settingsStore.getState();
    return AccessPolicyEngine.evaluate(student, packages, accessPolicyConfig);
  },

  checkInStudent(
    studentId: string,
    lockerNumber?: number,
    method: AttendanceRecord['method'] = 'fingerprint'
  ): {
    success: boolean;
    message: string;
    alertType?: 'info' | 'warning' | 'error';
    lockerNumber?: number;
  } {
    const student = MemberRepository.getById(studentId);
    if (!student) {
      return { success: false, message: 'عضو مورد نظر یافت نشد.', alertType: 'error' };
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayStr = '1403/05/25';

    let assignedLocker = lockerNumber;
    if (!assignedLocker) {
      const availLockers = LockerRepository.getAll().filter(l => l.status === 'available');
      if (availLockers.length > 0) {
        assignedLocker = availLockers[0].number;
      }
    }

    if (assignedLocker) {
      LockerRepository.assignLocker(assignedLocker, studentId);
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: student.tenantId || 'gym-org-1',
      branchId: student.branchId || 'branch-tehran-central',
      studentId: student.id,
      studentName: student.fullName,
      coachName: student.coachId || 'عمومی',
      date: todayStr,
      checkInTime: timeStr,
      lockerNumber: assignedLocker,
      method,
      isCurrentlyInside: true,
    };

    AttendanceRepository.recordCheckIn(newRecord);

    // Increment member attended sessions
    const updatedSessions = (student.sessionsAttended || 0) + 1;
    MemberRepository.updateMember(studentId, {
      sessionsAttended: updatedSessions,
    });

    // Create hardware event
    const credType: 'face' | 'rfid' | 'fingerprint' | 'qr' = method === 'face_scan' ? 'face' : method === 'rfid_wristband' ? 'rfid' : method === 'fingerprint' ? 'fingerprint' : 'qr';
    HardwareRepository.addEvent(
      createNormalizedHardwareEvent('dev-turnstile-main', 'ACCESS_GRANTED', {
        memberName: student.fullName,
        memberId: student.id,
        credentialType: credType,
        accessResult: 'granted',
        accessReason: `تردد ثبت شد • کمد #${assignedLocker || '---'}`,
      })
    );

    notifyAttendanceChange();

    return {
      success: true,
      message: `خوش آمدید ${student.fullName} • ورود ثبت شد • کمد #${assignedLocker || 'بدون کمد'}`,
      alertType: student.remainingDebt > 0 ? 'warning' : 'info',
      lockerNumber: assignedLocker,
    };
  },

  simulateIdentityScan(
    method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code',
    query: string
  ): ScanResult {
    const students = MemberRepository.getAll();
    let matchedStudent: Student | undefined;

    if (method === 'rfid_card') {
      matchedStudent = students.find(s => s.rfidCardUid === query || s.phone?.endsWith(query) || s.memberNumber === query);
    } else if (method === 'face_recognition') {
      matchedStudent = students.find(s => s.fullName.includes(query) || s.id === query);
    } else {
      matchedStudent = students.find(s => s.nationalId === query || s.phone === query || s.memberNumber === query);
    }

    if (!matchedStudent) {
      return {
        success: false,
        message: 'شناسه یا چهره در بانک اطلاعاتی شناسایی نشد.',
        alertType: 'error',
        method,
      };
    }

    const decision = this.evaluateMemberAccess(matchedStudent.id);

    let assignedLockerNum: number | undefined;
    if (decision.result === 'ALLOW' || decision.result === 'ALLOW_WITH_WARNING') {
      const checkInRes = this.checkInStudent(matchedStudent.id, undefined, 'rfid_wristband');
      assignedLockerNum = checkInRes.lockerNumber;
    }

    return {
      success: decision.result !== 'DENY',
      student: matchedStudent,
      lockerNumber: assignedLockerNum,
      message: decision.messageFa,
      alertType: decision.result === 'ALLOW' ? 'success' : decision.result === 'ALLOW_WITH_WARNING' ? 'warning' : 'error',
      method,
    };
  },

  batchSet(records: AttendanceRecord[]): void {
    AttendanceRepository.batchSet(records);
    notifyAttendanceChange();
  }
};

export function useAttendanceStore<S = AttendanceState>(selector?: (state: AttendanceState) => S): S {
  return useStore(attendanceStore, selector);
}

export function useLiveVisitors(): LiveVisitor[] {
  const version = useStore(attendanceStore, s => s.version);
  return useMemo(() => {
    return AttendanceRepository.getLiveVisitors();
  }, [version]);
}

export function usePaginatedAttendance(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  date?: string;
}): PaginatedResult<AttendanceRecord> {
  const version = useStore(attendanceStore, s => s.version);
  return useMemo(() => {
    return AttendanceRepository.queryPaginated(params);
  }, [version, params.page, params.pageSize, params.search, params.date]);
}

export function useAttendance() {
  const version = useStore(attendanceStore, s => s.version);
  const todayCount = useStore(attendanceStore, s => s.todayCount);
  const liveInsideCount = useStore(attendanceStore, s => s.liveInsideCount);
  const attendance = useMemo(() => AttendanceRepository.getAll(), [version]);

  return {
    version,
    todayCount,
    liveInsideCount,
    attendance,
    ...attendanceActions,
  };
}

