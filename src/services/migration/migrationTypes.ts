import { Student, MembershipPackage, PaymentRecord, AttendanceRecord, CustomField } from '../../types';

export type MigrationSourceType = 'xlsx' | 'csv' | 'json' | 'sql' | 'api' | 'vendor';

export type MigrationStep = 
  | 'source'
  | 'upload'
  | 'analyze'
  | 'map'
  | 'validate'
  | 'duplicates'
  | 'preview'
  | 'importing'
  | 'report';

export type DuplicateConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type DuplicateResolution = 'merge' | 'skip' | 'use_imported' | 'keep_existing' | 'create_new';

export type ImportMode = 'create_and_update' | 'create_only' | 'update_only';

export type HistoricalMigrationScope = 'members_only' | 'current_membership' | 'full_migration';

export type CurrencyUnit = 'toman' | 'rial';

export interface ParseResult {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
  sheets?: { name: string; rowCount: number }[];
  selectedSheet?: string;
  detectedDelimiter?: string;
  sourceType: MigrationSourceType;
  fileName?: string;
  fileSize?: number;
  detectedEntities?: {
    membersCount: number;
    paymentsCount: number;
    attendanceCount: number;
  };
}

export interface FieldConflict {
  field: string;
  fieldLabel: string;
  existingValue: any;
  incomingValue: any;
  resolvedValue?: any;
  chosenSource?: 'existing' | 'imported' | 'custom';
}

export interface ImportValidationItem {
  rowIndex: number;
  data: Record<string, any>;
  mappedMember: Partial<Student>;
  associatedPayments?: Partial<PaymentRecord>[];
  associatedAttendance?: Partial<AttendanceRecord>[];
  isValid: boolean;
  isDuplicate: boolean;
  confidence?: DuplicateConfidence;
  duplicateMatch?: Student;
  matchReason?: 'memberNumber' | 'nationalId' | 'phone' | 'name' | 'mixed';
  conflicts: FieldConflict[];
  resolution?: DuplicateResolution;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error' | 'duplicate';
}

export interface ImportMappingProfile {
  id: string;
  name: string;
  description?: string;
  sourceType: MigrationSourceType;
  sourceVendor?: string;
  mappings: Record<string, string>;
  fullNameMode?: 'combined' | 'split' | 'preserve';
  currencyUnit?: CurrencyUnit | string;
  customTransforms?: Record<string, string>;
  ignoredColumns?: string[];
  isSystemTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationOptions {
  tenantId: string;
  branchId: string;
  defaultCoachId: string;
  sourceType: MigrationSourceType;
  fileName?: string;
  importMode: ImportMode;
  scope: HistoricalMigrationScope;
  currencyUnit: CurrencyUnit;
  preserveMemberNumbers: boolean;
  createMissingPackages: boolean;
  createMissingCoaches: boolean;
  globalConflictResolution: DuplicateResolution;
}

export interface MigrationProgressState {
  currentStepTitle: string;
  currentStepIndex: number;
  totalSteps: number;
  overallPercentage: number;
  recordsProcessed: number;
  recordsTotal: number;
  currentErrors: number;
  elapsedSeconds: number;
  isCancelled: boolean;
}

export interface MigrationErrorRecord {
  row: number;
  field: string;
  message: string;
  data?: any;
}

export interface MigrationReport {
  id: string;
  migrationId: string;
  timestamp: string;
  sourceType: string;
  fileName?: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  duplicatesCount: number;
  conflictCount: number;
  errorCount: number;
  warningCount?: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CANCELLED' | 'ROLLED_BACK';
  errors: MigrationErrorRecord[];
  rollbackAvailable: boolean;
  durationMs?: number;
  scope?: any;
  importMode?: any;
}

export interface MigrationSnapshot {
  id: string;
  timestamp: string;
  description: string;
  dataBackup: string; // JSON of students, payments, attendance
}

export interface ApiImportConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  authType: 'none' | 'api_key' | 'bearer' | 'basic' | 'custom_header';
  apiKeyHeader?: string;
  apiKeyValue?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  customHeaders?: Record<string, string>;
  jsonPath?: string;
  pageParam?: string;
  limitParam?: string;
}

export interface VendorConnectorMetadata {
  id: string;
  vendorName: string;
  vendorTitleFa: string;
  descriptionFa: string;
  logoIcon?: string;
  supportedVersions: string[];
  status: 'supported' | 'coming_soon' | 'requires_gateway';
  supportedEntities: ('members' | 'memberships' | 'payments' | 'attendance' | 'lockers')[];
  defaultFields: Record<string, string>;
}
