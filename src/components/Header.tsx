import React, { useState, useRef, useEffect } from 'react';
import { 
  Dumbbell, 
  Globe, 
  PlusCircle, 
  UserCheck, 
  Search, 
  KeyRound,
  RefreshCw, 
  Menu,
  MoreVertical,
  Zap,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GlassButton } from './common/GlassButton';
import { GlassBadge } from './common/GlassBadge';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenQuickCheckIn: () => void;
  onOpenNewStudent: () => void;
  onOpenNewPayment: () => void;
  onOpenCommandPalette: () => void;
  onOpenEmergencyUnlock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarCollapsed,
  onOpenQuickCheckIn,
  onOpenNewStudent,
  onOpenNewPayment,
  onOpenCommandPalette,
  onOpenEmergencyUnlock,
}) => {
  const { 
    lang, 
    toggleLanguage, 
    t, 
    branches, 
    activeBranchId, 
    setActiveBranchId,
    integrationMode,
    syncState,
    triggerCloudSync,
    currentUser,
    organizationInfo
  } = useApp();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  return (
    <header className="shrink-0 glass-regular border-b border-[var(--gym-border)] transition-colors z-20">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Right Section in RTL: Sidebar Toggle + Logo & Brand + Branch */}
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
            
            {/* Sidebar Mobile/Desktop Toggle */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-[var(--gym-text-secondary,#d1d5db)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass)] transition-colors cursor-pointer"
                title="تغییر حالت سایدبار"
                aria-label="تغییر حالت سایدبار"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand,#10b981)] flex items-center justify-center shadow-xs font-bold shrink-0">
              <Zap className="h-5 w-5 fill-current" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[var(--gym-text,#fff)] tracking-tight truncate">
                  {organizationInfo?.name || 'Gym OS'}
                </h1>
                
                {/* Branch selector */}
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="hidden xl:inline-block text-xs font-semibold px-2.5 py-1 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] outline-none bg-[var(--gym-surface)]"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-stone-900 text-white">{b.name}</option>
                  ))}
                </select>

                {/* Integration Mode Pill */}
                <span className={`hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  integrationMode === 'shadow' 
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                    : integrationMode === 'hybrid' 
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                  <span>{integrationMode === 'shadow' ? 'شنود (Shadow)' : integrationMode === 'hybrid' ? 'ترکیبی' : 'کنترل کامل'}</span>
                </span>
              </div>

              <p className="text-[11px] text-[var(--gym-text-muted,#9ca3af)] truncate hidden lg:block">
                {activeBranch ? `${activeBranch.name} • اپراتور: ${currentUser.fullName}` : t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Left Section in RTL: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Global Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted,#9ca3af)] hover:text-[var(--gym-text,#fff)] text-xs font-medium transition-all cursor-pointer"
              title="جستجو و پالت دستورات (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">دستورات...</span>
              <kbd className="font-mono text-[10px] bg-[var(--gym-surface-glass-strong)] px-1.5 py-0.5 rounded-md border border-[var(--gym-border)] text-[var(--gym-text-muted)]">Ctrl+K</kbd>
            </button>

            {/* Compact Search icon on medium screens */}
            <button
              onClick={onOpenCommandPalette}
              className="lg:hidden hidden sm:inline-flex p-2 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] text-xs transition-colors cursor-pointer"
              title="جستجو و پالت دستورات"
              aria-label="جستجو"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Emergency Master Unlock Button */}
            <button
              onClick={onOpenEmergencyUnlock}
              title="بازگشایی اضطراری کلیه کمدها (Master Unlock)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-colors shrink-0 cursor-pointer"
              aria-label="مستر آنلاک کمدها"
            >
              <KeyRound className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden md:inline">مستر آنلاک</span>
            </button>

            {/* Quick Check-in Button */}
            <button
              id="header-quick-checkin-btn"
              onClick={onOpenQuickCheckIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text,#fff)] transition-colors shrink-0 cursor-pointer"
              title={t.quickCheckIn}
              aria-label={t.quickCheckIn}
            >
              <UserCheck className="h-3.5 w-3.5 text-[var(--gym-brand,#10b981)]" />
              <span className="hidden sm:inline">{t.quickCheckIn}</span>
            </button>

            {/* New Student Button */}
            <GlassButton
              variant="primary"
              size="sm"
              icon={<PlusCircle className="h-3.5 w-3.5" />}
              id="header-new-student-btn"
              onClick={onOpenNewStudent}
              title={t.newStudent}
            >
              <span className="font-bold">{t.newStudent}</span>
            </GlassButton>

            {/* Cloud Sync State Button */}
            <button
              onClick={triggerCloudSync}
              title={syncState === 'SYNCING' ? 'در حال همگام‌سازی ابری...' : 'همگام‌سازی ابری'}
              aria-label="همگام‌سازی"
              className="hidden sm:inline-flex p-2 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${syncState === 'SYNCING' ? 'animate-spin text-[var(--gym-brand)]' : ''}`} />
            </button>

            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title={lang === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
              aria-label="تغییر زبان"
              className="hidden md:inline-flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] transition-colors text-xs font-medium items-center gap-1 cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="font-semibold hidden lg:inline">{t.languageToggle}</span>
            </button>

            {/* Overflow Menu for Narrow Windows */}
            <div className="relative md:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-2 rounded-xl glass-subtle text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] transition-colors cursor-pointer"
                aria-label="گزینه‌های بیشتر"
                title="گزینه‌های بیشتر"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-56 glass-regular border border-[var(--gym-border-strong)] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1"
                  dir="rtl"
                >
                  <button
                    onClick={() => {
                      onOpenCommandPalette();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--gym-text-secondary,#d1d5db)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass)] transition-colors text-right"
                  >
                    <Search className="h-4 w-4 text-[var(--gym-text-muted)]" />
                    <span>جستجو و دستورات (Ctrl+K)</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerCloudSync();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--gym-text-secondary,#d1d5db)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass)] transition-colors text-right"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncState === 'SYNCING' ? 'animate-spin text-[var(--gym-brand)]' : 'text-[var(--gym-text-muted)]'}`} />
                    <span>همگام‌سازی ابری</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleLanguage();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--gym-text-secondary,#d1d5db)] hover:text-[var(--gym-text,#fff)] hover:bg-[var(--gym-surface-glass)] transition-colors text-right"
                  >
                    <Globe className="h-4 w-4 text-[var(--gym-text-muted)]" />
                    <span>تغییر زبان ({lang === 'fa' ? 'English' : 'فارسی'})</span>
                  </button>

                  {/* Branch selector in mobile/narrow menu */}
                  <div className="pt-2 border-t border-[var(--gym-border)] px-2">
                    <label className="block text-[10px] text-[var(--gym-text-muted)] mb-1">شعبه فعال:</label>
                    <select
                      value={activeBranchId}
                      onChange={(e) => {
                        setActiveBranchId(e.target.value);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-xs font-semibold px-2 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] outline-none bg-[var(--gym-surface)]"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-stone-900 text-white">{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

