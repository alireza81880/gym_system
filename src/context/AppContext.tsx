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
  PaymentMethod,
  ThemeKey,
  OrganizationInfo,
  CustomField,
  ImportMappingProfile,
  MigrationReport,
  MigrationSnapshot,
  DuplicateResolution,
  DashboardWidgetConfig,
  LockerZone
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
import { ThemeEngineService } from '../services/themeEngine';
import { MigrationService, ImportValidationItem } from '../services/migrationService';
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
  
  // Theme Engine
  activeThemeKey: ThemeKey;
  setActiveThemeKey: (key: ThemeKey) => void;

  // Real Installation & Demo Sandbox States
  isInstalled: boolean;
  isDemoMode: boolean;
  completeInstallation: (params: {
    orgData: Partial<OrganizationInfo>;
    lockerCount: number;
    lockerZones?: string;
    firstPackage?: Partial<MembershipPackage>;
    accessPolicy?: Partial<AccessPolicyConfig>;
    ownerData: { fullName: string; phone: string; username?: string };
  }) => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  resetToEmptyProduction: () => void;

  // Organization & Tenant
  organizationInfo: OrganizationInfo;
  updateOrganizationInfo: (info: Partial<OrganizationInfo>) => void;

  // Dynamic Custom Fields
  customFields: CustomField[];
  saveCustomField: (field: CustomField) => void;
  deleteCustomField: (id: string) => void;

  // Migration & Mapping Profiles
  mappingProfiles: ImportMappingProfile[];
  saveMappingProfile: (profile: ImportMappingProfile) => void;
  deleteMappingProfile: (id: string) => void;
  migrationReports: MigrationReport[];
  migrationSnapshots: MigrationSnapshot[];
  executeMigration: (
    validatedItems: ImportValidationItem[],
    conflictResolutions: Record<string, DuplicateResolution>,
    options: { sourceType: string; fileName?: string }
  ) => MigrationReport;
  rollbackMigration: (snapshotId: string) => boolean;

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
  
  // Dashboard Customization
  dashboardWidgets: DashboardWidgetConfig[];
  updateDashboardWidgets: (widgets: DashboardWidgetConfig[]) => void;

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
  setLockerCount: (newCount: number, defaultZone?: LockerZone) => { success: boolean; warning?: string };
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

