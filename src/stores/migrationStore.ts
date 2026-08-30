import { createStore, useStore } from './createStore';
import { 
  ImportMappingProfile, 
  MigrationReport, 
  MigrationSnapshot,
  DuplicateResolution,
} from '../types';
import { 
  MigrationService,
  ImportValidationItem,
  ImportMode,
  HistoricalMigrationScope,
  CurrencyUnit,
  MigrationProgressState,
} from '../services/migrationService';
import { PersistenceManager } from '../services/repositories/persistenceManager';
import { MemberRepository } from '../services/repositories/memberRepository';
import { memberActions } from './memberStore';
import { settingsStore } from './settingsStore';
import { AuditService } from '../services/auditService';
import { RBACService } from '../services/rbacService';

export interface MigrationState {
  mappingProfiles: ImportMappingProfile[];
  migrationReports: MigrationReport[];
  migrationSnapshots: MigrationSnapshot[];
}

export const migrationStore = createStore<MigrationState>({
  mappingProfiles: PersistenceManager.get<ImportMappingProfile[]>('mapping_profiles', MigrationService.PRESET_PROFILES),
  migrationReports: PersistenceManager.get<MigrationReport[]>('migration_reports', []),
  migrationSnapshots: PersistenceManager.get<MigrationSnapshot[]>('migration_snapshots', []),
});

