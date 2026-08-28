/**
 * High-Performance Persistence Manager
 * Uses targeted key-value storage and batched dirty flushing
 * to avoid serializing the entire application state on every user action.
 */

export class PersistenceManager {
  private static readonly DB_PREFIX = 'gym_os_';
  private static pendingSaves: Map<string, unknown> = new Map();
  private static flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private static readonly FLUSH_DELAY_MS = 80;

  /**
   * Reads a collection from local storage safely
   */
  static get<T>(key: string, defaultValue: T): T {
    try {
      // Check if there is an in-flight pending save first
      if (this.pendingSaves.has(key)) {
        return this.pendingSaves.get(key) as T;
      }

      const raw = localStorage.getItem(`${this.DB_PREFIX}${key}`) || localStorage.getItem(`gym_${key}`);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[PersistenceManager] Error reading key "${key}":`, e);
      return defaultValue;
    }
  }

  /**
   * Targeted immediate save for critical transactions
   */
  static setImmediate<T>(key: string, value: T): boolean {
    try {
      this.pendingSaves.delete(key);
      localStorage.setItem(`${this.DB_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[PersistenceManager] Failed immediate save for "${key}":`, e);
      return false;
    }
  }

  /**
   * Batched, debounced asynchronous save to keep UI thread at 60+ FPS
   */
  static setBatched<T>(key: string, value: T): void {
    this.pendingSaves.set(key, value);

    if (this.flushTimeout !== null) {
      return;
    }

    this.flushTimeout = setTimeout(() => {
      this.flushPendingSaves();
    }, this.FLUSH_DELAY_MS);
  }

  /**
   * Flushes all pending queued writes
   */
  static flushPendingSaves(): void {
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingSaves.size === 0) return;

    this.pendingSaves.forEach((value, key) => {
      try {
        localStorage.setItem(`${this.DB_PREFIX}${key}`, JSON.stringify(value));
      } catch (e) {
        console.error(`[PersistenceManager] Failed flushing "${key}":`, e);
      }
    });

    this.pendingSaves.clear();
  }

  /**
   * Removes a key from storage
   */
  static remove(key: string): void {
    this.pendingSaves.delete(key);
    localStorage.removeItem(`${this.DB_PREFIX}${key}`);
    localStorage.removeItem(`gym_${key}`);
  }

  /**
   * Creates a full JSON backup of all Gym OS data
   */
  static exportFullBackup(): string {
    this.flushPendingSaves();
    const backup: Record<string, unknown> = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      platform: 'Gym OS Local V2.4 (High Performance Engine)',
      data: {},
    };

    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && (storageKey.startsWith(this.DB_PREFIX) || storageKey.startsWith('gym_'))) {
        try {
          const val = localStorage.getItem(storageKey);
          (backup.data as Record<string, unknown>)[storageKey] = val ? JSON.parse(val) : null;
        } catch {
          // ignore non-json
        }
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Imports a full JSON backup
   */
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
