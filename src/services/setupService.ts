import { OrganizationInfo, MembershipPackage, AccessPolicyConfig, IntegrationMode, PackageType } from '../types';
import { settingsStore, settingsActions } from '../stores/settingsStore';
import { LockerRepository } from './repositories/lockerRepository';
import { notifyLockerChange } from '../stores/lockerStore';
import { AuthService } from './auth/authService';
import { PersistenceManager } from './repositories/persistenceManager';
import { LocalDbRepository } from './localDb';
import { AuditService } from './auditService';
import { ValidationService } from './validationService';

export type SetupState =
  | 'NEW_INSTALL'
  | 'SETUP_REQUIRED'
  | 'SETUP_IN_PROGRESS'
  | 'SETUP_COMPLETE'
  | 'DEMO_OPERATION';

export interface InitialSetupInput {
  orgData: {
    name: string;
    managerName: string;
    managerMobile: string;
    city?: string;
    address?: string;
    phone?: string;
    currency?: 'تومان' | 'IRR' | 'ریال';
    memberNumberLabel?: string;
  };
  lockerCount?: number;
  lockerZones?: string;
  firstPackage?: {
    name: string;
    price: number;
    sessionsCount?: number;
    validityDays?: number;
    durationDays?: number;
    type?: PackageType;
  };
  accessPolicy?: Partial<AccessPolicyConfig>;
  integrationMode?: IntegrationMode;
  ownerData?: {
    fullName: string;
    phone: string;
    username?: string;
  };
}

export interface QuickSetupInput {
  name: string;
  managerName?: string;
  managerMobile?: string;
  phone?: string;
  city?: string;
  address?: string;
  memberNumberLabel?: string;
  integrationMode?: IntegrationMode;
  accessPolicy?: Partial<AccessPolicyConfig>;
}

export interface SetupResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    organizationInfo: OrganizationInfo;
  };
}

export class SetupService {
  private static isSubmitting = false;

  /**
   * Deterministic State Machine for Application Lifecycle
   */
  static getSetupState(): SetupState {
    const { isInstalled, isDemoMode } = settingsStore.getState();
    if (isDemoMode) {
      return 'DEMO_OPERATION';
    }
    if (!isInstalled) {
      return 'SETUP_REQUIRED';
    }
    return 'SETUP_COMPLETE';
  }

  /**
   * Validates initial setup form inputs
   */
  static validateInitialSetupInput(input: InitialSetupInput): { valid: boolean; error?: string } {
    if (!input.orgData?.name?.trim()) {
      return { valid: false, error: 'نام باشگاه یا مجموعه ورزشی الزامی است.' };
    }
    if (!input.orgData?.managerName?.trim() && !input.ownerData?.fullName?.trim()) {
      return { valid: false, error: 'نام مدیر یا مؤسس باشگاه الزامی است.' };
    }
    const mobile = input.orgData?.managerMobile || input.ownerData?.phone;
    if (!mobile?.trim()) {
      return { valid: false, error: 'شماره موبایل مدیر جهت احراز هویت الزامی است.' };
    }
    if (!ValidationService.isValidMobilePhone(mobile.trim())) {
      return { valid: false, error: 'فرمت شماره همراه مدیر نامعتبر است (مثال: ۰۹۱۲۱۱۱۲۲۳۳).' };
    }
    if (input.lockerCount !== undefined && (input.lockerCount < 0 || input.lockerCount > 1000)) {
      return { valid: false, error: 'تعداد کمدها باید بین ۰ تا ۱۰۰۰ باشد.' };
    }
    if (input.firstPackage?.name && (input.firstPackage.price === undefined || input.firstPackage.price < 0)) {
      return { valid: false, error: 'مبلغ پکیج عضویت نمی‌تواند منفی باشد.' };
    }
    return { valid: true };
  }

