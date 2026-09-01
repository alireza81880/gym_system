/**
 * Local Database Manager (Singleton)
 * Provides centralized access to the active DatabaseAdapter (Real SQLite / IndexedDB / Memory)
 * and coordinates initial migrations, transactions, and health checks.
 */

import { DatabaseAdapter, DatabaseMigrationReport } from './types';
import { RealSQLiteAdapter } from './realSqliteAdapter';
import { IndexedDbAdapter } from './indexedDbAdapter';
import { SQLiteMigrationEngine } from './sqliteMigrationEngine';
import { SQLiteSchema } from './sqliteSchema';
import { StoragePathService } from './storagePathService';

export class LocalDatabase {
  private static adapter: DatabaseAdapter | null = null;
  private static initPromise: Promise<DatabaseMigrationReport> | null = null;
  private static readonly CURRENT_SCHEMA_VERSION = SQLiteSchema.SCHEMA_VERSION;

  /**
   * Returns the active database adapter (defaults to RealSQLiteAdapter)
   */
  static getAdapter(): DatabaseAdapter {
    if (!this.adapter) {
      // By default, activate RealSQLiteAdapter for disk durability and true ACID transactions
      this.adapter = new RealSQLiteAdapter();
    }
    return this.adapter;
  }

  /**
   * Sets a custom adapter (e.g. for desktop native SQLite or browser IndexedDB fallback)
   */
  static setAdapter(customAdapter: DatabaseAdapter): void {
    this.adapter = customAdapter;
    this.initPromise = null;
  }

  /**
   * Initializes the database, applies schema migrations, and executes data verification
   */
  static async initialize(): Promise<DatabaseMigrationReport> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const startTime = performance.now();
      let adapter = this.getAdapter();

      try {
        try {
          await adapter.initialize();
        } catch (initErr) {
          const isDesktop = typeof window !== 'undefined' && Boolean((window as any).gymDesktopApi?.isDesktop);
          if (isDesktop) {
            console.error('[LocalDatabase] Fatal SQLite Initialization Error in Desktop Mode. Halting without silent fallback:', initErr);
            throw new Error(`خطای حیاتی در دسترسی به پایگاه‌داده محلی SQLite (%APPDATA%\\GymOS\\data): ${(initErr as Error).message}. امکان اجرای نرم‌افزار بدون ذخیره‌ساز اصلی وجود ندارد.`);
          }

          if (adapter instanceof RealSQLiteAdapter) {
            console.warn('[LocalDatabase] RealSQLiteAdapter initialization failed in browser mode, falling back to IndexedDbAdapter:', initErr);
            adapter = new IndexedDbAdapter();
            this.adapter = adapter;
            await adapter.initialize();
          } else {
            throw initErr;
          }
        }

        await adapter.migrate(1, this.CURRENT_SCHEMA_VERSION);

        let reportMessage = 'پایگاه‌داده SQLite راه‌اندازی شد.';
        let migratedMembers = 0;
        let migratedPayments = 0;
        let migratedAttendance = 0;

        if (adapter instanceof RealSQLiteAdapter) {
          const initRes = await SQLiteMigrationEngine.initializeAndMigrate(adapter);
          reportMessage = initRes.message;
          migratedMembers = initRes.migratedMembersCount;
          migratedPayments = initRes.migratedPaymentsCount;
          migratedAttendance = initRes.migratedAttendanceCount;
        }

        const durationMs = Math.round(performance.now() - startTime);

        return {
          schemaVersion: this.CURRENT_SCHEMA_VERSION,
          detectedLegacy: migratedMembers > 0,
          migratedMembersCount: migratedMembers,
          migratedPaymentsCount: migratedPayments,
          migratedAttendanceCount: migratedAttendance,
          durationMs,
          status: 'SUCCESS',
          message: reportMessage,
        };
      } catch (err) {
        console.error('[LocalDatabase] Initialization failure:', err);
        return {
          schemaVersion: this.CURRENT_SCHEMA_VERSION,
          detectedLegacy: false,
          migratedMembersCount: 0,
          migratedPaymentsCount: 0,
          migratedAttendanceCount: 0,
          durationMs: Math.round(performance.now() - startTime),
          status: 'ERROR',
          message: `خطا در راه‌اندازی پایگاه‌داده: ${(err as Error).message}`,
        };
      }
    })();

    return this.initPromise;
  }

  /**
   * Creates an atomic transaction block
   */
  static async transaction<T>(work: (tx: any) => Promise<T>): Promise<T> {
    return this.getAdapter().transaction(work);
  }

  /**
   * Exports full database snapshot as JSON string
   */
  static async exportFullBackup(): Promise<string> {
    const adapter = this.getAdapter();
    const snapshot = await adapter.exportSnapshot();
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Imports a full snapshot
   */
  static async importFullBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'فایل پشتیبان نامعتبر است.' };
      }
      const adapter = this.getAdapter();
      const success = await adapter.importSnapshot(parsed);
      if (success) {
        return { success: true, message: 'اطلاعات پشتیبان با موفقیت در پایگاه‌داده SQLite بازیابی شد.' };
      } else {
        return { success: false, message: 'خطا در اعمال داده‌های پشتیبان.' };
      }
    } catch (e) {
      return { success: false, message: `خطا در بازخوانی فایل: ${(e as Error).message}` };
    }
  }

  /**
   * Exports raw SQLite binary database file (.db)
   */
  static exportBinaryDatabase(): Uint8Array | null {
    const adapter = this.getAdapter();
    if (adapter instanceof RealSQLiteAdapter) {
      return adapter.exportBinaryDatabase();
    }
    return null;
  }

  /**
   * Diagnostic info for settings/admin screen
   */
  static getDiagnosticInfo() {
    const paths = StoragePathService.getPaths();
    return {
      adapterName: this.getAdapter().name,
      schemaVersion: this.CURRENT_SCHEMA_VERSION,
      databasePath: paths.databaseFile,
      backupsPath: paths.backupsDir,
      logsPath: paths.logsDir,
    };
  }
}
