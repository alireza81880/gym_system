import React, { useState, useRef, useEffect } from 'react';
import { 
  Dumbbell, 
  Sun, 
  Moon, 
  Globe, 
  PlusCircle, 
  UserCheck, 
  Search, 
  Building2, 
  ShieldAlert, 
  RefreshCw, 
  Radio, 
  KeyRound,
  Sparkles,
  Menu,
  MoreVertical,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    currentUser
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
    <header className="shrink-0 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors z-20">
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Right Section in RTL: Sidebar Toggle + Logo & Brand + Branch */}
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
            
            {/* Sidebar Mobile/Desktop Toggle */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="تغییر حالت سایدبار"
                aria-label="تغییر حالت سایدبار"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-xs font-bold shrink-0">
              <Dumbbell className="h-5 w-5 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight truncate">
                  Gym OS
                </h1>
                
                {/* Branch selector - hidden on very narrow screens, accessible in more menu */}
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="hidden xl:inline-block text-xs font-semibold px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 outline-none"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                {/* Integration Mode Pill */}
                <span className={`hidden 2xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  integrationMode === 'shadow' 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                    : integrationMode === 'hybrid' 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                  <span>{integrationMode === 'shadow' ? 'شنود (Shadow)' : integrationMode === 'hybrid' ? 'ترکیبی' : 'کنترل کامل'}</span>
                </span>
              </div>

              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate hidden lg:block">
                {activeBranch ? `${activeBranch.name} • اپراتور: ${currentUser.fullName}` : t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Left Section in RTL: Actions (Always Visible + Overflow Menu for small screens) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Global Command Palette Trigger - Full on large, icon on medium */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-medium transition-all"
              title="جستجو و پالت دستورات (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">دستورات...</span>
              <kbd className="font-mono text-[10px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700">Ctrl+K</kbd>
            </button>

            {/* Compact Search icon on medium screens */}
            <button
              onClick={onOpenCommandPalette}
              className="lg:hidden hidden sm:inline-flex p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs transition-colors"
              title="جستجو و پالت دستورات"
              aria-label="جستجو"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Emergency Master Unlock Button - ALWAYS VISIBLE */}
            <button
              onClick={onOpenEmergencyUnlock}
              title="بازگشایی اضطراری کلیه کمدها (Master Unlock)"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors shrink-0"
              aria-label="مستر آنلاک کمدها"
            >
              <KeyRound className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden md:inline">مستر آنلاک</span>
            </button>

            {/* Quick Check-in Button - ALWAYS VISIBLE */}
            <button
              id="header-quick-checkin-btn"
              onClick={onOpenQuickCheckIn}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700 shrink-0"
              title={t.quickCheckIn}
              aria-label={t.quickCheckIn}
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">{t.quickCheckIn}</span>
            </button>

            {/* New Student Button - ALWAYS VISIBLE */}
            <button
              id="header-new-student-btn"
              onClick={onOpenNewStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-xs transition-all shrink-0 cursor-pointer"
              title={t.newStudent}
              aria-label={t.newStudent}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{t.newStudent}</span>
            </button>

            {/* Cloud Sync State Button - on medium+ */}
            <button
              onClick={triggerCloudSync}
              title={syncState === 'SYNCING' ? 'در حال همگام‌سازی ابری...' : 'همگام‌سازی ابری'}
              aria-label="همگام‌سازی"
              className="hidden sm:inline-flex p-1.5 sm:p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-stone-500 ${syncState === 'SYNCING' ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            {/* Language Toggle - on medium+ */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title={lang === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
              aria-label="تغییر زبان"
              className="hidden md:inline-flex p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors text-xs font-medium items-center gap-1"
            >
              <Globe className="h-3.5 w-3.5 text-stone-500" />
              <span className="font-semibold hidden lg:inline">{t.languageToggle}</span>
            </button>

            {/* Overflow "بیشتر ▾" Menu for Narrow Windows */}
            <div className="relative md:hidden" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                aria-label="گزینه‌های بیشتر"
                title="گزینه‌های بیشتر"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {isMoreMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1"
                  dir="rtl"
                >
                  <button
                    onClick={() => {
                      onOpenCommandPalette();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  >
                    <Search className="h-4 w-4 text-stone-400" />
                    <span>جستجو و دستورات (Ctrl+K)</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerCloudSync();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  >
                    <RefreshCw className={`h-4 w-4 text-stone-400 ${syncState === 'SYNCING' ? 'animate-spin text-amber-500' : ''}`} />
                    <span>همگام‌سازی ابری</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleLanguage();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-right"
                  >
                    <Globe className="h-4 w-4 text-stone-400" />
                    <span>تغییر زبان ({lang === 'fa' ? 'English' : 'فارسی'})</span>
                  </button>

                  {/* Branch selector in mobile/narrow menu */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 px-2">
                    <label className="block text-[10px] text-stone-400 mb-1">شعبه فعال:</label>
                    <select
                      value={activeBranchId}
                      onChange={(e) => {
                        setActiveBranchId(e.target.value);
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-xs font-semibold px-2 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
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