  /**
   * Authoritative Unified Initial Setup Execution ("افتتاح حساب و راه‌اندازی باشگاه")
   */
  static completeInitialInstallation(input: InitialSetupInput): SetupResult {
    // 0. Concurrency & Duplicate Submission Guard
    if (this.isSubmitting) {
      return {
        success: false,
        error: 'فرآیند راه‌اندازی باشگاه در حال اجراست؛ لطفاً شکیبا باشید.',
      };
    }

    this.isSubmitting = true;

    // Snapshot current state for strict atomic rollback
    const snapshotState = { ...settingsStore.getState() };
    const snapshotOrg = PersistenceManager.get('organization_info', snapshotState.organizationInfo);
    const snapshotPackages = PersistenceManager.get('packages', snapshotState.packages);
    const snapshotLockers = PersistenceManager.get('smart_lockers', []);
    const snapshotPolicy = PersistenceManager.get('access_policy_config', snapshotState.accessPolicyConfig);
    const snapshotInstalled = PersistenceManager.get('gym_installed', false);
    const snapshotDemo = PersistenceManager.get('gym_demo_mode', false);
    const snapshotOnboarding = PersistenceManager.get('gym_onboarding_completed', false);

    try {
      // 1. Validation
      const validation = this.validateInitialSetupInput(input);
      if (!validation.valid) {
        this.isSubmitting = false;
        return { success: false, error: validation.error };
      }

      const currentOrg = settingsStore.getState().organizationInfo;
      const nextOrg: OrganizationInfo = {
        ...currentOrg,
        name: input.orgData.name.trim(),
        managerName: (input.orgData.managerName || input.ownerData?.fullName || currentOrg.managerName).trim(),
        managerMobile: (input.orgData.managerMobile || input.ownerData?.phone || currentOrg.managerMobile).trim(),
        phone: (input.orgData.phone || currentOrg.phone || '').trim(),
        city: (input.orgData.city || currentOrg.city || 'تهران').trim(),
        address: (input.orgData.address || currentOrg.address || '').trim(),
        currency: input.orgData.currency || currentOrg.currency || 'تومان',
        memberNumberLabel: input.orgData.memberNumberLabel || currentOrg.memberNumberLabel || 'شماره عضویت',
        updatedAt: new Date().toISOString(),
      };

      // 2. Persist Organization Data & Synchronize Main Branch Immediately
      const branchName = nextOrg.name ? `${nextOrg.name} (${nextOrg.city || 'مرکزی'})` : 'شعبه مرکزی';
      const currentBranches = settingsStore.getState().branches;
      const updatedBranches = (currentBranches && currentBranches.length > 0)
        ? currentBranches.map(b => (b.isMain || currentBranches.length === 1) ? {
            ...b,
            name: branchName,
            city: nextOrg.city,
            address: nextOrg.address,
            phone: nextOrg.phone || nextOrg.managerMobile,
            managerName: nextOrg.managerName,
          } : b)
        : [{
            id: 'branch-main',
            tenantId: nextOrg.tenantId || 'gym-org-1',
            name: branchName,
            code: 'MAIN-01',
            city: nextOrg.city || 'تهران',
            address: nextOrg.address || '',
            phone: nextOrg.phone || nextOrg.managerMobile || '',
            managerName: nextOrg.managerName || '',
            isMain: true,
            isActive: true,
          }];

      PersistenceManager.setImmediate('organization_info', nextOrg);
      PersistenceManager.setImmediate('branches', updatedBranches);
      settingsStore.setState({ 
        organizationInfo: nextOrg,
        branches: updatedBranches,
        activeBranchId: updatedBranches[0]?.id || 'branch-main',
      });

      // 3. Initialize Lockers (supports lockerCount === 0 and > 0)
      if (input.lockerCount !== undefined) {
        LockerRepository.initialize();
        if (input.lockerCount === 0) {
          LockerRepository.batchSet([]);
        } else {
          LockerRepository.setCount(input.lockerCount);
        }
        notifyLockerChange();
      }

      // 4. Configure First Package
      if (input.firstPackage?.name?.trim()) {
        const pkgDays = input.firstPackage.validityDays || input.firstPackage.durationDays || 30;
        settingsActions.addPackage({
          name: input.firstPackage.name.trim(),
          type: input.firstPackage.type || '1_month',
          price: Number(input.firstPackage.price) || 0,
          validityDays: pkgDays,
          durationDays: pkgDays,
          sessionsCount: input.firstPackage.sessionsCount || 12,
          includesLocker: true,
          isActive: true,
          isArchived: false,
          description: 'پکیج اولیه ایجاد شده در زمان افتتاح باشگاه',
        });
      }

      // 5. Access Policy & Integration Mode
      if (input.accessPolicy) {
        const currentPolicy = settingsStore.getState().accessPolicyConfig;
        const nextPolicy = { ...currentPolicy, ...input.accessPolicy };
        PersistenceManager.setImmediate('access_policy_config', nextPolicy);
        settingsStore.setState({ accessPolicyConfig: nextPolicy });
      }

      if (input.integrationMode) {
        PersistenceManager.setImmediate('integration_mode', input.integrationMode);
        settingsStore.setState({ integrationMode: input.integrationMode });
      }

      // 6. Owner Staff Profile Sync
      const ownerName = input.ownerData?.fullName || nextOrg.managerName;
      const ownerPhone = input.ownerData?.phone || nextOrg.managerMobile;
      AuthService.initializeOwnerProfile({
        fullName: ownerName,
        phone: ownerPhone,
        username: input.ownerData?.username || 'admin',
      });

      // 7. Update System Metadata & Flags
      LocalDbRepository.setMetadata({
        isInstalled: true,
        isDemoMode: false,
        tenantId: nextOrg.tenantId || 'gym-org-1',
      });
      PersistenceManager.setImmediate('gym_installed', true);
      PersistenceManager.setImmediate('gym_demo_mode', false);
      PersistenceManager.setImmediate('gym_onboarding_completed', true);

      // 8. Update Authoritative Store State
      settingsStore.setState({
        isInstalled: true,
        isDemoMode: false,
        currentUser: AuthService.getCurrentUser(),
      });

      // 9. Audit Log
      AuditService.logEvent({
        action: 'SYSTEM_INSTALLATION_COMPLETED',
        category: 'system',
        details: `راه‌اندازی و افتتاح باشگاه «${nextOrg.name}» توسط «${ownerName}» با موفقیت ثبت شد.`,
        userName: ownerName,
      });

      this.isSubmitting = false;

      return {
        success: true,
        message: 'باشگاه شما با موفقیت افتتاح و راه‌اندازی شد.',
        data: { organizationInfo: nextOrg },
      };
    } catch (err) {
      console.error('[SetupService] Error during completeInitialInstallation, rolling back:', err);
      // Atomic rollback to pre-setup snapshot
      try {
        PersistenceManager.setImmediate('organization_info', snapshotOrg);
        PersistenceManager.setImmediate('packages', snapshotPackages);
        PersistenceManager.setImmediate('smart_lockers', snapshotLockers);
        PersistenceManager.setImmediate('access_policy_config', snapshotPolicy);
        PersistenceManager.setImmediate('gym_installed', snapshotInstalled);
        PersistenceManager.setImmediate('gym_demo_mode', snapshotDemo);
        PersistenceManager.setImmediate('gym_onboarding_completed', snapshotOnboarding);
        settingsStore.setState({
          ...snapshotState,
          isInstalled: snapshotInstalled,
          isDemoMode: snapshotDemo,
        });
      } catch (rollbackErr) {
        console.error('[SetupService] Rollback error:', rollbackErr);
      }

      this.isSubmitting = false;

      return {
        success: false,
        error: `خطا در فرآیند راه‌اندازی و افتتاح باشگاه: ${(err as Error).message}`,
      };
    }
  }

