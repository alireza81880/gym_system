import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
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
  initialAccessLogs, 
} from '../data/initialData';
import { translations, formatCurrency, formatNumber } from '../i18n/translations';
import { AccessPolicyConfig } from '../services/accessPolicyService';
import { AuditService } from '../services/auditService';
import { SyncEngine } from '../services/syncService';
import { 
  ImportValidationItem,
  ImportMode,
  HistoricalMigrationScope,
  CurrencyUnit,
  MigrationProgressState
} from '../services/migrationService';
import { MemberRepository } from '../services/repositories/memberRepository';
import { PaymentRepository } from '../services/repositories/paymentRepository';
import { AttendanceRepository } from '../services/repositories/attendanceRepository';
import { HardwareRepository } from '../services/repositories/hardwareRepository';
import { LockerRepository } from '../services/repositories/lockerRepository';
import { MembershipRepository } from '../services/repositories/membershipRepository';
import { ChargeRepository } from '../services/repositories/chargeRepository';
import { AuditRepository } from '../services/repositories/auditRepository';
import { PersistenceManager } from '../services/repositories/persistenceManager';
import { LocalDatabase } from '../services/database/localDatabase';
import { PerformanceDiagnostics } from '../services/diagnostics/performanceMetrics';
import { SetupService, InitialSetupInput, QuickSetupInput, SetupResult } from '../services/setupService';
import { FinanceService } from '../services/finance/financeService';
import { LocalDbRepository } from '../services/localDb';
import { useMemberStore, memberActions } from '../stores/memberStore';
import { useFinanceStore, financeActions, notifyFinanceChange } from '../stores/financeStore';
import { useAttendanceStore, attendanceActions, ScanResult } from '../stores/attendanceStore';
import { useHardwareStore, hardwareActions } from '../stores/hardwareStore';
import { useLockerStore, lockerActions } from '../stores/lockerStore';
import { useSettingsStore, settingsActions, settingsStore, defaultOrganizationInfo, initialBranches, CoachFinancialStats } from '../stores/settingsStore';
import { useThemeStore, themeActions } from '../stores/themeStore';
import { useMigrationStore, migrationActions } from '../stores/migrationStore';
import { usePlanStore, planActions } from '../stores/planStore';

