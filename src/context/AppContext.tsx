import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Language, 
  Theme, 
  NavTab,
  Coach, 
  Student, 
  PaymentRecord, 
  ExpenseRecord, 
  AttendanceRecord, 
  WorkoutPlan, 
  DietPlan,
  SmartLocker,
  HardwareDevice,
  AccessLog,
  MembershipPackage
} from '../types';
import { 
  initialCoaches, 
  initialStudents, 
  initialPayments, 
  initialExpenses, 
  initialAttendance, 
  initialWorkoutPlans, 
  initialDietPlans,
  initialSmartLockers,
  initialHardwareDevices,
  initialAccessLogs,
  initialPackages
} from '../data/initialData';
import { translations, formatCurrency, formatNumber } from '../i18n/translations';

interface CoachFinancialStats {
  totalStudents: number;
  totalGeneratedRevenue: number;
  totalCoachShare: number;
  totalClubShare: number;
  totalPaidOut: number;
  remainingBalance: number;
}

export interface ScanResult {
  success: boolean;
  student?: Student;
  lockerNumber?: number;
  message: string;
  alertType: 'success' | 'warning' | 'error';
  method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code' | 'manual_override';
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: typeof translations.fa;
  
  // Navigation State
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  
  // Data States
  coaches: Coach[];
  students: Student[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  attendance: AttendanceRecord[];
  workoutPlans: WorkoutPlan[];
  dietPlans: DietPlan[];
  smartLockers: SmartLocker[];
  hardwareDevices: HardwareDevice[];
  accessLogs: AccessLog[];
  packages: MembershipPackage[];
  
  // CRUD Actions
  addCoach: (coach: Omit<Coach, 'id'>) => void;
  updateCoach: (id: string, coach: Partial<Coach>) => void;
  deleteCoach: (id: string) => void;
  
  addStudent: (student: Omit<Student, 'id' | 'remainingDebt'>, initialPayment?: number, paymentMethod?: string) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  recordStudentPayment: (studentId: string, amount: number, paymentMethod: any, description?: string) => void;
  renewStudentMembership: (studentId: string, packageType: any, totalFee: number, paidAmount: number, paymentMethod: any, newExpireDate: string) => void;
  
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  
  addPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  deletePayment: (id: string) => void;
  
  // Package Management Actions
  addPackage: (pkg: Omit<MembershipPackage, 'id'>) => void;
  updatePackage: (id: string, pkg: Partial<MembershipPackage>) => void;
  deletePackage: (id: string) => void;
  
  // Coach Settlement
  settleCoachPayment: (coachId: string, amount: number, paymentMethod: any, notes?: string) => void;
  getCoachStats: (coachId: string) => CoachFinancialStats;
  
  // Attendance & Check-in
  checkInStudent: (studentId: string, lockerNumber?: number, method?: AttendanceRecord['method']) => { success: boolean; message: string; alertType?: 'info' | 'warning' | 'error'; lockerNumber?: number };
  
  // Smart Lockers & Hardware Gateway Actions
  addLocker: (locker: Omit<SmartLocker, 'id'>) => void;
  updateLocker: (id: string, locker: Partial<SmartLocker>) => void;
  deleteLocker: (id: string) => void;
  openLocker: (lockerNumber: number, reason?: string) => Promise<boolean>;
  releaseLocker: (lockerNumber: number) => void;
  assignLocker: (lockerNumber: number, studentId: string) => boolean;
  toggleLockerMaintenance: (lockerNumber: number) => void;
  triggerMasterUnlock: () => void;
  simulateIdentityScan: (method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code', query: string) => ScanResult;
  toggleDeviceOnline: (deviceId: string) => void;
  testRelayPulse: (deviceId: string) => Promise<{ success: boolean; latency: number }>;
  
  // Workout & Diet
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  deleteWorkoutPlan: (id: string) => void;
  saveDietPlan: (plan: DietPlan) => void;
  deleteDietPlan: (id: string) => void;
  
  // Backups & Reset
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  exportAllDataAsJson: () => void;
  importDataFromJson: (jsonString: string) => boolean;
  resetToInitialData: () => void;
  
  // Helpers
  formatMoney: (amount: number) => string;
  formatNum: (num: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

let uidCounter = 0;
const generateUid = (prefix: string) => `${prefix}-${Date.now()}-${++uidCounter}-${Math.random().toString(36).slice(2, 7)}`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('gym_lang') as Language) || 'fa';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('gym_theme') as Theme) || 'light';
  });

  const [coaches, setCoaches] = useState<Coach[]>(() => {
    const saved = localStorage.getItem('gym_coaches');
    return saved ? JSON.parse(saved) : initialCoaches;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('gym_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('gym_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('gym_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('gym_attendance');
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(() => {
    const saved = localStorage.getItem('gym_workout_plans');
    return saved ? JSON.parse(saved) : initialWorkoutPlans;
  });

  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => {
    const saved = localStorage.getItem('gym_diet_plans');
    return saved ? JSON.parse(saved) : initialDietPlans;
  });

  const [smartLockers, setSmartLockers] = useState<SmartLocker[]>(() => {
    const saved = localStorage.getItem('gym_smart_lockers');
    return saved ? JSON.parse(saved) : initialSmartLockers;
  });

  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>(() => {
    const saved = localStorage.getItem('gym_hardware_devices');
    return saved ? JSON.parse(saved) : initialHardwareDevices;
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
    const saved = localStorage.getItem('gym_access_logs');
    if (saved) {
      try {
        const parsed: AccessLog[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          return parsed.map((item, idx) => {
            let id = item.id;
            if (!id || seen.has(id)) {
              id = `log-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
            }
            seen.add(id);
            return { ...item, id };
          });
        }
      } catch (e) {
        console.error('Failed to parse access logs from storage', e);
      }
    }
    return initialAccessLogs;
  });

  const [packages, setPackages] = useState<MembershipPackage[]>(() => {
    const saved = localStorage.getItem('gym_packages');
    return saved ? JSON.parse(saved) : initialPackages;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('gym_lang', lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('gym_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('gym_coaches', JSON.stringify(coaches));
  }, [coaches]);

  useEffect(() => {
    localStorage.setItem('gym_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('gym_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('gym_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('gym_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('gym_workout_plans', JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  useEffect(() => {
    localStorage.setItem('gym_diet_plans', JSON.stringify(dietPlans));
  }, [dietPlans]);

  useEffect(() => {
    localStorage.setItem('gym_smart_lockers', JSON.stringify(smartLockers));
  }, [smartLockers]);

  useEffect(() => {
    localStorage.setItem('gym_hardware_devices', JSON.stringify(hardwareDevices));
  }, [hardwareDevices]);

  useEffect(() => {
    localStorage.setItem('gym_access_logs', JSON.stringify(accessLogs));
  }, [accessLogs]);

  useEffect(() => {
    localStorage.setItem('gym_packages', JSON.stringify(packages));
  }, [packages]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleLanguage = () => {
    setLang(prev => (prev === 'fa' ? 'en' : 'fa'));
  };

  const t = translations[lang];

  // Helper date formatted
  const getTodayFormatted = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getTimeFormatted = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  // Coach Management
  const addCoach = (coachData: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...coachData,
      id: generateUid('coach'),
    };
    setCoaches(prev => [newCoach, ...prev]);
  };

  const updateCoach = (id: string, updatedData: Partial<Coach>) => {
    setCoaches(prev => prev.map(c => (c.id === id ? { ...c, ...updatedData } : c)));
  };

  const deleteCoach = (id: string) => {
    setCoaches(prev => prev.filter(c => c.id !== id));
  };

  // Calculate Coach financial statistics
  const getCoachStats = (coachId: string): CoachFinancialStats => {
    const coach = coaches.find(c => c.id === coachId);
    const assignedStudents = students.filter(s => s.coachId === coachId);
    const rate = coach ? coach.commissionRate : 70;

    const totalGeneratedRevenue = assignedStudents.reduce((sum, s) => sum + s.totalFee, 0);
    const totalCoachShare = Math.round((totalGeneratedRevenue * rate) / 100);
    const totalClubShare = totalGeneratedRevenue - totalCoachShare;

    // Total settlements paid out to this coach
    const totalPaidOut = payments
      .filter(p => p.coachId === coachId && p.type === 'coach_settlement')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = Math.max(0, totalCoachShare - totalPaidOut);

    return {
      totalStudents: assignedStudents.length,
      totalGeneratedRevenue,
      totalCoachShare,
      totalClubShare,
      totalPaidOut,
      remainingBalance,
    };
  };

  // Student Management
  const addStudent = (
    studentData: Omit<Student, 'id' | 'remainingDebt'>, 
    initialPayment = 0,
    paymentMethod = 'pos'
  ) => {
    const remainingDebt = Math.max(0, studentData.totalFee - initialPayment);
    const newStudentId = generateUid('std');
    const newStudent: Student = {
      ...studentData,
      id: newStudentId,
      paidAmount: initialPayment,
      remainingDebt,
    };

    setStudents(prev => [newStudent, ...prev]);

    // Record initial payment if amount > 0
    if (initialPayment > 0) {
      const assignedCoach = coaches.find(c => c.id === studentData.coachId);
      const newPayment: PaymentRecord = {
        id: generateUid('pay'),
        studentId: newStudentId,
        studentName: studentData.fullName,
        coachId: studentData.coachId,
        coachName: assignedCoach ? assignedCoach.fullName : '',
        amount: initialPayment,
        date: studentData.registrationDate || getTodayFormatted(),
        paymentMethod: paymentMethod as any,
        type: 'tuition',
        description: `شهریه ثبت‌نام (${studentData.packageType})`,
        receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        recordedBy: 'مدیر باشگاه',
      };
      setPayments(prev => [newPayment, ...prev]);
    }
  };

  const updateStudent = (id: string, updatedData: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const totalFee = updatedData.totalFee !== undefined ? updatedData.totalFee : s.totalFee;
        const paidAmount = updatedData.paidAmount !== undefined ? updatedData.paidAmount : s.paidAmount;
        const remainingDebt = Math.max(0, totalFee - paidAmount);
        return {
          ...s,
          ...updatedData,
          totalFee,
          paidAmount,
          remainingDebt,
        };
      })
    );
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const recordStudentPayment = (
    studentId: string, 
    amount: number, 
    paymentMethod: any, 
    description?: string
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newPaidAmount = student.paidAmount + amount;
    const newRemainingDebt = Math.max(0, student.totalFee - newPaidAmount);

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, paidAmount: newPaidAmount, remainingDebt: newRemainingDebt }
          : s
      )
    );

    const coach = coaches.find(c => c.id === student.coachId);
    const newPayment: PaymentRecord = {
      id: generateUid('pay'),
      studentId: student.id,
      studentName: student.fullName,
      coachId: student.coachId,
      coachName: coach ? coach.fullName : '',
      amount,
      date: getTodayFormatted(),
      paymentMethod,
      type: 'tuition',
      description: description || `تسویه بدهی شهریه (${student.fullName})`,
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: 'مدیر سیستم',
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const renewStudentMembership = (
    studentId: string,
    packageType: any,
    totalFee: number,
    paidAmount: number,
    paymentMethod: any,
    newExpireDate: string
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const additionalDebt = Math.max(0, totalFee - paidAmount);
    const updatedTotalFee = student.totalFee + totalFee;
    const updatedPaid = student.paidAmount + paidAmount;
    const updatedDebt = student.remainingDebt + additionalDebt;

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? {
              ...s,
              packageType,
              expireDate: newExpireDate,
              totalFee: updatedTotalFee,
              paidAmount: updatedPaid,
              remainingDebt: updatedDebt,
              status: 'active',
              sessionsAttended: 0,
            }
          : s
      )
    );

    if (paidAmount > 0) {
      const coach = coaches.find(c => c.id === student.coachId);
      const payment: PaymentRecord = {
        id: generateUid('pay'),
        studentId: student.id,
        studentName: student.fullName,
        coachId: student.coachId,
        coachName: coach ? coach.fullName : '',
        amount: paidAmount,
        date: getTodayFormatted(),
        paymentMethod,
        type: 'tuition',
        description: `تمدید اشتراک (${packageType})`,
        receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        recordedBy: 'مدیر باشگاه',
      };
      setPayments(prev => [payment, ...prev]);
    }
  };

  // Coach Settlement Payout
  const settleCoachPayment = (
    coachId: string, 
    amount: number, 
    paymentMethod: any, 
    notes?: string
  ) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach || amount <= 0) return;

    const newPayment: PaymentRecord = {
      id: generateUid('pay-settle'),
      coachId: coach.id,
      coachName: coach.fullName,
      amount,
      date: getTodayFormatted(),
      paymentMethod,
      type: 'coach_settlement',
      description: notes || `تسویه حساب و واریز حق‌الزحمه مربی (${coach.fullName})`,
      receiptNumber: `PAY-COACH-${Math.floor(1000 + Math.random() * 9000)}`,
      recordedBy: 'مدیریت باشگاه',
    };

    setPayments(prev => [newPayment, ...prev]);
  };

  // Expenses & Income CRUD
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: generateUid('exp'),
      receiptNumber: expenseData.receiptNumber || `EXP-${Math.floor(100 + Math.random() * 900)}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, updatedData: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => (e.id === id ? { ...e, ...updatedData } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addPayment = (paymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: generateUid('pay'),
      receiptNumber: paymentData.receiptNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Package Management CRUD
  const addPackage = (packageData: Omit<MembershipPackage, 'id'>) => {
    const newPkg: MembershipPackage = {
      ...packageData,
      id: generateUid('pkg'),
    };
    setPackages(prev => [newPkg, ...prev]);
  };

  const updatePackage = (id: string, updatedData: Partial<MembershipPackage>) => {
    setPackages(prev => prev.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  // Attendance Check-in
  const checkInStudent = (studentId: string, lockerNumber?: number, method: AttendanceRecord['method'] = 'manual') => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'ورزشکار یافت نشد', alertType: 'error' };
    }

    const today = getTodayFormatted();
    const alreadyCheckedIn = attendance.some(
      a => a.studentId === studentId && a.date === today
    );

    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const coach = coaches.find(c => c.id === student.coachId);

    // Auto find available locker if none specified
    let assignedLockerNum = lockerNumber;
    if (!assignedLockerNum) {
      const availableLocker = smartLockers.find(l => l.status === 'available');
      assignedLockerNum = availableLocker ? availableLocker.number : Math.floor(1 + Math.random() * 36);
    }

    // Update smart locker status
    setSmartLockers(prev => prev.map(l => {
      if (l.number === assignedLockerNum) {
        return {
          ...l,
          status: 'occupied',
          currentStudentId: student.id,
          currentStudentName: student.fullName,
          assignedAt: checkInTime,
          isLocked: true,
          lastUnlockedAt: getTimeFormatted(),
        };
      }
      return l;
    }));

    // Update student assigned locker
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assignedLocker: assignedLockerNum } : s));

    const newAttendanceRecord: AttendanceRecord = {
      id: generateUid('att'),
      studentId: student.id,
      studentName: student.fullName,
      coachName: coach ? coach.fullName : 'عمومی',
      checkInTime,
      date: today,
      lockerNumber: assignedLockerNum,
      method,
    };

    setAttendance(prev => [newAttendanceRecord, ...prev]);

    // Increment attended sessions
    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? { ...s, sessionsAttended: s.sessionsAttended + 1 }
          : s
      )
    );

    let message = `ورود با موفقیت ثبت شد • کمد #${assignedLockerNum} اختصاص یافت`;
    let alertType: 'info' | 'warning' | 'error' = 'info';

    if (student.status === 'expired') {
      message = `${student.fullName}: ${t.expiredAlert}`;
      alertType = 'warning';
    } else if (student.remainingDebt > 0) {
      message = `${student.fullName}: ${t.debtAlert} (${formatCurrency(student.remainingDebt, lang)})`;
      alertType = 'warning';
    }

    if (alreadyCheckedIn) {
      message += ` (تردد مجدد امروز)`;
    }

    return { success: true, message, alertType, lockerNumber: assignedLockerNum };
  };

  // ----------------------------------------------------------------
  // SMART LOCKERS & HARDWARE GATEWAY ACTIONS
  // ----------------------------------------------------------------

  const addLocker = (lockerData: Omit<SmartLocker, 'id'>) => {
    const newLocker: SmartLocker = {
      ...lockerData,
      id: `locker-${lockerData.number}`,
    };
    setSmartLockers(prev => [...prev, newLocker].sort((a, b) => a.number - b.number));

    const timestamp = getTimeFormatted();
    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentName: 'مدیریت سخت‌افزار',
      deviceType: 'کنترلر هوشمند کمدها',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerData.number,
      message: `کمد هوشمند شماره #${lockerData.number} به سیستم متصل شد (زون: ${lockerData.zone})`,
    };
    setAccessLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const updateLocker = (id: string, updatedData: Partial<SmartLocker>) => {
    setSmartLockers(prev => prev.map(l => (l.id === id ? { ...l, ...updatedData } : l)));
  };

  const deleteLocker = (id: string) => {
    const targetLocker = smartLockers.find(l => l.id === id);
    if (targetLocker && targetLocker.currentStudentId) {
      setStudents(prev =>
        prev.map(s => (s.id === targetLocker.currentStudentId ? { ...s, assignedLocker: undefined } : s))
      );
    }
    setSmartLockers(prev => prev.filter(l => l.id !== id));
  };

  const openLocker = async (lockerNumber: number, reason = 'فرمان رله الکترونیکی'): Promise<boolean> => {
    const timestamp = getTimeFormatted();
    
    setSmartLockers(prev => prev.map(l => {
      if (l.number === lockerNumber) {
        return {
          ...l,
          isLocked: false,
          lastUnlockedAt: timestamp,
        };
      }
      return l;
    }));

    const targetLocker = smartLockers.find(l => l.number === lockerNumber);
    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentId: targetLocker?.currentStudentId,
      studentName: targetLocker?.currentStudentName || 'کنترل سخت‌افزار',
      deviceType: 'ماژول رله سخت‌افزاری کمدها (ESP32)',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerNumber,
      message: `فرمان بازگشایی کمد #${lockerNumber} اجرا شد (${reason})`,
    };

    setAccessLogs(prev => [newLog, ...prev.slice(0, 49)]);

    // Simulate auto-relock physical solenoid click after 5 seconds
    setTimeout(() => {
      setSmartLockers(prev => prev.map(l => {
        if (l.number === lockerNumber && l.status === 'occupied') {
          return { ...l, isLocked: true };
        }
        return l;
      }));
    }, 5000);

    return true;
  };

  const releaseLocker = (lockerNumber: number) => {
    const timestamp = getTimeFormatted();
    const targetLocker = smartLockers.find(l => l.number === lockerNumber);

    setSmartLockers(prev => prev.map(l => {
      if (l.number === lockerNumber) {
        return {
          ...l,
          status: 'available',
          currentStudentId: undefined,
          currentStudentName: undefined,
          assignedAt: undefined,
          isLocked: false,
          lastUnlockedAt: timestamp,
        };
      }
      return l;
    }));

    if (targetLocker?.currentStudentId) {
      setStudents(prev => prev.map(s => s.id === targetLocker.currentStudentId ? { ...s, assignedLocker: undefined } : s));
    }

    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentName: targetLocker?.currentStudentName || 'عملیات پذیرش',
      deviceType: 'هاب کنترل کمدها',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerNumber,
      message: `کمد #${lockerNumber} تخلیه و آزاد شد`,
    };
    setAccessLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const assignLocker = (lockerNumber: number, studentId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    const timestamp = getTimeFormatted();
    setSmartLockers(prev => prev.map(l => {
      if (l.number === lockerNumber) {
        return {
          ...l,
          status: 'occupied',
          currentStudentId: student.id,
          currentStudentName: student.fullName,
          assignedAt: timestamp,
          isLocked: true,
          lastUnlockedAt: timestamp,
        };
      }
      return l;
    }));

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assignedLocker: lockerNumber } : s));

    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentId: student.id,
      studentName: student.fullName,
      deviceType: 'سیستم پذیرش و رله',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerNumber,
      message: `کمد #${lockerNumber} به ${student.fullName} تخصیص داده شد`,
    };
    setAccessLogs(prev => [newLog, ...prev.slice(0, 49)]);
    return true;
  };

  const toggleLockerMaintenance = (lockerNumber: number) => {
    setSmartLockers(prev => prev.map(l => {
      if (l.number === lockerNumber) {
        const nextStatus = l.status === 'maintenance' ? 'available' : 'maintenance';
        return { ...l, status: nextStatus, isLocked: nextStatus === 'maintenance' };
      }
      return l;
    }));
  };

  const triggerMasterUnlock = () => {
    const timestamp = getTimeFormatted();
    setSmartLockers(prev => prev.map(l => ({
      ...l,
      isLocked: false,
      lastUnlockedAt: timestamp,
    })));

    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentName: 'مدیر ارشد باشگاه',
      deviceType: 'ماژول رله مرکزی (Master Signal)',
      method: 'manual_override',
      result: 'granted',
      message: 'فرمان Master Unlock اضطراری به کلیه رله‌های کمدها ارسال شد',
    };
    setAccessLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const simulateIdentityScan = (
    method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code', 
    query: string
  ): ScanResult => {
    const timestamp = getTimeFormatted();
    
    // Find matching student
    const matched = students.find(s => 
      s.id === query ||
      s.fullName.toLowerCase().includes(query.toLowerCase()) ||
      s.phone.includes(query) ||
      s.nationalId === query ||
      s.rfidCardUid?.toLowerCase() === query.toLowerCase()
    );

    if (!matched) {
      const failLog: AccessLog = {
        id: generateUid('log'),
        timestamp,
        studentName: 'هویت نامشخص / کارت تعریف‌نشده',
        deviceType: method === 'face_recognition' ? 'دوربین هوش مصنوعی تشخیص چهره' : method === 'rfid_card' ? 'اسکنر RFID گیت' : method === 'fingerprint' ? 'اسکنر اثر انگشت' : 'بارکدخوان گیت',
        method,
        result: 'denied_unknown',
        message: `شناسایی ناموفق (${query}) • گیت مسدود ماند`,
      };
      setAccessLogs(prev => [failLog, ...prev.slice(0, 49)]);

      return {
        success: false,
        message: 'ورزشکار یا شناسه بیومتریک در پایگاه داده یافت نشد.',
        alertType: 'error',
        method,
      };
    }

    // Check expiration status
    if (matched.status === 'expired') {
      const expiredLog: AccessLog = {
        id: generateUid('log'),
        timestamp,
        studentId: matched.id,
        studentName: matched.fullName,
        deviceType: method === 'face_recognition' ? 'دوربین AI Face Gate' : 'کارتخوان NFC گیت',
        method,
        result: 'denied_expired',
        message: `هویت ${matched.fullName} تایید شد ولی اشتراک منقضی است • گیت مسدود شد`,
      };
      setAccessLogs(prev => [expiredLog, ...prev.slice(0, 49)]);

      return {
        success: false,
        student: matched,
        message: `شناسایی چهره/هویت انجام شد، اما اشتراک ${matched.fullName} منقضی شده است. لطفا تمدید نمایید.`,
        alertType: 'warning',
        method,
      };
    }

    // Check-in and auto-assign / open locker
    const checkInRes = checkInStudent(matched.id, matched.assignedLocker, method === 'face_recognition' ? 'face_scan' : method === 'rfid_card' ? 'rfid_wristband' : method === 'fingerprint' ? 'fingerprint' : 'qr_code');
    const lockerNum = checkInRes.lockerNumber || matched.assignedLocker || 1;

    // Trigger electronic relay open for locker
    openLocker(lockerNum, `شناسایی خودکار هویت با ${method}`);

    const successLog: AccessLog = {
      id: generateUid('log'),
      timestamp,
      studentId: matched.id,
      studentName: matched.fullName,
      deviceType: method === 'face_recognition' ? 'ترمینال هوشمند تشخیص چهره AI' : method === 'rfid_card' ? 'کارتخوان و مچ‌بند RFID گیت' : method === 'fingerprint' ? 'اسکنر بیومتریک اثر انگشت' : 'بارکدخوان QR گیت',
      method,
      result: 'granted',
      assignedLocker: lockerNum,
      message: `هویت تایید شد • گیت باز شد • فرمان رله کمد هوشمند #${lockerNum} ارسال گردید`,
    };
    setAccessLogs(prev => [successLog, ...prev.slice(0, 49)]);

    return {
      success: true,
      student: matched,
      lockerNumber: lockerNum,
      message: `هویت ${matched.fullName} با موفقیت تایید شد. گیت ورود باز و درب کمد #${lockerNum} بازگشایی شد.`,
      alertType: 'success',
      method,
    };
  };

  const toggleDeviceOnline = (deviceId: string) => {
    setHardwareDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const nextStatus = d.status === 'online' ? 'offline' : 'online';
        return { ...d, status: nextStatus, lastPing: nextStatus === 'online' ? 'همین الان' : 'قطع ارتباط' };
      }
      return d;
    }));
  };

  const testRelayPulse = async (deviceId: string): Promise<{ success: boolean; latency: number }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const latency = Math.floor(18 + Math.random() * 25);
        setHardwareDevices(prev => prev.map(d => d.id === deviceId ? { ...d, lastPing: `پاسخ رله ${latency}ms` } : d));
        resolve({ success: true, latency });
      }, 350);
    });
  };

  // Workout & Diet CRUD
  const saveWorkoutPlan = (plan: WorkoutPlan) => {
    setWorkoutPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [plan, ...prev];
    });
  };

  const deleteWorkoutPlan = (id: string) => {
    setWorkoutPlans(prev => prev.filter(p => p.id !== id));
  };

  const saveDietPlan = (plan: DietPlan) => {
    setDietPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = plan;
        return next;
      }
      return [plan, ...prev];
    });
  };

  const deleteDietPlan = (id: string) => {
    setDietPlans(prev => prev.filter(p => p.id !== id));
  };

  // Export JSON Database
  const exportDatabaseJson = () => {
    const dbExport = {
      exportDate: new Date().toISOString(),
      app: 'Gym & Coach Management System',
      coaches,
      students,
      payments,
      expenses,
      attendance,
      workoutPlans,
      dietPlans,
      smartLockers,
      hardwareDevices,
      accessLogs,
      packages,
    };
    const blob = new Blob([JSON.stringify(dbExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Database
  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.coaches)) setCoaches(data.coaches);
      if (Array.isArray(data.students)) setStudents(data.students);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.attendance)) setAttendance(data.attendance);
      if (Array.isArray(data.workoutPlans)) setWorkoutPlans(data.workoutPlans);
      if (Array.isArray(data.dietPlans)) setDietPlans(data.dietPlans);
      if (Array.isArray(data.smartLockers)) setSmartLockers(data.smartLockers);
      if (Array.isArray(data.hardwareDevices)) setHardwareDevices(data.hardwareDevices);
      if (Array.isArray(data.accessLogs)) setAccessLogs(data.accessLogs);
      if (Array.isArray(data.packages)) setPackages(data.packages);
      return true;
    } catch (e) {
      console.error('Failed to parse database backup', e);
      return false;
    }
  };

  const resetToSampleData = () => {
    setCoaches(initialCoaches);
    setStudents(initialStudents);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setAttendance(initialAttendance);
    setWorkoutPlans(initialWorkoutPlans);
    setDietPlans(initialDietPlans);
    setSmartLockers(initialSmartLockers);
    setHardwareDevices(initialHardwareDevices);
    setAccessLogs(initialAccessLogs);
    setPackages(initialPackages);
  };

  const formatMoney = (amount: number) => formatCurrency(amount, lang);
  const formatNum = (num: number) => formatNumber(num, lang);

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        theme,
        setTheme,
        toggleTheme,
        toggleLanguage,
        t,
        activeTab,
        setActiveTab,
        coaches,
        students,
        payments,
        expenses,
        attendance,
        workoutPlans,
        dietPlans,
        smartLockers,
        hardwareDevices,
        accessLogs,
        packages,
        addCoach,
        updateCoach,
        deleteCoach,
        addStudent,
        updateStudent,
        deleteStudent,
        recordStudentPayment,
        renewStudentMembership,
        addExpense,
        updateExpense,
        deleteExpense,
        addPayment,
        deletePayment,
        addPackage,
        updatePackage,
        deletePackage,
        settleCoachPayment,
        getCoachStats,
        checkInStudent,
        addLocker,
        updateLocker,
        deleteLocker,
        openLocker,
        releaseLocker,
        assignLocker,
        toggleLockerMaintenance,
        triggerMasterUnlock,
        simulateIdentityScan,
        toggleDeviceOnline,
        testRelayPulse,
        saveWorkoutPlan,
        deleteWorkoutPlan,
        saveDietPlan,
        deleteDietPlan,
        exportDatabaseJson,
        importDatabaseJson,
        resetToSampleData,
        exportAllDataAsJson: exportDatabaseJson,
        importDataFromJson: importDatabaseJson,
        resetToInitialData: resetToSampleData,
        formatMoney,
        formatNum,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
