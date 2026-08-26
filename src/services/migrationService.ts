import * as XLSX from 'xlsx';
import { 
  Student, 
  ImportMappingProfile, 
  MigrationReport, 
  MigrationSnapshot, 
  DuplicateConflict, 
  DuplicateResolution,
  ApiImportConfig
} from '../types';
import { ValidationService } from './validationService';
import { MemberService } from './memberService';
import { DateService } from './dateService';

export interface ParseResult {
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ImportValidationItem {
  rowIndex: number;
  data: Record<string, any>;
  mappedMember: Partial<Student>;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateMatch?: Student;
  matchReason?: string;
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'error' | 'duplicate';
}

export class MigrationService {
  // Preset standard mapping profiles
  static readonly PRESET_PROFILES: ImportMappingProfile[] = [
    {
      id: 'profile-zkteco-biosecurity',
      name: 'نرم‌افزار تردد ZKTeco BioSecurity / BioTime',
      description: 'نگاشت استاندارد خروجی اکسل/CSV کاربران سامانه‌های ZKTeco',
      sourceType: 'xlsx',
      sourceVendor: 'zkteco',
      mappings: {
        'User ID': 'memberNumber',
        'First Name': 'firstName',
        'Last Name': 'lastName',
        'Card No': 'rfidCardUid',
        'Mobile': 'phone',
        'National ID': 'nationalId',
        'Department': 'notes',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'profile-legacy-gym-a',
      name: 'نرم‌افزار جامع مدیریت باشگاه (نسخه قدیمی A)',
      description: 'پروفایل انتقال اطلاعات باشگاه از نرم‌افزارهای فارسی سنتی با ستون‌های استاندارد',
      sourceType: 'xlsx',
      sourceVendor: 'legacy_a',
      mappings: {
        'شماره عضویت': 'memberNumber',
        'نام': 'firstName',
        'نام خانوادگی': 'lastName',
        'کد ملی': 'nationalId',
        'موبایل': 'phone',
        'تاریخ ثبت نام': 'registrationDate',
        'تاریخ انقضا': 'expireDate',
        'بدهی': 'remainingDebt',
        'شماره کارت تردد': 'rfidCardUid',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'profile-generic-excel',
      name: 'اکسل عمومی اعضا و ورزشکاران',
      description: 'نگاشت خودکار ستون‌های رایج فارسی و انگلیسی اکسل',
      sourceType: 'xlsx',
      sourceVendor: 'generic',
      mappings: {
        'نام و نام خانوادگی': 'fullName',
        'تلفن همراه': 'phone',
        'کد ملی': 'nationalId',
        'کد عضویت': 'memberNumber',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  /**
   * Parse XLSX File using SheetJS
   */
  static async parseXlsx(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
          
          if (!rows || rows.length === 0) {
            resolve({ columns: [], rows: [], totalRows: 0 });
            return;
          }

          const columns = Object.keys(rows[0]);
          resolve({ columns, rows, totalRows: rows.length });
        } catch (err) {
          reject(new Error(`خطا در خواندن فایل اکسل: ${(err as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error('خطا در بارگذاری فایل'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Parse CSV file text with Persian encoding & delimiter detection
   */
  static parseCsv(text: string): ParseResult {
    if (!text || text.trim().length === 0) {
      return { columns: [], rows: [], totalRows: 0 };
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return { columns: [], rows: [], totalRows: 0 };
    }

    // Delimiter auto-detection from the first line
    const firstLine = lines[0];
    const delimiters = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = 0;
    for (const d of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = d;
      }
    }

    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === bestDelimiter && !inQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, ''));
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
      return values;
    };

    const columns = parseLine(lines[0]);
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseLine(lines[i]);
      const rowObj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        rowObj[col] = vals[idx] !== undefined ? vals[idx] : '';
      });
      rows.push(rowObj);
    }

    return { columns, rows, totalRows: rows.length };
  }

  /**
   * Parse JSON string (Gym OS schema or generic array)
   */
  static parseJson(jsonString: string): ParseResult {
    try {
      const parsed = JSON.parse(jsonString);
      let targetArray: Record<string, any>[] = [];

      if (Array.isArray(parsed)) {
        targetArray = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.members)) {
          targetArray = parsed.members;
        } else if (Array.isArray(parsed.students)) {
          targetArray = parsed.students;
        } else if (Array.isArray(parsed.data)) {
          targetArray = parsed.data;
        } else {
          targetArray = [parsed];
        }
      }

      if (targetArray.length === 0) {
        return { columns: [], rows: [], totalRows: 0 };
      }

      const columns = Array.from(
        new Set(targetArray.flatMap(obj => Object.keys(obj)))
      );

      return { columns, rows: targetArray, totalRows: targetArray.length };
    } catch (err) {
      throw new Error(`ساختار فایل JSON نامعتبر است: ${(err as Error).message}`);
    }
  }

  /**
   * Suggest automatic field mappings based on Persian and English column naming
   */
  static suggestMappings(columns: string[]): Record<string, string> {
    const mappings: Record<string, string> = {};

    const dictionary: Record<string, string[]> = {
      firstName: ['نام', 'نام کوچک', 'first name', 'firstname', 'fname', 'name'],
      lastName: ['نام خانوادگی', 'فامیلی', 'شهرت', 'last name', 'lastname', 'family', 'lname'],
      fullName: ['نام و نام خانوادگی', 'نام کامل', 'نام عضو', 'نام ورزشکار', 'full name', 'fullname', 'member name'],
      memberNumber: ['شماره عضویت', 'شماره پرونده', 'شماره ثبت', 'کد عضویت', 'کد پرونده', 'کد ثبت', 'member number', 'member id', 'id', 'card no', 'user id'],
      nationalId: ['کد ملی', 'کدملی', 'شماره ملی', 'شناسه ملی', 'national id', 'national code', 'ssn'],
      phone: ['موبایل', 'تلفن همراه', 'شماره تماس', 'شماره همراه', 'همراه', 'تلفن', 'mobile', 'phone', 'cell'],
      emergencyPhone: ['تلفن اضطراری', 'شماره اضطراری', 'emergency phone', 'emergency contact'],
      registrationDate: ['تاریخ عضویت', 'تاریخ ثبت نام', 'تاریخ ثبت‌نام', 'تاریخ شروع', 'join date', 'registration date', 'start date'],
      expireDate: ['تاریخ انقضا', 'تاریخ اتمام', 'تاریخ اعتبار', 'expire date', 'end date'],
      packageType: ['پکیج', 'نوع پکیج', 'دوره', 'نوع عضویت', 'package', 'plan', 'membership'],
      remainingDebt: ['بدهی', 'مانده بدهی', 'مبلغ بدهی', 'debt', 'remaining debt', 'balance'],
      paidAmount: ['مبلغ پرداختی', 'پرداختی', 'شهریه پرداختی', 'paid amount', 'paid'],
      totalFee: ['مبلغ کل', 'شهریه', 'هزینه کل', 'total fee', 'fee', 'price'],
      birthDate: ['تاریخ تولد', 'تولد', 'birth date', 'dob'],
      rfidCardUid: ['کد کارت', 'کارت تردد', 'rfid', 'card uid', 'card no'],
      notes: ['یادداشت', 'توضیحات', 'notes', 'description'],
      medicalNotes: ['نکات پزشکی', 'بیماری', 'medical notes'],
    };

    columns.forEach(col => {
      const normalizedCol = col.trim().toLowerCase();
      for (const [targetField, aliases] of Object.entries(dictionary)) {
        if (aliases.some(alias => normalizedCol === alias.toLowerCase() || normalizedCol.includes(alias.toLowerCase()))) {
          // Do not overwrite if already mapped
          if (!Object.values(mappings).includes(targetField)) {
            mappings[col] = targetField;
            break;
          }
        }
      }
    });

    return mappings;
  }

  /**
   * Validate and preview rows before migration
   */
  static validateAndPreview(
    rows: Record<string, any>[],
    mappings: Record<string, string>,
    existingStudents: Student[]
  ): ImportValidationItem[] {
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

      // Name normalization
      if (!mapped.fullName && (mapped.firstName || mapped.lastName)) {
        mapped.fullName = `${mapped.firstName || ''} ${mapped.lastName || ''}`.trim();
      } else if (mapped.fullName && !mapped.firstName && !mapped.lastName) {
        const parts = mapped.fullName.split(' ');
        mapped.firstName = parts[0] || '';
        mapped.lastName = parts.slice(1).join(' ') || '';
      }

      // Member Number normalization
      if (mapped.memberNumber) {
        mapped.memberNumber = ValidationService.toEnglishDigits(mapped.memberNumber).trim();
      }

      // Phone Normalization
      if (mapped.phone) {
        mapped.phone = ValidationService.normalizeMobilePhone(mapped.phone);
      }

      // National ID Normalization
      if (mapped.nationalId) {
        mapped.nationalId = ValidationService.toEnglishDigits(mapped.nationalId).replace(/\D/g, '');
        if (mapped.nationalId.length >= 8 && mapped.nationalId.length < 10) {
          mapped.nationalId = mapped.nationalId.padStart(10, '0');
        }
      }

      // Financials
      if (mapped.totalFee) mapped.totalFee = ValidationService.parseNumber(mapped.totalFee);
      if (mapped.paidAmount) mapped.paidAmount = ValidationService.parseNumber(mapped.paidAmount);
      if (mapped.remainingDebt !== undefined) {
        mapped.remainingDebt = ValidationService.parseNumber(mapped.remainingDebt);
      } else if (mapped.totalFee !== undefined && mapped.paidAmount !== undefined) {
        mapped.remainingDebt = Math.max(0, mapped.totalFee - mapped.paidAmount);
      }

      if (Object.keys(customFields).length > 0) {
        mapped.customFields = customFields;
      }

      // Validation Checks
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!mapped.fullName && !mapped.firstName) {
        errors.push('نام ورزشکار الزامی است');
      }

      if (mapped.phone && !ValidationService.isValidMobilePhone(mapped.phone)) {
        warnings.push('فرمت شماره موبایل نامعتبر است (باید ۰۹xxxxxxxxx باشد)');
      }

      if (mapped.nationalId && !ValidationService.isValidNationalId(mapped.nationalId)) {
        warnings.push('کد ملی از نظر ساختار الگوریتمی معتبر نیست');
      }

      // Duplicate Matching Check
      let duplicateMatch: Student | undefined;
      let matchReason: string | undefined;

      // 1. By memberNumber
      if (mapped.memberNumber) {
        duplicateMatch = existingStudents.find(s => s.memberNumber === mapped.memberNumber);
        if (duplicateMatch) matchReason = 'memberNumber';
      }

      // 2. By nationalId
      if (!duplicateMatch && mapped.nationalId && mapped.nationalId.length === 10) {
        duplicateMatch = existingStudents.find(s => s.nationalId === mapped.nationalId);
        if (duplicateMatch) matchReason = 'nationalId';
      }

      // 3. By phone
      if (!duplicateMatch && mapped.phone && mapped.phone.length === 11) {
        duplicateMatch = existingStudents.find(s => s.phone === mapped.phone);
        if (duplicateMatch) matchReason = 'phone';
      }

      // 4. By full name similarity
      if (!duplicateMatch && mapped.fullName) {
        const cleanName = mapped.fullName.trim();
        duplicateMatch = existingStudents.find(s => s.fullName.trim() === cleanName);
        if (duplicateMatch) matchReason = 'name';
      }

      const isDuplicate = Boolean(duplicateMatch);

      let status: 'valid' | 'warning' | 'error' | 'duplicate' = 'valid';
      if (errors.length > 0) status = 'error';
      else if (isDuplicate) status = 'duplicate';
      else if (warnings.length > 0) status = 'warning';

      results.push({
        rowIndex: idx + 1,
        data: row,
        mappedMember: mapped,
        isValid: errors.length === 0,
        isDuplicate,
        duplicateMatch,
        matchReason,
        errors,
        warnings,
        status,
      });
    });

    return results;
  }

  /**
   * Execute migration and generate detailed migration report
   */
  static executeImport(
    validatedItems: ImportValidationItem[],
    existingStudents: Student[],
    conflictResolutions: Record<string, DuplicateResolution>, // match id -> resolution
    options: {
      tenantId: string;
      branchId: string;
      defaultCoachId: string;
      sourceType: string;
      fileName?: string;
    }
  ): {
    updatedStudents: Student[];
    report: MigrationReport;
    snapshot: MigrationSnapshot;
  } {
    // 1. Create Pre-Migration Snapshot for safe rollback
    const snapshot: MigrationSnapshot = {
      id: `snapshot-${Date.now()}`,
      timestamp: new Date().toISOString(),
      description: `پشتیبان خودکار قبل از واردسازی ${options.fileName || options.sourceType}`,
      dataBackup: JSON.stringify(existingStudents),
    };

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let duplicatesCount = 0;
    let conflictCount = 0;
    let errorCount = 0;
    const errorsList: { row: number; field: string; message: string; data?: any }[] = [];

    const studentList: Student[] = [...existingStudents];

    validatedItems.forEach(item => {
      if (!item.isValid) {
        errorCount++;
        errorsList.push({
          row: item.rowIndex,
          field: 'general',
          message: item.errors.join(', '),
          data: item.mappedMember,
        });
        return;
      }

      if (item.isDuplicate && item.duplicateMatch) {
        duplicatesCount++;
        const resolution = conflictResolutions[item.duplicateMatch.id] || 'merge';

        if (resolution === 'skip') {
          skippedCount++;
          return;
        }

        if (resolution === 'keep_existing') {
          skippedCount++;
          return;
        }

        if (resolution === 'use_imported' || resolution === 'merge') {
          conflictCount++;
          updatedCount++;
          const idx = studentList.findIndex(s => s.id === item.duplicateMatch!.id);
          if (idx !== -1) {
            studentList[idx] = {
              ...studentList[idx],
              ...item.mappedMember,
              id: studentList[idx].id, // retain primary key
              tenantId: options.tenantId,
              branchId: options.branchId,
              customFields: {
                ...(studentList[idx].customFields || {}),
                ...(item.mappedMember.customFields || {}),
              },
            };
          }
          return;
        }
      }

      // Create new member
      importedCount++;
      const assignedMemberNum = item.mappedMember.memberNumber || MemberService.calculateNextMemberNumber(studentList);
      const todayJalali = DateService.getTodayJalali();
      const defaultExpireJalali = DateService.addDaysToJalali(todayJalali, 30);

      const newStudent: Student = {
        id: `std-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tenantId: options.tenantId,
        branchId: options.branchId,
        memberNumber: assignedMemberNum,
        firstName: item.mappedMember.firstName || '',
        lastName: item.mappedMember.lastName || '',
        fullName: item.mappedMember.fullName || 'عضو جدید',
        nationalId: item.mappedMember.nationalId || '',
        phone: item.mappedMember.phone || '',
        emergencyPhone: item.mappedMember.emergencyPhone,
        coachId: item.mappedMember.coachId || options.defaultCoachId || '',
        packageType: item.mappedMember.packageType || '1_month',
        registrationDate: item.mappedMember.registrationDate || todayJalali,
        expireDate: item.mappedMember.expireDate || defaultExpireJalali,
        totalFee: item.mappedMember.totalFee || 0,
        paidAmount: item.mappedMember.paidAmount || 0,
        remainingDebt: item.mappedMember.remainingDebt || 0,
        status: item.mappedMember.status || 'active',
        sessionsTotal: item.mappedMember.sessionsTotal || 24,
        sessionsAttended: item.mappedMember.sessionsAttended || 0,
        medicalNotes: item.mappedMember.medicalNotes,
        rfidCardUid: item.mappedMember.rfidCardUid,
        notes: item.mappedMember.notes,
        customFields: item.mappedMember.customFields,
      };

      studentList.push(newStudent);
    });

    const report: MigrationReport = {
      id: `rep-${Date.now()}`,
      migrationId: snapshot.id,
      timestamp: new Date().toISOString(),
      sourceType: options.sourceType,
      fileName: options.fileName,
      totalRows: validatedItems.length,
      importedCount,
      updatedCount,
      skippedCount,
      duplicatesCount,
      conflictCount,
      errorCount,
      errors: errorsList,
      rollbackAvailable: true,
    };

    return {
      updatedStudents: studentList,
      report,
      snapshot,
    };
  }

  /**
   * Safe Rollback execution
   */
  static rollback(snapshot: MigrationSnapshot): Student[] {
    try {
      const restored = JSON.parse(snapshot.dataBackup);
      if (Array.isArray(restored)) {
        return restored as Student[];
      }
      throw new Error('فرمت داده پشتیبان نامعتبر است');
    } catch (err) {
      throw new Error(`خطا در بازگردانی نسخه پشتیبان: ${(err as Error).message}`);
    }
  }

  /**
   * API Import Connector abstraction
   */
  static async fetchFromApi(config: ApiImportConfig): Promise<ParseResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.authType === 'bearer' && config.bearerToken) {
        headers['Authorization'] = `Bearer ${config.bearerToken}`;
      } else if (config.authType === 'api_key' && config.apiKeyHeader && config.apiKeyValue) {
        headers[config.apiKeyHeader] = config.apiKeyValue;
      } else if (config.authType === 'basic' && config.username && config.password) {
        headers['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`;
      }

      const response = await fetch(config.endpoint, {
        method: config.method,
        headers,
      });

      if (!response.ok) {
        throw new Error(`خطای سرور خارجی HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let targetArray: any[] = [];

      if (config.jsonPath) {
        const parts = config.jsonPath.split('.');
        let current = data;
        for (const p of parts) {
          if (current && current[p]) {
            current = current[p];
          }
        }
        if (Array.isArray(current)) targetArray = current;
      } else if (Array.isArray(data)) {
        targetArray = data;
      } else if (data.data && Array.isArray(data.data)) {
        targetArray = data.data;
      } else if (data.members && Array.isArray(data.members)) {
        targetArray = data.members;
      }

      const columns = Array.from(new Set(targetArray.flatMap(o => Object.keys(o))));
      return { columns, rows: targetArray, totalRows: targetArray.length };
    } catch (err) {
      throw new Error(`خطا در ارتباط با API خارجی: ${(err as Error).message}`);
    }
  }

  /**
   * SQL Backup Safe Schema Inspector & Extraction Abstraction
   */
  static inspectSqlBackup(sqlContent: string): {
    tables: { name: string; estimatedRows: number; columns: string[] }[];
  } {
    const tableNames: string[] = [];
    const tableColumns: Record<string, string[]> = {};
    const tableRowCounts: Record<string, number> = {};

    // Detect CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\);/gi;
    let match;
    while ((match = createTableRegex.exec(sqlContent)) !== null) {
      const tableName = match[1];
      const columnDefs = match[2];
      tableNames.push(tableName);

      const cols = columnDefs
        .split(',')
        .map(line => line.trim().split(/\s+/)[0].replace(/[`"']/g, ''))
        .filter(c => c && !['PRIMARY', 'KEY', 'CONSTRAINT', 'UNIQUE', 'FOREIGN'].includes(c.toUpperCase()));
      
      tableColumns[tableName] = cols;
      tableRowCounts[tableName] = 0;
    }

    // Count INSERT INTO statements
    tableNames.forEach(t => {
      const insertRegex = new RegExp(`INSERT\\s+INTO\\s+\`?${t}\`?`, 'gi');
      const count = (sqlContent.match(insertRegex) || []).length;
      tableRowCounts[t] = count > 0 ? count * 5 : 0; // rough estimation
    });

    return {
      tables: tableNames.map(name => ({
        name,
        estimatedRows: tableRowCounts[name] || 0,
        columns: tableColumns[name] || [],
      })),
    };
  }
}
