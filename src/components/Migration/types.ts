import { 
  MigrationSourceType, 
  MigrationStep, 
  ParseResult, 
  ImportValidationItem, 
  ImportMappingProfile,
  MigrationOptions,
  MigrationReport
} from '../../services/migration/migrationTypes';

export interface MigrationWizardState {
  step: MigrationStep;
  sourceType: MigrationSourceType;
  selectedVendorId?: string;
  file?: File;
  rawText?: string;
  parseResult?: ParseResult;
  mappings: Record<string, string>;
  fullNameMode: 'split' | 'preserve';
  currencyUnit: 'toman' | 'rial';
  preserveMemberNumbers: boolean;
  importMode: 'create_and_update' | 'create_only' | 'update_only';
  scope: 'members_only' | 'current_membership' | 'full_migration';
  selectedSheet?: string;
  detectedDelimiter?: string;
  jsonPath?: string;
  validatedItems: ImportValidationItem[];
  conflictResolutions: Record<string, any>;
  activeProfileId?: string;
  matchedProfileBanner?: ImportMappingProfile | null;
}
