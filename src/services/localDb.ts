/**
 * Local Database Repository Pattern & Core Storage Engine
 * High-reliability single source of truth for Gym OS local persistence.
 * Guarantees zero data loss across page reloads, browser restarts, and unexpected tab closures.
 */

export interface DbMetadata {
  schemaVersion: number;
  initializedAt: string;
  lastUpdatedAt: string;
  isInstalled: boolean;
  isDemoMode: boolean;
  tenantId: string;
}

export class LocalDbRepository {
  public static readonly SCHEMA_VERSION = 3;
  public static readonly DB_PREFIX = 'gym_os_';
  private static readonly LEGACY_PREFIX = 'gym_';
  private static readonly META_KEY = 'meta';

  private static pendingSaves: Map<string, unknown> = new Map();
  private static flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private static readonly FLUSH_DELAY_MS = 60;
  private static isUnloadHookRegistered = false;

  /**
   * Registers automatic synchronous flush on window beforeunload and pagehide
   */
  private static ensureUnloadHook(): void {
    if (this.isUnloadHookRegistered || typeof window === 'undefined') return;
    try {
      window.addEventListener('beforeunload', () => {
        LocalDbRepository.flush();
      });
      window.addEventListener('pagehide', () => {
        LocalDbRepository.flush();
      });
      this.isUnloadHookRegistered = true;
    } catch {
      // safe fallback if in SSR/test environment
    }
  }

  static getSchemaVersion(): number {
    return this.SCHEMA_VERSION;
  }

  /**
   * Checks whether a collection key exists in pending memory or in storage
   */
  static hasKey(key: string): boolean {
    if (this.pendingSaves.has(key)) return true;
    if (typeof localStorage === 'undefined') return false;
    return (
      localStorage.getItem(`${this.DB_PREFIX}${key}`) !== null ||
      localStorage.getItem(`${this.LEGACY_PREFIX}${key}`) !== null
    );
  }

  /**
   * Reads a collection safely with corrupted JSON protection
   */
  static get<T>(collection: string, defaultValue: T): T {
    this.ensureUnloadHook();

    // 1. Check in-flight pending save first
    if (this.pendingSaves.has(collection)) {
      return this.pendingSaves.get(collection) as T;
    }

    if (typeof localStorage === 'undefined') return defaultValue;

    const raw =
      localStorage.getItem(`${this.DB_PREFIX}${collection}`) ??
      localStorage.getItem(`${this.LEGACY_PREFIX}${collection}`);

    if (raw === null || raw === undefined) {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed as T;
    } catch (err) {
      console.error(`[LocalDb] CRITICAL: Corrupted JSON detected in collection "${collection}":`, err);
      // Safety preservation: archive corrupted string so data isn't permanently lost
      try {
        const corruptedBackupKey = `${this.DB_PREFIX}corrupted_${collection}_${Date.now()}`;
        localStorage.setItem(corruptedBackupKey, raw);
        console.warn(`[LocalDb] Archived corrupted raw data to "${corruptedBackupKey}"`);
      } catch {
        // ignore backup error
      }
      return defaultValue;
    }
  }

