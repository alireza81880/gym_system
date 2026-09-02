/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CoachList } from './components/Coaches/CoachList';
import { StudentList } from './components/Students/StudentList';
import { FinancialLedger } from './components/Financials/FinancialLedger';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { SmartLockerHub } from './components/Lockers/SmartLockerHub';
import { HardwareHubView } from './components/HardwareHub/HardwareHubView';
import { SmartInsightsView } from './components/Insights/SmartInsightsView';
import { FeatureCenterView } from './components/Features/FeatureCenterView';
import { DiagnosticsView } from './components/Diagnostics/DiagnosticsView';
import { PlanManager } from './components/Plans/PlanManager';
import { ManagerReports } from './components/Reports/ManagerReports';
import { SettingsView } from './components/Settings/SettingsView';
import { MigrationCenter } from './components/Migration/MigrationCenter';
import { InstallationWizard } from './components/Setup/InstallationWizard';
import { MigrationSetup } from './components/Setup/MigrationSetup';
import { InitialAccessScreen } from './components/Setup/InitialAccessScreen';
import { QuickCheckInModal } from './components/Modals/QuickCheckInModal';
import { NewPaymentModal } from './components/Modals/NewPaymentModal';
import { CommandPaletteModal } from './components/Modals/CommandPaletteModal';
import { EmergencyMasterUnlockModal } from './components/Modals/EmergencyMasterUnlockModal';
import { OnboardingWizardModal } from './components/Modals/OnboardingWizardModal';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, isInstalled, isDemoMode, exitDemoMode, enterDemoMode, completeInstallation } = useApp();
  
  // Responsive Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gym_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return window.innerWidth < 1280;
    } catch {
      return false;
    }
  });

  const [isSidebarOverlayOpen, setIsSidebarOverlayOpen] = useState(false);

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMigrationSetupOpen, setIsMigrationSetupOpen] = useState(false);
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isEmergencyUnlockOpen, setIsEmergencyUnlockOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [openStudentModalTrigger, setOpenStudentModalTrigger] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive Window Resize Handler (Throttled via requestAnimationFrame)
  useEffect(() => {
    let ticking = false;
    const handleResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.innerWidth >= 850 && isSidebarOverlayOpen) {
            setIsSidebarOverlayOpen(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOverlayOpen]);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 850) {
      setIsSidebarOverlayOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('gym_sidebar_collapsed', String(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const handleOpenNewStudent = () => {
    setActiveTab('students');
    setOpenStudentModalTrigger(true);
  };

  const handleStartMigration = () => {
    setIsMigrationSetupOpen(true);
  };

  const handleCompleteMigrationSetup = (setupData: {
    gymName: string;
    managerName: string;
    phone: string;
    city: string;
  }) => {
    completeInstallation({
      orgData: {
        name: setupData.gymName,
        managerName: setupData.managerName,
        managerMobile: setupData.phone,
        phone: setupData.phone,
        city: setupData.city,
      },
      lockerCount: 0,
      ownerData: {
        fullName: setupData.managerName,
        phone: setupData.phone,
      },
    });
    setIsMigrationSetupOpen(false);
    setActiveTab('migration');
  };

  if (!isInstalled && !isDemoMode) {
    if (isWizardOpen) {
      return (
        <InstallationWizard
          isInitialSetup={true}
          onClose={() => setIsWizardOpen(false)}
        />
      );
    }
    if (isMigrationSetupOpen) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6" dir="rtl">
          <MigrationCenter
            isInitialSetup={true}
            onBack={() => setIsMigrationSetupOpen(false)}
          />
        </div>
      );
    }
    return (
      <InitialAccessScreen
        onStartNewGym={() => setIsWizardOpen(true)}
        onStartMigration={handleStartMigration}
        onEnterDemo={enterDemoMode}
      />
    );
  }

  return (
    <div className="h-screen w-screen min-h-0 overflow-hidden flex flex-row bg-[var(--gym-bg,#0c0f17)] text-[var(--gym-text,#fff)] font-sans transition-colors duration-200" dir="rtl">
      
      {/* 1. AppShell -> Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        isOverlayOpen={isSidebarOverlayOpen}
        onCloseOverlay={() => setIsSidebarOverlayOpen(false)}
        onOpenQuickCheckIn={() => setIsQuickCheckInOpen(true)}
        onOpenNewStudent={handleOpenNewStudent}
      />

      {/* 2. AppShell -> MainArea */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-screen overflow-hidden">
        
        {/* Demo Sandbox Alert Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-950 animate-ping"></span>
              <span>حالت دمو و آموزشی فعال است — تغییرات روی داده‌های شبیه‌سازی شده اعمال می‌شوند.</span>
            </div>
            <button
              onClick={exitDemoMode}
              className="px-3 py-1 rounded-xl bg-stone-950 text-amber-300 hover:text-white transition-all text-[11px] cursor-pointer font-bold"
            >
              خروج از دمو
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenQuickCheckIn={() => setIsQuickCheckInOpen(true)}
          onOpenNewStudent={handleOpenNewStudent}
          onOpenNewPayment={() => setIsNewPaymentOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenEmergencyUnlock={() => setIsEmergencyUnlockOpen(true)}
        />

        {/* Scrollable Main Content Viewport */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 scrollbar-thin">
          <main className="w-full max-w-7xl mx-auto space-y-6 pb-8 min-w-0">
            {activeTab === 'dashboard' && (
              <Dashboard
                onOpenNewStudent={handleOpenNewStudent}
                onOpenNewPayment={() => setIsNewPaymentOpen(true)}
                onOpenCheckIn={() => setIsQuickCheckInOpen(true)}
              />
            )}

            {activeTab === 'smart_lockers' && <SmartLockerHub />}

            {activeTab === 'hardware_hub' && <HardwareHubView />}

            {activeTab === 'coaches' && <CoachList />}

            {activeTab === 'students' && (
              <StudentList
                initialOpenNewModal={openStudentModalTrigger}
                onModalClosed={() => setOpenStudentModalTrigger(false)}
              />
            )}

            {activeTab === 'attendance' && <AttendanceManager />}

            {activeTab === 'finances' && <FinancialLedger />}

            {activeTab === 'plans' && <PlanManager />}

            {activeTab === 'insights' && <SmartInsightsView />}

            {activeTab === 'reports' && <ManagerReports />}

            {activeTab === 'migration' && <MigrationCenter />}

            {activeTab === 'features' && <FeatureCenterView />}

            {activeTab === 'diagnostics' && <DiagnosticsView />}

            {activeTab === 'settings' && <SettingsView />}
          </main>

          {/* Compact In-Content Footer */}
          <footer className="w-full max-w-7xl mx-auto border-t border-[var(--gym-border)] pt-4 pb-6 mt-8 text-xs text-[var(--gym-text-muted,#9ca3af)] no-print flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="h-2 w-2 rounded-full bg-[var(--gym-brand,#10b981)] animate-pulse"></span>
              <span className="font-semibold text-[var(--gym-text-secondary,#d1d5db)]">سامانه جامع مدیریت هوشمند باشگاه و مربیان (Gym OS)</span>
            </div>
            <div className="font-mono text-[11px] flex items-center gap-3">
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="text-[var(--gym-brand,#10b981)] hover:underline font-bold cursor-pointer"
              >
                راهنمای راه‌اندازی سریع (Wizard)
              </button>
              <span>•</span>
              <span>نسخه ۲.۴.۰ • آفلاین / امن</span>
            </div>
          </footer>
        </div>

      </div>

      {/* 3. Global Overlays & Modals */}
      {isQuickCheckInOpen && (
        <QuickCheckInModal onClose={() => setIsQuickCheckInOpen(false)} />
      )}

      {isNewPaymentOpen && (
        <NewPaymentModal onClose={() => setIsNewPaymentOpen(false)} />
      )}

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      <EmergencyMasterUnlockModal
        isOpen={isEmergencyUnlockOpen}
        onClose={() => setIsEmergencyUnlockOpen(false)}
      />

      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
