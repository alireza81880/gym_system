import { createStore, useStore } from './createStore';
import { 
  OrganizationInfo, 
  StaffUser, 
  Branch, 
  CustomField, 
  MembershipPackage, 
  Coach, 
  DashboardWidgetConfig, 
  ModuleFeature, 
  IntegrationMode, 
  AccessPolicyConfig,
  UserRole,
  PaymentMethod,
} from '../types';
import { initialCoaches, initialPackages } from '../data/initialData';
import { initialModuleFeatures } from '../data/featureModules';
import { defaultAccessPolicyConfig } from '../services/accessPolicyService';
import { PersistenceManager } from '../services/repositories/persistenceManager';
import { AuditService } from '../services/auditService';
import { SyncEngine } from '../services/syncService';
import { MemberRepository } from '../services/repositories/memberRepository';
import { PaymentRepository } from '../services/repositories/paymentRepository';
import { MembershipRepository } from '../services/repositories/membershipRepository';
import { ChargeRepository } from '../services/repositories/chargeRepository';
import { PackageRepository } from '../services/repositories/packageRepository';
import { DateService } from '../services/dateService';
import { financeActions } from './financeStore';
import { AuthService } from '../services/auth/authService';
import { RBACService } from '../services/rbacService';


export const defaultOrganizationInfo: OrganizationInfo = {
  id: 'org-main',
  tenantId: 'gym-org-1',
  name: 'باشگاه بدنسازی و تندرستی',
  managerName: 'مدیریت باشگاه',
  managerMobile: '',
  city: 'تهران',
  address: '',
  phone: '',
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

export const defaultCustomFields: CustomField[] = [
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

export const defaultDashboardWidgets: DashboardWidgetConfig[] = [
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

export const initialBranches: Branch[] = [
  {
    id: 'branch-main',
    tenantId: 'gym-org-1',
    name: 'شعبه مرکزی',
    code: 'MAIN-01',
    city: 'تهران',
    address: '',
    phone: '',
    managerName: 'مدیریت باشگاه',
    isMain: true,
    isActive: true,
  },
];

export interface SettingsState {
  isInstalled: boolean;
  isDemoMode: boolean;
  organizationInfo: OrganizationInfo;
  currentUser: StaffUser;
  branches: Branch[];
  activeBranchId: string;
  customFields: CustomField[];
  packages: MembershipPackage[];
  coaches: Coach[];
  accessPolicyConfig: AccessPolicyConfig;
  dashboardWidgets: DashboardWidgetConfig[];
  moduleFeatures: ModuleFeature[];
  integrationMode: IntegrationMode;
}

const getInitialStorePackages = (): MembershipPackage[] => {
  try {
    PackageRepository.initialize();
    const repoPackages = PackageRepository.getAll({ includeArchived: true });
    if (repoPackages.length > 0) return repoPackages;
    if (PersistenceManager.hasKey('packages')) {
      const raw = PersistenceManager.get<MembershipPackage[]>('packages', []);
      if (Array.isArray(raw)) return raw;
    }
  } catch {}
  if (!PersistenceManager.hasKey('gym_db_initialized') && !PersistenceManager.hasKey('packages')) {
    return initialPackages;
  }
  return [];
};

export const settingsStore = createStore<SettingsState>({
  isInstalled: PersistenceManager.get<boolean>('gym_installed', true),
  isDemoMode: PersistenceManager.get<boolean>('gym_demo_mode', false),
  organizationInfo: PersistenceManager.get<OrganizationInfo>('organization_info', defaultOrganizationInfo),
  currentUser: AuthService.getCurrentUser(),
  branches: PersistenceManager.get<Branch[]>('branches', initialBranches),
  activeBranchId: PersistenceManager.get<Branch[]>('branches', initialBranches)[0]?.id || 'branch-main',
  customFields: PersistenceManager.get<CustomField[]>('custom_fields', defaultCustomFields),
  packages: getInitialStorePackages(),
  coaches: PersistenceManager.get<Coach[]>('coaches', initialCoaches),
  accessPolicyConfig: PersistenceManager.get<AccessPolicyConfig>('access_policy_config', defaultAccessPolicyConfig),
  dashboardWidgets: PersistenceManager.get<DashboardWidgetConfig[]>('dashboard_widgets', defaultDashboardWidgets),
  moduleFeatures: PersistenceManager.get<ModuleFeature[]>('module_features', initialModuleFeatures),
  integrationMode: PersistenceManager.get<IntegrationMode>('integration_mode', 'shadow'),
});

// Auto-sync settingsStore currentUser whenever AuthService session updates
AuthService.subscribe((session) => {
  if (session && session.user) {
    settingsStore.setState({ currentUser: session.user });
  }
});

// Ensure initial settings domain records are durably present in storage only on clean setup
if (!PersistenceManager.hasKey('packages') && !PersistenceManager.hasKey('gym_db_initialized')) {
  PersistenceManager.setImmediate('packages', initialPackages);
}
if (!PersistenceManager.hasKey('branches')) {
  PersistenceManager.setImmediate('branches', initialBranches);
}
if (!PersistenceManager.hasKey('active_branch_id')) {
  PersistenceManager.setImmediate('active_branch_id', initialBranches[0]?.id || 'branch-main');
}
if (!PersistenceManager.hasKey('coaches')) {
  PersistenceManager.setImmediate('coaches', initialCoaches);
}
if (!PersistenceManager.hasKey('organization_info')) {
  PersistenceManager.setImmediate('organization_info', defaultOrganizationInfo);
}
if (!PersistenceManager.hasKey('custom_fields')) {
  PersistenceManager.setImmediate('custom_fields', defaultCustomFields);
}
if (!PersistenceManager.hasKey('access_policy_config')) {
  PersistenceManager.setImmediate('access_policy_config', defaultAccessPolicyConfig);
}
if (!PersistenceManager.hasKey('dashboard_widgets')) {
  PersistenceManager.setImmediate('dashboard_widgets', defaultDashboardWidgets);
}
if (!PersistenceManager.hasKey('module_features')) {
  PersistenceManager.setImmediate('module_features', initialModuleFeatures);
}

export interface CoachFinancialStats {
  totalStudents: number;
  totalGeneratedRevenue: number;
  totalCoachShare: number;
  totalClubShare: number;
  totalPaidOut: number;
  remainingBalance: number;
}

export const settingsActions = {
  updateOrganizationInfo(partial: Partial<OrganizationInfo>): void {
    const currentState = settingsStore.getState();
    const updated = { ...currentState.organizationInfo, ...partial };
    
    // Automatically keep the primary branch in sync with the updated organization identity
    const currentBranches = currentState.branches.length > 0 ? currentState.branches : initialBranches;
    const updatedBranches = currentBranches.map(branch => {
      if (branch.isMain || currentBranches.length === 1) {
        return {
          ...branch,
          tenantId: updated.tenantId || branch.tenantId,
          name: updated.name ? `${updated.name} (${updated.city || 'مرکزی'})` : branch.name,
          city: updated.city || branch.city,
          address: updated.address !== undefined ? updated.address : branch.address,
          phone: updated.phone !== undefined ? updated.phone : branch.phone,
          managerName: updated.managerName !== undefined ? updated.managerName : branch.managerName,
        };
      }
      return branch;
    });

    settingsStore.setState({ 
      organizationInfo: updated,
      branches: updatedBranches,
    });
    PersistenceManager.setImmediate('organization_info', updated);
    PersistenceManager.setImmediate('branches', updatedBranches);
    SyncEngine.enqueue('organization_info', updated.id || 'org-main', 'UPDATE', updated);
  },

  updateBranch(branchId: string, partial: Partial<Branch>): void {
    const currentState = settingsStore.getState();
    const updatedBranches = currentState.branches.map(b => {
      if (b.id === branchId) {
        return { ...b, ...partial };
      }
      return b;
    });
    settingsStore.setState({ branches: updatedBranches });
    PersistenceManager.setImmediate('branches', updatedBranches);
  },

  saveCustomField(field: CustomField): void {
    const existing = settingsStore.getState().customFields;
    const idx = existing.findIndex(f => f.id === field.id);
    let next: CustomField[];
    if (idx >= 0) {
      next = [...existing];
      next[idx] = field;
    } else {
      next = [...existing, field];
    }
    settingsStore.setState({ customFields: next });
    PersistenceManager.setBatched('custom_fields', next);
  },

  deleteCustomField(id: string): void {
    const next = settingsStore.getState().customFields.filter(f => f.id !== id);
    settingsStore.setState({ customFields: next });
    PersistenceManager.setBatched('custom_fields', next);
  },

  updateCustomFields(fields: CustomField[]): void {
    settingsStore.setState({ customFields: fields });
    PersistenceManager.setBatched('custom_fields', fields);
  },

  checkPackageUsage(id: string): { isReferenced: boolean; count: number; details: string[] } {
    const usage = PackageRepository.checkUsage(id);
    const details: string[] = [];
    if (usage.membershipReferences > 0) details.push(`${usage.membershipReferences} دوره عضویت`);
    if (usage.chargeReferences > 0) details.push(`${usage.chargeReferences} صورت‌حساب مالی`);
    if (usage.paymentReferences > 0) details.push(`${usage.paymentReferences} سند پرداخت`);

    return {
      isReferenced: usage.inUse,
      count: usage.totalReferences,
      details,
    };
  },

  addPackage(pkgData: Omit<MembershipPackage, 'id'>): MembershipPackage {
    const state = settingsStore.getState();
    const newPkg: MembershipPackage = {
      ...pkgData,
      id: `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: state.organizationInfo.tenantId,
      branchId: state.activeBranchId,
      isActive: pkgData.isActive !== false,
      isArchived: false,
    };
    PackageRepository.add(newPkg);
    const next = PackageRepository.getAll({ includeArchived: true });
    settingsStore.setState({ packages: next });
    PersistenceManager.setImmediate('packages', next);
    SyncEngine.enqueue('package', newPkg.id, 'INSERT', newPkg);
    return newPkg;
  },

  updatePackage(id: string, pkgData: Partial<MembershipPackage>): void {
    PackageRepository.update(id, pkgData);
    const next = PackageRepository.getAll({ includeArchived: true });
    settingsStore.setState({ packages: next });
    PersistenceManager.setImmediate('packages', next);
    SyncEngine.enqueue('package', id, 'UPDATE', pkgData);
  },

  archivePackage(id: string): void {
    PackageRepository.update(id, { isActive: false, isArchived: true, archivedAt: new Date().toISOString() });
    const next = PackageRepository.getAll({ includeArchived: true });
    settingsStore.setState({ packages: next });
    PersistenceManager.setImmediate('packages', next);
    SyncEngine.enqueue('package', id, 'UPDATE', { isActive: false, isArchived: true });
  },

  reactivatePackage(id: string): void {
    PackageRepository.update(id, { isActive: true, isArchived: false, archivedAt: undefined });
    const next = PackageRepository.getAll({ includeArchived: true });
    settingsStore.setState({ packages: next });
    PersistenceManager.setImmediate('packages', next);
    SyncEngine.enqueue('package', id, 'UPDATE', { isActive: true, isArchived: false });
  },

  deletePackage(id: string, force = false): { success: boolean; reason?: string; usageCount?: number } {
    const usage = this.checkPackageUsage(id);
    if (usage.isReferenced && !force) {
      return {
        success: false,
        reason: `این پکیج دارای سابقه ثبت‌شده مستقیم (${usage.details.join('، ')}) است و جهت حفظ تاریخچه و صحت محاسبات مالی قابل حذف فیزیکی نیست. می‌توانید پکیج را بایگانی نمایید تا برای اعضای جدید نمایش داده نشود.`,
        usageCount: usage.count,
      };
    }

    PackageRepository.delete(id);
    const next = PackageRepository.getAll({ includeArchived: true });
    settingsStore.setState({ packages: next });
    PersistenceManager.setImmediate('packages', next);
    SyncEngine.enqueue('package', id, 'DELETE', { id });
    return { success: true };
  },

  updatePackages(packages: MembershipPackage[]): void {
    PackageRepository.reset(packages);
    settingsStore.setState({ packages });
    PersistenceManager.setImmediate('packages', packages);
  },

  addCoach(coachData: Omit<Coach, 'id'>, recordedBy = 'مدیر سیستم'): Coach {
    const state = settingsStore.getState();
    const newCoach: Coach = {
      ...coachData,
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: state.organizationInfo.tenantId,
      branchId: state.activeBranchId,
    };
    const next = [newCoach, ...state.coaches];
    settingsStore.setState({ coaches: next });
    PersistenceManager.setImmediate('coaches', next);
    SyncEngine.enqueue('coach', newCoach.id, 'INSERT', newCoach);
    AuditService.logEvent({
      action: 'COACH_ADDED',
      category: 'setting',
      details: `مربی جدید «${newCoach.fullName}» اضافه شد.`,
      userName: recordedBy,
    });
    return newCoach;
  },

  updateCoach(id: string, coachData: Partial<Coach>): void {
    const next = settingsStore.getState().coaches.map(c => c.id === id ? { ...c, ...coachData } : c);
    settingsStore.setState({ coaches: next });
    PersistenceManager.setImmediate('coaches', next);
    SyncEngine.enqueue('coach', id, 'UPDATE', coachData);
  },

  deleteCoach(id: string, recordedBy = 'مدیر سیستم'): void {
    const coach = settingsStore.getState().coaches.find(c => c.id === id);
    const next = settingsStore.getState().coaches.filter(c => c.id !== id);
    settingsStore.setState({ coaches: next });
    PersistenceManager.setImmediate('coaches', next);
    SyncEngine.enqueue('coach', id, 'DELETE', { id });
    if (coach) {
      AuditService.logEvent({
        action: 'COACH_DELETED',
        category: 'setting',
        details: `مربی «${coach.fullName}» حذف شد.`,
        userName: recordedBy,
      });
    }
  },

  updateCoaches(coaches: Coach[]): void {
    settingsStore.setState({ coaches });
    PersistenceManager.setBatched('coaches', coaches);
  },

  getCoachStats(coachId: string): CoachFinancialStats {
    const coach = settingsStore.getState().coaches.find(c => c.id === coachId);
    if (!coach) {
      return { totalStudents: 0, totalGeneratedRevenue: 0, totalCoachShare: 0, totalClubShare: 0, totalPaidOut: 0, remainingBalance: 0 };
    }

    const students = MemberRepository.getAll();
    const coachStudents = students.filter(s => s.coachId === coachId);
    const totalGeneratedRevenue = coachStudents.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const rate = (coach.commissionRate || 0) / 100;
    const totalCoachShare = Math.round(totalGeneratedRevenue * rate);
    const totalClubShare = totalGeneratedRevenue - totalCoachShare;

    const expenses = PaymentRepository.getAllExpenses();
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
  },

  setActiveBranchId(branchId: string): void {
    settingsStore.setState({ activeBranchId: branchId });
    PersistenceManager.setImmediate('active_branch_id', branchId);
  },

  setCurrentUserRole(role: import('../types').UserRole): { success: boolean; error?: string } {
    const res = AuthService.switchUserRole(role);
    if (res.success && res.user) {
      settingsStore.setState({ currentUser: res.user });
    }
    return res;
  },

  login(identifier: string, roleOverride?: import('../types').UserRole) {
    const res = AuthService.login(identifier, roleOverride);
    if (res.success && res.session) {
      settingsStore.setState({ currentUser: res.session.user });
    }
    return res;
  },

  logout(reason?: string): void {
    AuthService.logout(reason);
    settingsStore.setState({ currentUser: AuthService.getCurrentUser() });
  },

  updateDashboardWidgets(widgets: DashboardWidgetConfig[]): void {
    settingsStore.setState({ dashboardWidgets: widgets });
    PersistenceManager.setBatched('dashboard_widgets', widgets);
  },

  updateModuleFeatures(features: ModuleFeature[]): void {
    settingsStore.setState({ moduleFeatures: features });
    PersistenceManager.setBatched('module_features', features);
  },

  setIntegrationMode(mode: IntegrationMode): void {
    settingsStore.setState({ integrationMode: mode });
    PersistenceManager.setBatched('integration_mode', mode);
  },

  setAccessPolicyConfig(config: AccessPolicyConfig | ((prev: AccessPolicyConfig) => AccessPolicyConfig)): void {
    const next = typeof config === 'function' ? config(settingsStore.getState().accessPolicyConfig) : config;
    settingsStore.setState({ accessPolicyConfig: next });
    PersistenceManager.setBatched('access_policy_config', next);
  },

  setIsInstalled(installed: boolean): void {
    settingsStore.setState({ isInstalled: installed });
    PersistenceManager.setImmediate('gym_installed', installed);
  },

  setIsDemoMode(demo: boolean): void {
    settingsStore.setState({ isDemoMode: demo });
    PersistenceManager.setImmediate('gym_demo_mode', demo);
  },

  enterDemoMode(): void {
    settingsActions.setIsDemoMode(true);
  },

  exitDemoMode(): void {
    settingsActions.setIsDemoMode(false);
  },

  settleCoachPayment(
    coachId: string,
    amount: number,
    paymentMethod: PaymentMethod = 'card_transfer',
    notes = ''
  ): void {
    const coach = settingsStore.getState().coaches.find(c => c.id === coachId);
    if (!coach) return;
    const { organizationInfo, activeBranchId, currentUser } = settingsStore.getState();
    financeActions.addExpense({
      title: `تسویه حساب پورسانت مربی (${coach.fullName})`,
      category: 'salary',
      amount,
      paidTo: coach.fullName,
      paymentMethod,
      date: DateService.getTodayJalali(),
      description: notes || `تسویه پورسانت مربیگری ${coach.fullName}`,
      tenantId: organizationInfo.tenantId,
      branchId: activeBranchId,
      receiptNumber: `EXP-${Date.now().toString().slice(-6)}`,
      status: 'completed',
    });
    AuditService.logEvent({
      action: 'COACH_PAYOUT_SETTLED',
      category: 'payment',
      details: `مبلغ ${amount.toLocaleString('fa-IR')} تومان به عنوان تسویه پورسانت به ${coach.fullName} پرداخت شد.`,
      userName: currentUser.fullName,
    });
  }
};

export function useSettingsStore<S = SettingsState>(selector?: (state: SettingsState) => S): S {
  return useStore(settingsStore, selector);
}

export function useSettings() {
  const state = useStore(settingsStore);
  return {
    ...state,
    ...settingsActions,
  };
}

