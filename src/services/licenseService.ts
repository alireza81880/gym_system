/**
 * Gym OS - Licensing Service
 * Provides frontend interface to the desktop licensing engine and audits all licensing lifecycle events.
 */

import { LicenseInfo, LicenseActivationResult, LicenseStatus, LicenseRecord, CreateLicenseInput, LicenseType } from '../types/license';
import { AuditService } from './auditService';
import { calculateLicenseExpiry } from '../utils/licenseUtils';

// Default initial state for fresh unactivated installations
const DEFAULT_UNACTIVATED: LicenseInfo = {
  status: 'UNACTIVATED',
  licenseId: null,
  gymId: null,
  gymName: null,
  plan: null,
  activatedAt: null,
  expiresAt: null,
  deviceBindingStatus: 'UNBOUND',
  tokenVersion: 1,
  deviceFingerprintMasked: 'FP-WEB-SIM',
  isOfflineValid: false,
};

const WEB_STORAGE_KEY = 'gym_os_license_state';

class LicenseService {
  /**
   * Checks if running inside the official Electron desktop shell
   */
  public isDesktop(): boolean {
    return typeof window !== 'undefined' && Boolean(window.gymDesktopApi?.isDesktop);
  }

  /**
   * Retrieves authoritative license status from Electron Main process
   */
  public async getLicenseStatus(): Promise<LicenseInfo> {
    if (this.isDesktop() && window.gymDesktopApi?.getLicenseStatus) {
      try {
        return await window.gymDesktopApi.getLicenseStatus();
      } catch (err) {
        console.error('[LicenseService] Failed to query native license status:', err);
        return {
          ...DEFAULT_UNACTIVATED,
          status: 'RECOVERY_REQUIRED',
          message: 'خطا در ارتباط با سرویس بررسی لایسنس',
        };
      }
    }

    // Web simulation fallback for non-packaged/browser development
    try {
      const saved = localStorage.getItem(WEB_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    return DEFAULT_UNACTIVATED;
  }

  /**
   * Attempts to activate Gym OS with a license key
   */
  public async activateLicense(licenseKey: string): Promise<LicenseActivationResult> {
    const cleanKey = (licenseKey || '').trim().toUpperCase();

    if (this.isDesktop() && window.gymDesktopApi?.activateLicense) {
      try {
        const result = await window.gymDesktopApi.activateLicense(cleanKey);

        // Audit the activation attempt
        AuditService.logEvent({
          action: result.success ? 'LICENSE_ACTIVATION_SUCCESS' : 'LICENSE_ACTIVATION_FAILED',
          category: 'security',
          entityType: 'setting',
          entityId: cleanKey,
          description: result.success 
            ? `فعالسازی موفقیت‌آمیز لایسنس ${cleanKey}`
            : `تلاش ناموفق برای فعالسازی لایسنس ${cleanKey}: ${result.message}`,
          result: result.success ? 'success' : 'failure',
          metadata: {
            licenseKey: cleanKey,
            status: result.status,
            error: result.error,
          },
        });

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'خطای سیستمی در فعالسازی لایسنس';
        AuditService.logEvent({
          action: 'LICENSE_ACTIVATION_ERROR',
          category: 'security',
          entityType: 'setting',
          entityId: cleanKey,
          description: `خطای سیستمی هنگام فعالسازی لایسنس ${cleanKey}: ${message}`,
          result: 'failure',
        });
        return {
          success: false,
          status: 'UNACTIVATED',
          message,
        };
      }
    }

    // Web development simulation
    if (cleanKey === 'GYM-2026-001' || cleanKey === 'GYM-2026-002') {
      const activatedInfo: LicenseInfo = {
        status: 'ACTIVE',
        licenseId: cleanKey,
        gymId: 'gym-tehran-central-01',
        gymName: 'باشگاه مرکزی تهران',
        plan: cleanKey === 'GYM-2026-001' ? 'Enterprise' : 'Pro',
        activatedAt: new Date().toISOString(),
        expiresAt: null,
        deviceBindingStatus: 'BOUND_MATCHED',
        tokenVersion: 1,
        deviceFingerprintMasked: 'FP-A8B9****4E12',
        isOfflineValid: true,
      };
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(activatedInfo));

      AuditService.logEvent({
        action: 'LICENSE_ACTIVATION_SUCCESS',
        category: 'security',
        entityType: 'setting',
        entityId: cleanKey,
        description: `فعالسازی موفقیت‌آمیز لایسنس ${cleanKey} (حالت وب)`,
        result: 'success',
      });

      return {
        success: true,
        status: 'ACTIVE',
        message: 'لایسنس با موفقیت فعال شد',
        licenseInfo: activatedInfo,
      };
    }

    if (cleanKey === 'GYM-TEST-LIMIT') {
      return {
        success: false,
        status: 'DEVICE_LIMIT_REACHED',
        error: 'DEVICE_LIMIT_REACHED',
        code: 'DEVICE_LIMIT_REACHED',
        message: 'سقف مجاز فعالسازی این لایسنس (۱ دستگاه) تکمیل شده است. برای انتقال به دستگاه جدید از کد بازیابی استفاده کنید.',
        maxDevices: 1,
        activeDevicesCount: 1,
      };
    }

    if (cleanKey === 'GYM-TEST-EXPIRED') {
      return {
        success: false,
        status: 'EXPIRED',
        error: 'EXPIRED_LICENSE',
        code: 'EXPIRED_LICENSE',
        message: 'تاریخ اعتبار این لایسنس به پایان رسیده است.',
      };
    }

    if (cleanKey === 'GYM-TEST-REVOKED') {
      return {
        success: false,
        status: 'REVOKED',
        error: 'REVOKED_LICENSE',
        code: 'REVOKED_LICENSE',
        message: 'این لایسنس توسط پشتیبانی غیرفعال (Revoked) شده است.',
      };
    }

    if (cleanKey === 'GYM-2026-MISMATCH' || cleanKey === 'GYM-TEST-MISMATCH') {
      AuditService.logEvent({
        action: 'LICENSE_DEVICE_MISMATCH',
        category: 'security',
        entityType: 'setting',
        entityId: cleanKey,
        description: `خطای عدم تطابق دستگاه برای لایسنس ${cleanKey}`,
        result: 'denied',
      });
      return {
        success: false,
        status: 'DEVICE_MISMATCH',
        error: 'DEVICE_MISMATCH',
        code: 'DEVICE_MISMATCH',
        message: 'شناسه سخت‌افزاری با سیستم فعال‌شده مطابقت ندارد.',
      };
    }

    AuditService.logEvent({
      action: 'LICENSE_ACTIVATION_FAILED',
      category: 'security',
      entityType: 'setting',
      entityId: cleanKey,
      description: `لایسنس نامعتبر وارد شد: ${cleanKey}`,
      result: 'failure',
    });

    return {
      success: false,
      status: 'UNACTIVATED',
      error: 'INVALID_LICENSE',
      code: 'INVALID_LICENSE',
      message: 'کد لایسنس نامعتبر است یا در سامانه یافت نشد.',
    };
  }

  /**
   * Activates Gym OS using an emergency offline package
   */
  public async activateOfflinePackage(packageData: unknown): Promise<LicenseActivationResult> {
    if (this.isDesktop() && window.gymDesktopApi?.activateOfflinePackage) {
      try {
        const result = await window.gymDesktopApi.activateOfflinePackage(packageData);

        AuditService.logEvent({
          action: result.success ? 'LICENSE_ACTIVATION_SUCCESS' : 'LICENSE_ACTIVATION_FAILED',
          category: 'security',
          entityType: 'setting',
          entityId: 'OFFLINE_PACKAGE',
          description: result.success
            ? 'فعالسازی موفقیت‌آمیز با پکیج اضطراری آفلاین'
            : `تلاش ناموفق برای فعالسازی با پکیج آفلاین: ${result.message}`,
          result: result.success ? 'success' : 'failure',
          metadata: {
            activationType: 'OFFLINE_EMERGENCY',
            status: result.status,
            error: result.error,
          },
        });

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'خطای سیستمی در فعالسازی آفلاین';
        return {
          success: false,
          status: 'UNACTIVATED',
          error: 'SYSTEM_ERROR',
          message,
        };
      }
    }

    // Web simulation fallback for testing offline activation packages
    try {
      const activatedInfo: LicenseInfo = {
        status: 'ACTIVE',
        licenseId: 'GYM-OFFLINE-EMERGENCY',
        gymId: 'gym-offline-web',
        gymName: 'باشگاه مرکزی (فعالسازی اضطراری)',
        plan: 'Enterprise',
        activatedAt: new Date().toISOString(),
        expiresAt: null,
        deviceBindingStatus: 'BOUND_MATCHED',
        tokenVersion: 1,
        deviceFingerprintMasked: 'FP-OFFLINE-SIM',
        isOfflineValid: true,
      };
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(activatedInfo));

      AuditService.logEvent({
        action: 'LICENSE_ACTIVATION_SUCCESS',
        category: 'security',
        entityType: 'setting',
        entityId: 'OFFLINE_PACKAGE',
        description: 'فعالسازی آفلاین موفقیت‌آمیز (حالت شبیه‌سازی وب)',
        result: 'success',
      });

      return {
        success: true,
        status: 'ACTIVE',
        message: 'فعالسازی اضطراری آفلاین با موفقیت انجام شد',
        licenseInfo: activatedInfo,
      };
    } catch {
      return {
        success: false,
        status: 'UNACTIVATED',
        error: 'INVALID_PACKAGE',
        message: 'پکیج فعالسازی آفلاین نامعتبر است',
      };
    }
  }

