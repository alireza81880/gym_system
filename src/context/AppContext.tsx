import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
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
  initialWorkoutPlans, 
  initialDietPlans, 
  initialAccessLogs, 
} from '../data/initialData';
import { translations, formatCurrency, formatNumber } from '../i18n/translations';
import { AccessPolicyEngine, AccessPolicyConfig } from '../services/accessPolicyService';
import { LockerEngine } from '../services/lockerService';
import { AuditService } from '../services/auditService';
import { SyncEngine } from '../services/syncService';
import { MigrationService, ImportValidationItem } from '../services/migrationService';
import { MemberService } from '../services/memberService';
import { getAdapterForVendor, createNormalizedHardwareEvent } from '../services/hardwareAdapters';
import { MemberRepository } from '../services/repositories/memberRepository';
import { PaymentRepository } from '../services/repositories/paymentRepository';
import { AttendanceRepository } from '../services/repositories/attendanceRepository';
import { HardwareRepository } from '../services/repositories/hardwareRepository';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { PersistenceManager } from '../services/repositories/persistenceManager';
import { useMemberStore, memberActions } from '../stores/memberStore';
import { useFinanceStore, financeActions } from '../stores/financeStore';
import { useAttendanceStore, attendanceActions } from '../stores/attendanceStore';
import { useHardwareStore, hardwareActions } from '../stores/hardwareStore';
import { useLockerStore, lockerActions } from '../stores/lockerStore';
import { useSettingsStore, settingsStore, settingsActions } from '../stores/settingsStore';
import { useThemeStore, themeActions } from '../stores/themeStore';
import { useMigrationStore, migrationActions } from '../stores/migrationStore';

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