const defaultOrganizationInfo: OrganizationInfo = {
  id: 'org-main',
  tenantId: 'gym-org-1',
  name: 'باشگاه بدنسازی و فیتنس پروشات',
  managerName: 'مهندس علیرضا حسینی',
  managerMobile: '09121112233',
  city: 'تهران',
  address: 'تهران، خیابان نیاوران، روبروی پارک، مجتمع ورزشی رویال',
  phone: '021-22800112',
  currency: 'تومان',
  timezone: 'Asia/Tehran',
  memberNumberLabel: 'شماره عضویت',
  workingHours: {
    openingTime: '06:00',
    closingTime: '23:30',
    activeDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    holidaysDescription: 'جمعه‌ها از ۸:۰۰ الی ۲۰:۰۰',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
};

const defaultCustomFields: CustomField[] = [
  {
    id: 'cf-emergency-contact',
    key: 'emergencyContactName',
    label: 'نام و نسبت فرد پاسخگو در شرایط اضطراری',
    type: 'text',
    required: false,
    visible: true,
    category: 'medical',
  },
  {
    id: 'cf-referral-source',
    key: 'referralSource',
    label: 'نحوه آشنایی با باشگاه',
    type: 'select',
    options: ['اینستاگرام / فضای مجازی', 'معرفی اعضا و دوستان', 'موقعیت فیزیکی باشگاه', 'تبلیغات پیامکی'],
    required: false,
    visible: true,
    category: 'general',
  },
  {
    id: 'cf-favourite-discipline',
    key: 'favouriteDiscipline',
    label: 'رشته ورزشی تخصصی',
    type: 'text',
    required: false,
    visible: true,
    category: 'general',
  },
];

const defaultDashboardWidgets: DashboardWidgetConfig[] = [
  { id: 'live_activity', name: 'Live Activity', nameFa: 'فعالیت‌های زنده باشگاه و گیت', visible: true, order: 1 },
  { id: 'people_inside', name: 'People Inside', nameFa: 'پایش حاضرین در سالن', visible: true, order: 2 },
  { id: 'revenue', name: 'Revenue & Finance', nameFa: 'تراز مالی و درآمد ماه جاری', visible: true, order: 3 },
  { id: 'attendance_chart', name: 'Attendance Trends', nameFa: 'نمودار روند تردد و ساعات پیک', visible: true, order: 4 },
  { id: 'expiring_members', name: 'Expiring Members', nameFa: 'اشتراک‌های رو به انقضا', visible: true, order: 5 },
  { id: 'debt_receivables', name: 'Outstanding Debt', nameFa: 'مطالبات و ورزشکاران بدهکار', visible: true, order: 6 },
  { id: 'hardware_health', name: 'Hardware Health', nameFa: 'وضعیت سلامت سخت‌افزارها', visible: true, order: 7 },
  { id: 'locker_status', name: 'Locker Status', nameFa: 'وضعیت کمدهای هوشمند', visible: true, order: 8 },
  { id: 'smart_insights', name: 'Smart Insights', nameFa: 'هشدارهای هوشمند و اعضای در معرض ریزش', visible: true, order: 9 },
];

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
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('gym_lang') as Language) || 'fa';
  });

  const [activeThemeKey, setActiveThemeKeyState] = useState<ThemeKey>(() => {
    return ThemeEngineService.getInitialTheme();
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('gym_theme') as Theme;
    if (saved) return saved;
    return 'dark';
  });

  // Installation & Demo Sandbox States
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    return LocalDbRepository.get<boolean>('gym_installed', true); // Defaults to true or initialized state
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return LocalDbRepository.get<boolean>('gym_demo_mode', false);
  });

  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo>(() => {
    return LocalDbRepository.get<OrganizationInfo>('organization_info', defaultOrganizationInfo);
  });

  // Feature Customization Center
  const [moduleFeatures, setModuleFeatures] = useState<ModuleFeature[]>(() => {
    return LocalDbRepository.get<ModuleFeature[]>('module_features', initialModuleFeatures);
  });

  // Custom Fields System
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    return LocalDbRepository.get<CustomField[]>('custom_fields', defaultCustomFields);
  });

  // Migration Profiles, Snapshots & Reports
  const [mappingProfiles, setMappingProfiles] = useState<ImportMappingProfile[]>(() => {
    return LocalDbRepository.get<ImportMappingProfile[]>('mapping_profiles', MigrationService.PRESET_PROFILES);
  });

  const [migrationReports, setMigrationReports] = useState<MigrationReport[]>(() => {
    return LocalDbRepository.get<MigrationReport[]>('migration_reports', []);
  });

  const [migrationSnapshots, setMigrationSnapshots] = useState<MigrationSnapshot[]>(() => {
    return LocalDbRepository.get<MigrationSnapshot[]>('migration_snapshots', []);
  });

  // Dashboard Customization
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetConfig[]>(() => {
    return LocalDbRepository.get<DashboardWidgetConfig[]>('dashboard_widgets', defaultDashboardWidgets);
  });

  // Multi-Branch State
  const [branches, setBranches] = useState<Branch[]>(() => {
    return LocalDbRepository.get<Branch[]>('branches', initialBranches);
  });
  const [activeBranchId, setActiveBranchId] = useState<string>('branch-tehran-central');

  // RBAC User
  const [currentUser, setCurrentUser] = useState<StaffUser>(() => {
    return LocalDbRepository.get<StaffUser>('current_user', {
      id: 'usr-admin-1',
      username: 'admin',
      fullName: organizationInfo.managerName || 'مدیر ارشد باشگاه',
      role: 'gym_owner',
      phone: organizationInfo.managerMobile || '09121112233',
      isActive: true,
    });
  });

  // Integration Mode (Default: Shadow Mode for safe pilot deployment!)
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>(() => {
    return LocalDbRepository.get<IntegrationMode>('integration_mode', 'shadow');
  });

  // Access Policy Config
  const [accessPolicyConfig, setAccessPolicyConfig] = useState<AccessPolicyConfig>(() => {
    return LocalDbRepository.get<AccessPolicyConfig>('access_policy_config', defaultAccessPolicyConfig);
  });

  // Core Data States
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

  // Apply Theme on load & change
  useEffect(() => {
    ThemeEngineService.applyTheme(activeThemeKey);
    const config = ThemeEngineService.getTheme(activeThemeKey);
    setThemeState(config.category === 'dark' || config.category === 'special' ? 'dark' : 'light');
  }, [activeThemeKey]);

  // Local Persistence Effects
  useEffect(() => {
    localStorage.setItem('gym_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => { LocalDbRepository.set('gym_installed', isInstalled); }, [isInstalled]);
  useEffect(() => { LocalDbRepository.set('gym_demo_mode', isDemoMode); }, [isDemoMode]);
  useEffect(() => { LocalDbRepository.set('organization_info', organizationInfo); }, [organizationInfo]);
  useEffect(() => { LocalDbRepository.set('custom_fields', customFields); }, [customFields]);
  useEffect(() => { LocalDbRepository.set('mapping_profiles', mappingProfiles); }, [mappingProfiles]);
  useEffect(() => { LocalDbRepository.set('migration_reports', migrationReports); }, [migrationReports]);
  useEffect(() => { LocalDbRepository.set('migration_snapshots', migrationSnapshots); }, [migrationSnapshots]);
  useEffect(() => { LocalDbRepository.set('dashboard_widgets', dashboardWidgets); }, [dashboardWidgets]);
  useEffect(() => { LocalDbRepository.set('current_user', currentUser); }, [currentUser]);
  useEffect(() => { LocalDbRepository.set('branches', branches); }, [branches]);

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

  const setActiveThemeKey = (key: ThemeKey) => {
    setActiveThemeKeyState(key);
    ThemeEngineService.applyTheme(key);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    const fallbackKey: ThemeKey = t === 'dark' ? 'obsidian' : 'pearl';
    setActiveThemeKey(fallbackKey);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const toggleLanguage = () => setLang(prev => prev === 'fa' ? 'en' : 'fa');
  const t = translations[lang];

  const setCurrentUserRole = (role: UserRole) => {
    setCurrentUser(prev => ({ ...prev, role }));
  };

  // ----------------------------------------------------
  // INSTALLATION WIZARD & DEMO MODE HANDLERS
  // ----------------------------------------------------
  const completeInstallation = (params: {
    orgData: Partial<OrganizationInfo>;
    lockerCount: number;
    lockerZones?: string;
    firstPackage?: Partial<MembershipPackage>;
    accessPolicy?: Partial<AccessPolicyConfig>;
    ownerData: { fullName: string; phone: string; username?: string };
  }) => {
    const tenantId = `gym-org-${Date.now()}`;
    const branchId = `branch-main-${Date.now()}`;

    const newOrg: OrganizationInfo = {
      ...defaultOrganizationInfo,
      ...params.orgData,
      id: `org-${Date.now()}`,
      tenantId,
      createdAt: new Date().toISOString(),
    };

    const newBranch: Branch = {
      id: branchId,
      tenantId,
      name: `شعبه مرکزی (${newOrg.name})`,
      code: 'MAIN-01',
      city: newOrg.city,
      address: newOrg.address,
      phone: newOrg.phone,
      managerName: params.ownerData.fullName,
      isMain: true,
      isActive: true,
    };

    const newOwner: StaffUser = {
      id: `usr-owner-${Date.now()}`,
      tenantId,
      branchId,
      username: params.ownerData.username || 'owner',
      fullName: params.ownerData.fullName,
      role: 'gym_owner',
      phone: params.ownerData.phone,
      isActive: true,
    };

    // Generate Dynamic Lockers
    const generatedLockers = LockerEngine.generateLockers(
      params.lockerCount || 100,
      'general',
      tenantId,
      branchId
    );

    // Initial Package if specified
    const initialPkgList: MembershipPackage[] = [];
    if (params.firstPackage && params.firstPackage.name) {
      initialPkgList.push({
        id: `pkg-${Date.now()}`,
        tenantId,
        branchId,
        name: params.firstPackage.name,
        price: params.firstPackage.price || 3000000,
        sessionsCount: params.firstPackage.sessionsCount || 24,
        durationDays: params.firstPackage.durationDays || 30,
        description: params.firstPackage.description || 'پکیج پایه راه‌اندازی باشگاه',
        includesLocker: params.firstPackage.includesLocker ?? true,
        isActive: true,
      });
    }

    // Set Access Policies
    if (params.accessPolicy) {
      setAccessPolicyConfig(prev => ({ ...prev, ...params.accessPolicy }));
    }

    setOrganizationInfo(newOrg);
    setBranches([newBranch]);
    setActiveBranchId(branchId);
    setCurrentUser(newOwner);
    setSmartLockers(generatedLockers);
    setPackages(initialPkgList);

    // Empty clean data in real installation mode!
    setStudents([]);
    setCoaches([]);
    setPayments([]);
    setExpenses([]);
    setAttendance([]);
    setWorkoutPlans([]);
    setDietPlans([]);
    setHardwareDevices([]);
    setHardwareEvents([]);
    setPilotComparisonLogs([]);
    setAccessLogs([]);

    const initialAudit = AuditService.createLog(
      newOwner,
      'GYM_INITIAL_SETUP',
      'setting',
      `باشگاه «${newOrg.name}» با موفقیت راه‌اندازی شد. تعداد ${generatedLockers.length} کمد الکترونیکی تخصیص یافت.`
    );
    setAuditLogs([initialAudit]);

    setIsInstalled(true);
    setIsDemoMode(false);
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setIsInstalled(true);
    setOrganizationInfo(defaultOrganizationInfo);
    setCoaches(initialCoaches);
    setStudents(initialStudents);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setAttendance(initialAttendance);
    setWorkoutPlans(initialWorkoutPlans);
    setDietPlans(initialDietPlans);
    setSmartLockers(initialSmartLockers);
    setHardwareDevices(initialHardwareDevices);
    setPackages(initialPackages);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  const resetToEmptyProduction = () => {
    localStorage.clear();
    setIsInstalled(false);
    setIsDemoMode(false);
    window.location.reload();
  };

  const updateOrganizationInfo = (info: Partial<OrganizationInfo>) => {
    setOrganizationInfo(prev => ({ ...prev, ...info, updatedAt: new Date().toISOString() }));
  };

  // Custom Fields
  const saveCustomField = (field: CustomField) => {
    setCustomFields(prev => {
      const idx = prev.findIndex(f => f.id === field.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = field;
        return updated;
      }
      return [...prev, field];
    });
  };

  const deleteCustomField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
  };

  // Mapping Profiles
  const saveMappingProfile = (profile: ImportMappingProfile) => {
    setMappingProfiles(prev => {
      const idx = prev.findIndex(p => p.id === profile.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...profile, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [profile, ...prev];
    });
  };

  const deleteMappingProfile = (id: string) => {
    setMappingProfiles(prev => prev.filter(p => p.id !== id));
  };

  // Migration Execution & Rollback
  const executeMigration = (
    validatedItems: ImportValidationItem[],
    conflictResolutions: Record<string, DuplicateResolution>,
    options: { sourceType: string; fileName?: string }
  ): MigrationReport => {
    const result = MigrationService.executeImport(
      validatedItems,
      students,
      conflictResolutions,
      {
        tenantId: organizationInfo.tenantId,
        branchId: activeBranchId,
        defaultCoachId: coaches[0]?.id || '',
        sourceType: options.sourceType,
        fileName: options.fileName,
      }
    );

    setStudents(result.updatedStudents);
    setMigrationReports(prev => [result.report, ...prev]);
    setMigrationSnapshots(prev => [result.snapshot, ...prev]);

    const audit = AuditService.createLog(
      currentUser,
      'MIGRATION_COMPLETED',
      'member',
      `مهاجرت داده‌ها از منبع ${options.sourceType} انجام شد: ${result.report.importedCount} عضو جدید، ${result.report.updatedCount} به‌روزرسانی.`
    );
    setAuditLogs(prev => [audit, ...prev]);

    return result.report;
  };

  const rollbackMigration = (snapshotId: string): boolean => {
    const snapshot = migrationSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    try {
      const restored = MigrationService.rollback(snapshot);
      setStudents(restored);

      setMigrationReports(prev => prev.map(r => r.migrationId === snapshotId ? { ...r, rollbackAvailable: false } : r));

      const audit = AuditService.createLog(
        currentUser,
        'MIGRATION_ROLLBACK',
        'member',
        `بازگردانی داده‌های مهاجرت با شناسه snapshot #${snapshotId} با موفقیت انجام شد.`
      );
      setAuditLogs(prev => [audit, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  // Dynamic Locker Resizing
  const setLockerCount = (newCount: number, defaultZone: LockerZone = 'general') => {
    const result = LockerEngine.resizeLockers(
      smartLockers,
      newCount,
      defaultZone,
      organizationInfo.tenantId,
      activeBranchId
    );
    setSmartLockers(result.updatedLockers);

    const audit = AuditService.createLog(
      currentUser,
      'LOCKER_RESIZE',
      'locker',
      `تعداد کل کمدهای سالن به ${result.updatedLockers.length} کمد تغییر یافت.`
    );
    setAuditLogs(prev => [audit, ...prev]);

    return {
      success: true,
      warning: result.warning,
    };
  };

  const updateDashboardWidgets = (widgets: DashboardWidgetConfig[]) => {
    setDashboardWidgets(widgets);
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
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    setCoaches(prev => [newCoach, ...prev]);
    SyncEngine.enqueue('coach', newCoach.id, 'INSERT', newCoach);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'COACH_ADDED', 'setting', `مربی جدید «${newCoach.fullName}» اضافه شد.`),
      ...prev
    ]);
  };

  const updateCoach = (id: string, coachData: Partial<Coach>) => {
    setCoaches(prev => prev.map(c => c.id === id ? { ...c, ...coachData } : c));
    SyncEngine.enqueue('coach', id, 'UPDATE', coachData);
  };

  const deleteCoach = (id: string) => {
    const coach = coaches.find(c => c.id === id);
    setCoaches(prev => prev.filter(c => c.id !== id));
    SyncEngine.enqueue('coach', id, 'DELETE', { id });
    if (coach) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'COACH_DELETED', 'setting', `مربی «${coach.fullName}» حذف شد.`),
        ...prev
      ]);
    }
  };

  // ----------------------------------------------------
  // STUDENTS / MEMBERS CRUD
  // ----------------------------------------------------
  const addStudent = (studentData: Omit<Student, 'id' | 'remainingDebt'>, initialPayment = 0, paymentMethod: PaymentMethod = 'pos') => {
    const totalFee = studentData.totalFee || 0;
    const remainingDebt = Math.max(0, totalFee - initialPayment);
    const newStudentId = generateUid('student');
    const memberNum = studentData.memberNumber || `${students.length + 1001}`;

    const newStudent: Student = {
      ...studentData,
      id: newStudentId,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      memberNumber: memberNum,
      paidAmount: initialPayment,
      remainingDebt,
    };

    setStudents(prev => [newStudent, ...prev]);
    SyncEngine.enqueue('student', newStudent.id, 'INSERT', newStudent);

    if (initialPayment > 0) {
      const payment: PaymentRecord = {
        id: generateUid('pay'),
        tenantId: organizationInfo.tenantId,
        branchId: activeBranchId,
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        amount: initialPayment,
        date: newStudent.registrationDate,
        paymentMethod,
        type: 'tuition',
        description: `شهریه ثبت‌نام اولیه (${studentData.packageType})`,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        recordedBy: currentUser.fullName,
      };
      setPayments(prev => [payment, ...prev]);
      SyncEngine.enqueue('payment', payment.id, 'INSERT', payment);
    }

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'STUDENT_REGISTERED', 'member', `ورزشکار جدید «${newStudent.fullName}» (${organizationInfo.memberNumberLabel}: ${memberNum}) ثبت‌نام شد.`),
      ...prev
    ]);
  };

  const updateStudent = (id: string, studentData: Partial<Student>) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const updated = { ...s, ...studentData };
        if (studentData.totalFee !== undefined || studentData.paidAmount !== undefined) {
          const fee = studentData.totalFee !== undefined ? studentData.totalFee : s.totalFee;
          const paid = studentData.paidAmount !== undefined ? studentData.paidAmount : s.paidAmount;
          updated.remainingDebt = Math.max(0, fee - paid);
        }
        return updated;
      }
      return s;
    }));
    SyncEngine.enqueue('student', id, 'UPDATE', studentData);
  };

  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    SyncEngine.enqueue('student', id, 'DELETE', { id });
    if (student) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'STUDENT_DELETED', 'member', `ورزشکار «${student.fullName}» حذف شد.`),
        ...prev
      ]);
    }
  };

  const recordStudentPayment = (studentId: string, amount: number, paymentMethod: PaymentMethod, description?: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const newPaidAmount = student.paidAmount + amount;
    const newRemainingDebt = Math.max(0, student.remainingDebt - amount);

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      paidAmount: newPaidAmount,
      remainingDebt: newRemainingDebt,
    } : s));

    const payment: PaymentRecord = {
      id: generateUid('pay'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      studentId: student.id,
      studentName: student.fullName,
      amount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      type: 'tuition',
      description: description || 'تسویه بدهی / پرداخت شهریه',
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: currentUser.fullName,
    };
    setPayments(prev => [payment, ...prev]);

    SyncEngine.enqueue('payment', payment.id, 'INSERT', payment);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'PAYMENT_RECORDED', 'payment', `مبلغ ${formatCurrency(amount, lang)} برای «${student.fullName}» ثبت شد.`),
      ...prev
    ]);
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

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      packageType,
      expireDate: newExpireDate,
      totalFee: s.totalFee + totalFee,
      paidAmount: s.paidAmount + paidAmount,
      remainingDebt: s.remainingDebt + newDebt,
      status: 'active',
      sessionsAttended: 0,
    } : s));

    if (paidAmount > 0) {
      const payment: PaymentRecord = {
        id: generateUid('pay'),
        tenantId: organizationInfo.tenantId,
        branchId: activeBranchId,
        studentId: student.id,
        studentName: student.fullName,
        amount: paidAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod,
        type: 'tuition',
        description: `تمدید اشتراک (${packageType}) تا تاریخ ${newExpireDate}`,
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        recordedBy: currentUser.fullName,
      };
      setPayments(prev => [payment, ...prev]);
      SyncEngine.enqueue('payment', payment.id, 'INSERT', payment);
    }

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'MEMBERSHIP_RENEWED', 'member', `عضویت «${student.fullName}» تمدید شد.`),
      ...prev
    ]);
  };

  // ----------------------------------------------------
  // EXPENSES & PAYMENTS CRUD
  // ----------------------------------------------------
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: generateUid('exp'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `EXP-${Date.now().toString().slice(-6)}`,
      status: 'completed',
    };
    setExpenses(prev => [newExpense, ...prev]);
    SyncEngine.enqueue('expense', newExpense.id, 'INSERT', newExpense);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'EXPENSE_RECORDED', 'payment', `هزینه «${newExpense.title}» به مبلغ ${formatCurrency(newExpense.amount, lang)} ثبت شد.`),
      ...prev
    ]);
  };

  const updateExpense = (id: string, expenseData: Partial<ExpenseRecord>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expenseData } : e));
    SyncEngine.enqueue('expense', id, 'UPDATE', expenseData);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    SyncEngine.enqueue('expense', id, 'DELETE', { id });
  };

  const voidExpense = (id: string, reason: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? {
      ...e,
      status: 'voided',
      voidReason: reason,
    } : e));
    SyncEngine.enqueue('expense', id, 'UPDATE', { status: 'voided', voidReason: reason });
  };

  const addPayment = (paymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: generateUid('pay'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    };
    setPayments(prev => [newPayment, ...prev]);
    SyncEngine.enqueue('payment', newPayment.id, 'INSERT', newPayment);
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    SyncEngine.enqueue('payment', id, 'DELETE', { id });
  };

  const voidPayment = (id: string, reason: string) => {
    setPayments(prev => prev.map(p => p.id === id ? {
      ...p,
      status: 'voided',
      voidReason: reason,
      voidedAt: new Date().toISOString(),
      voidedBy: currentUser.fullName,
    } : p));
    SyncEngine.enqueue('payment', id, 'UPDATE', { status: 'voided', voidReason: reason });
  };

  // ----------------------------------------------------
  // PACKAGES CRUD
  // ----------------------------------------------------
  const addPackage = (pkgData: Omit<MembershipPackage, 'id'>) => {
    const newPkg: MembershipPackage = {
      ...pkgData,
      id: generateUid('pkg'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    setPackages(prev => [newPkg, ...prev]);
    SyncEngine.enqueue('package', newPkg.id, 'INSERT', newPkg);
  };

  const updatePackage = (id: string, pkgData: Partial<MembershipPackage>) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, ...pkgData } : p));
    SyncEngine.enqueue('package', id, 'UPDATE', pkgData);
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
    SyncEngine.enqueue('package', id, 'DELETE', { id });
  };

  // ----------------------------------------------------
  // COACH SETTLEMENT
  // ----------------------------------------------------
  const settleCoachPayment = (coachId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;

    const expense: ExpenseRecord = {
      id: generateUid('exp'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      title: `تسویه حساب مربی: ${coach.fullName}`,
      category: 'salary',
      amount,
      date: new Date().toISOString().split('T')[0],
      paidTo: coach.fullName,
      paymentMethod,
      description: notes || 'پرداخت سهم و پورسانت شاگردان',
      receiptNumber: `PAY-COACH-${Date.now().toString().slice(-6)}`,
      status: 'completed',
    };
    setExpenses(prev => [expense, ...prev]);
    SyncEngine.enqueue('expense', expense.id, 'INSERT', expense);

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'COACH_SETTLEMENT', 'payment', `مبلغ ${formatCurrency(amount, lang)} به مربی «${coach.fullName}» پرداخت شد.`),
      ...prev
    ]);
  };

  const getCoachStats = (coachId: string): CoachFinancialStats => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) {
      return { totalStudents: 0, totalGeneratedRevenue: 0, totalCoachShare: 0, totalClubShare: 0, totalPaidOut: 0, remainingBalance: 0 };
    }

    const coachStudents = students.filter(s => s.coachId === coachId);
    const totalGeneratedRevenue = coachStudents.reduce((sum, s) => sum + s.paidAmount, 0);
    const rate = coach.commissionRate / 100;
    const totalCoachShare = Math.round(totalGeneratedRevenue * rate);
    const totalClubShare = totalGeneratedRevenue - totalCoachShare;

    const paidExpenses = expenses.filter(e => e.paidTo === coach.fullName && e.category === 'salary' && e.status !== 'voided');
    const totalPaidOut = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBalance = Math.max(0, totalCoachShare - totalPaidOut);

    return {
      totalStudents: coachStudents.length,
      totalGeneratedRevenue,
      totalCoachShare,
      totalClubShare,
      totalPaidOut,
      remainingBalance,
    };
  };

  // ----------------------------------------------------
  // ACCESS DECISION & CHECK-IN ENGINE
  // ----------------------------------------------------
  const evaluateMemberAccess = (studentId: string): AccessDecision => {
    const student = students.find(s => s.id === studentId);
    return AccessPolicyEngine.evaluate(student, accessPolicyConfig, attendance);
  };

  const checkInStudent = (
    studentId: string, 
    lockerNumber?: number, 
    method: AttendanceRecord['method'] = 'manual'
  ): { success: boolean; message: string; alertType?: 'info' | 'warning' | 'error'; lockerNumber?: number } => {
    const student = students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'ورزشکار یافت نشد.', alertType: 'error' };
    }

    const decision = evaluateMemberAccess(studentId);

    if (decision.result === 'DENY' && integrationMode === 'full_control') {
      return { success: false, message: decision.messageFa, alertType: 'error' };
    }

    let assignedNum = lockerNumber;
    if (!assignedNum && decision.requiresLocker) {
      const alloc = LockerEngine.allocateLocker(smartLockers, student);
      if (alloc.success && alloc.lockerNumber) {
        assignedNum = alloc.lockerNumber;
        setSmartLockers(alloc.updatedLockers);
      }
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().split('T')[0];

    const attRecord: AttendanceRecord = {
      id: generateUid('att'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      studentId: student.id,
      studentName: student.fullName,
      coachName: coaches.find(c => c.id === student.coachId)?.fullName || 'عمومی',
      checkInTime: timeStr,
      date: dateStr,
      lockerNumber: assignedNum,
      method,
      isCurrentlyInside: true,
    };

    setAttendance(prev => [attRecord, ...prev]);

    setStudents(prev => prev.map(s => s.id === studentId ? {
      ...s,
      sessionsAttended: s.sessionsAttended + 1,
      lastAccessTime: now.toISOString(),
      assignedLocker: assignedNum,
    } : s));

    const accessLog: AccessLog = {
      id: generateUid('log'),
      timestamp: timeStr,
      studentId: student.id,
      studentName: student.fullName,
      deviceType: 'ورودی پذیرش',
      method: method === 'face_scan' ? 'face_recognition' : method === 'rfid_wristband' ? 'rfid_card' : 'manual_override',
      result: decision.result === 'ALLOW' ? 'granted' : 'granted',
      assignedLocker: assignedNum,
      message: decision.messageFa,
    };
    setAccessLogs(prev => [accessLog, ...prev]);

    return {
      success: true,
      message: `${decision.messageFa} ${assignedNum ? `• کمد اختصاص یافته: #${assignedNum}` : ''}`,
      alertType: decision.result === 'ALLOW_WITH_WARNING' ? 'warning' : 'info',
      lockerNumber: assignedNum,
    };
  };

  // ----------------------------------------------------
  // SMART LOCKERS CRUD & GATEWAY ACTIONS
  // ----------------------------------------------------
  const addLocker = (lockerData: Omit<SmartLocker, 'id'>) => {
    const newLocker: SmartLocker = {
      ...lockerData,
      id: generateUid('lck'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    setSmartLockers(prev => [...prev, newLocker].sort((a, b) => a.number - b.number));
  };

  const updateLocker = (id: string, lockerData: Partial<SmartLocker>) => {
    setSmartLockers(prev => prev.map(l => l.id === id ? { ...l, ...lockerData } : l));
  };

  const deleteLocker = (id: string) => {
    setSmartLockers(prev => prev.filter(l => l.id !== id));
  };

  const openLocker = async (lockerNumber: number, reason = 'بازگشایی از پذیرش'): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    setSmartLockers(prev => prev.map(l => l.number === lockerNumber ? {
      ...l,
      isLocked: false,
      lastUnlockedAt: timestamp,
    } : l));

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'LOCKER_OPENED', 'locker', `کمد شماره #${lockerNumber} بازگشایی شد (${reason}).`),
      ...prev
    ]);
    return true;
  };

  const releaseLocker = (lockerNumber: number) => {
    const res = LockerEngine.releaseLocker(smartLockers, lockerNumber);
    setSmartLockers(res.updatedLockers);

    setStudents(prev => prev.map(s => s.assignedLocker === lockerNumber ? {
      ...s,
      assignedLocker: undefined,
    } : s));

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'LOCKER_RELEASED', 'locker', `کمد شماره #${lockerNumber} آزاد شد.`),
      ...prev
    ]);
  };

  const assignLocker = (lockerNumber: number, studentId: string): boolean => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    const assignedAt = new Date().toISOString();
    setSmartLockers(prev => prev.map(l => l.number === lockerNumber ? {
      ...l,
      status: 'occupied',
      currentStudentId: student.id,
      currentStudentName: student.fullName,
      assignedAt,
      isLocked: false,
      lastUnlockedAt: assignedAt,
    } : l));

    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, assignedLocker: lockerNumber } : s));
    return true;
  };

  const toggleLockerMaintenance = (lockerNumber: number) => {
    setSmartLockers(prev => prev.map(l => {
      if (l.number === lockerNumber) {
        const nextStatus = l.status === 'maintenance' ? 'available' : 'maintenance';
        return { ...l, status: nextStatus };
      }
      return l;
    }));
  };

  const triggerMasterUnlock = (reason = 'بازگشایی اضطراری کلیه کمدها') => {
    const updated = LockerEngine.masterEmergencyUnlockAll(smartLockers);
    setSmartLockers(updated);

    const audit = AuditService.createLog(
      currentUser,
      'MASTER_LOCKER_UNLOCK_EMERGENCY',
      'locker',
      `هشدار: بازگشایی سراسری تمام ${smartLockers.length} کمد توسط ${currentUser.fullName} اجرا شد. دلیل: ${reason}`
    );
    setAuditLogs(prev => [audit, ...prev]);
  };

  const simulateIdentityScan = (
    method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code',
    query: string
  ): ScanResult => {
    let matchedStudent: Student | undefined;

    if (method === 'rfid_card') {
      matchedStudent = students.find(s => s.rfidCardUid === query || s.phone.endsWith(query) || s.memberNumber === query);
    } else if (method === 'face_recognition') {
      matchedStudent = students.find(s => s.fullName.includes(query) || s.id === query);
    } else {
      matchedStudent = students.find(s => s.nationalId === query || s.phone === query || s.memberNumber === query);
    }

    if (!matchedStudent) {
      return {
        success: false,
        message: 'شناسه یا چهره در بانک اطلاعاتی شناسایی نشد.',
        alertType: 'error',
        method,
      };
    }

    const decision = evaluateMemberAccess(matchedStudent.id);

    let assignedLockerNum: number | undefined;
    if (decision.result === 'ALLOW' || decision.result === 'ALLOW_WITH_WARNING') {
      const checkInRes = checkInStudent(matchedStudent.id, undefined, method === 'face_scan' as any ? 'face_scan' : 'rfid_wristband');
      assignedLockerNum = checkInRes.lockerNumber;
    }

    return {
      success: decision.result !== 'DENY',
      student: matchedStudent,
      lockerNumber: assignedLockerNum,
      message: decision.messageFa,
      alertType: decision.result === 'ALLOW' ? 'success' : decision.result === 'ALLOW_WITH_WARNING' ? 'warning' : 'error',
      method,
    };
  };

  const toggleDeviceOnline = (deviceId: string) => {
    setHardwareDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        const next = d.status === 'online' ? 'offline' : 'online';
        return { ...d, status: next, lastPing: new Date().toLocaleTimeString('fa-IR') };
      }
      return d;
    }));
  };

  const testRelayPulse = async (deviceId: string): Promise<{ success: boolean; latency: number }> => {
    const dev = hardwareDevices.find(d => d.id === deviceId);
    if (!dev) return { success: false, latency: 0 };

    const adapter = getAdapterForVendor(dev.vendor);
    const start = Date.now();
    const res = await adapter.openDoor(dev, 1500, dev.integrationMode || 'hybrid');
    const latency = Date.now() - start;
    return { success: res.success, latency };
  };

  // Workout & Diet
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

  // Backup & Reset
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
      activeThemeKey,
      setActiveThemeKey,
      isInstalled,
      isDemoMode,
      completeInstallation,
      enterDemoMode,
      exitDemoMode,
      resetToEmptyProduction,
      organizationInfo,
      updateOrganizationInfo,
      customFields,
      saveCustomField,
      deleteCustomField,
      mappingProfiles,
      saveMappingProfile,
      deleteMappingProfile,
      migrationReports,
      migrationSnapshots,
      executeMigration,
      rollbackMigration,
      dashboardWidgets,
      updateDashboardWidgets,
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
      setLockerCount,
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
