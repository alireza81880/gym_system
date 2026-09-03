/**
 * High-Performance Persistence Manager
 * Thin delegation wrapper around the unified LocalDbRepository core.
 * Ensures complete backward compatibility across all existing store hooks and repositories.
 */

import { LocalDbRepository, DbMetadata } from '../localDb';

export class PersistenceManager {
  /**
   * Reads a collection safely from storage
   */
  static get<T>(key: string, defaultValue: T): T {
    return LocalDbRepository.get<T>(key, defaultValue);
  }

  /**
   * Checks if a key exists in storage
   */
  static hasKey(key: string): boolean {
    return LocalDbRepository.hasKey(key);
  }

  /**
   * Targeted immediate save for critical mutations (financials, sales, member creation)
   */
  static setImmediate<T>(key: string, value: T): boolean {
    return LocalDbRepository.setImmediate<T>(key, value);
  }

  /**
   * Batched, debounced asynchronous save
   */
  static setBatched<T>(key: string, value: T): void {
    LocalDbRepository.setBatched<T>(key, value);
  }

  /**
   * Set value (alias)
   */
  static set<T>(key: string, value: T, immediate = false): boolean {
    return LocalDbRepository.set<T>(key, value, immediate);
  }

  /**
   * Flushes all pending queued writes
   */
  static flushPendingSaves(): void {
    LocalDbRepository.flush();
  }

  /**
   * Removes a key from storage
   */
  static remove(key: string): void {
    LocalDbRepository.remove(key);
  }

  /**
   * Metadata operations
   */
  static getMetadata(): DbMetadata {
    return LocalDbRepository.getMetadata();
  }

  static setMetadata(meta: Partial<DbMetadata>): void {
    LocalDbRepository.setMetadata(meta);
  }

  /**
   * Creates a full JSON backup of all Gym OS data
   */
  static exportFullBackup(): string {
    return LocalDbRepository.exportFullBackup();
  }

  /**
   * Imports a full JSON backup
   */
  static importFullBackup(backupJson: string): ReturnType<typeof LocalDbRepository.importFullBackup> {
    return LocalDbRepository.importFullBackup(backupJson);
  }
}