  /**
   * Authoritative Unified Quick Setup & Onboarding Execution
   */
  static completeQuickSetup(input: QuickSetupInput): SetupResult {
    try {
      if (!input.name?.trim()) {
        return { success: false, error: 'نام باشگاه الزامی است.' };
      }

      const currentOrg = settingsStore.getState().organizationInfo;
      const nextOrg: OrganizationInfo = {
        ...currentOrg,
        name: input.name.trim(),
        managerName: (input.managerName || currentOrg.managerName || '').trim(),
        managerMobile: (input.managerMobile || currentOrg.managerMobile || '').trim(),
        phone: (input.phone || currentOrg.phone || '').trim(),
        city: (input.city || currentOrg.city || 'تهران').trim(),
        address: (input.address || currentOrg.address || '').trim(),
        memberNumberLabel: input.memberNumberLabel || currentOrg.memberNumberLabel || 'شماره عضویت',
        updatedAt: new Date().toISOString(),
      };

      // Persist Immediately
      PersistenceManager.setImmediate('organization_info', nextOrg);
      settingsStore.setState({ organizationInfo: nextOrg });

      if (input.integrationMode) {
        PersistenceManager.setImmediate('integration_mode', input.integrationMode);
        settingsStore.setState({ integrationMode: input.integrationMode });
      }

      if (input.accessPolicy) {
        const currentPolicy = settingsStore.getState().accessPolicyConfig;
        const nextPolicy = { ...currentPolicy, ...input.accessPolicy };
        PersistenceManager.setImmediate('access_policy_config', nextPolicy);
        settingsStore.setState({ accessPolicyConfig: nextPolicy });
      }

      // Mark Onboarding Complete
      PersistenceManager.setImmediate('gym_onboarding_completed', true);

      // Audit Log
      AuditService.logEvent({
        action: 'QUICK_SETUP_COMPLETED',
        category: 'system',
        details: `تنظیمات باشگاه «${nextOrg.name}» به‌روزرسانی شد.`,
        userName: settingsStore.getState().currentUser.fullName,
      });

      return {
        success: true,
        message: 'تنظیمات باشگاه با موفقیت ذخیره شد.',
        data: { organizationInfo: nextOrg },
      };
    } catch (err) {
      console.error('[SetupService] Error during completeQuickSetup:', err);
      return {
        success: false,
        error: `خطا در ذخیره‌سازی تنظیمات: ${(err as Error).message}`,
      };
    }
  }
}
