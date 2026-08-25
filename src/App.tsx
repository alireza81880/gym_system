/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CoachList } from './components/Coaches/CoachList';
import { StudentList } from './components/Students/StudentList';
import { FinancialLedger } from './components/Financials/FinancialLedger';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { SmartLockerHub } from './components/Lockers/SmartLockerHub';
import { PlanManager } from './components/Plans/PlanManager';
import { ManagerReports } from './components/Reports/ManagerReports';
import { SettingsView } from './components/Settings/SettingsView';
import { QuickCheckInModal } from './components/Modals/QuickCheckInModal';
import { NewPaymentModal } from './components/Modals/NewPaymentModal';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [openStudentModalTrigger, setOpenStudentModalTrigger] = useState(false);

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

          {activeTab === 'smartLockers' && <SmartLockerHub />}

          {activeTab === 'coaches' && <CoachList />}

          {activeTab === 'students' && (
            <StudentList
              initialOpenNewModal={openStudentModalTrigger}
              onModalClosed={() => setOpenStudentModalTrigger(false)}
            />
          )}

          {activeTab === 'finances' && <FinancialLedger />}

          {activeTab === 'attendance' && <AttendanceManager />}

          {activeTab === 'plans' && <PlanManager />}

          {activeTab === 'reports' && <ManagerReports />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      {isQuickCheckInOpen && (
        <QuickCheckInModal onClose={() => setIsQuickCheckInOpen(false)} />
      )}

      {isNewPaymentOpen && (
        <NewPaymentModal onClose={() => setIsNewPaymentOpen(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 py-4 no-print">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-2">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">سامانه جامع مدیریت هوشمند باشگاه و مربیان</span>
          </div>
          <div className="font-mono text-[11px]">
            نسخه ۲.۴.۰ • پشتیبانی از زبان فارسی و انگلیسی • دیتابیس محلی پایدار • اتصال سخت‌افزار IoT
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
