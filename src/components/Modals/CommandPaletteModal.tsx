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
import { GlassBadge } from '../common/GlassBadge';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl glass-regular rounded-2xl border border-[var(--gym-border-strong)] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-32px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[var(--gym-border)] flex items-center gap-3 bg-[var(--gym-surface-glass-strong)]">
          <Search className="h-5 w-5 text-[var(--gym-text-muted)] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder={lang === 'fa' ? 'جستجوی نام ورزشکار، شماره تماس، کد ملی، کمد، کارت RFID یا عملیات...' : 'Search members, phone, RFID, lockers, devices...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base outline-hidden text-[var(--gym-text,#fff)] placeholder:text-[var(--gym-text-muted)]"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--gym-text-muted)] glass-subtle rounded-md border border-[var(--gym-border)]">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs sm:text-sm scrollbar-thin">
          
          {/* Members Results */}
          {matchedMembers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-[var(--gym-text-muted)] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[var(--gym-brand,#10b981)]" />
                <span>ورزشکاران و اعضا ({matchedMembers.length})</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedMembers.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectTab('students')}
                    className="p-2.5 rounded-xl hover:bg-[var(--gym-surface-glass)] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-[var(--gym-border)]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[var(--gym-brand-soft)] text-[var(--gym-brand,#10b981)] font-bold flex items-center justify-center text-xs border border-[var(--gym-border-strong)]">
                        {m.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--gym-text,#fff)]">{m.fullName}</div>
                        <div className="text-[11px] text-[var(--gym-text-muted)]">{m.phone} • کد ملی: {m.nationalId || 'ثبت‌نشده'}</div>
                      </div>
                    </div>
                    <div className="text-left rtl:text-right flex items-center gap-2">
                      <GlassBadge variant={m.status === 'active' ? 'success' : 'danger'} size="sm">
                        {m.status === 'active' ? 'اشتراک فعال' : 'منقضی'}
                      </GlassBadge>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--gym-text-muted)] rtl:rotate-180" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Smart Lockers Results */}
          {matchedLockers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-[var(--gym-text-muted)] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
                <span>کمدهای هوشمند</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedLockers.map(l => (
                  <div
                    key={l.id}
                    onClick={() => handleSelectTab('smart_lockers')}
                    className="p-2.5 rounded-xl hover:bg-[var(--gym-surface-glass)] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-[var(--gym-border)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-400 font-mono">کمد #{l.number}</span>
                      <span className="text-[var(--gym-text-muted)] font-mono text-xs">({l.zone.toUpperCase()})</span>
                      {l.currentStudentName && (
                        <span className="text-xs text-[var(--gym-text)]">• تحویل به: {l.currentStudentName}</span>
                      )}
                    </div>
                    <GlassBadge variant={l.status === 'available' ? 'success' : 'warning'} size="sm">
                      {l.status === 'available' ? 'آزاد' : 'تحویل داده شده'}
                    </GlassBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coaches Results */}
          {matchedCoaches.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-[var(--gym-text-muted)] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <span>کادر مربیان</span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedCoaches.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectTab('coaches')}
                    className="p-2.5 rounded-xl hover:bg-[var(--gym-surface-glass)] cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-[var(--gym-border)]"
                  >
                    <div className="font-semibold text-[var(--gym-text,#fff)]">
                      استاد {c.fullName} <span className="text-[var(--gym-text-muted)] font-normal text-xs">({c.specialty})</span>
                    </div>
                    <span className="text-[var(--gym-text-muted)] text-xs font-mono">پورسانت {c.commissionRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-[11px] font-bold text-[var(--gym-text-muted)] px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
              <Command className="h-3.5 w-3.5 text-[var(--gym-brand,#10b981)]" />
              <span>عملیات و ماژول‌های سریع</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {filteredQuickActions.map(act => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.id}
                    onClick={() => handleSelectTab(act.tab)}
                    className="p-3 rounded-2xl glass-subtle hover:border-[var(--gym-border-strong)] hover:bg-[var(--gym-surface-glass)] cursor-pointer flex items-center gap-3 transition-all"
                  >
                    <div className="p-2 rounded-xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border)] text-[var(--gym-brand,#10b981)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--gym-text,#fff)]">{act.title}</div>
                      <div className="text-[11px] text-[var(--gym-text-muted)]">{act.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 px-4 bg-[var(--gym-surface-glass-strong)] border-t border-[var(--gym-border)] flex items-center justify-between text-[11px] text-[var(--gym-text-muted)]">
          <div className="flex items-center gap-2">
            <span>سامانه جستجوی سراسری Gym OS</span>
            <span>•</span>
            <span>کلید میانبر: <kbd className="font-mono glass-subtle px-1.5 py-0.5 rounded border border-[var(--gym-border)]">Ctrl+K</kbd></span>
          </div>
          <div>برای خروج Esc را بزنید</div>
        </div>
      </div>
    </div>
  );
};

