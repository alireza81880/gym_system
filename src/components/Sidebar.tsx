import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ReceiptText, 
  UserCheck, 
  KeyRound,
  FileText, 
  BarChart3, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';

export type { NavTab };

interface SidebarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
  onOpenQuickCheckIn?: () => void;
  onOpenNewStudent?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const appContext = useApp();
  const activeTab = props.activeTab ?? appContext.activeTab;
  const setActiveTab = props.setActiveTab ?? appContext.setActiveTab;
  const { t, coaches, students, smartLockers, lang, formatNum } = appContext;

  const activeCoachesCount = coaches.filter(c => c.status === 'active').length;
  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const debtorsCount = students.filter(s => s.remainingDebt > 0).length;
  const availableLockersCount = smartLockers.filter(l => l.status === 'available').length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: t.dashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'smartLockers' as NavTab,
      label: t.smartLockers,
      icon: KeyRound,
      badge: `${formatNum(availableLockersCount)} آزاد`,
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    },
    {
      id: 'coaches' as NavTab,
      label: t.coaches,
      icon: Users,
      badge: formatNum(activeCoachesCount),
      badgeColor: 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300',
    },
    {
      id: 'students' as NavTab,
      label: t.students,
      icon: GraduationCap,
      badge: formatNum(activeStudentsCount),
      badgeColor: debtorsCount > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-stone-200 dark:bg-stone-700',
    },
    {
      id: 'finances' as NavTab,
      label: t.finances,
      icon: ReceiptText,
      warningDot: debtorsCount > 0,
    },
    {
      id: 'attendance' as NavTab,
      label: t.attendance,
      icon: UserCheck,
    },
    {
      id: 'plans' as NavTab,
      label: t.plans,
      icon: FileText,
    },
    {
      id: 'reports' as NavTab,
      label: t.reports,
      icon: BarChart3,
    },
    {
      id: 'settings' as NavTab,
      label: t.settings,
      icon: Settings,
    },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-2.5 shadow-xs sticky top-24">
        
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap lg:whitespace-normal group ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-semibold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? 'text-stone-950'
                        : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 mr-2 rtl:mr-0 rtl:ml-2">
                  {item.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? 'bg-stone-950 text-amber-400'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.warningDot && !isActive && (
                    <span className="h-2 w-2 rounded-full bg-rose-500" title="دارای بدهی معوق"></span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Coach Quick Stats in Sidebar */}
        <div className="hidden lg:block mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 px-3">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2">
            <span>{t.debtorsAlert}</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              {formatNum(debtorsCount)} {lang === 'fa' ? 'نفر' : 'members'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (activeStudentsCount > 0 ? (activeStudentsCount - debtorsCount) / activeStudentsCount * 100 : 100))}%` }}
            ></div>
          </div>
        </div>

      </div>
    </aside>
  );
};