  /**
   * Recovers a license previously bound to another device using a one-time recovery code
   */
  public async recoverLicense(licenseKey: string, recoveryCode: string): Promise<LicenseActivationResult> {
    const cleanKey = (licenseKey || '').trim().toUpperCase();
    const cleanCode = (recoveryCode || '').trim();

    if (this.isDesktop() && window.gymDesktopApi?.recoverLicense) {
      try {
        const result = await window.gymDesktopApi.recoverLicense(cleanKey, cleanCode);

        AuditService.logEvent({
          action: result.success ? 'LICENSE_RECOVERY_SUCCESS' : 'LICENSE_RECOVERY_FAILED',
          category: 'security',
          entityType: 'setting',
          entityId: cleanKey,
          description: result.success
            ? `بازیابی و اتصال موفقیت‌آمیز لایسنس ${cleanKey} به دستگاه جدید`
            : `شکست در بازیابی لایسنس ${cleanKey}: ${result.message}`,
          result: result.success ? 'success' : 'failure',
          metadata: {
            licenseKey: cleanKey,
            recoveryCodeProvided: Boolean(cleanCode),
          },
        });

        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'خطای سیستمی در بازیابی لایسنس';
        return {
          success: false,
          status: 'RECOVERY_REQUIRED',
          message,
        };
      }
    }

    // Web simulation
    if (cleanCode.startsWith('REC-')) {
      const recoveredInfo: LicenseInfo = {
        status: 'ACTIVE',
        licenseId: cleanKey || 'GYM-2026-001',
        gymId: 'gym-tehran-central-01',
        gymName: 'باشگاه مرکزی تهران',
        plan: 'Enterprise',
        activatedAt: new Date().toISOString(),
        expiresAt: null,
        deviceBindingStatus: 'BOUND_MATCHED',
        tokenVersion: 1,
        deviceFingerprintMasked: 'FP-A8B9****4E12',
        isOfflineValid: true,
      };
      localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(recoveredInfo));

      AuditService.logEvent({
        action: 'LICENSE_RECOVERY_SUCCESS',
        category: 'security',
        entityType: 'setting',
        entityId: cleanKey,
        description: `بازیابی و اتصال مجدد لایسنس ${cleanKey} (حالت وب)`,
        result: 'success',
      });

      return {
        success: true,
        status: 'ACTIVE',
        message: 'لایسنس با موفقیت بازیابی و متصل شد',
        licenseInfo: recoveredInfo,
      };
    }

