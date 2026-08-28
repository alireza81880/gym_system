/**
 * Local Production Database Abstraction Types
 * Defines the contract for local persistence engines (IndexedDB, SQLite, Memory, Cloud)
 */

export interface QueryOptions<T = any> {
  limit?: number;
  offset?: number;
  orderBy?: keyof T | string;
  orderDirection?: 'asc' | 'desc';
  indexName?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface DatabaseTransaction {
  getById<T>(collection: string, id: string): Promise<T | null>;
  insert<T>(collection: string, item: T): Promise<T>;
  update<T>(collection: string, id: string, partial: Partial<T>): Promise<T>;
  delete(collection: string, id: string): Promise<boolean>;
  query<T>(collection: string, filter?: (item: T) => boolean): Promise<T[]>;
}

export interface DatabaseAdapter {
  readonly name: string;
  readonly isAsync: boolean;

  /**
   * Initializes the database connection and object stores/tables
   */
  initialize(): Promise<void>;

  /**
   * Runs schema migrations if version changed
   */
  migrate(fromVersion: number, toVersion: number): Promise<void>;

  /**
   * Executes multiple operations inside an atomic transaction
   */
  transaction<T>(work: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;

  /**
   * Fetches an entity by primary key ID
   */
  getById<T>(collection: string, id: string): Promise<T | null>;

  /**
   * Queries entities with optional filtering and pagination
   */
  query<T>(collection: string, filter?: (item: T) => boolean, options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Inserts a single record
   */
  insert<T extends { id?: string }>(collection: string, item: T): Promise<T>;

  /**
   * Updates an existing record
   */
  update<T>(collection: string, id: string, partial: Partial<T>): Promise<T>;

  /**
   * Deletes a record by ID
   */
  delete(collection: string, id: string): Promise<boolean>;

  /**
   * Counts records in a collection
   */
  count(collection: string, filter?: (item: any) => boolean): Promise<number>;

  /**
   * Bulk inserts multiple records
   */
  bulkInsert<T extends { id?: string }>(collection: string, items: T[]): Promise<void>;

  /**
   * Overwrites entire collection safely
   */
  bulkSet<T extends { id?: string }>(collection: string, items: T[]): Promise<void>;

  /**
   * Clears a collection
   */
  clear(collection: string): Promise<void>;

  /**
   * Exports full database snapshot
   */
  exportSnapshot(): Promise<Record<string, unknown>>;

  /**
   * Imports a full snapshot
   */
  importSnapshot(snapshot: Record<string, unknown>): Promise<boolean>;

  /**
   * Closes database connection
   */
  close(): Promise<void>;
}

export interface DatabaseMigrationReport {
  schemaVersion: number;
  detectedLegacy: boolean;
  migratedMembersCount: number;
  migratedPaymentsCount: number;
  migratedAttendanceCount: number;
  durationMs: number;
  status: 'SUCCESS' | 'NO_LEGACY_FOUND' | 'ERROR';
  message: string;
}
