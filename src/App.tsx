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
import { QuickCheckInModal } from './components/Modals/QuickCheckInModal';
import { NewPaymentModal } from './components/Modals/NewPaymentModal';
import { CommandPaletteModal } from './components/Modals/CommandPaletteModal';
import { EmergencyMasterUnlockModal } from './components/Modals/EmergencyMasterUnlockModal';
import { OnboardingWizardModal } from './components/Modals/OnboardingWizardModal';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isEmergencyUnlockOpen, setIsEmergencyUnlockOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [openStudentModalTrigger, setOpenStudentModalTrigger] = useState(false);

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

  const handleOpenNewStudent = () => {
    setActiveTab('students');
    setOpenStudentModalTrigger(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Header Bar */}
      <Header
        onOpenQuickCheckIn={() => setIsQuickCheckInOpen(true)}
        onOpenNewStudent={handleOpenNewStudent}
        onOpenNewPayment={() => setIsNewPaymentOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenEmergencyUnlock={() => setIsEmergencyUnlockOpen(true)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 sm:p-6 gap-6">
        
        {/* Navigation Sidebar */}
        <Sidebar
          onOpenQuickCheckIn={() => setIsQuickCheckInOpen(true)}
          onOpenNewStudent={handleOpenNewStudent}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 min-w-0 pb-12">
          {activeTab === 'dashboard' && (
            <Dashboard
              onOpenNewStudent={handleOpenNewStudent}
              onOpenNewPayment={() => setIsNewPaymentOpen(true)}
              onOpenCheckIn={() => setIsQuickCheckInOpen(true)}
            />
          )}

          {(activeTab === 'smartLockers' || activeTab === 'smart_lockers') && <SmartLockerHub />}

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

          {activeTab === 'features' && <FeatureCenterView />}

          {activeTab === 'diagnostics' && <DiagnosticsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Action & Command Modals */}
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

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 py-4 no-print">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">سامانه جامع مدیریت هوشمند باشگاه و مربیان (Gym OS)</span>
          </div>
          <div className="font-mono text-[11px] flex items-center gap-3">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              راهنمای راه‌اندازی سریع (Wizard)
            </button>
            <span>•</span>
            <span>نسخه ۲.۴.۰ • پشتیبانی از دیتابیس محلی پایدار و سخت‌افزار IoT</span>
          </div>
        </div>
      </footer>
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
