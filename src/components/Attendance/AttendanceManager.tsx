import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Clock, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  ShieldAlert,
  Dumbbell
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AttendanceManager: React.FC = () => {
  const { 
    students, 
    coaches, 
    attendance, 
    checkInStudent, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [customLocker, setCustomLocker] = useState<number>(0);
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    studentName: string;
    message: string;
    alertType: 'info' | 'warning' | 'error';
    time: string;
    locker: number;
  } | null>(null);

  const [dateFilter, setDateFilter] = useState('all');

  // Search matching students
  const matchingStudents = searchQuery.trim() === '' ? [] : students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nationalId.includes(searchQuery) ||
    s.phone.includes(searchQuery)
  );

  const handlePerformCheckIn = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const assignedLocker = customLocker || Math.floor(1 + Math.random() * 60);
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
    setCustomLocker(0);
  };

  const datesList = Array.from(new Set(attendance.map(a => a.date)));

  const filteredAttendance = attendance.filter(a => {
    return dateFilter === 'all' || a.date === dateFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-amber-500" />
            <span>{t.attendanceTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.attendanceDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <Users className="h-4 w-4" />
          <span>ورودهای ثبت شده: {formatNum(attendance.length)} تردد</span>
        </div>
      </div>

      {/* Live Check-in Desk Form */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-500" />
          <span>میز پذیرش و ثبت فوری ورود ورزشکار</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-3">
            <Search className="absolute right-3.5 rtl:right-3.5 rtl:left-auto left-auto top-3.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder={t.scanOrSearchStudent}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-11 rtl:pr-11 rtl:pl-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-medium focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="شماره کمد (اختیاری)"
              value={customLocker || ''}
              onChange={(e) => setCustomLocker(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {matchingStudents.length > 0 && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900 shadow-md">
            {matchingStudents.map((st) => {
              const coach = coaches.find(c => c.id === st.coachId);
              return (
                <div
                  key={st.id}
                  onClick={() => handlePerformCheckIn(st.id)}
                  className="p-3.5 flex items-center justify-between hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="h-9 w-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-sm">
                      {st.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                        <span>{st.fullName}</span>
                        {st.remainingDebt > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">بدهکار</span>
                        )}
                        {st.status !== 'active' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">منقضی</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>کدملی: {st.nationalId}</span>
                        <span>•</span>
                        <span>مربی: {coach ? coach.fullName : 'عمومی'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs"
                  >
                    ثبت ورود + کمد
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Real-time Confirmation Card */}
        {lastCheckInResult && (
          <div className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            lastCheckInResult.alertType === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
          }`}>
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {lastCheckInResult.alertType === 'warning' ? (
                <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm">
                  ورود {lastCheckInResult.studentName} ثبت گردید
                </div>
                <div className="mt-0.5">{lastCheckInResult.message}</div>
              </div>
            </div>

            <div className="text-left rtl:text-right font-mono">
              <div className="px-2.5 py-1 rounded bg-white dark:bg-stone-900 font-bold border border-stone-200 dark:border-stone-700">
                کمد #{lastCheckInResult.locker}
              </div>
              <div className="text-[10px] text-stone-400 mt-1 text-center">
                ساعت {lastCheckInResult.time}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-stone-500" />
            <span>{t.checkInHistory}</span>
          </h3>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
          >
            <option value="all">تمامی روزها ({attendance.length} رکورد)</option>
            {datesList.map(d => (
              <option key={d} value={d}>تاریخ: {d}</option>
            ))}
          </select>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
              <tr>
                <th className="p-3">نام ورزشکار</th>
                <th className="p-3">مربی</th>
                <th className="p-3">تاریخ</th>
                <th className="p-3">ساعت ورود</th>
                <th className="p-3">کمد تحویلی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {filteredAttendance.map(att => (
                <tr key={att.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                  <td className="p-3 font-bold text-stone-900 dark:text-white">{att.studentName}</td>
                  <td className="p-3 text-stone-600 dark:text-stone-400">{att.coachName}</td>
                  <td className="p-3 text-stone-600 dark:text-stone-400 font-mono">{att.date}</td>
                  <td className="p-3 font-mono font-bold text-stone-800 dark:text-stone-200">{att.checkInTime}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-bold text-amber-700 dark:text-amber-300 border border-stone-200 dark:border-stone-700">
                      #{att.lockerNumber}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
