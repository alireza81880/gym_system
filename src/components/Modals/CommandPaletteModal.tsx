import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  KeyRound, 
  Cpu, 
  Users, 
  CreditCard, 
  UserCheck, 
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTab } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ isOpen, onClose }) => {
  const { 
    students, 
    coaches, 
    smartLockers, 
    hardwareDevices, 
    setActiveTab, 
    lang, 
    formatMoney 
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Matched entities
  const matchedMembers = cleanQuery ? students.filter(s => 
    s.fullName.toLowerCase().includes(cleanQuery) ||
    s.phone.includes(cleanQuery) ||
    (s.nationalId && s.nationalId.includes(cleanQuery)) ||
    (s.rfidCardUid && s.rfidCardUid.toLowerCase().includes(cleanQuery))
  ).slice(0, 4) : [];

  const matchedLockers = cleanQuery ? smartLockers.filter(l => 
    l.number.toString().includes(cleanQuery) ||
    (l.currentStudentName && l.currentStudentName.toLowerCase().includes(cleanQuery))
  ).slice(0, 3) : [];

  const matchedCoaches = cleanQuery ? coaches.filter(c => 
    c.fullName.toLowerCase().includes(cleanQuery) ||
    c.specialty.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const matchedDevices = cleanQuery ? hardwareDevices.filter(d => 
    d.name.toLowerCase().includes(cleanQuery) ||
    d.ipAddress.includes(cleanQuery) ||
    d.vendor.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  // Quick Action navigation shortcuts
  const quickActions: { id: string; title: string; subtitle: string; tab: NavTab; icon: any }[] = [
    { id: 'act-checkin', title: 'کنترل تردد و گیت ورود', subtitle: 'ثبت حضور و بررسی گیت', tab: 'attendance', icon: UserCheck },
    { id: 'act-lockers', title: 'کمدهای هوشمند و رله', subtitle: 'مشاهده و بازگشایی کمدها', tab: 'smart_lockers', icon: KeyRound },
    { id: 'act-hardware', title: 'هاب سخت‌افزار و IoT', subtitle: 'پیکربندی گیت‌ها و بیومتریک', tab: 'hardware_hub', icon: Cpu },
    { id: 'act-insights', title: 'موتور هوشمند و تحلیل رفتار', subtitle: 'اعضای در معرض ریزش و وفادار', tab: 'insights', icon: Sparkles },
    { id: 'act-finance', title: 'حسابداری و ثبت دریافتی', subtitle: 'دفتر کل مالی و شهریه‌ها', tab: 'finances', icon: CreditCard },
  ];

  const filteredQuickActions = cleanQuery 
    ? quickActions.filter(a => a.title.toLowerCase().includes(cleanQuery) || a.subtitle.toLowerCase().includes(cleanQuery))
    : quickActions;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3 bg-stone-50/50 dark:bg-stone-950/40">
          <Search className="h-5 w-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder={lang === 'fa' ? 'جستجوی نام ورزشکار، شماره تماس، کد ملی، کمد، کارت RFID یا عملیات...' : 'Search members, phone, RFID, lockers, devices...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base outline-hidden text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-stone-500 bg-stone-200 dark:bg-stone-800 rounded border border-stone-300 dark:border-stone-700">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs sm:text-sm">
          
          {/* Members Results */}
          {matchedMembers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-stone-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-amber-500" />
                <span>ورزشکاران و اعضا ({matchedMembers.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedMembers.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectTab('students')}
                    className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                        {m.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-900 dark:text-stone-100">{m.fullName}</div>
                        <div className="text-[11px] text-stone-500">{m.phone} • کد ملی: {m.nationalId || 'ثبت‌نشده'}</div>
                      </div>
                    </div>
                    <div className="text-left rtl:text-right flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${m.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'}`}>
                        {m.status === 'active' ? 'اشتراک فعال' : 'منقضی'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-stone-400 rtl:rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Lockers Results */}
          {matchedLockers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-stone-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-blue-500" />
                <span>کمدهای هوشمند</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedLockers.map(l => (
                  <div
                    key={l.id}
                    onClick={() => handleSelectTab('smart_lockers')}
                    className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">کمد #{l.number}</span>
                      <span className="text-stone-500">({l.zone.toUpperCase()})</span>
                      {l.currentStudentName && (
                        <span className="text-xs text-stone-700 dark:text-stone-300">• تحویل به: {l.currentStudentName}</span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${l.status === 'available' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                      {l.status === 'available' ? 'آزاد' : 'تحویل داده شده'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coaches Results */}
          {matchedCoaches.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-stone-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-500" />
                <span>کادر مربیان</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedCoaches.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTab('coaches')}
                    className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/70 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="font-semibold text-stone-900 dark:text-stone-100">
                      استاد {c.fullName} <span className="text-stone-500 font-normal">({c.specialty})</span>
                    </div>
                    <span className="text-stone-400 text-xs">پورسانت {c.commissionRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[11px] font-bold text-stone-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
              <Command className="h-3.5 w-3.5 text-emerald-500" />
              <span>عملیات و ماژول‌های سریع</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {filteredQuickActions.map(act => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectTab(act.tab)}
                    className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 cursor-pointer flex items-center gap-3 transition-all"
                  >
                    <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      <Icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-900 dark:text-stone-100">{act.title}</div>
                      <div className="text-[11px] text-stone-500">{act.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-2.5 px-4 bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-2">
            <span>سامانه جستجوی سراسری Gym OS</span>
            <span>•</span>
            <span>کلید میانبر: <kbd className="font-mono bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded">Ctrl+K</kbd></span>
          </div>
          <div>برای خروج Esc را بزنید</div>
        </div>
      </div>
    </div>
  );
};
