import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenQuickCheckIn: () => void;
  onOpenNewStudent: () => void;
  onOpenNewPayment: () => void;
  onOpenCommandPalette: () => void;
  onOpenEmergencyUnlock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickCheckIn,
  onOpenNewStudent,
  onOpenNewPayment,
  onOpenCommandPalette,
  onOpenEmergencyUnlock,
}) => {
  const { 
    lang, 
    theme, 
    toggleTheme, 
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

  const activeBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand & Branch Selector */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 font-bold">
              <Dumbbell className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight truncate">
                  Gym OS
                </h1>
                
                {/* Branch selector */}
                <select
                  value={activeBranchId}
                  onChange={(e) => setActiveBranchId(e.target.value)}
                  className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 outline-hidden"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                {/* Integration Mode Pill */}
                <span className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${integrationMode === 'shadow' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' : integrationMode === 'hybrid' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                  <span>{integrationMode === 'shadow' ? 'حالت شنود (Shadow)' : integrationMode === 'hybrid' ? 'ترکیبی (Hybrid)' : 'کنترل کامل (Full)'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate hidden sm:block">
                {activeBranch ? `${activeBranch.name} • اپراتور: ${currentUser.fullName}` : t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons & Switches */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Global Command Palette Trigger */}
            <button
              onClick={onOpenCommandPalette}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs font-medium transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              <span>جستجو و دستورات...</span>
              <kbd className="font-mono text-[10px] bg-stone-200 dark:bg-stone-800 px-1.5 py-0.5 rounded border border-stone-300 dark:border-stone-700">Ctrl+K</kbd>
            </button>

            {/* Emergency Master Unlock Button */}
            <button
              onClick={onOpenEmergencyUnlock}
              title="بازگشایی اضطراری کلیه کمدها (Master Unlock)"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden md:inline">مستر آنلاک</span>
            </button>

            {/* Quick Check-in Button */}
            <button
              id="header-quick-checkin-btn"
              onClick={onOpenQuickCheckIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">{t.quickCheckIn}</span>
            </button>

            {/* New Student Button */}
            <button
              id="header-new-student-btn"
              onClick={onOpenNewStudent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{t.newStudent}</span>
            </button>

            {/* Cloud Sync State Button */}
            <button
              onClick={triggerCloudSync}
              title={syncState === 'SYNCING' ? 'در حال همگام‌سازی ابری...' : 'همگام‌سازی ابری'}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 text-stone-500 ${syncState === 'SYNCING' ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title={lang === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Globe className="h-4 w-4 text-stone-500" />
              <span className="font-semibold">{t.languageToggle}</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-stone-600" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