export interface AppContextType {
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('fa');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(() => PersistenceManager.get('workout_plans', initialWorkoutPlans));
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => PersistenceManager.get('diet_plans', initialDietPlans));
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => PersistenceManager.get('access_logs', initialAccessLogs));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => PersistenceManager.get('audit_logs', []));
  const [syncState, setSyncState] = useState<SyncState>('ONLINE');
  const [syncQueue, setSyncQueue] = useState<SyncJob[]>([]);
  const [pilotComparisonLogs] = useState<PilotComparisonLog[]>([]);

  // Domain Store Subscriptions
  const theme = useThemeStore(s => s.theme);
  const activeThemeKey = useThemeStore(s => s.activeThemeKey);

  const isInstalled = useSettingsStore(s => s.isInstalled);
  const isDemoMode = useSettingsStore(s => s.isDemoMode);
  const organizationInfo = useSettingsStore(s => s.organizationInfo);
  const currentUser = useSettingsStore(s => s.currentUser);
  const branches = useSettingsStore(s => s.branches);
  const activeBranchId = useSettingsStore(s => s.activeBranchId);
  const customFields = useSettingsStore(s => s.customFields);
  const packages = useSettingsStore(s => s.packages);
  const coaches = useSettingsStore(s => s.coaches);
  const accessPolicyConfig = useSettingsStore(s => s.accessPolicyConfig);
  const dashboardWidgets = useSettingsStore(s => s.dashboardWidgets);
  const moduleFeatures = useSettingsStore(s => s.moduleFeatures);
  const integrationMode = useSettingsStore(s => s.integrationMode);

  const memberVersion = useMemberStore(s => s.version);
  const students = useMemo(() => MemberRepository.getAll(), [memberVersion]);

  const financeVersion = useFinanceStore(s => s.version);
  const payments = useMemo(() => PaymentRepository.getAllPayments(), [financeVersion]);
  const expenses = useMemo(() => PaymentRepository.getAllExpenses(), [financeVersion]);

  const attendanceVersion = useAttendanceStore(s => s.version);
  const attendance = useMemo(() => AttendanceRepository.getAll(), [attendanceVersion]);

  const hardwareVersion = useHardwareStore(s => s.version);
  const hardwareDevices = useMemo(() => HardwareRepository.getDevices(), [hardwareVersion]);
  const hardwareEvents = useMemo(() => HardwareRepository.getRecentEvents(100), [hardwareVersion]);

  const lockerVersion = useLockerStore(s => s.version);
  const smartLockers = useMemo(() => LockerRepository.getAll(), [lockerVersion]);

  const mappingProfiles = useMigrationStore(s => s.mappingProfiles);
  const migrationReports = useMigrationStore(s => s.migrationReports);
  const migrationSnapshots = useMigrationStore(s => s.migrationSnapshots);

  const t = translations[lang];

  // Language & Theme
  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === 'fa' ? 'en' : 'fa'));
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    themeActions.setTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    themeActions.toggleTheme();
  }, []);

  const setActiveThemeKey = useCallback((key: ThemeKey) => {
    themeActions.setThemeKey(key);
  }, []);

  // Installation & Demo Sandbox
  const completeInstallation = useCallback((params: {
    orgData: Partial<OrganizationInfo>;
    lockerCount: number;
    lockerZones?: string;
    firstPackage?: Partial<MembershipPackage>;
    accessPolicy?: Partial<AccessPolicyConfig>;
    ownerData: { fullName: string; phone: string; username?: string };
  }) => {
    settingsActions.updateOrganizationInfo(params.orgData);
    if (params.lockerCount > 0) {
      lockerActions.setLockerCount(params.lockerCount);
    }
    if (params.firstPackage) {
      const newPkg: MembershipPackage = {
        id: 'pkg-default-1',
        tenantId: organizationInfo.tenantId,
        branchId: activeBranchId,
        name: params.firstPackage.name || 'عضویت طلایی ماهانه',
        type: '1_month',
        price: params.firstPackage.price || 1500000,
        sessionsCount: params.firstPackage.sessionsCount || 24,
        validityDays: params.firstPackage.validityDays || 30,
        description: 'اشتراک پیش‌فرض باشگاه',
        isActive: true,
      };
      settingsActions.updatePackages([newPkg]);
    }
    if (params.accessPolicy) {
      settingsActions.setAccessPolicyConfig(prev => ({ ...prev, ...params.accessPolicy }));
    }
    settingsActions.setIsInstalled(true);
    settingsActions.setIsDemoMode(false);
  }, [organizationInfo.tenantId, activeBranchId]);

  const enterDemoMode = useCallback(() => {
    settingsActions.setIsDemoMode(true);
    settingsActions.setIsInstalled(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    settingsActions.setIsDemoMode(false);
  }, []);

  const resetToEmptyProduction = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const updateOrganizationInfo = useCallback((info: Partial<OrganizationInfo>) => {
    settingsActions.updateOrganizationInfo(info);
  }, []);

  const saveCustomField = useCallback((field: CustomField) => {
    const existing = customFields;
    const idx = existing.findIndex(f => f.id === field.id);
    let next: CustomField[];
    if (idx >= 0) {
      next = [...existing];
      next[idx] = field;
    } else {
      next = [...existing, field];
    }
    settingsActions.updateCustomFields(next);
  }, [customFields]);

  const deleteCustomField = useCallback((id: string) => {
    settingsActions.updateCustomFields(customFields.filter(f => f.id !== id));
  }, [customFields]);

  const saveMappingProfile = useCallback((profile: ImportMappingProfile) => {
    migrationActions.saveMappingProfile(profile);
  }, []);

  const deleteMappingProfile = useCallback((id: string) => {
    migrationActions.deleteMappingProfile(id);
  }, []);

  const executeMigration = useCallback((
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

    memberActions.batchSet(result.updatedStudents);
    migrationActions.addReport(result.report);
    migrationActions.addSnapshot(result.snapshot);

    const audit = AuditService.createLog(
      currentUser,
      'MIGRATION_COMPLETED',
      'member',
      `مهاجرت داده‌ها از منبع ${options.sourceType} انجام شد: ${result.report.importedCount} عضو جدید، ${result.report.updatedCount} به‌روزرسانی.`
    );
    setAuditLogs(prev => [audit, ...prev]);

    return result.report;
  }, [students, organizationInfo.tenantId, activeBranchId, coaches, currentUser]);

  const rollbackMigration = useCallback((snapshotId: string): boolean => {
    const snapshot = migrationSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    try {
      const restored = MigrationService.rollback(snapshot);
      memberActions.batchSet(restored);
      migrationActions.removeSnapshot(snapshotId);

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
  }, [migrationSnapshots, currentUser]);

  const setLockerCount = useCallback((newCount: number, defaultZone: LockerZone = 'general') => {
    const res = lockerActions.setLockerCount(newCount, defaultZone);
    const audit = AuditService.createLog(
      currentUser,
      'LOCKER_RESIZE',
      'locker',
      `تعداد کل کمدهای سالن به ${newCount} کمد تغییر یافت.`
    );
    setAuditLogs(prev => [audit, ...prev]);
    return res;
  }, [currentUser]);

  const updateDashboardWidgets = useCallback((widgets: DashboardWidgetConfig[]) => {
    settingsActions.updateDashboardWidgets(widgets);
  }, []);

  const toggleFeatureEnabled = useCallback((featureId: NavTab) => {
    settingsActions.updateModuleFeatures(
      moduleFeatures.map(f => f.id === featureId ? { ...f, isEnabled: !f.isEnabled } : f)
    );
  }, [moduleFeatures]);

  const toggleFeaturePinned = useCallback((featureId: NavTab) => {
    settingsActions.updateModuleFeatures(
      moduleFeatures.map(f => f.id === featureId ? { ...f, isPinned: !f.isPinned } : f)
    );
  }, [moduleFeatures]);

  const restoreDefaultFeatures = useCallback(() => {
    settingsActions.updateModuleFeatures(moduleFeatures);
  }, [moduleFeatures]);

  const setActiveBranchId = useCallback((branchId: string) => {
    settingsStore.setState({ activeBranchId: branchId });
  }, []);

  const setCurrentUserRole = useCallback((role: UserRole) => {
    settingsStore.setState({ currentUser: { ...currentUser, role } });
  }, [currentUser]);

  const setIntegrationMode = useCallback((mode: IntegrationMode) => {
    settingsActions.setIntegrationMode(mode);
  }, []);

  const setAccessPolicyConfig = useCallback((config: React.SetStateAction<AccessPolicyConfig>) => {
    settingsActions.setAccessPolicyConfig(config);
  }, []);

  const triggerCloudSync = useCallback(async () => {
    setSyncState('SYNCING');
    const result = await SyncEngine.processQueue();
    setSyncState(SyncEngine.getState());
    setSyncQueue(SyncEngine.getQueue());
    
    const syncAudit = AuditService.createLog(
      currentUser,
      'CLOUD_SYNC_TRIGGERED',
      'setting',
      `همگام‌سازی ابری انجام شد (${result.processedCount} رکورد ارسال شد).`
    );
    setAuditLogs(prev => [syncAudit, ...prev]);
  }, [currentUser]);

  // Coaches CRUD
  const addCoach = useCallback((coachData: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...coachData,
      id: generateUid('coach'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    settingsActions.updateCoaches([newCoach, ...coaches]);
    SyncEngine.enqueue('coach', newCoach.id, 'INSERT', newCoach);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'COACH_ADDED', 'setting', `مربی جدید «${newCoach.fullName}» اضافه شد.`),
      ...prev
    ]);
  }, [coaches, organizationInfo.tenantId, activeBranchId, currentUser]);

  const updateCoach = useCallback((id: string, coachData: Partial<Coach>) => {
    settingsActions.updateCoaches(coaches.map(c => c.id === id ? { ...c, ...coachData } : c));
    SyncEngine.enqueue('coach', id, 'UPDATE', coachData);
  }, [coaches]);

  const deleteCoach = useCallback((id: string) => {
    const coach = coaches.find(c => c.id === id);
    settingsActions.updateCoaches(coaches.filter(c => c.id !== id));
    SyncEngine.enqueue('coach', id, 'DELETE', { id });
    if (coach) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'COACH_DELETED', 'setting', `مربی «${coach.fullName}» حذف شد.`),
        ...prev
      ]);
    }
  }, [coaches, currentUser]);

  // Students CRUD
  const addStudent = useCallback((
    studentData: Omit<Student, 'id' | 'remainingDebt'>,
    initialPayment = 0,
    paymentMethod: PaymentMethod = 'pos'
  ) => {
    const memberNum = studentData.memberNumber || MemberService.calculateNextMemberNumber(students);
    const newStudent = memberActions.addStudent({
      ...studentData,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      memberNumber: memberNum,
    }, initialPayment, paymentMethod);

    SyncEngine.enqueue('student', newStudent.id, 'INSERT', newStudent);

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'STUDENT_REGISTERED', 'member', `ورزشکار جدید «${newStudent.fullName}» (${organizationInfo.memberNumberLabel}: ${memberNum}) ثبت‌نام شد.`),
      ...prev
    ]);
  }, [students, organizationInfo.tenantId, organizationInfo.memberNumberLabel, activeBranchId, currentUser]);

  const updateStudent = useCallback((id: string, studentData: Partial<Student>) => {
    memberActions.updateStudent(id, studentData);
    SyncEngine.enqueue('student', id, 'UPDATE', studentData);
  }, []);

  const deleteStudent = useCallback((id: string) => {
    const student = MemberRepository.getById(id);
    memberActions.deleteStudent(id);
    SyncEngine.enqueue('student', id, 'DELETE', { id });
    if (student) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'STUDENT_DELETED', 'member', `ورزشکار «${student.fullName}» حذف شد.`),
        ...prev
      ]);
    }
  }, [currentUser]);

  const recordStudentPayment = useCallback((
    studentId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    description?: string
  ) => {
    memberActions.recordStudentPayment(studentId, amount, paymentMethod, description);
    const student = MemberRepository.getById(studentId);
    if (student) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'PAYMENT_RECORDED', 'payment', `مبلغ ${formatCurrency(amount, lang)} برای «${student.fullName}» ثبت شد.`),
        ...prev
      ]);
    }
  }, [currentUser, lang]);

  const renewStudentMembership = useCallback((
    studentId: string, 
    packageType: string, 
    totalFee: number, 
    paidAmount: number, 
    paymentMethod: PaymentMethod, 
    newExpireDate: string
  ) => {
    memberActions.renewStudentMembership(studentId, packageType, totalFee, paidAmount, paymentMethod, newExpireDate);
    const student = MemberRepository.getById(studentId);
    if (student) {
      setAuditLogs(prev => [
        AuditService.createLog(currentUser, 'MEMBERSHIP_RENEWED', 'member', `عضویت «${student.fullName}» تمدید شد.`),
        ...prev
      ]);
    }
  }, [currentUser]);

  // Expenses & Payments CRUD
  const addExpense = useCallback((expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense = financeActions.addExpense({
      ...expenseData,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `EXP-${Date.now().toString().slice(-6)}`,
      status: 'completed',
    });
    SyncEngine.enqueue('expense', newExpense.id, 'INSERT', newExpense);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'EXPENSE_RECORDED', 'payment', `هزینه «${newExpense.title}» به مبلغ ${formatCurrency(newExpense.amount, lang)} ثبت شد.`),
      ...prev
    ]);
  }, [organizationInfo.tenantId, activeBranchId, currentUser, lang]);

  const updateExpense = useCallback((id: string, expenseData: Partial<ExpenseRecord>) => {
    financeActions.updateExpense(id, expenseData);
    SyncEngine.enqueue('expense', id, 'UPDATE', expenseData);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    financeActions.deleteExpense(id);
    SyncEngine.enqueue('expense', id, 'DELETE', { id });
  }, []);

  const voidExpense = useCallback((id: string, reason: string) => {
    financeActions.updateExpense(id, { status: 'voided', voidReason: reason });
    SyncEngine.enqueue('expense', id, 'UPDATE', { status: 'voided', voidReason: reason });
  }, []);

  const addPayment = useCallback((paymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment = financeActions.addPayment({
      ...paymentData,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    });
    SyncEngine.enqueue('payment', newPayment.id, 'INSERT', newPayment);
  }, [organizationInfo.tenantId, activeBranchId, currentUser.fullName]);

  const deletePayment = useCallback((id: string) => {
    financeActions.deletePayment(id);
    SyncEngine.enqueue('payment', id, 'DELETE', { id });
  }, []);

  const voidPayment = useCallback((id: string, reason: string) => {
    financeActions.deletePayment(id);
    SyncEngine.enqueue('payment', id, 'UPDATE', { status: 'voided', voidReason: reason });
  }, []);

  // Packages CRUD
  const addPackage = useCallback((pkgData: Omit<MembershipPackage, 'id'>) => {
    const newPkg: MembershipPackage = {
      ...pkgData,
      id: generateUid('pkg'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    settingsActions.updatePackages([...packages, newPkg]);
    SyncEngine.enqueue('package', newPkg.id, 'INSERT', newPkg);
  }, [packages, organizationInfo.tenantId, activeBranchId]);

  const updatePackage = useCallback((id: string, pkgData: Partial<MembershipPackage>) => {
    settingsActions.updatePackages(packages.map(p => p.id === id ? { ...p, ...pkgData } : p));
    SyncEngine.enqueue('package', id, 'UPDATE', pkgData);
  }, [packages]);

  const deletePackage = useCallback((id: string) => {
    settingsActions.updatePackages(packages.filter(p => p.id !== id));
    SyncEngine.enqueue('package', id, 'DELETE', { id });
  }, [packages]);

  // Coach Settlement
  const settleCoachPayment = useCallback((coachId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) return;

    financeActions.settleCoachPayment(coachId, coach.fullName, amount, paymentMethod, notes);

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'COACH_SETTLEMENT', 'payment', `مبلغ ${formatCurrency(amount, lang)} به مربی «${coach.fullName}» پرداخت شد.`),
      ...prev
    ]);
  }, [coaches, currentUser, lang]);

  const getCoachStats = useCallback((coachId: string): CoachFinancialStats => {
    const coach = coaches.find(c => c.id === coachId);
    if (!coach) {
      return { totalStudents: 0, totalGeneratedRevenue: 0, totalCoachShare: 0, totalClubShare: 0, totalPaidOut: 0, remainingBalance: 0 };
    }

    const coachStudents = students.filter(s => s.coachId === coachId);
    const totalGeneratedRevenue = coachStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const rate = (coach.commissionRate || 0) / 100;
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
  }, [coaches, students, expenses]);

  // Access Evaluation & Check-in
  const evaluateMemberAccess = useCallback((studentId: string): AccessDecision => {
    const student = MemberRepository.getById(studentId);
    return AccessPolicyEngine.evaluate(student, packages, accessPolicyConfig);
  }, [packages, accessPolicyConfig]);

  const checkInStudent = useCallback((
    studentId: string, 
    lockerNumber?: number, 
    method: AttendanceRecord['method'] = 'manual'
  ) => {
    return attendanceActions.checkInStudent(studentId, lockerNumber, method);
  }, []);

  // Smart Lockers
  const addLocker = useCallback((lockerData: Omit<SmartLocker, 'id'>) => {
    const newLocker: SmartLocker = {
      ...lockerData,
      id: generateUid('lck'),
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
    };
    lockerActions.batchSet([...smartLockers, newLocker].sort((a, b) => a.number - b.number));
  }, [smartLockers, organizationInfo.tenantId, activeBranchId]);

  const updateLocker = useCallback((id: string, lockerData: Partial<SmartLocker>) => {
    lockerActions.batchSet(smartLockers.map(l => l.id === id ? { ...l, ...lockerData } : l));
  }, [smartLockers]);

  const deleteLocker = useCallback((id: string) => {
    lockerActions.batchSet(smartLockers.filter(l => l.id !== id));
  }, [smartLockers]);

  const openLocker = useCallback(async (lockerNumber: number, reason = 'بازگشایی از پذیرش'): Promise<boolean> => {
    const timestamp = new Date().toISOString();
    lockerActions.batchSet(smartLockers.map(l => l.number === lockerNumber ? {
      ...l,
      isLocked: false,
      lastUnlockedAt: timestamp,
    } : l));

    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'LOCKER_OPENED', 'locker', `کمد شماره #${lockerNumber} بازگشایی شد (${reason}).`),
      ...prev
    ]);
    return true;
  }, [smartLockers, currentUser]);

  const releaseLocker = useCallback((lockerNumber: number) => {
    lockerActions.releaseLocker(lockerNumber);
    setAuditLogs(prev => [
      AuditService.createLog(currentUser, 'LOCKER_RELEASED', 'locker', `کمد شماره #${lockerNumber} آزاد شد.`),
      ...prev
    ]);
  }, [currentUser]);

  const assignLocker = useCallback((lockerNumber: number, studentId: string): boolean => {
    return lockerActions.assignLocker(lockerNumber, studentId);
  }, []);

  const toggleLockerMaintenance = useCallback((lockerNumber: number) => {
    lockerActions.toggleMaintenance(lockerNumber);
  }, []);

  const triggerMasterUnlock = useCallback((reason = 'بازگشایی اضطراری کلیه کمدها') => {
    const updated = LockerEngine.masterEmergencyUnlockAll(smartLockers);
    lockerActions.batchSet(updated);

    const audit = AuditService.createLog(
      currentUser,
      'MASTER_LOCKER_UNLOCK_EMERGENCY',
      'locker',
      `هشدار: بازگشایی سراسری تمام ${smartLockers.length} کمد توسط ${currentUser.fullName} اجرا شد. دلیل: ${reason}`
    );
    setAuditLogs(prev => [audit, ...prev]);
  }, [smartLockers, currentUser]);

  const simulateIdentityScan = useCallback((
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
      const checkInRes = checkInStudent(matchedStudent.id, undefined, 'rfid_wristband');
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
  }, [students, evaluateMemberAccess, checkInStudent]);

  const toggleDeviceOnline = useCallback((deviceId: string) => {
    hardwareActions.toggleDeviceOnline(deviceId);
  }, []);

  const testRelayPulse = useCallback(async (deviceId: string): Promise<{ success: boolean; latency: number }> => {
    return hardwareActions.testRelayPulse(deviceId);
  }, []);

  // Workout & Diet
  const saveWorkoutPlan = useCallback((plan: WorkoutPlan) => {
    setWorkoutPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      const copy = idx >= 0 ? [...prev] : [plan, ...prev];
      if (idx >= 0) copy[idx] = plan;
      PersistenceManager.setBatched('workout_plans', copy);
      return copy;
    });
  }, []);

  const deleteWorkoutPlan = useCallback((id: string) => {
    setWorkoutPlans(prev => {
      const next = prev.filter(p => p.id !== id);
      PersistenceManager.setBatched('workout_plans', next);
      return next;
    });
  }, []);

  const saveDietPlan = useCallback((plan: DietPlan) => {
    setDietPlans(prev => {
      const idx = prev.findIndex(p => p.id === plan.id);
      const copy = idx >= 0 ? [...prev] : [plan, ...prev];
      if (idx >= 0) copy[idx] = plan;
      PersistenceManager.setBatched('diet_plans', copy);
      return copy;
    });
  }, []);

  const deleteDietPlan = useCallback((id: string) => {
    setDietPlans(prev => {
      const next = prev.filter(p => p.id !== id);
      PersistenceManager.setBatched('diet_plans', next);
      return next;
    });
  }, []);

  // Backup & Restore
  const exportDatabaseJson = useCallback(() => {
    const backupStr = PersistenceManager.exportFullBackup();
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-os-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importDatabaseJson = useCallback((jsonString: string): boolean => {
    const res = PersistenceManager.importFullBackup(jsonString);
    if (res.success) {
      window.location.reload();
      return true;
    }
    return false;
  }, []);

  const resetToSampleData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  const formatMoney = useCallback((amt: number) => formatCurrency(amt, lang), [lang]);
  const formatNum = useCallback((num: number) => formatNumber(num, lang), [lang]);

  const value = useMemo<AppContextType>(() => ({
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
  }), [
    lang,
    theme,
    toggleTheme,
    setTheme,
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
    formatMoney,
    formatNum,
  ]);

  return (
    <AppContext.Provider value={value}>
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

export const useAppContext = useApp;
