import { Student, PaymentRecord, AttendanceRecord } from '../../types';
import { 
  ImportValidationItem, 
  MigrationOptions, 
  MigrationReport, 
  MigrationSnapshot, 
  DuplicateResolution, 
  MigrationProgressState,
  MigrationErrorRecord,
  DuplicateConfidence
} from './migrationTypes';
import { MigrationNormalizers } from './normalizers';
import { DuplicateEngine } from './duplicateEngine';
import { DateService } from '../dateService';
import { MemberService } from '../memberService';

export class MigrationEngine {
  /**
   * Validate and prepare all raw imported rows with duplicate detection and normalization
   */
  static validateRows(
    rows: Record<string, any>[],
    mappings: Record<string, string>,
    existingStudents: Student[],
    options: {
      fullNameMode: 'split' | 'preserve';
      currencyUnit: 'toman' | 'rial';
    }
  ): ImportValidationItem[] {
    const dupEngine = new DuplicateEngine(existingStudents);
    const results: ImportValidationItem[] = [];

    rows.forEach((row, idx) => {
      const mapped: Partial<Student> = {};
      const customFields: Record<string, any> = {};

      Object.entries(mappings).forEach(([sourceCol, targetField]) => {
        const rawVal = row[sourceCol];
        if (rawVal === undefined || rawVal === '') return;

        if (targetField.startsWith('custom:')) {
          const customKey = targetField.replace('custom:', '');
          customFields[customKey] = rawVal;
        } else {
          (mapped as any)[targetField] = rawVal;
        }
      });

      // Name Normalization & Splitting
      if (options.fullNameMode === 'split') {
        if (mapped.fullName && (!mapped.firstName || !mapped.lastName)) {
          const split = MigrationNormalizers.splitPersianFullName(mapped.fullName);
          mapped.firstName = mapped.firstName || split.firstName;
          mapped.lastName = mapped.lastName || split.lastName;
        } else if (!mapped.fullName && (mapped.firstName || mapped.lastName)) {
          mapped.fullName = `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
        }
      } else {
        if (!mapped.fullName && (mapped.firstName || mapped.lastName)) {
          mapped.fullName = `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
        }
      }

      // Member Number normalization (historical preservation)
      if (mapped.memberNumber) {
        mapped.memberNumber = MigrationNormalizers.toEnglishDigits(mapped.memberNumber).trim();
      }

      // Phone Normalization
      if (mapped.phone) {
        mapped.phone = MigrationNormalizers.normalizeMobilePhone(mapped.phone);
      }
      if (mapped.emergencyPhone) {
        mapped.emergencyPhone = MigrationNormalizers.normalizeMobilePhone(mapped.emergencyPhone);
      }

      // National ID Normalization
      if (mapped.nationalId) {
        mapped.nationalId = MigrationNormalizers.normalizeNationalId(mapped.nationalId);
      }

      // Date Normalization
      if (mapped.registrationDate) {
        mapped.registrationDate = MigrationNormalizers.normalizeDate(mapped.registrationDate);
      }
      if (mapped.expireDate) {
        mapped.expireDate = MigrationNormalizers.normalizeDate(mapped.expireDate);
      }
      if (mapped.birthDate) {
        mapped.birthDate = MigrationNormalizers.normalizeDate(mapped.birthDate);
      }

      // Financials Normalization & Currency Conversion
      const currencyDivisor = options.currencyUnit === 'rial' ? 10 : 1;

      if (mapped.totalFee !== undefined && mapped.totalFee !== null && (mapped.totalFee as any) !== '') {
        mapped.totalFee = Math.round(MigrationNormalizers.parseNumber(mapped.totalFee) / currencyDivisor);
      }
      if (mapped.paidAmount !== undefined && mapped.paidAmount !== null && (mapped.paidAmount as any) !== '') {
        mapped.paidAmount = Math.round(MigrationNormalizers.parseNumber(mapped.paidAmount) / currencyDivisor);
      }
      if (mapped.remainingDebt !== undefined && mapped.remainingDebt !== null && (mapped.remainingDebt as any) !== '') {
        mapped.remainingDebt = Math.round(MigrationNormalizers.parseNumber(mapped.remainingDebt) / currencyDivisor);
      } else if (mapped.totalFee !== undefined && mapped.paidAmount !== undefined) {
        mapped.remainingDebt = Math.max(0, (mapped.totalFee || 0) - (mapped.paidAmount || 0));
      }

      if (Object.keys(customFields).length > 0) {
        mapped.customFields = customFields;
      }

      // Validation Checks & Rules
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!mapped.fullName && !mapped.firstName) {
        errors.push('نام و نام خانوادگی عضو مشخص نشده است.');
      }

      if (mapped.phone && !/^09\d{9}$/.test(mapped.phone)) {
        warnings.push('فرمت شماره همراه استاندارد نیست (باید ۰۹xxxxxxxxx باشد).');
      }

      if (mapped.nationalId && !MigrationNormalizers.isValidNationalId(mapped.nationalId)) {
        warnings.push('کد ملی از نظر ساختار الگوریتمی معتبر نیست.');
      }

      // Duplicate Check
      const dupCheck = dupEngine.check(mapped);

      let status: 'valid' | 'warning' | 'error' | 'duplicate' = 'valid';
      if (errors.length > 0) {
        status = 'error';
      } else if (dupCheck.isDuplicate) {
        status = 'duplicate';
      } else if (warnings.length > 0) {
        status = 'warning';
      }

      results.push({
        rowIndex: idx + 1,
        data: row,
        mappedMember: mapped,
        isValid: errors.length === 0,
        isDuplicate: dupCheck.isDuplicate,
        confidence: dupCheck.confidence,
        duplicateMatch: dupCheck.match,
        matchReason: dupCheck.matchReason,
        conflicts: dupCheck.conflicts,
        errors,
        warnings,
        status,
      });
    });

