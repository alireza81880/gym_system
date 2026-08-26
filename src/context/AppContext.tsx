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
  MembershipPackage,
  IntegrationMode,
  HardwareEvent,
  AuditLog,
  StaffUser,
  UserRole,
  ModuleFeature,
  PilotComparisonLog,
  SyncState,
  SyncJob,
  Branch,
  AccessDecision,
  PaymentMethod
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
import { initialModuleFeatures } from '../data/featureModules';
import { translations, formatCurrency, formatNumber } from '../i18n/translations';
import { AccessPolicyEngine, AccessPolicyConfig, defaultAccessPolicyConfig } from '../services/accessPolicyService';
import { LockerEngine } from '../services/lockerService';
import { SmartInsightsEngine } from '../services/insightsService';
import { AuditService } from '../services/auditService';
import { SyncEngine } from '../services/syncService';
import { LocalDbRepository } from '../services/localDb';
import { getAdapterForVendor, createNormalizedHardwareEvent } from '../services/hardwareAdapters';

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
  decisionCode?: string;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
  t: typeof translations.fa;
  
  // Navigation & Feature Visibility
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  moduleFeatures: ModuleFeature[];
  toggleFeatureEnabled: (featureId: NavTab) => void;
  toggleFeaturePinned: (featureId: NavTab) => void;
  restoreDefaultFeatures: () => void;
  
  // Multi-Branch & Tenant
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  branches: Branch[];
  
  // RBAC & Active User
  currentUser: StaffUser;
  setCurrentUserRole: (role: UserRole) => void;
  
  // Integration Mode (Shadow / Hybrid / Full Control)
  integrationMode: IntegrationMode;
  setIntegrationMode: (mode: IntegrationMode) => void;
  
  // Access Policy Config
  accessPolicyConfig: AccessPolicyConfig;
  setAccessPolicyConfig: React.Dispatch<React.SetStateAction<AccessPolicyConfig>>;
  
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
  hardwareEvents: HardwareEvent[];
  pilotComparisonLogs: PilotComparisonLog[];
  accessLogs: AccessLog[];
  auditLogs: AuditLog[];
  packages: MembershipPackage[];
  
  // Offline & Sync Engine
  syncState: SyncState;
  syncQueue: SyncJob[];
  triggerCloudSync: () => Promise<void>;
  
  // CRUD Actions
  addCoach: (coach: Omit<Coach, 'id'>) => void;
  updateCoach: (id: string, coach: Partial<Coach>) => void;
  deleteCoach: (id: string) => void;
  
  addStudent: (student: Omit<Student, 'id' | 'remainingDebt'>, initialPayment?: number, paymentMethod?: PaymentMethod) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  recordStudentPayment: (studentId: string, amount: number, paymentMethod: PaymentMethod, description?: string) => void;
  renewStudentMembership: (studentId: string, packageType: string, totalFee: number, paidAmount: number, paymentMethod: PaymentMethod, newExpireDate: string) => void;
  
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  voidExpense: (id: string, reason: string) => void;
  
  addPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  deletePayment: (id: string) => void;
  voidPayment: (id: string, reason: string) => void;
  
  // Package Management Actions
  addPackage: (pkg: Omit<MembershipPackage, 'id'>) => void;
  updatePackage: (id: string, pkg: Partial<MembershipPackage>) => void;
  deletePackage: (id: string) => void;
  
  // Coach Settlement
  settleCoachPayment: (coachId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => void;
  getCoachStats: (coachId: string) => CoachFinancialStats;
  
  // Access Decision & Check-in
  evaluateMemberAccess: (studentId: string) => AccessDecision;
  checkInStudent: (studentId: string, lockerNumber?: number, method?: AttendanceRecord['method']) => { success: boolean; message: string; alertType?: 'info' | 'warning' | 'error'; lockerNumber?: number };
  
  // Smart Lockers & Hardware Gateway Actions
  addLocker: (locker: Omit<SmartLocker, 'id'>) => void;
  updateLocker: (id: string, locker: Partial<SmartLocker>) => void;
  deleteLocker: (id: string) => void;
  openLocker: (lockerNumber: number, reason?: string) => Promise<boolean>;
  releaseLocker: (lockerNumber: number) => void;
  assignLocker: (lockerNumber: number, studentId: string) => boolean;
  toggleLockerMaintenance: (lockerNumber: number) => void;
  triggerMasterUnlock: (reason?: string) => void;
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

const initialBranches: Branch[] = [
  {
    id: 'branch-tehran-central',
    tenantId: 'gym-org-1',
    name: 'شعبه مرکزی (تهران - نیاوران)',
    code: 'TEH-01',
    city: 'تهران',
    address: 'خیابان نیاوران، مجتمع ورزشی رویال، طبقه -۱',
    phone: '021-22800112',
    managerName: 'مهندس حسینی',
    isMain: true,
    isActive: true,
  },
  {
    id: 'branch-tehran-west',
    tenantId: 'gym-org-1',
    name: 'شعبه غرب (سعادت‌آباد)',
    code: 'TEH-02',
    city: 'تهران',
    address: 'بلوار شهرداری، پلاک ۴۴',
    phone: '021-88691234',
    managerName: 'خانم شریفی',
    isMain: false,
    isActive: true,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('gym_lang') as Language) || 'fa';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gym_theme') as Theme;
    if (saved) return saved;
    return 'dark';
  });

  // Feature Customization Center
  const [moduleFeatures, setModuleFeatures] = useState<ModuleFeature[]>(() => {
    return LocalDbRepository.get<ModuleFeature[]>('module_features', initialModuleFeatures);
  });

  // Multi-Branch State
  const [branches] = useState<Branch[]>(initialBranches);
  const [activeBranchId, setActiveBranchId] = useState<string>('branch-tehran-central');

  // RBAC User
  const [currentUser, setCurrentUser] = useState<StaffUser>({
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'مدیر ارشد باشگاه',
    role: 'gym_owner',
    phone: '09121112233',
    isActive: true,
  });

  // Integration Mode (Default: Shadow Mode for safe pilot deployment!)
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>(() => {
    return LocalDbRepository.get<IntegrationMode>('integration_mode', 'shadow');
  });

  // Access Policy Config
  const [accessPolicyConfig, setAccessPolicyConfig] = useState<AccessPolicyConfig>(() => {
    return LocalDbRepository.get<AccessPolicyConfig>('access_policy_config', defaultAccessPolicyConfig);
  });

  // Data States
  const [coaches, setCoaches] = useState<Coach[]>(() => {
    return LocalDbRepository.get<Coach[]>('coaches', initialCoaches);
  });

  const [students, setStudents] = useState<Student[]>(() => {
    return LocalDbRepository.get<Student[]>('students', initialStudents);
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    return LocalDbRepository.get<PaymentRecord[]>('payments', initialPayments);
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    return LocalDbRepository.get<ExpenseRecord[]>('expenses', initialExpenses);
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    return LocalDbRepository.get<AttendanceRecord[]>('attendance', initialAttendance);
  });

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(() => {
    return LocalDbRepository.get<WorkoutPlan[]>('workout_plans', initialWorkoutPlans);
  });

  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => {
    return LocalDbRepository.get<DietPlan[]>('diet_plans', initialDietPlans);
  });

  const [smartLockers, setSmartLockers] = useState<SmartLocker[]>(() => {
    return LocalDbRepository.get<SmartLocker[]>('smart_lockers', initialSmartLockers);
  });

  const [hardwareDevices, setHardwareDevices] = useState<HardwareDevice[]>(() => {
    return LocalDbRepository.get<HardwareDevice[]>('hardware_devices', initialHardwareDevices);
  });

  const [hardwareEvents, setHardwareEvents] = useState<HardwareEvent[]>(() => {
    return LocalDbRepository.get<HardwareEvent[]>('hardware_events', [
      createNormalizedHardwareEvent('dev-face-gate', 'ACCESS_GRANTED', {
        memberName: 'نیما کمالی',
        memberId: 'std-2',
        credentialType: 'face',
        accessResult: 'granted',
        accessReason: 'عضویت معتبر • کمد #22 اختصاص یافت',
      }),
      createNormalizedHardwareEvent('dev-rfid-turnstile', 'ACCESS_GRANTED', {
        memberName: 'فرزاد شجاعی',
        memberId: 'std-6',
        credentialType: 'rfid',
        accessResult: 'granted',
        accessReason: 'تردد گیت تایید شد • کمد #18',
      }),
    ]);
  });

  const [pilotComparisonLogs, setPilotComparisonLogs] = useState<PilotComparisonLog[]>(() => {
    return LocalDbRepository.get<PilotComparisonLog[]>('pilot_comparison_logs', [
      {
        id: 'pilot-1',
        timestamp: '18:30:12',
        deviceId: 'dev-rfid-turnstile',
        deviceName: 'کارتخوان گیت',
        memberId: 'std-6',
        memberName: 'فرزاد شجاعی',
        externalDecision: 'ALLOW',
        gymOsDecision: 'ALLOW',
        isMatch: true,
      },
      {
        id: 'pilot-2',
        timestamp: '18:05:44',
        deviceId: 'dev-face-gate',
        deviceName: 'ترمینال چهره',
        memberId: 'std-2',
        memberName: 'نیما کمالی',
        externalDecision: 'ALLOW',
        gymOsDecision: 'ALLOW',
        isMatch: true,
      },
    ]);
  });

  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => {
    return LocalDbRepository.get<AccessLog[]>('access_logs', initialAccessLogs);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return LocalDbRepository.get<AuditLog[]>('audit_logs', [
      AuditService.createLog(
        { id: 'usr-admin-1', fullName: 'مدیر ارشد', role: 'gym_owner' },
        'SYSTEM_STARTUP',
        'setting',
        'سامانه Gym OS در حالت شنود (Shadow Mode) راه‌اندازی شد.'
      ),
    ]);
  });

  const [packages, setPackages] = useState<MembershipPackage[]>(() => {
    return LocalDbRepository.get<MembershipPackage[]>('packages', initialPackages);
  });

  // Sync Engine State
  const [syncState, setSyncState] = useState<SyncState>('ONLINE');
  const [syncQueue, setSyncQueue] = useState<SyncJob[]>([]);

  // Local Persistence Effects
  useEffect(() => {
    localStorage.setItem('gym_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('gym_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => { LocalDbRepository.set('coaches', coaches); }, [coaches]);
  useEffect(() => { LocalDbRepository.set('students', students); }, [students]);
  useEffect(() => { LocalDbRepository.set('payments', payments); }, [payments]);
  useEffect(() => { LocalDbRepository.set('expenses', expenses); }, [expenses]);
  useEffect(() => { LocalDbRepository.set('attendance', attendance); }, [attendance]);
  useEffect(() => { LocalDbRepository.set('workout_plans', workoutPlans); }, [workoutPlans]);
  useEffect(() => { LocalDbRepository.set('diet_plans', dietPlans); }, [dietPlans]);
  useEffect(() => { LocalDbRepository.set('smart_lockers', smartLockers); }, [smartLockers]);
  useEffect(() => { LocalDbRepository.set('hardware_devices', hardwareDevices); }, [hardwareDevices]);
  useEffect(() => { LocalDbRepository.set('hardware_events', hardwareEvents); }, [hardwareEvents]);
  useEffect(() => { LocalDbRepository.set('pilot_comparison_logs', pilotComparisonLogs); }, [pilotComparisonLogs]);
  useEffect(() => { LocalDbRepository.set('access_logs', accessLogs); }, [accessLogs]);
  useEffect(() => { LocalDbRepository.set('audit_logs', auditLogs); }, [auditLogs]);
  useEffect(() => { LocalDbRepository.set('packages', packages); }, [packages]);
  useEffect(() => { LocalDbRepository.set('module_features', moduleFeatures); }, [moduleFeatures]);
  useEffect(() => { LocalDbRepository.set('integration_mode', integrationMode); }, [integrationMode]);
  useEffect(() => { LocalDbRepository.set('access_policy_config', accessPolicyConfig); }, [accessPolicyConfig]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLang(prev => prev === 'fa' ? 'en' : 'fa');
  const t = translations[lang];

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  // Feature Toggles
  const toggleFeatureEnabled = (featureId: NavTab) => {
    setModuleFeatures(prev => prev.map(f => f.id === featureId ? { ...f, isEnabled: !f.isEnabled } : f));
  };

  const toggleFeaturePinned = (featureId: NavTab) => {
    setModuleFeatures(prev => prev.map(f => f.id === featureId ? { ...f, isPinned: !f.isPinned } : f));
  };

  const restoreDefaultFeatures = () => {
    setModuleFeatures(initialModuleFeatures);
  };

  // Cloud Sync
  const triggerCloudSync = async () => {
    setSyncState('SYNCING');
    const result = await SyncEngine.processQueue();
    setSyncState(SyncEngine.getState());
    setSyncQueue(SyncEngine.getQueue());
    
    // Add audit log
    const syncAudit = AuditService.createLog(
      currentUser,
      'CLOUD_SYNC_TRIGGERED',
      'setting',
      `همگام‌سازی ابری انجام شد (${result.processedCount} رکورد با موفقیت ارسال شد).`
    );
    setAuditLogs(prev => [syncAudit, ...prev]);
  };

  // ----------------------------------------------------
  // COACHES CRUD
  // ----------------------------------------------------
  const addCoach = (coachData: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...coachData,
      id: generateUid('coach'),
    };
    setCoaches(prev => [newCoach, ...prev]);
    SyncEngine.enqueue('coach', newCoach.id, 'INSERT', newCoach as any);
    
    const log = AuditService.createLog(currentUser, 'COACH_CREATED', 'member', `مربی جدید «${newCoach.fullName}» تعریف شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const updateCoach = (id: string, updatedData: Partial<Coach>) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...updatedData } : c));
    SyncEngine.enqueue('coach', id, 'UPDATE', updatedData as any);
  };

  const deleteCoach = (id: string) => {
    const coach = coaches.find(c => c.id === id);
    setCoaches(prev => prev.filter(c => c.id !== id));
    SyncEngine.enqueue('coach', id, 'DELETE', { id });
    
    if (coach) {
      const log = AuditService.createLog(currentUser, 'COACH_DELETED', 'member', `مربی «${coach.fullName}» از سامانه حذف شد.`);
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  // ----------------------------------------------------
  // STUDENTS / MEMBERS CRUD
  // ----------------------------------------------------
  const addStudent = (
    studentData: Omit<Student, 'id' | 'remainingDebt'>,
    initialPayment = 0,
    paymentMethod: PaymentMethod = 'pos'
  ) => {
    const remainingDebt = Math.max(0, studentData.totalFee - initialPayment);
    const newStudentId = generateUid('std');
    const newStudent: Student = {
      ...studentData,
      id: newStudentId,
      remainingDebt,
      sessionsAttended: studentData.sessionsAttended || 0,
      paidAmount: initialPayment,
    };

    setStudents(prev => [newStudent, ...prev]);
    SyncEngine.enqueue('student', newStudentId, 'INSERT', newStudent as any);

    if (initialPayment > 0) {
      const assignedCoach = coaches.find(c => c.id === studentData.coachId);
      const newPayment: PaymentRecord = {
        id: generateUid('pay'),
        studentId: newStudentId,
        studentName: studentData.fullName,
        coachId: studentData.coachId,
        coachName: assignedCoach ? assignedCoach.fullName : 'عمومی (بدون مربی)',
        amount: initialPayment,
        date: studentData.registrationDate,
        paymentMethod,
        type: 'tuition',
        description: `پیش‌پرداخت ثبت‌نام اولیه - ${studentData.packageType}`,
        receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        recordedBy: currentUser.fullName,
        status: 'completed',
      };
      setPayments(prev => [newPayment, ...prev]);
      SyncEngine.enqueue('payment', newPayment.id, 'INSERT', newPayment as any);
    }

    const log = AuditService.createLog(currentUser, 'MEMBER_REGISTERED', 'member', `ورزشکار جدید «${newStudent.fullName}» ثبت‌نام شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const updateStudent = (id: string, updatedData: Partial<Student>) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...updatedData };
        if (updatedData.totalFee !== undefined || updatedData.paidAmount !== undefined) {
          merged.remainingDebt = Math.max(0, (merged.totalFee || 0) - (merged.paidAmount || 0));
        }
        return merged;
      }
      return s;
    }));
    SyncEngine.enqueue('student', id, 'UPDATE', updatedData as any);
  };

  const deleteStudent = (id: string) => {
    const std = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    SyncEngine.enqueue('student', id, 'DELETE', { id });
    if (std) {
      const log = AuditService.createLog(currentUser, 'MEMBER_DELETED', 'member', `پرونده عضو «${std.fullName}» حذف شد.`);
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const recordStudentPayment = (
    studentId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    description = 'پرداخت بدهی شهریه'
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student || amount <= 0) return;

    const newPaidAmount = student.paidAmount + amount;
    const newRemainingDebt = Math.max(0, student.totalFee - newPaidAmount);

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      paidAmount: newPaidAmount,
      remainingDebt: newRemainingDebt,
    } : s));

    const coach = coaches.find(c => c.id === student.coachId);
    const newPayment: PaymentRecord = {
      id: generateUid('pay'),
      studentId: student.id,
      studentName: student.fullName,
      coachId: student.coachId,
      coachName: coach ? coach.fullName : 'عمومی',
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      type: 'tuition',
      description,
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    };

    setPayments(prev => [newPayment, ...prev]);
    SyncEngine.enqueue('payment', newPayment.id, 'INSERT', newPayment as any);

    const log = AuditService.createLog(currentUser, 'PAYMENT_RECORDED', 'payment', `دریافتی شهریه مبلغ ${amount.toLocaleString('fa-IR')} تومان برای «${student.fullName}» ثبت شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const renewStudentMembership = (
    studentId: string,
    packageType: string,
    totalFee: number,
    paidAmount: number,
    paymentMethod: PaymentMethod,
    newExpireDate: string
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newDebt = Math.max(0, totalFee - paidAmount);
    const matchedPkg = packages.find(p => p.type === packageType || p.id === packageType);
    const addedSessions = matchedPkg?.sessionsCount || 12;

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      packageType,
      totalFee: totalFee,
      paidAmount: paidAmount,
      remainingDebt: newDebt,
      expireDate: newExpireDate,
      status: 'active',
      sessionsTotal: addedSessions,
      sessionsAttended: 0,
    } : s));

    if (paidAmount > 0) {
      const coach = coaches.find(c => c.id === student.coachId);
      const payment: PaymentRecord = {
        id: generateUid('pay'),
        studentId: student.id,
        studentName: student.fullName,
        coachId: student.coachId,
        coachName: coach ? coach.fullName : 'عمومی',
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod,
        type: 'tuition',
        description: `تمدید اشتراک دوره - ${packageType}`,
        receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
        recordedBy: currentUser.fullName,
        status: 'completed',
      };
      setPayments(prev => [payment, ...prev]);
    }

    const log = AuditService.createLog(currentUser, 'MEMBERSHIP_RENEWED', 'member', `عضویت «${student.fullName}» تا تاریخ ${newExpireDate} تمدید شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  // ----------------------------------------------------
  // COACH SETTLEMENT & STATS
  // ----------------------------------------------------
  const settleCoachPayment = (
    coachId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes = 'تسویه سهم مربی'
  ) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach || amount <= 0) return;

    const newPayment: PaymentRecord = {
      id: generateUid('pay-settle'),
      coachId: coach.id,
      coachName: coach.fullName,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      type: 'coach_settlement',
      description: notes,
      receiptNumber: `SETTLE-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    };

    setPayments(prev => [newPayment, ...prev]);

    const log = AuditService.createLog(currentUser, 'COACH_SETTLED', 'payment', `تسویه حساب با مربی «${coach.fullName}» به مبلغ ${amount.toLocaleString('fa-IR')} تومان ثبت شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const getCoachStats = (coachId: string): CoachFinancialStats => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) {
      return { totalStudents: 0, totalGeneratedRevenue: 0, totalCoachShare: 0, totalClubShare: 0, totalPaidOut: 0, remainingBalance: 0 };
    }

    const assignedStudents = students.filter(s => s.coachId === coachId);
    const totalStudents = assignedStudents.length;
    const totalGeneratedRevenue = assignedStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const coachRate = (coach.commissionRate || 70) / 100;
    const totalCoachShare = Math.round(totalGeneratedRevenue * coachRate);
    const totalClubShare = totalGeneratedRevenue - totalCoachShare;

    const totalPaidOut = payments
      .filter(p => p.coachId === coachId && p.type === 'coach_settlement' && p.status !== 'voided')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = Math.max(0, totalCoachShare - totalPaidOut);

    return { totalStudents, totalGeneratedRevenue, totalCoachShare, totalClubShare, totalPaidOut, remainingBalance };
  };

  // ----------------------------------------------------
  // EXPENSES & PAYMENTS (SAFE NON-DESTRUCTIVE VOIDING)
  // ----------------------------------------------------
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: generateUid('exp'),
      receiptNumber: expenseData.receiptNumber || `EXP-${Math.floor(100 + Math.random() * 900)}`,
      status: 'completed',
    };
    setExpenses(prev => [newExpense, ...prev]);
    SyncEngine.enqueue('expense', newExpense.id, 'INSERT', newExpense as any);

    const log = AuditService.createLog(currentUser, 'EXPENSE_RECORDED', 'payment', `هزینه «${newExpense.title}» به مبلغ ${newExpense.amount.toLocaleString('fa-IR')} تومان ثبت شد.`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const updateExpense = (id: string, updatedData: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updatedData } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const voidExpense = (id: string, reason: string) => {
    const exp = expenses.find(e => e.id === id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'voided', voidReason: reason } : e));
    if (exp) {
      const log = AuditService.createLog(currentUser, 'EXPENSE_VOIDED', 'payment', `سند هزینه «${exp.title}» ابطال شد. علت: ${reason}`);
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const addPayment = (paymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: generateUid('pay'),
      receiptNumber: paymentData.receiptNumber || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    };
    setPayments(prev => [newPayment, ...prev]);
    SyncEngine.enqueue('payment', newPayment.id, 'INSERT', newPayment as any);
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  const voidPayment = (id: string, reason: string) => {
    const pay = payments.find(p => p.id === id);
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'voided', voidReason: reason, voidedAt: new Date().toISOString(), voidedBy: currentUser.fullName } : p));
    if (pay) {
      const log = AuditService.createLog(currentUser, 'PAYMENT_VOIDED', 'payment', `سند دریافتی/پرداختی #${pay.receiptNumber} به مبلغ ${pay.amount.toLocaleString('fa-IR')} تومان ابطال شد. علت: ${reason}`);
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  // ----------------------------------------------------
  // PACKAGES
  // ----------------------------------------------------
  const addPackage = (packageData: Omit<MembershipPackage, 'id'>) => {
    const newPkg: MembershipPackage = {
      ...packageData,
      id: generateUid('pkg'),
    };
    setPackages(prev => [newPkg, ...prev]);
  };

  const updatePackage = (id: string, pkgData: Partial<MembershipPackage>) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...pkgData } : p));
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  // ----------------------------------------------------
  // ACCESS POLICY ENGINE & CHECK-IN
  // ----------------------------------------------------
  const evaluateMemberAccess = (studentId: string): AccessDecision => {
    const student = students.find(s => s.id === studentId);
    return AccessPolicyEngine.evaluate(student, packages, accessPolicyConfig);
  };

  const checkInStudent = (
    studentId: string,
    lockerNumber?: number,
    method: AttendanceRecord['method'] = 'manual'
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'ورزشکار یافت نشد.', alertType: 'error' as const };
    }

    // Access Decision Engine evaluation
    const decision = AccessPolicyEngine.evaluate(student, packages, accessPolicyConfig);
    if (decision.result === 'DENY') {
      const failLog: AccessLog = {
        id: generateUid('log'),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentId: student.id,
        studentName: student.fullName,
        deviceType: 'کانتر پذیرش / گیت ورود',
        method: method === 'face_scan' ? 'face_recognition' : method === 'rfid_wristband' ? 'rfid_card' : 'manual_override',
        result: decision.reasonCode === 'EXPIRED_MEMBERSHIP' ? 'denied_expired' : decision.reasonCode === 'DEBT_EXCEEDED' ? 'denied_debt' : 'denied_unknown',
        message: decision.messageFa,
      };
      setAccessLogs(prev => [failLog, ...prev]);
      return { success: false, message: decision.messageFa, alertType: 'error' as const };
    }

    // Check duplicate check-in today
    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyInside = attendance.find(a => a.studentId === studentId && a.date === todayStr && a.isCurrentlyInside !== false);
    if (alreadyInside && !accessPolicyConfig.allowSameDayMultipleEntries) {
      return { success: false, message: 'ورزشکار در حال حاضر در سالن حضور دارد (تردد تکراری).', alertType: 'warning' as const };
    }

    // Assign Locker using LockerEngine
    let assignedLockerNum = lockerNumber;
    if (!assignedLockerNum && decision.requiresLocker) {
      const lockerRes = LockerEngine.allocateLocker(smartLockers, student);
      if (lockerRes.success && lockerRes.lockerNumber) {
        assignedLockerNum = lockerRes.lockerNumber;
        setSmartLockers(lockerRes.updatedLockers);
      }
    }

    // Update student attended sessions
    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      sessionsAttended: (s.sessionsAttended || 0) + 1,
      assignedLocker: assignedLockerNum,
    } : s));

    const coach = coaches.find(c => c.id === student.coachId);
    const newAttendanceRecord: AttendanceRecord = {
      id: generateUid('att'),
      studentId: student.id,
      studentName: student.fullName,
      coachName: coach ? coach.fullName : 'عمومی',
      checkInTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      date: todayStr,
      lockerNumber: assignedLockerNum,
      method,
      isCurrentlyInside: true,
    };

    setAttendance(prev => [newAttendanceRecord, ...prev]);

    // Create Access Log
    const successLog: AccessLog = {
      id: generateUid('log'),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      studentId: student.id,
      studentName: student.fullName,
      deviceType: 'گیت ورود هوشمند',
      method: method === 'face_scan' ? 'face_recognition' : method === 'rfid_wristband' ? 'rfid_card' : 'manual_override',
      result: 'granted',
      assignedLocker: assignedLockerNum,
      message: `ورود تایید شد • ${assignedLockerNum ? `کمد هوشمند #${assignedLockerNum}` : 'بدون کمد'}`,
    };
    setAccessLogs(prev => [successLog, ...prev]);

    // Hardware Event normalized
    const hwEvt = createNormalizedHardwareEvent('dev-face-gate', 'ACCESS_GRANTED', {
      memberId: student.id,
      memberName: student.fullName,
      credentialType: method === 'face_scan' ? 'face' : 'rfid',
      accessResult: 'granted',
      accessReason: decision.messageFa,
      direction: 'entry',
    });
    setHardwareEvents(prev => [hwEvt, ...prev]);

    return {
      success: true,
      message: `${decision.messageFa} ${assignedLockerNum ? `(کمد اختصاصی #${assignedLockerNum})` : ''}`,
      alertType: decision.result === 'ALLOW_WITH_WARNING' ? 'warning' : 'info',
      lockerNumber: assignedLockerNum,
    };
  };

  // ----------------------------------------------------
  // SMART LOCKERS & HARDWARE GATEWAY
  // ----------------------------------------------------
  const addLocker = (lockerData: Omit<SmartLocker, 'id'>) => {
    const newLocker: SmartLocker = {
      ...lockerData,
      id: generateUid('locker'),
    };
    setSmartLockers(prev => [...prev, newLocker]);
  };

  const updateLocker = (id: string, updatedData: Partial<SmartLocker>) => {
    setSmartLockers(prev => prev.map(l => l.id === id ? { ...l, ...updatedData } : l));
  };

  const deleteLocker = (id: string) => {
    setSmartLockers(prev => prev.filter(l => l.id !== id));
  };

  const openLocker = async (lockerNumber: number, reason = 'فرمان دستی پذیرش') => {
    const targetLocker = smartLockers.find(l => l.number === lockerNumber);
    if (!targetLocker) return false;

    // Check integration mode: Shadow mode protects against accidental hardware pulse
    const masterDevice = hardwareDevices.find(d => d.type === 'locker_relay_board');
    if (masterDevice) {
      const adapter = getAdapterForVendor(masterDevice.vendor);
      await adapter.openLocker(masterDevice, lockerNumber, 800, integrationMode);
    }

    setSmartLockers(prev => prev.map(l => l.number === lockerNumber ? {
      ...l,
      isLocked: false,
      lastUnlockedAt: new Date().toISOString(),
    } : l));

    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      studentId: targetLocker.currentStudentId,
      studentName: targetLocker.currentStudentName || 'کنترل سخت‌افزار',
      deviceType: 'کنترلر رله هوشمند کمدها',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerNumber,
      message: `بازگشایی کمد #${lockerNumber} • ${reason} (${integrationMode === 'shadow' ? 'شنود لاگ' : 'ارسال سیگنال پالس'})`,
    };
    setAccessLogs(prev => [newLog, ...prev]);

    return true;
  };

  const releaseLocker = (lockerNumber: number) => {
    const { updatedLockers, releasedStudentName } = LockerEngine.releaseLocker(smartLockers, lockerNumber);
    setSmartLockers(updatedLockers);

    // Free student assigned locker
    setStudents(prev => prev.map(s => s.assignedLocker === lockerNumber ? { ...s, assignedLocker: undefined } : s));

    const newLog: AccessLog = {
      id: generateUid('log'),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      studentName: releasedStudentName || 'تخلیه کمد',
      deviceType: 'هاب کنترل کمدها',
      method: 'manual_override',
      result: 'granted',
      assignedLocker: lockerNumber,
      message: `کمد #${lockerNumber} تخلیه و مجدداً آماده واگذاری شد.`,
    };
    setAccessLogs(prev => [newLog, ...prev]);
  };

  const assignLocker = (lockerNumber: number, studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    setSmartLockers(prev => prev.map(l => l.number === lockerNumber ? {
      ...l,
      status: 'occupied',
      currentStudentId: student.id,
      currentStudentName: student.fullName,
      assignedAt: new Date().toISOString(),
      isLocked: false,
    } : l));

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assignedLocker: lockerNumber } : s));
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

  const triggerMasterUnlock = (reason = 'عملیات اضطراری مدیریت') => {
    const unlocked = LockerEngine.masterEmergencyUnlockAll(smartLockers);
    setSmartLockers(unlocked);

    const log = AuditService.createLog(currentUser, 'MASTER_UNLOCK_ALL', 'locker', `فرمان بازگشایی اضطراری کلیه کمدها صادر شد. علت: ${reason}`);
    setAuditLogs(prev => [log, ...prev]);
  };

  const simulateIdentityScan = (
    method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code',
    query: string
  ): ScanResult => {
    const cleanQ = query.trim().toLowerCase();
    const matched = students.find(s => 
      (s.rfidCardUid && s.rfidCardUid.toLowerCase() === cleanQ) ||
      (s.nationalId && s.nationalId === cleanQ) ||
      (s.phone && s.phone === cleanQ) ||
      (s.fullName && s.fullName.toLowerCase().includes(cleanQ)) ||
      (s.id === cleanQ)
    );

    if (!matched) {
      const failLog: AccessLog = {
        id: generateUid('log'),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentName: 'هویت نامشخص / کارت تعریف‌نشده',
        deviceType: method === 'face_recognition' ? 'دوربین هوش مصنوعی تشخیص چهره' : 'اسکنر RFID گیت',
        method,
        result: 'denied_unknown',
        message: 'ورود ناموفق: هویت در پایگاه داده اعضای فعال یافت نشد.',
      };
      setAccessLogs(prev => [failLog, ...prev]);

      // Pilot mismatch log
      const pilotLog: PilotComparisonLog = {
        id: generateUid('pilot'),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        deviceId: 'dev-face-gate',
        deviceName: 'ترمینال چهره',
        memberName: 'ناشناس',
        externalDecision: 'DENY',
        gymOsDecision: 'DENY',
        isMatch: true,
      };
      setPilotComparisonLogs(prev => [pilotLog, ...prev]);

      return {
        success: false,
        message: 'شناسایی ناموفق: اطلاعاتی برای این مشخصه بیومتریک یا کارت ثبت نشده است.',
        alertType: 'error',
        method,
        decisionCode: 'DENY',
      };
    }

    // Evaluate via AccessPolicyEngine
    const decision = AccessPolicyEngine.evaluate(matched, packages, accessPolicyConfig);

    if (decision.result === 'DENY') {
      const failLog: AccessLog = {
        id: generateUid('log'),
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentId: matched.id,
        studentName: matched.fullName,
        deviceType: method === 'face_recognition' ? 'دوربین هوش مصنوعی' : 'اسکنر RFID',
        method,
        result: decision.reasonCode === 'EXPIRED_MEMBERSHIP' ? 'denied_expired' : 'denied_debt',
        message: decision.messageFa,
      };
      setAccessLogs(prev => [failLog, ...prev]);

      return {
        success: false,
        student: matched,
        message: decision.messageFa,
        alertType: 'error',
        method,
        decisionCode: 'DENY',
      };
    }

    // Allocate locker
    const lockerRes = LockerEngine.allocateLocker(smartLockers, matched);
    if (lockerRes.success && lockerRes.lockerNumber) {
      setSmartLockers(lockerRes.updatedLockers);
      openLocker(lockerRes.lockerNumber, `شناسایی خودکار هویت با ${method}`);
    }

    // Register attendance
    checkInStudent(matched.id, lockerRes.lockerNumber, method === 'face_recognition' ? 'face_scan' : 'rfid_wristband');

    return {
      success: true,
      student: matched,
      lockerNumber: lockerRes.lockerNumber,
      message: `${decision.messageFa} • ${lockerRes.lockerNumber ? `کمد هوشمند #${lockerRes.lockerNumber} آنلاک شد` : ''}`,
      alertType: decision.result === 'ALLOW_WITH_WARNING' ? 'warning' : 'success',
      method,
      decisionCode: decision.result,
    };
  };

  const toggleDeviceOnline = (deviceId: string) => {
    setHardwareDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const nextStatus = d.status === 'online' ? 'offline' : 'online';
        return { ...d, status: nextStatus, lastPing: nextStatus === 'online' ? 'همین الان (آنلاین)' : 'آفلاین' };
      }
      return d;
    }));
  };

  const testRelayPulse = async (deviceId: string) => {
    const dev = hardwareDevices.find(d => d.id === deviceId);
    if (!dev) return { success: false, latency: 0 };
    const adapter = getAdapterForVendor(dev.vendor);
    const diag = await adapter.runDiagnostics(dev);
    return { success: diag.passed, latency: diag.latencyMs };
  };

  // ----------------------------------------------------
  // WORKOUT & DIET PLANS
  // ----------------------------------------------------
  const saveWorkoutPlan = (plan: WorkoutPlan) => {
    setWorkoutPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = plan;
        return copy;
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
        const copy = [...prev];
        copy[idx] = plan;
        return copy;
      }
      return [plan, ...prev];
    });
  };

  const deleteDietPlan = (id: string) => {
    setDietPlans(prev => prev.filter(p => p.id !== id));
  };

  // ----------------------------------------------------
  // BACKUP & RESTORE
  // ----------------------------------------------------
  const exportDatabaseJson = () => {
    const backupStr = LocalDbRepository.exportFullBackup();
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    const res = LocalDbRepository.importFullBackup(jsonString);
    if (res.success) {
      window.location.reload();
      return true;
    }
    return false;
  };

  const resetToSampleData = () => {
    localStorage.clear();
    window.location.reload();
  };

  const formatMoney = (amt: number) => formatCurrency(amt, lang);
  const formatNum = (num: number) => formatNumber(num, lang);

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      theme,
      setTheme,
      toggleTheme,
      toggleLanguage,
      t,
      activeTab,
      setActiveTab,
      moduleFeatures,
      toggleFeatureEnabled,
      toggleFeaturePinned,
      restoreDefaultFeatures,
      activeBranchId,
      setActiveBranchId,
      branches,
      currentUser,
      setCurrentUserRole,
      integrationMode,
      setIntegrationMode,
      accessPolicyConfig,
      setAccessPolicyConfig,
      coaches,
      students,
      payments,
      expenses,
      attendance,
      workoutPlans,
      dietPlans,
      smartLockers,
      hardwareDevices,
      hardwareEvents,
      pilotComparisonLogs,
      accessLogs,
      auditLogs,
      packages,
      syncState,
      syncQueue,
      triggerCloudSync,
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
      voidExpense,
      addPayment,
      deletePayment,
      voidPayment,
      addPackage,
      updatePackage,
      deletePackage,
      settleCoachPayment,
      getCoachStats,
      evaluateMemberAccess,
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
    }}>
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
