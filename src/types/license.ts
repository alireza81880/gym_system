/**
 * Gym OS - License & Anti-Copy Types
 * Production licensing models, state declarations, and response contracts.
 */

export type LicenseStatus =
  | 'UNACTIVATED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'DEVICE_MISMATCH'
  | 'EXPIRED'
  | 'REVOKED'
  | 'RECOVERY_REQUIRED';

export type DeviceBindingStatus =
  | 'BOUND_MATCHED'
  | 'MISMATCH'
  | 'UNBOUND'
  | 'TAMPERED';

export interface LicenseInfo {
  status: LicenseStatus;
  licenseId: string | null;
  gymId: string | null;
  gymName: string | null;
  plan: string | null;
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
  boundDeviceMasked?: string;
  newRecoveryCode?: string;
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
  recoverLicense?: (licenseKey: string, recoveryCode: string) => Promise<LicenseActivationResult>;
  getDeviceFingerprint?: () => Promise<string>;
  log?: (level: string, message: string, meta?: unknown) => void;
  onBeforeQuit?: (callback: () => void) => void;
}

declare global {
  interface Window {
    gymDesktopApi?: GymDesktopApi;
  }
}
