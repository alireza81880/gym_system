/**
 * Local Database Manager (Singleton)
 * Provides centralized access to the active DatabaseAdapter (IndexedDB / SQLite / Memory)
 * and coordinates initial migrations and health checks.
 */

import { DatabaseAdapter, DatabaseMigrationReport } from './types';
import { IndexedDbAdapter } from './indexedDbAdapter';
import { SQLiteReadyAdapter } from './sqliteReadyAdapter';
import { LegacyStorageMigration } from './legacyMigration';

export class LocalDatabase {
  private static adapter: DatabaseAdapter | null = null;
  private static initPromise: Promise<DatabaseMigrationReport> | null = null;
  private static readonly CURRENT_SCHEMA_VERSION = 3;

  /**
   * Returns the active database adapter
   */
  static getAdapter(): DatabaseAdapter {
    if (!this.adapter) {
      // Default to IndexedDB in browser environment; fallback to SQLiteReady if in desktop runtime
      if (typeof window !== 'undefined' && window.indexedDB) {
        this.adapter = new IndexedDbAdapter('gym_os_production_db', this.CURRENT_SCHEMA_VERSION);
      } else {
        this.adapter = new SQLiteReadyAdapter();
      }
    }
    return this.adapter;
  }

  /**
   * Sets a custom adapter (e.g. for desktop SQLite testing or memory mocking)
   */
  static setAdapter(customAdapter: DatabaseAdapter): void {
    this.adapter = customAdapter;
    this.initPromise = null;
  }

  /**
   * Initializes the database, applies migrations, and executes legacy data transfer
   */
  static async initialize(): Promise<DatabaseMigrationReport> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const adapter = this.getAdapter();
      await adapter.initialize();
      await adapter.migrate(1, this.CURRENT_SCHEMA_VERSION);
      const report = await LegacyStorageMigration.checkAndMigrate(adapter);
      return report;
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
        return { success: true, message: 'اطلاعات پشتیبان با موفقیت بازیابی شد.' };
      } else {
        return { success: false, message: 'خطا در اعمال داده‌های پشتیبان.' };
      }
    } catch (e) {
      return { success: false, message: `خطا در بازخوانی فایل: ${(e as Error).message}` };
    }
  }
}
