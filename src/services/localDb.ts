/**
 * Local Database Repository Pattern
 * Abstraction layer for local persistence (LocalStorage/IndexedDB -> SQLite/Tauri -> Cloud Postgres)
 */

export interface DbSchemaMetadata {
  version: number;
  lastMigratedAt: string;
  tenantId: string;
}

export class LocalDbRepository {
  private static readonly SCHEMA_VERSION = 2;
  private static readonly DB_PREFIX = 'gym_os_';

  static getSchemaVersion(): number {
    return this.SCHEMA_VERSION;
  }

  static get<T>(collection: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`${this.DB_PREFIX}${collection}`) || localStorage.getItem(`gym_${collection}`);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`[LocalDb] Failed to read ${collection}`, e);
      return defaultValue;
    }
  }

  static set<T>(collection: string, value: T): boolean {
    try {
      localStorage.setItem(`${this.DB_PREFIX}${collection}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[LocalDb] Failed to write ${collection}`, e);
      return false;
    }
  }

  static remove(collection: string): void {
    localStorage.removeItem(`${this.DB_PREFIX}${collection}`);
    localStorage.removeItem(`gym_${collection}`);
  }

  static exportFullBackup(): string {
    const backup: Record<string, unknown> = {
      schemaVersion: this.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      platform: 'Gym OS Local V2.4',
      data: {},
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(this.DB_PREFIX) || key.startsWith('gym_'))) {
        try {
          const val = localStorage.getItem(key);
          (backup.data as Record<string, unknown>)[key] = val ? JSON.parse(val) : null;
        } catch {
          // ignore non-json
        }
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  static importFullBackup(backupJson: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است.' };
      }

      const dataObj = parsed.data as Record<string, unknown>;
      Object.entries(dataObj).forEach(([k, v]) => {
        localStorage.setItem(k, JSON.stringify(v));
      });

      return { success: true, message: 'اطلاعات با موفقیت بازیابی شد. سامانه آماده به‌کار است.' };
    } catch (e) {
      return { success: false, message: `خطا در بازخوانی فایل پشتیبان: ${(e as Error).message}` };
    }
  }
}
