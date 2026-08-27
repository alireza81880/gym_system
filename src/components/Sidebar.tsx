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
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';
import { SmartInsightsEngine } from '../services/insightsService';
import { ThemeSelectorPopover } from './common/ThemeSelectorPopover';

export type { NavTab };

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isOverlayOpen?: boolean;
  onCloseOverlay?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  isOverlayOpen = false,
  onCloseOverlay,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}) => {
  const appContext = useApp();
  const activeTab = propActiveTab ?? appContext.activeTab;
  const setActiveTab = propSetActiveTab ?? appContext.setActiveTab;
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
        return { text: `${formatNum(availableLockersCount)} آزاد`, compactText: `${formatNum(availableLockersCount)}`, color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' };
      case 'hardware_hub':
        return { text: `${formatNum(onlineDevicesCount)} آنلاین`, compactText: `${formatNum(onlineDevicesCount)}`, color: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' };
      case 'students':
        return { text: formatNum(activeStudentsCount), compactText: formatNum(activeStudentsCount), color: debtorsCount > 0 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-stone-200 dark:bg-stone-700' };
      case 'coaches':
        return { text: formatNum(activeCoachesCount), compactText: formatNum(activeCoachesCount), color: 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300' };
      case 'insights':
        if (churnRiskCount > 0) {
          return { text: `${formatNum(churnRiskCount)} ریزش`, compactText: `${formatNum(churnRiskCount)}!`, color: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' };
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleSelectTab = (tabId: NavTab) => {
    setActiveTab(tabId);
    if (onCloseOverlay) {
      onCloseOverlay();
    }
  };

  const renderSidebarContent = (compactMode: boolean) => (
    <div className="flex flex-col h-full select-none">
      
      {/* Sidebar Header */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
        {!compactMode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                ⚡
              </div>
              <div className="truncate">
                <span className="block font-bold text-xs text-stone-900 dark:text-white truncate">Gym OS Desk</span>
                <span className="block text-[10px] text-stone-400 font-mono">ماژول‌های پذیرش</span>
              </div>
            </div>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white items-center justify-center transition-colors cursor-pointer"
                title="جمع کردن سایدبار (Compact)"
                aria-label="جمع کردن سایدبار"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0" />
              </button>
            )}

            {onCloseOverlay && isOverlayOpen && (
              <button
                onClick={onCloseOverlay}
                className="lg:hidden w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors"
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-sm shadow-xs">
              ⚡
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="باز کردن سایدبار (Expand)"
                aria-label="باز کردن سایدبار"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-0" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Navigation Scroll Area */}
      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-thin">
        {enabledFeatures.map((item) => {
          const Icon = iconMap[item.iconName] || Boxes;
          const currentTabId = item.id === 'smart_lockers' ? 'smartLockers' : item.id;
          const isActive = activeTab === currentTabId || activeTab === item.id;
          const badgeInfo = getBadgeForFeature(item.id);
          const isFinancesDebt = (item.id === 'finances' && debtorsCount > 0);
          const label = lang === 'fa' ? item.labelFa : item.labelEn;

          if (compactMode) {
            return (
              <div key={item.id} className="relative group flex justify-center">
                <button
                  id={`nav-item-${item.id}`}
                  onClick={() => handleSelectTab(item.id)}
                  aria-label={label}
                  className={`w-11 h-11 rounded-2xl font-medium flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-stone-950 stroke-[2.4]' : ''}`} />
                  
                  {/* Mini badge indicator in compact mode */}
                  {badgeInfo && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-stone-950 text-amber-400 ring-1 ring-amber-500/50 flex items-center justify-center">
                      {badgeInfo.compactText}
                    </span>
                  )}
                  {isFinancesDebt && !badgeInfo && !isActive && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </button>

                {/* Floating Tooltip in RTL (appears to the left of the button) */}
                <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-white text-xs font-semibold rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden sm:flex items-center gap-1.5">
                  <span>{label}</span>
                  {badgeInfo && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                      {badgeInfo.text}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => handleSelectTab(item.id)}
              aria-label={label}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all group cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-stone-950'
                      : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white'
                  }`}
                />
                <span className="truncate">{label}</span>
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

      {/* Sticky Bottom Utilities Section */}
      <div className="shrink-0 p-2.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 space-y-2">
        
        {/* Theme Selector Popover (Compact or Full) */}
        <ThemeSelectorPopover compact={compactMode} />

        {/* System Status Indicator */}
        {!compactMode ? (
          <div className="pt-1.5 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 px-1 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>دیتابیس محلی (پایدار)</span>
              </span>
              <span className="text-emerald-500 font-mono font-bold">فعال</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-1 group relative">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse cursor-help" />
            <div className="absolute right-full mr-2.5 bottom-0 px-2 py-1 bg-stone-900 border border-stone-700 text-white text-[10px] font-mono rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden sm:block">
              دیتابیس محلی فعال
            </div>
          </div>
        )}

      </div>

    </div>
  );

  return (
    <>
      {/* 1. Desktop / Windowed Fixed Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shrink-0 transition-all duration-200 z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>

      {/* 2. Mobile / Narrow Window Drawer Overlay */}
      {isOverlayOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseOverlay}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Sliding Drawer */}
          <aside
            className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl z-10 flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right"
            dir="rtl"
          >
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};
