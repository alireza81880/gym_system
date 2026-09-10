/**
 * Gym OS - Licensing Service
 * Provides frontend interface to the desktop licensing engine and audits all licensing lifecycle events.
 */

import { LicenseInfo, LicenseActivationResult, LicenseStatus } from '../types/license';
import { AuditService } from './auditService';

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

    if (cleanKey === 'GYM-2026-MISMATCH') {
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
        message: 'این لایسنس قبلاً روی دستگاه دیگری فعال شده است',
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
      error: 'INVALID_KEY',
      message: 'لایسنس نامعتبر است',
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
