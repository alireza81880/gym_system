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
  Sparkles,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';
import { SmartInsightsEngine } from '../services/insightsService';
import { ThemeSelectorPopover } from './common/ThemeSelectorPopover';
import { GlassBadge } from './common/GlassBadge';

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
        return { text: `${formatNum(availableLockersCount)} آزاد`, compactText: `${formatNum(availableLockersCount)}`, variant: 'success' as const };
      case 'hardware_hub':
        return { text: `${formatNum(onlineDevicesCount)} آنلاین`, compactText: `${formatNum(onlineDevicesCount)}`, variant: 'info' as const };
      case 'students':
        return { text: formatNum(activeStudentsCount), compactText: formatNum(activeStudentsCount), variant: debtorsCount > 0 ? ('warning' as const) : ('neutral' as const) };
      case 'coaches':
        return { text: formatNum(activeCoachesCount), compactText: formatNum(activeCoachesCount), variant: 'neutral' as const };
      case 'insights':
        if (churnRiskCount > 0) {
          return { text: `${formatNum(churnRiskCount)} ریزش`, compactText: `${formatNum(churnRiskCount)}!`, variant: 'danger' as const };
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
      <div className="p-3.5 border-b border-[var(--gym-border)] flex items-center justify-between shrink-0 bg-[var(--gym-surface-glass-strong)]">
        {!compactMode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand,#10b981)] flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="truncate">
                <span className="block font-bold text-xs sm:text-sm text-[var(--gym-text,#fff)] tracking-tight truncate">Gym OS Desk</span>
                <span className="block text-[10px] text-[var(--gym-text-muted,#9ca3af)] font-mono">ماژول مدیریت باشگاه</span>
              </div>
            </div>

            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex w-7 h-7 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] items-center justify-center transition-colors cursor-pointer"
                title="جمع کردن سایدبار"
                aria-label="جمع کردن سایدبار"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-0" />
              </button>
            )}

            {onCloseOverlay && isOverlayOpen && (
              <button
                onClick={onCloseOverlay}
                className="lg:hidden w-7 h-7 rounded-xl glass-subtle text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] flex items-center justify-center transition-colors"
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand,#10b981)] flex items-center justify-center font-bold text-base shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="w-7 h-7 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] flex items-center justify-center transition-colors cursor-pointer"
                title="باز کردن سایدبار"
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
                  className={`w-10 h-10 rounded-2xl font-medium flex items-center justify-center transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-md shadow-[var(--gym-glow)] border border-[var(--gym-border-strong)]'
                      : 'text-[var(--gym-text-secondary,#d1d5db)] hover:bg-[var(--gym-surface-glass)] hover:text-[var(--gym-text,#fff)]'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-stone-950 stroke-[2.4]' : ''}`} />
                  
                  {/* Mini badge indicator in compact mode */}
                  {badgeInfo && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-[var(--gym-surface)] text-[var(--gym-brand,#10b981)] border border-[var(--gym-border-strong)] flex items-center justify-center">
                      {badgeInfo.compactText}
                    </span>
                  )}
                  {isFinancesDebt && !badgeInfo && !isActive && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </button>

                {/* Floating Tooltip in RTL */}
                <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 glass-regular border border-[var(--gym-border-strong)] text-[var(--gym-text,#fff)] text-xs font-semibold rounded-xl shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap hidden sm:flex items-center gap-1.5">
                  <span>{label}</span>
                  {badgeInfo && (
                    <GlassBadge variant={badgeInfo.variant} size="sm">
                      {badgeInfo.text}
                    </GlassBadge>
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
                  ? 'nav-item-active font-bold border border-[var(--gym-border-strong)] shadow-xs'
                  : 'text-[var(--gym-text-secondary,#d1d5db)] hover:bg-[var(--gym-surface-glass)] hover:text-[var(--gym-text,#fff)]'
              }`}
            >
              <div className="flex items-center space-x-2.5 rtl:space-x-reverse min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-[var(--gym-brand,#10b981)]'
                      : 'text-[var(--gym-text-muted,#9ca3af)] group-hover:text-[var(--gym-text,#fff)]'
                  }`}
                />
                <span className="truncate">{label}</span>
              </div>

              <div className="flex items-center gap-1.5 mr-2 rtl:mr-0 rtl:ml-2 shrink-0">
                {badgeInfo && (
                  <GlassBadge variant={badgeInfo.variant} size="sm">
                    {badgeInfo.text}
                  </GlassBadge>
                )}
                {isFinancesDebt && !isActive && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="دارای بدهی معوق"></span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sticky Bottom Utilities Section */}
      <div className="shrink-0 p-2.5 border-t border-[var(--gym-border)] bg-[var(--gym-surface-glass-strong)] space-y-2">
        
        {/* Theme Selector Popover */}
        <ThemeSelectorPopover compact={compactMode} />

        {/* System Status Indicator */}
        {!compactMode ? (
          <div className="pt-1.5 border-t border-[var(--gym-border)] text-[11px] text-[var(--gym-text-muted,#9ca3af)] px-1 space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>دیتابیس پایدار محلی</span>
              </span>
              <span className="text-[var(--gym-brand,#10b981)] font-mono font-bold">فعال</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-1 group relative">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse cursor-help" />
            <div className="absolute right-full mr-2.5 bottom-0 px-2 py-1 glass-regular border border-[var(--gym-border-strong)] text-[var(--gym-text)] text-[10px] font-mono rounded-lg shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 hidden sm:block">
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
        className={`hidden md:flex flex-col h-full glass-regular border-l border-[var(--gym-border)] shrink-0 transition-all duration-200 z-20 ${
          isCollapsed ? 'w-18' : 'w-64'
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
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Sliding Drawer */}
          <aside
            className="absolute inset-y-0 right-0 w-72 max-w-[85vw] glass-regular border-l border-[var(--gym-border-strong)] shadow-2xl z-10 flex flex-col transform transition-transform duration-200 ease-out animate-in slide-in-from-right"
            dir="rtl"
          >
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}
    </>
  );
};