    return results;
  }

  /**
   * Execute real chunked migration with progress updates and snapshot generation
   */
  static async executeImport(
    validatedItems: ImportValidationItem[],
    existingStudents: Student[],
    conflictResolutions: Record<string, DuplicateResolution>, // duplicateMatch.id -> resolution
    options: MigrationOptions,
    onProgress?: (progress: MigrationProgressState) => void
  ): Promise<{
    updatedStudents: Student[];
    report: MigrationReport;
    snapshot: MigrationSnapshot;
  }> {
    const startTime = Date.now();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const migrationId = `MIG-${dateStr}-${randomSuffix}`;

    // 1. Create Pre-Migration Safe Snapshot for instant 1-click rollback
    const snapshot: MigrationSnapshot = {
      id: migrationId,
      timestamp: new Date().toISOString(),
      description: `پشتیبان خودکار قبل از واردسازی ${options.fileName || options.sourceType} (#${migrationId})`,
      dataBackup: JSON.stringify(existingStudents),
    };

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let duplicatesCount = 0;
    let conflictCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    const errorsList: MigrationErrorRecord[] = [];

    const studentList: Student[] = [...existingStudents];
    const totalRecords = validatedItems.length;

    // Batch chunk processing (500 records per chunk for 60fps UI smoothness)
    const chunkSize = 200;
    const totalChunks = Math.ceil(totalRecords / chunkSize);

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
      const chunkStart = chunkIdx * chunkSize;
      const chunkEnd = Math.min(totalRecords, chunkStart + chunkSize);
      const currentChunk = validatedItems.slice(chunkStart, chunkEnd);

      currentChunk.forEach(item => {
        if (!item.isValid) {
          errorCount++;
          errorsList.push({
            row: item.rowIndex,
            field: 'general',
            message: item.errors.join(' | '),
            data: item.mappedMember,
          });
          return;
        }

        if (item.warnings.length > 0) {
          warningCount++;
        }

        // Handle duplicates & conflict resolution
        if (item.isDuplicate && item.duplicateMatch) {
          duplicatesCount++;
          const resolution = item.resolution || conflictResolutions[item.duplicateMatch.id] || options.globalConflictResolution || 'merge';

          if (resolution === 'skip' || resolution === 'keep_existing') {
            skippedCount++;
            return;
          }

          if (options.importMode === 'create_only') {
            skippedCount++;
            return;
          }

          if (resolution === 'use_imported' || resolution === 'merge') {
            conflictCount++;
            updatedCount++;
            const idx = studentList.findIndex(s => s.id === item.duplicateMatch!.id);
            if (idx !== -1) {
              const existing = studentList[idx];
              
              // Apply resolved conflict values if customized
              const mergedCustomFields = {
                ...(existing.customFields || {}),
                ...(item.mappedMember.customFields || {}),
              };

              studentList[idx] = {
                ...existing,
                ...item.mappedMember,
                id: existing.id, // Retain primary UUID
                tenantId: options.tenantId,
                branchId: options.branchId,
                customFields: mergedCustomFields,
              };
            }
            return;
          }
        }

        // Check if Import Mode is UPDATE ONLY
        if (options.importMode === 'update_only') {
          skippedCount++;
          return;
        }

        // Create new member
        importedCount++;
        
        // Calculate continuous member number if not provided or preserved
        let assignedMemberNum = item.mappedMember.memberNumber;
        if (!assignedMemberNum || !options.preserveMemberNumbers) {
          assignedMemberNum = MemberService.calculateNextMemberNumber(studentList);
        }

        const rawFullName = item.mappedMember.fullName || `${item.mappedMember.firstName || ''} ${item.mappedMember.lastName || ''}`.trim();

        // Safe data provenance metadata
        const mergedCustomFields = {
          ...(item.mappedMember.customFields || {}),
          sourceSystem: options.sourceType,
          migrationId,
          ...(options.fileName ? { sourceFileName: options.fileName } : {}),
          ...(item.data?.id !== undefined ? { sourceRecordId: String(item.data.id) } : {}),
        };

        const newStudent: Student = {
          id: `std-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          tenantId: options.tenantId,
          branchId: options.branchId,
          memberNumber: assignedMemberNum,
          firstName: item.mappedMember.firstName || '',
          lastName: item.mappedMember.lastName || '',
          fullName: rawFullName || '',
          nationalId: item.mappedMember.nationalId || '',
          phone: item.mappedMember.phone || '',
          emergencyPhone: item.mappedMember.emergencyPhone,
          coachId: item.mappedMember.coachId || options.defaultCoachId || '',
          packageType: item.mappedMember.packageType || '',
          registrationDate: item.mappedMember.registrationDate || '',
          expireDate: item.mappedMember.expireDate || '',
          totalFee: item.mappedMember.totalFee !== undefined ? Number(item.mappedMember.totalFee) : 0,
          paidAmount: item.mappedMember.paidAmount !== undefined ? Number(item.mappedMember.paidAmount) : 0,
          remainingDebt: item.mappedMember.remainingDebt !== undefined ? Number(item.mappedMember.remainingDebt) : 0,
          status: item.mappedMember.status || (item.mappedMember.expireDate ? 'active' : 'inactive'),
          sessionsTotal: typeof item.mappedMember.sessionsTotal === 'number' ? item.mappedMember.sessionsTotal : (item.mappedMember.sessionsTotal ? Number(item.mappedMember.sessionsTotal) : 0),
          sessionsAttended: typeof item.mappedMember.sessionsAttended === 'number' ? item.mappedMember.sessionsAttended : (item.mappedMember.sessionsAttended ? Number(item.mappedMember.sessionsAttended) : 0),
          medicalNotes: item.mappedMember.medicalNotes,
          rfidCardUid: item.mappedMember.rfidCardUid,
          notes: item.mappedMember.notes,
          customFields: mergedCustomFields,
        };

        studentList.push(newStudent);
      });

      // Report progress to UI
      if (onProgress) {
        const processed = chunkEnd;
        const pct = Math.round((processed / totalRecords) * 100);
        onProgress({
          currentStepTitle: `در حال واردسازی رکوردها (${processed} از ${totalRecords})...`,
          currentStepIndex: 3,
          totalSteps: 5,
          overallPercentage: pct,
          recordsProcessed: processed,
          recordsTotal: totalRecords,
          currentErrors: errorCount,
          elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
          isCancelled: false,
        });

        // Yield to main thread for non-blocking UI
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    const durationMs = Date.now() - startTime;

    let overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
    if (totalRecords === 0) {
      overallStatus = 'SUCCESS';
    } else if (errorCount > 0 && importedCount === 0 && updatedCount === 0) {
      overallStatus = 'FAILED';
    } else if (errorCount > 0 || skippedCount > 0 || warningCount > 0) {
      overallStatus = (errorCount > 0 || skippedCount > 0) ? 'PARTIAL' : 'SUCCESS';
    }

    const report: MigrationReport = {
      id: `rep-${Date.now()}`,
      migrationId,
      timestamp: new Date().toISOString(),
      sourceType: options.sourceType,
      fileName: options.fileName,
      totalRows: totalRecords,
      importedCount,
      updatedCount,
      skippedCount,
      duplicatesCount,
      conflictCount,
      errorCount,
      warningCount,
      status: overallStatus,
      errors: errorsList,
      rollbackAvailable: true,
      durationMs,
      scope: options.scope,
      importMode: options.importMode,
    };

    return {
      updatedStudents: studentList,
      report,
      snapshot,
    };
  }

  /**
   * Rollback migration by restoring data backup from snapshot
   */
  static rollback(snapshot: MigrationSnapshot): Student[] {
    try {
      const parsed = JSON.parse(snapshot.dataBackup);
      if (Array.isArray(parsed)) {
        return parsed as Student[];
      }
      throw new Error('فرمت داده پشتیبان نامعتبر است.');
    } catch (err) {
      throw new Error(`خطا در بازگردانی نسخه پشتیبان: ${(err as Error).message}`);
    }
  }

  /**
   * Generate CSV content for downloading validation errors
   */
  static generateErrorReportCsv(errors: MigrationErrorRecord[]): string {
    const headers = ['ردیف (Row)', 'فیلد (Field)', 'شرح خطا (Error Message)'];
    const rows = errors.map(e => [
      e.row,
      `"${e.field.replace(/"/g, '""')}"`,
      `"${e.message.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    return '\uFEFF' + csvContent; // UTF-8 BOM for Excel Persian support
  }
}
