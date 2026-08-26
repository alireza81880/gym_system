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
  AlertCircle,
  Cpu,
  BrainCircuit,
  Boxes,
  Activity,
  Pin,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';
import { SmartInsightsEngine } from '../services/insightsService';
import { ThemeSelectorPopover } from './common/ThemeSelectorPopover';

export type { NavTab };

interface SidebarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
  onOpenQuickCheckIn?: () => void;
  onOpenNewStudent?: () => void;
}

const iconMap: Record<string, any> = {
  LayoutDashboard,
  KeyRound,
  Cpu,
  GraduationCap,
  Users,
  UserCheck,
  ReceiptText,
  FileText,
  BrainCircuit,
  BarChart3,
  Activity,
  Boxes,
  Settings,
  ArrowRightLeft,
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const appContext = useApp();
  const activeTab = props.activeTab ?? appContext.activeTab;
  const setActiveTab = props.setActiveTab ?? appContext.setActiveTab;
  const { 
    t, 
    coaches, 
    students, 
    smartLockers, 
    hardwareDevices,
    attendance,
    moduleFeatures,
    lang, 
    formatNum 
  } = appContext;

  const activeCoachesCount = coaches.filter(c => c.status === 'active').length;
  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const debtorsCount = students.filter(s => s.remainingDebt > 0).length;
  const availableLockersCount = smartLockers.filter(l => l.status === 'available').length;
  const onlineDevicesCount = hardwareDevices.filter(d => d.status === 'online').length;
  const churnRiskCount = SmartInsightsEngine.detectChurnRisk(students, attendance, 12).length;

  // Filter only enabled features
  const enabledFeatures = moduleFeatures.filter(f => f.isEnabled);

  const getBadgeForFeature = (featureId: NavTab) => {
    switch (featureId) {
      case 'smart_lockers':
        return { text: `${formatNum(availableLockersCount)} آزاد`, color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' };
      case 'hardware_hub':
        return { text: `${formatNum(onlineDevicesCount)} آنلاین`, color: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' };
      case 'students':
        return { text: formatNum(activeStudentsCount), color: debtorsCount > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-stone-200 dark:bg-stone-700' };
      case 'coaches':
        return { text: formatNum(activeCoachesCount), color: 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300' };
      case 'insights':
        if (churnRiskCount > 0) {
          return { text: `${formatNum(churnRiskCount)} ریزش`, color: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' };
        }
        return undefined;
      default:
        return undefined;
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-3 shadow-xs sticky top-24 space-y-1">
        
        {/* Quick section label */}
        <div className="hidden lg:flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          <span>ماژول‌های ناوبری</span>
          <span className="text-[10px] text-amber-500 font-mono">GYM OS V2.4</span>
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 scrollbar-none">
          {enabledFeatures.map((item) => {
            const Icon = iconMap[item.iconName] || Boxes;
            const currentTabId = item.id === 'smart_lockers' ? 'smartLockers' : item.id;
            const isActive = activeTab === currentTabId || activeTab === item.id;
            const badgeInfo = getBadgeForFeature(item.id);
            const isFinancesDebt = (item.id === 'finances' && debtorsCount > 0);

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap lg:whitespace-normal group ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-stone-950'
                        : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{lang === 'fa' ? item.labelFa : item.labelEn}</span>
                </div>

                <div className="flex items-center gap-1.5 mr-2 rtl:mr-0 rtl:ml-2 shrink-0">
                  {badgeInfo && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? 'bg-stone-950 text-amber-400'
                          : badgeInfo.color
                      }`}
                    >
                      {badgeInfo.text}
                    </span>
                  )}
                  {isFinancesDebt && !isActive && (
                    <span className="h-2 w-2 rounded-full bg-rose-500" title="دارای بدهی معوق"></span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Theme Selector Popover at bottom of sidebar */}
        <div className="pt-2">
          <ThemeSelectorPopover />
        </div>

        {/* Quick Footer inside Sidebar on desktop */}
        <div className="hidden lg:block pt-2 border-t border-slate-800 text-[11px] text-slate-400 px-2 space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>پایگاه داده محلی</span>
            </span>
            <span className="text-emerald-400 font-mono font-bold">آفلاین / امن</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