export const migrationActions = {
  saveMappingProfile(profile: ImportMappingProfile): void {
    const { currentUser } = settingsStore.getState();
    RBACService.requirePermission('migration.import', currentUser, {
      actionName: 'SAVE_MAPPING_PROFILE',
      description: 'ذخیره پروفایل نگاشت اکسل',
    });

    const existing = migrationStore.getState().mappingProfiles;
    const idx = existing.findIndex(p => p.id === profile.id);
    let next: ImportMappingProfile[];
    if (idx !== -1) {
      next = [...existing];
      next[idx] = profile;
    } else {
      next = [profile, ...existing];
    }
    migrationStore.setState({ mappingProfiles: next });
    PersistenceManager.setBatched('mapping_profiles', next);
  },

  deleteMappingProfile(id: string): void {
    const { currentUser } = settingsStore.getState();
    RBACService.requirePermission('migration.import', currentUser, {
      actionName: 'DELETE_MAPPING_PROFILE',
      description: 'حذف پروفایل نگاشت اکسل',
    });

    const next = migrationStore.getState().mappingProfiles.filter(p => p.id !== id);
    migrationStore.setState({ mappingProfiles: next });
    PersistenceManager.setBatched('mapping_profiles', next);
  },

  addReport(report: MigrationReport): void {
    const next = [report, ...migrationStore.getState().migrationReports];
    migrationStore.setState({ migrationReports: next });
    PersistenceManager.setBatched('migration_reports', next);
  },

  addSnapshot(snapshot: MigrationSnapshot): void {
    const next = [snapshot, ...migrationStore.getState().migrationSnapshots].slice(0, 10);
    migrationStore.setState({ migrationSnapshots: next });
    PersistenceManager.setBatched('migration_snapshots', next);
  },

  removeSnapshot(id: string): void {
    const next = migrationStore.getState().migrationSnapshots.filter(s => s.id !== id);
    migrationStore.setState({ migrationSnapshots: next });
    PersistenceManager.setBatched('migration_snapshots', next);
  },

  async executeMigration(
    validatedItems: ImportValidationItem[],
    conflictResolutions: Record<string, DuplicateResolution>,
    options: { 
      sourceType: string; 
      fileName?: string;
      importMode?: ImportMode;
      scope?: HistoricalMigrationScope;
      currencyUnit?: CurrencyUnit;
      preserveMemberNumbers?: boolean;
      defaultCoachId?: string;
    },
    onProgress?: (progress: MigrationProgressState) => void
  ): Promise<MigrationReport> {
    const { currentUser, organizationInfo, activeBranchId, coaches } = settingsStore.getState();
    
    // RBAC Permission Check at Service Level
    RBACService.requirePermission('migration.import', currentUser, {
      actionName: 'EXECUTE_MIGRATION',
      entityType: 'member',
      description: `انتقال داده‌ها از منبع ${options.sourceType}`,
    });

    const students = MemberRepository.getAll();

    AuditService.logEvent({
      action: 'MIGRATION_STARTED',
      category: 'member',
      details: `شروع فرآیند انتقال داده‌ها از منبع ${options.sourceType} (${validatedItems.length} رکورد)`,
      userName: currentUser.fullName,
      actor: currentUser,
    });

    try {
      const result = await MigrationService.executeImport(
        validatedItems,
        students,
        conflictResolutions,
        {
          tenantId: organizationInfo.tenantId,
          branchId: activeBranchId,
          defaultCoachId: options.defaultCoachId || coaches[0]?.id || '',
          sourceType: options.sourceType,
          fileName: options.fileName,
          importMode: options.importMode,
          scope: options.scope,
          currencyUnit: options.currencyUnit,
          preserveMemberNumbers: options.preserveMemberNumbers,
        },
        onProgress
      );

      if (result.report.status === 'FAILED') {
        AuditService.logEvent({
          action: 'MIGRATION_FAILED',
          category: 'member',
          details: `عملیات انتقال داده‌ها ناموفق بود: ${result.report.errors?.[0]?.message || 'خطای ساختار داده'}`,
          userName: currentUser.fullName,
          actor: currentUser,
          result: 'denied',
        });
        migrationActions.addReport(result.report);
        return result.report;
      }

      memberActions.batchSet(result.updatedStudents);
      migrationActions.addReport(result.report);
      migrationActions.addSnapshot(result.snapshot);

      const auditAction = result.report.status === 'PARTIAL' ? 'MIGRATION_PARTIAL' : 'MIGRATION_COMPLETED';
      AuditService.logSensitiveMutation({
        actor: currentUser,
        action: auditAction,
        entityType: 'member',
        description: `مهاجرت داده‌ها از منبع ${options.sourceType} با وضعیت ${result.report.status} پایان یافت: ${result.report.importedCount} عضو جدید، ${result.report.updatedCount} به‌روزرسانی.`,
        metadata: {
          importedCount: result.report.importedCount,
          updatedCount: result.report.updatedCount,
          snapshotId: result.snapshot.id,
        },
        result: 'success',
      });

      return result.report;
    } catch (err) {
      AuditService.logEvent({
        action: 'MIGRATION_FAILED',
        category: 'member',
        details: `انتقال اطلاعات با خطای سیستمی مواجه شد: ${(err as Error).message}`,
        userName: currentUser.fullName,
        actor: currentUser,
        result: 'denied',
      });
      throw err;
    }
  },

  rollbackMigration(snapshotId: string): boolean {
    const { currentUser } = settingsStore.getState();

    // Enforce RBAC Permission Check for rollback
    RBACService.requirePermission('migration.rollback', currentUser, {
      actionName: 'ROLLBACK_MIGRATION',
      entityType: 'member',
      description: `بازگردانی اسنپ‌شات مهاجرت #${snapshotId}`,
    });

    const snapshots = migrationStore.getState().migrationSnapshots;
    const snapshot = snapshots.find(s => s.id === snapshotId);
    if (!snapshot) return false;

    try {
      const beforeCount = MemberRepository.getAll().length;
      const restored = MigrationService.rollback(snapshot);
      memberActions.batchSet(restored);
      migrationActions.removeSnapshot(snapshotId);

      AuditService.logSensitiveMutation({
        actor: currentUser,
        action: 'MIGRATION_ROLLBACK',
        entityType: 'member',
        description: `بازگردانی داده‌های مهاجرت با شناسه snapshot #${snapshotId} توسط «${currentUser.fullName}» با موفقیت انجام شد.`,
        beforeState: { memberCount: beforeCount },
        afterState: { memberCount: restored.length, snapshotId },
        result: 'success',
      });
      return true;
    } catch (err) {
      AuditService.logSecurityViolation(
        currentUser,
        'ROLLBACK_FAILED',
        'Rollback Migration',
        `خطا در بازگردانی اسنپ‌شات: ${(err as Error).message}`
      );
      return false;
    }
  }
};

export function useMigrationStore<S = MigrationState>(selector?: (state: MigrationState) => S): S {
  return useStore(migrationStore, selector);
}

export function useMigration() {
  const state = useStore(migrationStore);
  return {
    ...state,
    ...migrationActions,
  };
}

