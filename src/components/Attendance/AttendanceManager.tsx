import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Search, 
  Clock, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MemberRepository } from '../../services/repositories/memberRepository';
import { LockerRepository } from '../../services/repositories/lockerRepository';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';

const PAGE_SIZE = 15;

export const AttendanceManager: React.FC = () => {
  const { 
    coaches, 
    attendance, 
    checkInStudent, 
    formatNum, 
    t, 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [customLocker, setCustomLocker] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');

  const [lastCheckInResult, setLastCheckInResult] = useState<{
    studentName: string;
    message: string;
    alertType: 'info' | 'warning' | 'error';
    time: string;
    locker?: number;
  } | null>(null);

  // Fast indexed search using MemberRepository
  const matchingStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return MemberRepository.searchFast(searchQuery, 8);
  }, [searchQuery]);

  const handlePerformCheckIn = (studentId: string) => {
    const student = MemberRepository.getById(studentId);
    if (!student) return;

    let assignedLocker = typeof customLocker === 'number' && customLocker > 0 ? customLocker : undefined;
    if (!assignedLocker) {
      const avail = LockerRepository.getAvailable();
      if (avail.length > 0) {
        assignedLocker = avail[0].number;
      }
    }

    const result = checkInStudent(studentId, assignedLocker);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setLastCheckInResult({
      studentName: student.fullName,
      message: result.message,
      alertType: result.alertType || 'info',
      time: timeStr,
      locker: assignedLocker,
    });

    setSearchQuery('');
    setCustomLocker('');
  };

  const datesList = useMemo(() => {
    return Array.from(new Set(attendance.map(a => a.date)));
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (dateFilter === 'all') return attendance;
    return attendance.filter(a => a.date === dateFilter);
  }, [attendance, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / PAGE_SIZE));
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAttendance.slice(start, start + PAGE_SIZE);
  }, [filteredAttendance, currentPage]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <GlassPageHeader
        title={t.attendanceTitle}
        subtitle={t.attendanceDesc}
        icon={<UserCheck className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-subtle border border-[var(--gym-border)] text-xs font-bold text-[var(--gym-text-secondary)]">
            <Users className="h-4 w-4 text-[var(--gym-brand,#10b981)]" />
            <span>ورودهای ثبت شده: {formatNum(attendance.length)} تردد</span>
          </div>
        }
      />

      {/* Live Check-in Desk Form */}
      <GlassCard variant="regular" className="p-6 space-y-4">
        <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-[var(--gym-brand,#10b981)]" />
          <span>میز پذیرش و ثبت فوری ورود ورزشکار</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-3">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gym-text-muted)]" />
            <input
              type="text"
              placeholder={t.scanOrSearchStudent}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-11 py-3 rounded-2xl glass-subtle border border-[var(--gym-border)] text-sm font-medium text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] focus:ring-1 focus:ring-[var(--gym-brand,#10b981)] outline-none"
              autoFocus
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="شماره کمد (اختیاری)"
              value={customLocker}
              onChange={(e) => setCustomLocker(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-3 rounded-2xl glass-subtle border border-[var(--gym-border)] text-sm font-mono text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] outline-none"
            />
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {matchingStudents.length > 0 && (
          <div className="border border-[var(--gym-border)] rounded-2xl overflow-hidden divide-y divide-[var(--gym-border)] glass-regular shadow-xl">
            {matchingStudents.map((st) => {
              const coach = coaches.find(c => c.id === st.coachId);
              return (
                <div
                  key={st.id}
                  onClick={() => handlePerformCheckIn(st.id)}
                  className="p-3.5 flex items-center justify-between hover:bg-[var(--gym-surface-glass)] cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="h-10 w-10 rounded-xl bg-[var(--gym-brand,#10b981)]/15 text-[var(--gym-brand,#10b981)] border border-[var(--gym-brand,#10b981)]/30 flex items-center justify-center font-bold text-sm">
                      {st.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[var(--gym-text,#fff)] flex items-center gap-2">
                        <span>{st.fullName}</span>
                        {st.remainingDebt > 0 && (
                          <GlassBadge variant="danger" size="sm">بدهکار</GlassBadge>
                        )}
                        {st.status !== 'active' && (
                          <GlassBadge variant="warning" size="sm">منقضی</GlassBadge>
                        )}
                      </div>
                      <div className="text-xs text-[var(--gym-text-muted)] flex items-center gap-2 mt-0.5">
                        <span>پرونده #{st.memberNumber || st.id.slice(0, 6)}</span>
                        <span>•</span>
                        <span>موبایل: {st.phone}</span>
                        <span>•</span>
                        <span>مربی: {coach ? coach.fullName : 'عمومی'}</span>
                      </div>
                    </div>
                  </div>

                  <GlassButton
                    variant="neon"
                    size="sm"
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  >
                    ثبت ورود + کمد
                  </GlassButton>
                </div>
              );
            })}
          </div>
        )}

        {/* Real-time Confirmation Card */}
        {lastCheckInResult && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
            lastCheckInResult.alertType === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {lastCheckInResult.alertType === 'warning' ? (
                <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  ورود {lastCheckInResult.studentName} ثبت گردید
                </div>
                <div className="mt-0.5 opacity-90">{lastCheckInResult.message}</div>
              </div>
            </div>

            <div className="text-left rtl:text-right font-mono">
              <div className="px-3 py-1 rounded-xl glass-subtle font-bold border border-[var(--gym-border)] text-center">
                کمد #{lastCheckInResult.locker || '---'}
              </div>
              <div className="text-[10px] text-[var(--gym-text-muted)] mt-1 text-center">
                ساعت {lastCheckInResult.time}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Attendance History */}
      <GlassCard variant="regular" className="overflow-hidden p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--gym-brand,#10b981)]" />
            <span>{t.checkInHistory}</span>
          </h3>

          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs text-[var(--gym-text)] bg-[var(--gym-surface)] outline-none"
          >
            <option value="all" className="bg-stone-900 text-white">تمامی روزها ({attendance.length} رکورد)</option>
            {datesList.map(d => (
              <option key={d} value={d} className="bg-stone-900 text-white">تاریخ: {d}</option>
            ))}
          </select>
        </div>

        <div className="border border-[var(--gym-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
              <tr>
                <th className="p-3">نام ورزشکار</th>
                <th className="p-3">مربی</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">ساعت ورود</th>
                <th className="p-3">کمد تحویلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gym-border)]">
              {paginatedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-[var(--gym-text-muted)]">
                    هیچ رکوردی یافت نشد.
                  </td>
                </tr>
              ) : (
                paginatedAttendance.map(att => (
                  <tr key={att.id} className="hover:bg-[var(--gym-surface-glass)]">
                    <td className="p-3 font-bold text-[var(--gym-text,#fff)]">{att.studentName}</td>
                    <td className="p-3 text-[var(--gym-text-secondary)]">{att.coachName}</td>
                    <td className="p-3 text-[var(--gym-text-secondary)] font-mono">{att.date}</td>
                    <td className="p-3 font-mono font-bold text-[var(--gym-text,#fff)]">{att.checkInTime}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg glass-subtle font-mono font-bold text-[var(--gym-brand,#10b981)] border border-[var(--gym-border)]">
                        #{att.lockerNumber || '---'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--gym-border)] text-xs text-[var(--gym-text-muted)]">
            <span>صفحه {formatNum(currentPage)} از {formatNum(totalPages)} ({formatNum(filteredAttendance.length)} تردد)</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-40 cursor-pointer text-[var(--gym-text)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-[var(--gym-border)] glass-subtle disabled:opacity-40 cursor-pointer text-[var(--gym-text)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

    </div>
  );
};
