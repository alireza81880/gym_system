import React from 'react';
import { 
  Dumbbell, 
  Sun, 
  Moon, 
  Globe, 
  PlusCircle, 
  UserCheck, 
  CreditCard,
  Building2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenQuickCheckIn: () => void;
  onOpenNewStudent: () => void;
  onOpenNewPayment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickCheckIn,
  onOpenNewStudent,
  onOpenNewPayment,
}) => {
  const { lang, theme, toggleTheme, toggleLanguage, t } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
              <Dumbbell className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight truncate">
                  {t.appTitle}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 rtl:ml-1 rtl:mr-0 animate-pulse"></span>
                  {t.gymSystemReady}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons & Switches */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Quick Actions for Manager */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                id="header-quick-checkin-btn"
                onClick={onOpenQuickCheckIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700"
              >
                <UserCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t.quickCheckIn}</span>
              </button>

              <button
                id="header-new-student-btn"
                onClick={onOpenNewStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold shadow-xs transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{t.newStudent}</span>
              </button>
            </div>

            {/* Language Toggle */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title={lang === 'fa' ? 'Switch to English' : 'تغییر به زبان فارسی'}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors text-xs font-medium flex items-center gap-1.5"
            >
              <Globe className="h-4 w-4 text-stone-500" />
              <span className="font-semibold">{t.languageToggle}</span>
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
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