export type { ScanResult, CoachFinancialStats };

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
  }) => SetupResult;
  completeQuickSetup: (input: QuickSetupInput) => SetupResult;
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
    options: { 
      sourceType: string; 
      fileName?: string;
      importMode?: ImportMode;
      scope?: HistoricalMigrationScope;
      currencyUnit?: CurrencyUnit;
      preserveMemberNumbers?: boolean;
      defaultCoachId?: string;
    },
    onProgress?: (progress: MigrationProgressState) => void
  ) => Promise<MigrationReport>;
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
  addHardwareDevice: (device: HardwareDevice) => void;
  updateHardwareDevice: (id: string, updates: Partial<HardwareDevice>) => void;
  removeHardwareDevice: (id: string) => void;
  
  // Workout & Diet
  saveWorkoutPlan: (plan: WorkoutPlan) => void;
  deleteWorkoutPlan: (id: string) => void;
  saveDietPlan: (plan: DietPlan) => void;
  deleteDietPlan: (id: string) => void;
  
  // Backups & Reset
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => Promise<any> | any;
  resetToSampleData: () => void;
  exportAllDataAsJson: () => void;
  importDataFromJson: (jsonString: string) => Promise<any> | any;
  resetToInitialData: () => void;
  
  // Helpers
  formatMoney: (amount: number) => string;
  formatNum: (num: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Bootstrap & Cross-Cutting Global States
  const [lang, setLang] = useState<Language>('fa');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [accessLogs] = useState<AccessLog[]>(() => PersistenceManager.get('access_logs', initialAccessLogs));
  const [auditLogs] = useState<AuditLog[]>(() => PersistenceManager.get('audit_logs', []));
  const [syncState, setSyncState] = useState<SyncState>('ONLINE');
  const [syncQueue, setSyncQueue] = useState<SyncJob[]>([]);
  const [pilotComparisonLogs] = useState<PilotComparisonLog[]>([]);

  // Domain Store Selectors
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
  const dashboardWidgets = useSettingsStore(s => s.dashboardWidgets);
  const moduleFeatures = useSettingsStore(s => s.moduleFeatures);
  const integrationMode = useSettingsStore(s => s.integrationMode);
  const accessPolicyConfig = useSettingsStore(s => s.accessPolicyConfig);

  const memberVersion = useMemberStore(s => s.version);
  const students = useMemo(() => MemberRepository.getAll(), [memberVersion]);

  const financeVersion = useFinanceStore(s => s.version);
  const payments = useMemo(() => PaymentRepository.getAllPayments(), [financeVersion]);
  const expenses = useMemo(() => PaymentRepository.getAllExpenses(), [financeVersion]);

  const attendanceVersion = useAttendanceStore(s => s.version);
  const attendance = useMemo(() => AttendanceRepository.getAll(), [attendanceVersion]);

  const lockerVersion = useLockerStore(s => s.version);
  const smartLockers = useMemo(() => LockerRepository.getAll(), [lockerVersion]);

  const hardwareVersion = useHardwareStore(s => s.version);
  const hardwareDevices = useMemo(() => HardwareRepository.getDevices(), [hardwareVersion]);
  const hardwareEvents = useMemo(() => HardwareRepository.getRecentEvents(100), [hardwareVersion]);

  const workoutPlans = usePlanStore(s => s.workoutPlans);
  const dietPlans = usePlanStore(s => s.dietPlans);

  const mappingProfiles = useMigrationStore(s => s.mappingProfiles);
  const migrationReports = useMigrationStore(s => s.migrationReports);
  const migrationSnapshots = useMigrationStore(s => s.migrationSnapshots);

  // App Initialization
  useEffect(() => {
    try {
      LocalDatabase.initialize();
      const summary = PerformanceDiagnostics.getSummary();
      console.log('[LocalDataCore] Production Database Initialized:', summary);
    } catch (err) {
      console.error('[LocalDataCore] Initialization error:', err);
    }
  }, []);

  // Sync state listener
  useEffect(() => {
    const unsub = SyncEngine.subscribe(state => {
      setSyncState(state.syncState);
      setSyncQueue(state.queue);
    });
    return unsub;
  }, []);

  // I18n & Theme toggles
  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === 'fa' ? 'en' : 'fa'));
  }, []);

  const toggleTheme = useCallback(() => {
    themeActions.toggleTheme();
  }, []);

  const setTheme = useCallback((t: Theme) => {
    themeActions.setTheme(t);
  }, []);

  const setActiveThemeKey = useCallback((key: ThemeKey) => {
    themeActions.setActiveThemeKey(key);
  }, []);

  const t = useMemo(() => {
    return translations[lang] || translations.fa;
  }, [lang]);

  const formatMoney = useCallback((amount: number) => {
    return formatCurrency(amount, lang);
  }, [lang]);

  const formatNum = useCallback((num: number) => {
    return formatNumber(num, lang);
  }, [lang]);

  // Feature Toggles
  const toggleFeatureEnabled = useCallback((featureId: NavTab) => {
    const next = moduleFeatures.map(f => f.id === featureId ? { ...f, isEnabled: !f.isEnabled } : f);
    settingsActions.updateModuleFeatures(next);
  }, [moduleFeatures]);

  const toggleFeaturePinned = useCallback((featureId: NavTab) => {
    const next = moduleFeatures.map(f => f.id === featureId ? { ...f, isPinned: !f.isPinned } : f);
    settingsActions.updateModuleFeatures(next);
  }, [moduleFeatures]);

  const restoreDefaultFeatures = useCallback(() => {
    import('../data/featureModules').then(({ initialModuleFeatures }) => {
      settingsActions.updateModuleFeatures(initialModuleFeatures);
    });
  }, []);

  // Installation & Demo Sandbox Handlers
  const completeInstallation = useCallback((params: {
    orgData: Partial<OrganizationInfo>;
    lockerCount: number;
    lockerZones?: string;
    firstPackage?: Partial<MembershipPackage>;
    accessPolicy?: Partial<AccessPolicyConfig>;
    ownerData: { fullName: string; phone: string; username?: string };
  }): SetupResult => {
    return SetupService.completeInitialInstallation({
      orgData: {
        name: params.orgData.name || '',
        managerName: params.orgData.managerName || '',
        managerMobile: params.orgData.managerMobile || '',
        city: params.orgData.city,
        address: params.orgData.address,
        phone: params.orgData.phone,
        currency: params.orgData.currency,
        memberNumberLabel: params.orgData.memberNumberLabel,
      },
      lockerCount: params.lockerCount,
      lockerZones: params.lockerZones,
      firstPackage: params.firstPackage ? {
        name: params.firstPackage.name || '',
        price: Number(params.firstPackage.price) || 0,
        sessionsCount: params.firstPackage.sessionsCount,
        validityDays: params.firstPackage.validityDays,
        durationDays: (params.firstPackage as any).durationDays,
        type: params.firstPackage.type,
      } : undefined,
      accessPolicy: params.accessPolicy,
      ownerData: params.ownerData,
    });
  }, []);

  const completeQuickSetup = useCallback((input: QuickSetupInput): SetupResult => {
    return SetupService.completeQuickSetup(input);
  }, []);

  const enterDemoMode = useCallback(() => {
    settingsActions.setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    settingsActions.setIsDemoMode(false);
  }, []);

  const resetToEmptyProduction = useCallback(async () => {
    // 1. Reset all repository indexes & in-memory caches
    MemberRepository.reset([]);
    PaymentRepository.reset([], []);
    MembershipRepository.reset([]);
    ChargeRepository.reset([]);
    AttendanceRepository.reset([]);
    LockerRepository.reset([], []);
    HardwareRepository.reset([], []);
    AuditRepository.reset([]);

    // 2. Clear all Zustand domain stores
    memberActions.batchSet([]);
    financeActions.batchSet([], []);
    attendanceActions.batchSet([]);
    lockerActions.batchSet([]);
    notifyFinanceChange();
    
    // 3. Clear settings domain records
    settingsStore.setState({
      packages: [],
      coaches: [],
      customFields: [],
      organizationInfo: defaultOrganizationInfo,
      branches: initialBranches,
      activeBranchId: initialBranches[0]?.id || 'branch-main',
      isInstalled: false,
      isDemoMode: false,
    });

    // 4. Synchronously persist empty states to storage
    PersistenceManager.setImmediate('students', []);
    PersistenceManager.setImmediate('payments', []);
    PersistenceManager.setImmediate('expenses', []);
    PersistenceManager.setImmediate('memberships', []);
    PersistenceManager.setImmediate('charges', []);
    PersistenceManager.setImmediate('smart_lockers', []);
    PersistenceManager.setImmediate('attendance', []);
    PersistenceManager.setImmediate('coaches', []);
    PersistenceManager.setImmediate('packages', []);
    PersistenceManager.setImmediate('custom_fields', []);
    PersistenceManager.setImmediate('organization_info', defaultOrganizationInfo);
    PersistenceManager.setImmediate('branches', initialBranches);
    PersistenceManager.setImmediate('active_branch_id', initialBranches[0]?.id || 'branch-main');
    PersistenceManager.setImmediate('hardware_devices', []);
    PersistenceManager.setImmediate('hardware_events', []);
    PersistenceManager.setImmediate('audit_logs', []);
    PersistenceManager.setImmediate('locker_assignments_history', []);
    PersistenceManager.setImmediate('gym_installed', false);
    PersistenceManager.setImmediate('gym_demo_mode', false);
    PersistenceManager.setImmediate('gym_onboarding_completed', false);

    LocalDbRepository.setMetadata({
      schemaVersion: LocalDbRepository.getSchemaVersion(),
      isInstalled: false,
      isDemoMode: false,
      tenantId: defaultOrganizationInfo.tenantId,
      initializedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    });

    // 5. Clear SQLite relational database tables
    try {
      const adapter = LocalDatabase.getAdapter();
      const tables = [
        'members', 
        'memberships', 
        'packages', 
        'payments', 
        'charges', 
        'expenses', 
        'attendance', 
        'lockers', 
        'coaches', 
        'settings', 
        'hardware_devices', 
        'hardware_events'
      ];
      for (const t of tables) {
        try {
          await adapter.clear(t);
        } catch {}
      }
    } catch (err) {
      console.warn('[AppContext] SQLite reset warning:', err);
    }

    AuditService.logEvent({
      action: 'SYSTEM_RESET_PRODUCTION',
      details: 'تمام اطلاعات عملیاتی، اعضا، بسته‌ها و سوابق مالی سیستم با موفقیت پاکسازی شد.',
      userName: currentUser.fullName,
    });

    settingsActions.setIsInstalled(false);
    settingsActions.setIsDemoMode(false);
  }, [currentUser.fullName]);

  const resetToSampleData = useCallback(() => {
    memberActions.restoreSampleData();
    AuditService.logEvent({
      action: 'DATA_RESTORED_SAMPLE',
      category: 'system',
      details: 'داده‌های تستی نمونه سیستم بازیابی شد.',
      userName: currentUser.fullName,
    });
  }, [currentUser.fullName]);

  // Database Backup / Import
  const exportDatabaseJson = useCallback(() => {
    const json = PersistenceManager.exportFullBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importDatabaseJson = useCallback(async (jsonString: string) => {
    const result = PersistenceManager.importFullBackup(jsonString);
    if (result.success && result.payload) {
      const payload = result.payload;

      // 1. Reset all repositories with the restored data
      MemberRepository.reset(payload.students);
      PaymentRepository.reset(payload.payments, payload.expenses);
      MembershipRepository.reset(payload.memberships);
      ChargeRepository.reset(payload.charges);
      AttendanceRepository.reset(payload.attendance);
      LockerRepository.reset(payload.lockers, payload.lockerAssignments || []);
      HardwareRepository.reset(payload.hardwareDevices || [], payload.hardwareEvents || []);
      AuditRepository.reset(payload.auditLogs || []);

      // 2. Update React Zustand domain stores
      memberActions.batchSet(payload.students);
      financeActions.batchSet(payload.payments, payload.expenses);
      attendanceActions.batchSet(payload.attendance);
      lockerActions.batchSet(payload.lockers);

      // 3. Update settings store
      const currentSettings = settingsStore.getState();
      const newOrgInfo = payload.organizationInfo || currentSettings.organizationInfo;
      const newBranches = (payload.branches && payload.branches.length > 0) ? payload.branches : currentSettings.branches;
      const newActiveBranchId = payload.activeBranchId || newBranches[0]?.id || currentSettings.activeBranchId;
      const newPackages = (payload.packages && payload.packages.length > 0) ? payload.packages : currentSettings.packages;
      const newCoaches = (payload.coaches && payload.coaches.length > 0) ? payload.coaches : currentSettings.coaches;
      const newCustomFields = payload.customFields || currentSettings.customFields;
      const newAccessPolicy = payload.accessPolicyConfig || currentSettings.accessPolicyConfig;
      const newDashboardWidgets = payload.dashboardWidgets || currentSettings.dashboardWidgets;
      const newModuleFeatures = payload.moduleFeatures || currentSettings.moduleFeatures;

      settingsStore.setState({
        organizationInfo: newOrgInfo,
        branches: newBranches,
        activeBranchId: newActiveBranchId,
        packages: newPackages,
        coaches: newCoaches,
        customFields: newCustomFields,
        accessPolicyConfig: newAccessPolicy,
        dashboardWidgets: newDashboardWidgets,
        moduleFeatures: newModuleFeatures,
        isInstalled: true,
        isDemoMode: false,
      });

      // Persist restored settings to local storage immediately
      PersistenceManager.setImmediate('packages', newPackages);
      PersistenceManager.setImmediate('branches', newBranches);
      PersistenceManager.setImmediate('active_branch_id', newActiveBranchId);
      PersistenceManager.setImmediate('coaches', newCoaches);
      PersistenceManager.setImmediate('organization_info', newOrgInfo);
      PersistenceManager.setImmediate('custom_fields', newCustomFields);
      PersistenceManager.setImmediate('access_policy_config', newAccessPolicy);
      if (newDashboardWidgets) PersistenceManager.setImmediate('dashboard_widgets', newDashboardWidgets);
      if (newModuleFeatures) PersistenceManager.setImmediate('module_features', newModuleFeatures);

      // 4. Trigger authoritative post-restore Financial Reconciliation
      try {
        FinanceService.reconcileAllFinancials();
        // Update members store with reconciled balance calculations
        memberActions.batchSet(MemberRepository.getAll());
        // Notify finance store to recompute summary and KPIs
        notifyFinanceChange();
      } catch (finErr) {
        console.warn('[AppContext] Post-restore finance reconciliation warning:', finErr);
      }

      // 5. Sync with SQLite database
      try {
        const adapter = LocalDatabase.getAdapter();
        await adapter.importSnapshot({
          schemaVersion: 3,
          members: MemberRepository.getAll(),
          packages: newPackages,
          memberships: payload.memberships,
          charges: ChargeRepository.getAll(),
          payments: payload.payments,
          expenses: payload.expenses,
          attendance: payload.attendance,
          lockers: payload.lockers,
          coaches: newCoaches,
          settings: newOrgInfo,
          hardware_devices: payload.hardwareDevices || [],
          hardware_events: payload.hardwareEvents || [],
        });
      } catch (err) {
        console.warn('[AppContext] SQLite sync after import warning:', err);
      }

      AuditService.logEvent({
        action: 'DATA_RESTORED_BACKUP',
        category: 'system',
        details: `پشتیبان سیستم با موفقیت بازیابی شد (${payload.students.length} عضو، ${payload.payments.length} پرداخت، ${payload.packages.length} بسته، ${payload.charges.length} صورت‌حساب).`,
        userName: currentUser.fullName,
      });

      return {
        success: true,
        counts: payload.counts,
        message: result.message
      };
    }
    return {
      success: false,
      message: result.message || 'خطا در بازیابی اطلاعات'
    };
  }, [currentUser.fullName]);


  // Async Cloud Sync
  const triggerCloudSync = useCallback(async () => {
    setSyncState('SYNCING');
    try {
      await SyncEngine.syncNow();
      setSyncState('ONLINE');
    } catch {
      setSyncState('OFFLINE');
    }
  }, []);

  // Direct delegation to domain stores
  const openLocker = useCallback(async (lockerNumber: number, reason?: string) => {
    return lockerActions.openLocker(lockerNumber, reason, currentUser.fullName);
  }, [currentUser.fullName]);

  const value: AppContextType = useMemo(() => ({
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
    completeQuickSetup,
    enterDemoMode,
    exitDemoMode,
    resetToEmptyProduction,
    organizationInfo,
    updateOrganizationInfo: settingsActions.updateOrganizationInfo,
    customFields,
    saveCustomField: settingsActions.saveCustomField,
    deleteCustomField: settingsActions.deleteCustomField,
    mappingProfiles,
    saveMappingProfile: migrationActions.saveMappingProfile,
    deleteMappingProfile: migrationActions.deleteMappingProfile,
    migrationReports,
    migrationSnapshots,
    executeMigration: migrationActions.executeMigration.bind(migrationActions),
    rollbackMigration: migrationActions.rollbackMigration.bind(migrationActions),
    dashboardWidgets,
    updateDashboardWidgets: settingsActions.updateDashboardWidgets,
    activeTab,
    setActiveTab,
    moduleFeatures,
    toggleFeatureEnabled,
    toggleFeaturePinned,
    restoreDefaultFeatures,
    activeBranchId,
    setActiveBranchId: settingsActions.setActiveBranchId,
    branches,
    currentUser,
    setCurrentUserRole: settingsActions.setCurrentUserRole,
    integrationMode,
    setIntegrationMode: settingsActions.setIntegrationMode,
    accessPolicyConfig,
    setAccessPolicyConfig: settingsActions.setAccessPolicyConfig,
    coaches,
    students,
    payments,
    expenses,
    attendance,
    workoutPlans,
    dietPlans,
    smartLockers,
    setLockerCount: lockerActions.setLockerCount,
    hardwareDevices,
    hardwareEvents,
    pilotComparisonLogs,
    accessLogs,
    auditLogs,
    packages,
    syncState,
    syncQueue,
    triggerCloudSync,
    addCoach: (c) => settingsActions.addCoach(c, currentUser.fullName),
    updateCoach: settingsActions.updateCoach,
    deleteCoach: (id) => settingsActions.deleteCoach(id, currentUser.fullName),
    addStudent: memberActions.addStudent,
    updateStudent: memberActions.updateStudent,
    deleteStudent: memberActions.deleteStudent,
    recordStudentPayment: memberActions.recordStudentPayment,
    renewStudentMembership: memberActions.renewStudentMembership,
    addExpense: (e) => financeActions.addExpense({
      ...e,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `EXP-${Date.now().toString().slice(-6)}`,
      status: 'completed',
    }),
    updateExpense: financeActions.updateExpense,
    deleteExpense: financeActions.deleteExpense,
    voidExpense: (id, reason) => financeActions.updateExpense(id, { status: 'voided', voidReason: reason }),
    addPayment: (p) => financeActions.addPayment({
      ...p,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: currentUser.fullName,
      status: 'completed',
    }),
    deletePayment: financeActions.deletePayment,
    voidPayment: (id, reason) => financeActions.deletePayment(id),
    addPackage: settingsActions.addPackage,
    updatePackage: settingsActions.updatePackage,
    deletePackage: settingsActions.deletePackage,
    settleCoachPayment: (coachId, amount, paymentMethod, notes) => {
      const coach = coaches.find(c => c.id === coachId);
      if (!coach) return;
      financeActions.settleCoachPayment(coachId, coach.fullName, amount, paymentMethod, notes);
    },
    getCoachStats: settingsActions.getCoachStats,
    evaluateMemberAccess: attendanceActions.evaluateMemberAccess,
    checkInStudent: attendanceActions.checkInStudent,
    addLocker: lockerActions.addLocker,
    updateLocker: lockerActions.updateLocker,
    deleteLocker: lockerActions.deleteLocker,
    openLocker,
    releaseLocker: (num) => lockerActions.releaseLocker(num, currentUser.fullName),
    assignLocker: lockerActions.assignLocker,
    toggleLockerMaintenance: lockerActions.toggleMaintenance,
    triggerMasterUnlock: (reason) => lockerActions.triggerMasterUnlock(reason, currentUser.fullName),
    simulateIdentityScan: attendanceActions.simulateIdentityScan.bind(attendanceActions),
    toggleDeviceOnline: hardwareActions.toggleDeviceOnline,
    testRelayPulse: hardwareActions.testRelayPulse,
    addHardwareDevice: hardwareActions.addDevice,
    updateHardwareDevice: hardwareActions.updateDevice,
    removeHardwareDevice: hardwareActions.removeDevice,
    saveWorkoutPlan: planActions.saveWorkoutPlan,
    deleteWorkoutPlan: planActions.deleteWorkoutPlan,
    saveDietPlan: planActions.saveDietPlan,
    deleteDietPlan: planActions.deleteDietPlan,
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
    completeQuickSetup,
    enterDemoMode,
    exitDemoMode,
    resetToEmptyProduction,
    organizationInfo,
    customFields,
    mappingProfiles,
    migrationReports,
    migrationSnapshots,
    dashboardWidgets,
    activeTab,
    setActiveTab,
    moduleFeatures,
    toggleFeatureEnabled,
    toggleFeaturePinned,
    restoreDefaultFeatures,
    activeBranchId,
    branches,
    currentUser,
    integrationMode,
    accessPolicyConfig,
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
    openLocker,
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
