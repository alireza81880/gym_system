import { Student } from '../../types';
import { 
  DuplicateConfidence, 
  FieldConflict, 
  DuplicateResolution 
} from './migrationTypes';
import { MigrationNormalizers } from './normalizers';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence?: DuplicateConfidence;
  match?: Student;
  matchReason?: 'memberNumber' | 'nationalId' | 'phone' | 'name' | 'mixed';
  conflicts: FieldConflict[];
}

export class DuplicateEngine {
  private memberNumberIndex: Map<string, Student> = new Map();
  private nationalIdIndex: Map<string, Student> = new Map();
  private phoneIndex: Map<string, Student> = new Map();
  private nameIndex: Map<string, Student> = new Map();
  private allStudents: Student[] = [];

  constructor(students: Student[]) {
    this.rebuildIndex(students);
  }

  public rebuildIndex(students: Student[]) {
    this.allStudents = students;
    this.memberNumberIndex.clear();
    this.nationalIdIndex.clear();
    this.phoneIndex.clear();
    this.nameIndex.clear();

    students.forEach(st => {
      if (st.memberNumber) {
        const cleanNum = MigrationNormalizers.toEnglishDigits(st.memberNumber).trim();
        if (cleanNum) this.memberNumberIndex.set(cleanNum, st);
      }
      if (st.nationalId) {
        const cleanNat = MigrationNormalizers.normalizeNationalId(st.nationalId);
        if (cleanNat && cleanNat.length >= 8) this.nationalIdIndex.set(cleanNat, st);
      }
      if (st.phone) {
        const cleanPhone = MigrationNormalizers.normalizeMobilePhone(st.phone);
        if (cleanPhone && cleanPhone.length === 11) this.phoneIndex.set(cleanPhone, st);
      }
      if (st.fullName) {
        const cleanName = st.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
        if (cleanName) this.nameIndex.set(cleanName, st);
      }
    });
  }

  /**
   * Check incoming mapped member against existing student database
   */
  public check(incoming: Partial<Student>): DuplicateCheckResult {
    let match: Student | undefined;
    let matchReason: 'memberNumber' | 'nationalId' | 'phone' | 'name' | 'mixed' | undefined;
    let confidence: DuplicateConfidence | undefined;

    // 1. Check by memberNumber (Highest Priority - Exact System Match)
    if (incoming.memberNumber) {
      const cleanNum = MigrationNormalizers.toEnglishDigits(incoming.memberNumber).trim();
      if (cleanNum && this.memberNumberIndex.has(cleanNum)) {
        match = this.memberNumberIndex.get(cleanNum);
        matchReason = 'memberNumber';
        confidence = 'HIGH';
      }
    }

    // 2. Check by nationalId (High Priority)
    if (!match && incoming.nationalId) {
      const cleanNat = MigrationNormalizers.normalizeNationalId(incoming.nationalId);
      if (cleanNat && cleanNat.length >= 8 && this.nationalIdIndex.has(cleanNat)) {
        match = this.nationalIdIndex.get(cleanNat);
        matchReason = 'nationalId';
        confidence = 'HIGH';
      }
    }

    // 3. Check by phone (Medium Priority)
    if (!match && incoming.phone) {
      const cleanPhone = MigrationNormalizers.normalizeMobilePhone(incoming.phone);
      if (cleanPhone && cleanPhone.length === 11 && this.phoneIndex.has(cleanPhone)) {
        match = this.phoneIndex.get(cleanPhone);
        matchReason = 'phone';
        confidence = 'MEDIUM';
      }
    }

    // 4. Check by name (Low / Medium Priority)
    if (!match && incoming.fullName) {
      const cleanName = incoming.fullName.trim().toLowerCase().replace(/\s+/g, ' ');
      if (cleanName && this.nameIndex.has(cleanName)) {
        match = this.nameIndex.get(cleanName);
        matchReason = 'name';
        confidence = 'LOW';
      }
    }

    if (!match) {
      return {
        isDuplicate: false,
        conflicts: []
      };
    }

    // Build field conflicts between existing match and incoming
    const conflicts = this.calculateConflicts(match, incoming);

    return {
      isDuplicate: true,
      confidence: confidence || 'MEDIUM',
      match,
      matchReason,
      conflicts
    };
  }

  /**
   * Compare fields and return structured conflicts
   */
  private calculateConflicts(existing: Student, incoming: Partial<Student>): FieldConflict[] {
    const conflicts: FieldConflict[] = [];

    const fieldMap: { key: keyof Student; label: string }[] = [
      { key: 'fullName', label: 'نام و نام خانوادگی' },
      { key: 'phone', label: 'شماره موبایل' },
      { key: 'nationalId', label: 'کد ملی' },
      { key: 'memberNumber', label: 'شماره عضویت' },
      { key: 'expireDate', label: 'تاریخ انقضا' },
      { key: 'packageType', label: 'پکیج عضویت' },
      { key: 'remainingDebt', label: 'مانده بدهی' },
      { key: 'rfidCardUid', label: 'کارت RFID' },
      { key: 'notes', label: 'توضیحات' }
    ];

    fieldMap.forEach(({ key, label }) => {
      const existVal = (existing as any)[key];
      const inVal = (incoming as any)[key];

      if (inVal !== undefined && inVal !== null && inVal !== '') {
        const existStr = String(existVal ?? '').trim();
        const inStr = String(inVal ?? '').trim();

        if (existStr && existStr !== inStr) {
          conflicts.push({
            field: String(key),
            fieldLabel: label,
            existingValue: existVal,
            incomingValue: inVal,
            resolvedValue: existVal,
            chosenSource: 'existing'
          });
        }
      }
    });

    return conflicts;
  }
}