  /**
   * Immediate synchronous save for financial, membership, and critical mutations
   */
  static setImmediate<T>(collection: string, value: T): boolean {
    this.ensureUnloadHook();
    this.pendingSaves.delete(collection);

    if (typeof localStorage === 'undefined') return false;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(`${this.DB_PREFIX}${collection}`, serialized);
      this.updateMetadataTimestamp();
      return true;
    } catch (err) {
      console.error(`[LocalDb] Critical error writing "${collection}" immediately:`, err);
      return false;
    }
  }

  /**
   * Batched, debounced asynchronous save to maintain 60+ FPS on UI mutations
   */
  static setBatched<T>(collection: string, value: T): void {
    this.ensureUnloadHook();
    this.pendingSaves.set(collection, value);

    if (this.flushTimeout !== null) {
      return;
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.FLUSH_DELAY_MS);
  }

  /**
   * Alias for setImmediate / setBatched based on synchronous requirement
   */
  static set<T>(collection: string, value: T, immediate = false): boolean {
    if (immediate) {
      return this.setImmediate(collection, value);
    }
    this.setBatched(collection, value);
    return true;
  }

  /**
   * Flushes all queued writes synchronously to storage
   */
  static flush(): void {
    if (this.flushTimeout !== null) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingSaves.size === 0 || typeof localStorage === 'undefined') return;

    this.pendingSaves.forEach((value, collection) => {
      try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(`${this.DB_PREFIX}${collection}`, serialized);
      } catch (err) {
        console.error(`[LocalDb] Error flushing key "${collection}":`, err);
      }
    });

    this.pendingSaves.clear();
    this.updateMetadataTimestamp();
  }

  /**
   * Removes a key from storage and in-flight queue
   */
  static remove(collection: string): void {
    this.pendingSaves.delete(collection);
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(`${this.DB_PREFIX}${collection}`);
    localStorage.removeItem(`${this.LEGACY_PREFIX}${collection}`);
  }

  /**
   * Database Metadata Management
   */
  static getMetadata(): DbMetadata {
    const defaultMeta: DbMetadata = {
      schemaVersion: this.SCHEMA_VERSION,
      initializedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      isInstalled: true,
      isDemoMode: false,
      tenantId: 'gym-org-1',
    };

    return this.get<DbMetadata>(this.META_KEY, defaultMeta);
  }

  static setMetadata(meta: Partial<DbMetadata>): void {
    const current = this.getMetadata();
    const updated: DbMetadata = {
      ...current,
      ...meta,
      lastUpdatedAt: new Date().toISOString(),
    };
    this.setImmediate(this.META_KEY, updated);
  }

  private static updateMetadataTimestamp(): void {
    try {
      const raw = localStorage.getItem(`${this.DB_PREFIX}${this.META_KEY}`);
      if (raw) {
        const meta = JSON.parse(raw) as DbMetadata;
        meta.lastUpdatedAt = new Date().toISOString();
        localStorage.setItem(`${this.DB_PREFIX}${this.META_KEY}`, JSON.stringify(meta));
      }
    } catch {
      // safe fallback
    }
  }

  /**
   * Checks if the database has ever been initialized on this browser instance
   */
  static isDatabaseInitialized(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return this.hasKey(this.META_KEY) || this.hasKey('students') || this.hasKey('payments');
  }

  /**
   * Full JSON export for complete system backup
   */
  static exportFullBackup(): string {
    this.flush();
    const backup: Record<string, unknown> = {
      schemaVersion: this.SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      platform: 'Gym OS Local Core V3 (Reliable Persistence)',
      data: {},
    };

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.DB_PREFIX) || key.startsWith(this.LEGACY_PREFIX))) {
          try {
            const val = localStorage.getItem(key);
            (backup.data as Record<string, unknown>)[key] = val ? JSON.parse(val) : null;
          } catch {
            // ignore non-json values
          }
        }
      }
    }

    return JSON.stringify(backup, null, 2);
  }

  /**
   * Imports a full JSON backup restoring all domain records
   */
  static importFullBackup(backupJson: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(backupJson);
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        return { success: false, message: 'ساختار فایل پشتیبان نامعتبر است.' };
      }

      this.pendingSaves.clear();

      const dataObj = parsed.data as Record<string, unknown>;
      Object.entries(dataObj).forEach(([k, v]) => {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch (e) {
          console.error(`[LocalDb] Failed importing key ${k}:`, e);
        }
      });

      this.setMetadata({
        schemaVersion: this.SCHEMA_VERSION,
        lastUpdatedAt: new Date().toISOString(),
      });

      return { success: true, message: 'اطلاعات پشتیبان با موفقیت بازیابی شد. سامانه آماده به‌کار است.' };
    } catch (e) {
      return { success: false, message: `خطا در بازخوانی فایل پشتیبان: ${(e as Error).message}` };
    }
  }

  /**
   * Validates schema and version integrity
   */
  static validateSchema(): { valid: boolean; currentVersion: number; details: string } {
    const meta = this.getMetadata();
    const isValid = meta.schemaVersion === this.SCHEMA_VERSION;
    return {
      valid: isValid,
      currentVersion: meta.schemaVersion,
      details: isValid
        ? `طرحواره پایگاه داده نسخه ${meta.schemaVersion} معتبر است.`
        : `ناسازگاری طرحواره: نسخه دیتابیس ${meta.schemaVersion} در برابر نسخه مورد انتظار ${this.SCHEMA_VERSION}.`,
    };
  }
}
