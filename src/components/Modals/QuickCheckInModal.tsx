import React, { useState } from 'react';
import { X, Search, CheckCircle2, UserCheck, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface QuickCheckInModalProps {
  onClose: () => void;
}

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({ onClose }) => {
  const { students, coaches, checkInStudent, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [lockerNumber, setLockerNumber] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredStudents = searchTerm.trim() === '' ? [] : students.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.nationalId.includes(searchTerm)
  );

  const handleCheckIn = (studentId: string, studentName: string) => {
    const assignedLocker = lockerNumber || Math.floor(1 + Math.random() * 60);
    const res = checkInStudent(studentId, assignedLocker);
    setFeedback(`ورود ${studentName} با کمد #${assignedLocker} ثبت شد.`);
    setSearchTerm('');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" />
            <span>ثبت سریع تردد و تحویل کمد</span>
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
            شماره کمد اختیاری
          </label>
          <input
            type="number"
            placeholder="مثلاً: ۲۴ (در صورت خالی بودن خودکار تعیین می‌شود)"
            value={lockerNumber || ''}
            onChange={(e) => setLockerNumber(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
            نام یا کدملی شاگرد
          </label>
          <div className="relative">
            <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-auto top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="جستجو و انتخاب ورزشکار..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 rtl:pr-10 rtl:pl-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              autoFocus
            />
          </div>
        </div>

        {feedback && (
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        {filteredStudents.length > 0 && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-56 overflow-y-auto">
            {filteredStudents.map(st => {
              const coach = coaches.find(c => c.id === st.coachId);
              return (
                <div
                  key={st.id}
                  onClick={() => handleCheckIn(st.id, st.fullName)}
                  className="p-3 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer flex items-center justify-between transition-colors text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900 dark:text-white">{st.fullName}</div>
                    <div className="text-stone-400 text-[10px]">مربی: {coach ? coach.fullName : 'عمومی'}</div>
                  </div>
                  <button className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs">
                    ورود
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