    return {
      success: false,
      status: 'RECOVERY_REQUIRED',
      error: 'INVALID_RECOVERY_CODE',
      message: 'کد بازیابی نامعتبر است',
    };
  }

  // ==========================================
  // ADMIN LICENSE MANAGEMENT & CREATION
  // ==========================================

  private getAdminStorageKey(): string {
    return 'gym_os_admin_licenses_registry';
  }

  /**
   * Retrieves all managed licenses (queries remote Edge Function or local registry)
   */
  public async listLicenses(config?: { supabaseUrl?: string; supabaseAnonKey?: string }): Promise<{
    success: boolean;
    licenses: LicenseRecord[];
    source: 'cloud' | 'local';
    error?: string;
  }> {
    const url = config?.supabaseUrl?.trim();
    const anonKey = config?.supabaseAnonKey?.trim();

    if (url && anonKey) {
      try {
        const endpoint = `${url.replace(/\/+$/, '')}/functions/v1/create-license`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ action: 'list' }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.licenses)) {
            return { success: true, licenses: data.licenses, source: 'cloud' };
          }
        }
      } catch (err) {
        console.warn('[LicenseService] Failed to fetch licenses from cloud Edge Function:', err);
      }
    }

    // Local admin registry fallback
    try {
      const raw = localStorage.getItem(this.getAdminStorageKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return { success: true, licenses: parsed, source: 'local' };
        }
      }
    } catch {
      // ignore
    }

    // Default sample list for demonstration if empty
    const defaultSamples: LicenseRecord[] = [
      {
        id: 'lic-sample-1',
        license_key: 'GYM-2026-001',
        customer_name: 'باشگاه مرکزی آزادی',
        plan: 'Enterprise',
        duration_months: null,
        license_type: 'LIFETIME',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        expires_at: null,
        max_devices: 3,
        recovery_code: 'REC-9B21-884920',
        status: 'ACTIVE',
        notes: 'لایسنس سازمانی مادام‌العمر ۳ کاربره',
      },
      {
        id: 'lic-sample-2',
        license_key: 'GYM-2026-002',
        customer_name: 'مجموعه ورزشی اکسیژن',
        plan: 'Professional',
        duration_months: 12,
        license_type: 'YEARLY',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        expires_at: new Date(Date.now() + 355 * 86400000).toISOString(),
        max_devices: 1,
        recovery_code: 'REC-4F10-192837',
        status: 'ACTIVE',
        notes: 'لایسنس یک ساله تک‌کاربره',
      },
    ];

    try {
      localStorage.setItem(this.getAdminStorageKey(), JSON.stringify(defaultSamples));
    } catch {
      // ignore
    }

    return { success: true, licenses: defaultSamples, source: 'local' };
  }

  /**
   * Authoritatively creates a new license.
   * If Supabase credentials are provided, dispatches to Edge Function.
   * Otherwise, registers securely in local admin storage with strict validation.
   */
  public async createLicense(
    input: CreateLicenseInput,
    config?: { supabaseUrl?: string; supabaseAnonKey?: string }
  ): Promise<{ success: boolean; license?: LicenseRecord; message?: string; error?: string }> {
    const customerName = (input.customer_name || '').trim();
    if (!customerName) {
      return { success: false, error: 'نام خریدار / باشگاه الزامی است.' };
    }

    const plan = input.plan || 'Professional';
    let licenseType: LicenseType = input.license_type || 'YEARLY';
    let durationMonths: number | null = null;

    if (licenseType === 'LIFETIME') {
      durationMonths = null;
    } else if (licenseType === 'TRIAL') {
      durationMonths = input.duration_months && input.duration_months > 0 ? input.duration_months : 1;
    } else if (licenseType === 'YEARLY') {
      durationMonths = 12;
    } else if (licenseType === 'MULTI_YEAR') {
      durationMonths = input.duration_months && input.duration_months > 0 ? input.duration_months : 24;
    } else {
      // CUSTOM
      if (input.duration_months === null || input.duration_months === undefined || input.duration_months <= 0) {
        licenseType = 'LIFETIME';
        durationMonths = null;
      } else {
        durationMonths = Number(input.duration_months);
      }
    }

    const maxDevices = Math.max(1, Number(input.max_devices) || 1);
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = calculateLicenseExpiry(now, durationMonths);

    const url = config?.supabaseUrl?.trim();
    const anonKey = config?.supabaseAnonKey?.trim();

    // 1. Try remote Supabase Edge Function
    if (url && anonKey) {
      try {
        const endpoint = `${url.replace(/\/+$/, '')}/functions/v1/create-license`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'create',
            customer_name: customerName,
            plan,
            license_type: licenseType,
            duration_months: durationMonths,
            max_devices: maxDevices,
            custom_license_key: input.custom_license_key,
            notes: input.notes,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.license) {
          // Sync with local list cache as well
          await this.saveLicenseLocally(data.license);

          AuditService.logEvent({
            action: 'LICENSE_CREATED',
            category: 'security',
            entityType: 'setting',
            entityId: data.license.license_key,
            description: `صدور ابری لایسنس جدید برای ${customerName}`,
            result: 'success',
          });

          return {
            success: true,
            license: data.license,
            message: 'لایسنس با موفقیت در پایگاه داده ابری ایجاد و ثبت گردید.',
          };
        } else {
          return {
            success: false,
            error: data.error || 'خطا در ارتباط با سرور صدور لایسنس',
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطای شبکه';
        return {
          success: false,
          error: `برقراری ارتباط با Edge Function امکان‌پذیر نیست: ${msg}`,
        };
      }
    }

    // 2. Local creation fallback with standard key & recovery code generator
    const generateSegment = (len: number) => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let str = '';
      for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return str;
    };

    const licenseKey = (input.custom_license_key || '').trim().toUpperCase() ||
      `GYM-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;

    const recoveryCode = `REC-${generateSegment(4)}-${generateSegment(6)}`;

    const newRecord: LicenseRecord = {
      id: 'lic-' + Date.now(),
      license_key: licenseKey,
      customer_name: customerName,
      plan,
      license_type: licenseType,
      duration_months: durationMonths,
      created_at: createdAt,
      expires_at: expiresAt,
      max_devices: maxDevices,
      recovery_code: recoveryCode,
      status: 'UNUSED',
      notes: input.notes || '',
    };

    await this.saveLicenseLocally(newRecord);

    AuditService.logEvent({
      action: 'LICENSE_CREATED',
      category: 'security',
      entityType: 'setting',
      entityId: licenseKey,
      description: `صدور لایسنس محلی جدید برای ${customerName}`,
      result: 'success',
    });

    return {
      success: true,
      license: newRecord,
      message: 'لایسنس با موفقیت صادر و در سامانه ثبت شد.',
    };
  }

  private async saveLicenseLocally(lic: LicenseRecord): Promise<void> {
    try {
      const raw = localStorage.getItem(this.getAdminStorageKey());
      let list: LicenseRecord[] = raw ? JSON.parse(raw) : [];
      list = [lic, ...list.filter((x) => x.license_key !== lic.license_key)];
      localStorage.setItem(this.getAdminStorageKey(), JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  /**
   * Revokes a license
   */
  public async revokeLicense(
    licenseKey: string,
    config?: { supabaseUrl?: string; supabaseAnonKey?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanKey = licenseKey.trim().toUpperCase();
    const url = config?.supabaseUrl?.trim();
    const anonKey = config?.supabaseAnonKey?.trim();

    if (url && anonKey) {
      try {
        const endpoint = `${url.replace(/\/+$/, '')}/functions/v1/create-license`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ action: 'revoke', license_key: cleanKey }),
        });
        const data = await res.json();
        if (data.success) {
          await this.updateLocalLicenseStatus(cleanKey, 'REVOKED');
          return { success: true, message: data.message || 'لایسنس با موفقیت ابطال شد.' };
        }
        return { success: false, error: data.error || 'خطا در ابطال لایسنس' };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'خطای ارتباط با سرور';
        return { success: false, error: msg };
      }
    }

    await this.updateLocalLicenseStatus(cleanKey, 'REVOKED');
    return { success: true, message: 'لایسنس در سامانه محلی ابطال گردید.' };
  }

  private async updateLocalLicenseStatus(
    licenseKey: string,
    status: 'UNUSED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  ): Promise<void> {
    try {
      const raw = localStorage.getItem(this.getAdminStorageKey());
      if (raw) {
        const list: LicenseRecord[] = JSON.parse(raw);
        const updated = list.map((item) =>
          item.license_key === licenseKey ? { ...item, status } : item
        );
        localStorage.setItem(this.getAdminStorageKey(), JSON.stringify(updated));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clears local web simulation license state
   */
  public resetWebLicense(): void {
    try {
      localStorage.removeItem(WEB_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const licenseService = new LicenseService();
