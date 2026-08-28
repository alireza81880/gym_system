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
  AccessPolicyConfig 
} from '../types';
import { initialCoaches, initialPackages } from '../data/initialData';
import { initialModuleFeatures } from '../data/featureModules';
import { defaultAccessPolicyConfig } from '../services/accessPolicyService';
import { PersistenceManager } from '../services/repositories/persistenceManager';

export const defaultOrganizationInfo: OrganizationInfo = {
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

export const settingsStore = createStore<SettingsState>({
  isInstalled: PersistenceManager.get<boolean>('gym_installed', true),
  isDemoMode: PersistenceManager.get<boolean>('gym_demo_mode', false),
  organizationInfo: PersistenceManager.get<OrganizationInfo>('organization_info', defaultOrganizationInfo),
  currentUser: PersistenceManager.get<StaffUser>('current_user', {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'مهندس علیرضا حسینی',
    role: 'gym_owner',
    phone: '09121112233',
    isActive: true,
  }),
  branches: PersistenceManager.get<Branch[]>('branches', initialBranches),
  activeBranchId: 'branch-tehran-central',
  customFields: PersistenceManager.get<CustomField[]>('custom_fields', defaultCustomFields),
  packages: PersistenceManager.get<MembershipPackage[]>('packages', initialPackages),
  coaches: PersistenceManager.get<Coach[]>('coaches', initialCoaches),
  accessPolicyConfig: PersistenceManager.get<AccessPolicyConfig>('access_policy_config', defaultAccessPolicyConfig),
  dashboardWidgets: PersistenceManager.get<DashboardWidgetConfig[]>('dashboard_widgets', defaultDashboardWidgets),
  moduleFeatures: PersistenceManager.get<ModuleFeature[]>('module_features', initialModuleFeatures),
  integrationMode: PersistenceManager.get<IntegrationMode>('integration_mode', 'shadow'),
});

export const settingsActions = {
  updateOrganizationInfo(partial: Partial<OrganizationInfo>): void {
    const updated = { ...settingsStore.getState().organizationInfo, ...partial };
    settingsStore.setState({ organizationInfo: updated });
    PersistenceManager.setBatched('organization_info', updated);
  },

  updateCustomFields(fields: CustomField[]): void {
    settingsStore.setState({ customFields: fields });
    PersistenceManager.setBatched('custom_fields', fields);
  },

  updatePackages(packages: MembershipPackage[]): void {
    settingsStore.setState({ packages });
    PersistenceManager.setBatched('packages', packages);
  },

  updateCoaches(coaches: Coach[]): void {
    settingsStore.setState({ coaches });
    PersistenceManager.setBatched('coaches', coaches);
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
    PersistenceManager.setBatched('gym_installed', installed);
  },

  setIsDemoMode(demo: boolean): void {
    settingsStore.setState({ isDemoMode: demo });
    PersistenceManager.setBatched('gym_demo_mode', demo);
  }
};

export function useSettingsStore<S = SettingsState>(selector?: (state: SettingsState) => S): S {
  return useStore(settingsStore, selector);
}
