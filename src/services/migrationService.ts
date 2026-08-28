import { 
  Student, 
  ImportMappingProfile, 
  MigrationReport, 
  MigrationSnapshot, 
  DuplicateResolution,
  ApiImportConfig
} from '../types';
import { ExcelImporter } from './migration/importers/excelImporter';
import { CsvImporter } from './migration/importers/csvImporter';
import { JsonImporter } from './migration/importers/jsonImporter';
import { SqlImporter } from './migration/importers/sqlImporter';
import { ApiImporter } from './migration/importers/apiImporter';
import { VendorImporter } from './migration/importers/vendorImporter';
import { MappingEngine } from './migration/mappingEngine';
import { MigrationEngine } from './migration/migrationEngine';
import { MigrationNormalizers } from './migration/normalizers';
import { 
  ParseResult, 
  ImportValidationItem, 
  MigrationOptions,
  MigrationProgressState
} from './migration/migrationTypes';

export * from './migration/migrationTypes';
export * from './migration/normalizers';
export * from './migration/mappingEngine';
export * from './migration/duplicateEngine';
export * from './migration/migrationEngine';
export * from './migration/importers/excelImporter';
export * from './migration/importers/csvImporter';
export * from './migration/importers/jsonImporter';
export * from './migration/importers/sqlImporter';
export * from './migration/importers/apiImporter';
export * from './migration/importers/vendorImporter';

export class MigrationService {
  static readonly PRESET_PROFILES: ImportMappingProfile[] = MappingEngine.SYSTEM_TEMPLATES;

  static async parseXlsx(file: File, selectedSheet?: string): Promise<ParseResult> {
    return ExcelImporter.parse(file, selectedSheet);
  }

  static parseCsv(text: string, fileName?: string, forcedDelimiter?: string): ParseResult {
    return CsvImporter.parse(text, fileName, forcedDelimiter);
  }

  static parseJson(jsonString: string, fileName?: string, jsonPath?: string): ParseResult {
    return JsonImporter.parse(jsonString, fileName, jsonPath);
  }

  static inspectSqlBackup(sqlContent: string) {
    return SqlImporter.inspect(sqlContent);
  }

  static async fetchFromApi(config: ApiImportConfig): Promise<ParseResult> {
    return ApiImporter.fetchFromApi(config);
  }

  static suggestMappings(columns: string[]): Record<string, string> {
    return MappingEngine.suggestMappings(columns);
  }

  static validateAndPreview(
    rows: Record<string, any>[],
    mappings: Record<string, string>,
    existingStudents: Student[],
    options: {
      fullNameMode?: 'split' | 'preserve';
      currencyUnit?: 'toman' | 'rial';
    } = {}
  ): ImportValidationItem[] {
    return MigrationEngine.validateRows(rows, mappings, existingStudents, {
      fullNameMode: options.fullNameMode || 'split',
      currencyUnit: options.currencyUnit || 'toman',
    });
  }

  static async executeImport(
    validatedItems: ImportValidationItem[],
    existingStudents: Student[],
    conflictResolutions: Record<string, DuplicateResolution>,
    options: {
      tenantId: string;
      branchId: string;
      defaultCoachId?: string;
      sourceType: string;
      fileName?: string;
      importMode?: 'create_and_update' | 'create_only' | 'update_only';
      scope?: 'members_only' | 'current_membership' | 'full_migration';
      currencyUnit?: 'toman' | 'rial';
      preserveMemberNumbers?: boolean;
      createMissingPackages?: boolean;
      createMissingCoaches?: boolean;
      globalConflictResolution?: DuplicateResolution;
    },
    onProgress?: (progress: MigrationProgressState) => void
  ): Promise<{
    updatedStudents: Student[];
    report: MigrationReport;
    snapshot: MigrationSnapshot;
  }> {
    const defaultOptions: MigrationOptions = {
      tenantId: options.tenantId,
      branchId: options.branchId,
      defaultCoachId: options.defaultCoachId || '',
      sourceType: options.sourceType as any,
      fileName: options.fileName,
      importMode: options.importMode || 'create_and_update',
      scope: options.scope || 'members_only',
      currencyUnit: options.currencyUnit || 'toman',
      preserveMemberNumbers: options.preserveMemberNumbers !== undefined ? options.preserveMemberNumbers : true,
      createMissingPackages: options.createMissingPackages !== undefined ? options.createMissingPackages : false,
      createMissingCoaches: options.createMissingCoaches !== undefined ? options.createMissingCoaches : false,
      globalConflictResolution: options.globalConflictResolution || 'merge',
    };

    const result = await MigrationEngine.executeImport(
      validatedItems,
      existingStudents,
      conflictResolutions,
      defaultOptions,
      onProgress
    );

    return result;
  }

  static rollback(snapshot: MigrationSnapshot): Student[] {
    return MigrationEngine.rollback(snapshot);
  }
}
