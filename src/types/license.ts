/**
 * Gym OS - License & Anti-Copy Types
 * Production licensing models, state declarations, and response contracts.
 */

export type LicenseStatus =
  | 'UNACTIVATED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'DEVICE_MISMATCH'
  | 'DEVICE_LIMIT_REACHED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'RECOVERY_REQUIRED'
  | 'CLOCK_ROLLBACK_DETECTED'
  | 'LICENSE_STATE_TAMPERED';

export type LicenseErrorCode =
  | 'INVALID_LICENSE'
  | 'EXPIRED_LICENSE'
  | 'REVOKED_LICENSE'
  | 'DEVICE_LIMIT_REACHED'
  | 'DEVICE_MISMATCH'
  | 'INVALID_RECOVERY_CODE'
  | 'CLOCK_ROLLBACK_DETECTED'
  | 'LICENSE_STATE_TAMPERED'
  | 'NETWORK_ERROR'
  | 'SERVER_UNCONFIGURED';

export type DeviceBindingStatus =
  | 'BOUND_MATCHED'
  | 'MISMATCH'
  | 'UNBOUND'
  | 'TAMPERED';

export type LicenseType = 'TRIAL' | 'YEARLY' | 'MULTI_YEAR' | 'LIFETIME' | 'CUSTOM';

export interface LicenseRecord {
  id?: string;
  license_key: string;
  customer_name: string;
  plan: string;
  duration_months: number | null;
  license_type: LicenseType;
  created_at: string;
  expires_at: string | null;
  max_devices: number;
  recovery_code: string;
  status: 'UNUSED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  active_devices_count?: number;
  notes?: string;
}

export interface CreateLicenseInput {
  customer_name: string;
  plan?: string;
  license_type?: LicenseType;
  duration_months?: number | null;
  max_devices?: number;
  custom_license_key?: string;
  notes?: string;
}

export interface LicenseInfo {
  status: LicenseStatus;
  licenseId: string | null;
  gymId: string | null;
  gymName: string | null;
  customerName?: string | null;
  plan: string | null;
  licenseType?: LicenseType | string | null;
  durationMonths?: number | null;
  maxDevices?: number;
  activatedAt: string | null;
  expiresAt: string | null;
  deviceBindingStatus: DeviceBindingStatus;
  tokenVersion: number;
  deviceFingerprintMasked?: string;
  isOfflineValid: boolean;
  reason?: string;
  message?: string;
}

export interface LicenseActivationResult {
  success: boolean;
  status: LicenseStatus;
  message: string;
  licenseInfo?: LicenseInfo;
  error?: string;
  code?: string;
  boundDeviceMasked?: string;
  newRecoveryCode?: string;
  maxDevices?: number;
  activeDevicesCount?: number;
}

export interface GymDesktopApi {
  isDesktop?: boolean;
  platform?: string;
  getAppPaths?: () => Promise<Record<string, string>>;
  readDatabaseFile?: (path?: string) => Promise<number[] | null>;
  writeDatabaseFile?: (path: string, bytes: number[]) => Promise<boolean>;
  writeDatabaseFileSync?: (path: string, bytes: number[]) => void;
  createBackup?: () => Promise<{ success: boolean; backupPath?: string; filename?: string; message?: string }>;
  restoreBackup?: (backupPath: string) => Promise<{ success: boolean; message?: string }>;
  getLicenseStatus?: () => Promise<LicenseInfo>;
  activateLicense?: (licenseKey: string) => Promise<LicenseActivationResult>;
  deactivateLicense?: () => Promise<{ success: boolean; message?: string }>;
  activateOfflinePackage?: (packageData: unknown) => Promise<LicenseActivationResult>;
  recoverLicense?: (licenseKey: string, recoveryCode: string) => Promise<LicenseActivationResult>;
  getDeviceFingerprint?: () => Promise<string>;
  getRawDeviceFingerprint?: () => Promise<string>;
  log?: (level: string, message: string, meta?: unknown) => void;
  onBeforeQuit?: (callback: () => void) => void;
}

declare global {
  interface Window {
    gymDesktopApi?: GymDesktopApi;
  }
}
