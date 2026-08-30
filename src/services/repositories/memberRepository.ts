import { Student } from '../../types';
import { initialStudents } from '../../data/initialData';
import { LocalDbRepository } from '../localDb';
import { ValidationService } from '../validationService';

export interface MemberQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  coachId?: string;
  debtFilter?: 'all' | 'with_debt' | 'settled';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export class MemberRepository {
  private static studentsList: Student[] = [];
  private static byIdMap = new Map<string, Student>();
  private static byMemberNumberMap = new Map<string, Student>();
  private static byNationalIdMap = new Map<string, Student>();
  private static byPhoneMap = new Map<string, Student>();
  private static isInitialized = false;

  // Cached Metrics to prevent recalculating on every render
  private static cachedActiveCount = 0;
  private static cachedTotalDebt = 0;
  private static cachedExpiringCount = 0;

  static initialize(): void {
    if (this.isInitialized) return;

    const hasPersistedStudents = LocalDbRepository.hasKey('students');
    let stored: Student[];

    if (hasPersistedStudents) {
      stored = LocalDbRepository.get<Student[]>('students', []);
    } else if (!LocalDbRepository.isDatabaseInitialized()) {
      stored = initialStudents;
      LocalDbRepository.setImmediate('students', stored);
    } else {
      stored = [];
    }

    this.rebuildIndex(stored);
    this.isInitialized = true;
  }

  static rebuildIndex(students: Student[]): void {
    this.studentsList = [...students];
    this.byIdMap.clear();
    this.byMemberNumberMap.clear();
    this.byNationalIdMap.clear();
    this.byPhoneMap.clear();

    let active = 0;
    let debt = 0;
    let expiring = 0;

    for (const student of this.studentsList) {
      this.byIdMap.set(student.id, student);

      if (student.memberNumber) {
        this.byMemberNumberMap.set(student.memberNumber.trim().toLowerCase(), student);
      }

      if (student.nationalId) {
        const cleanNationalId = ValidationService.toEnglishDigits(student.nationalId).replace(/\D/g, '');
        if (cleanNationalId) {
          this.byNationalIdMap.set(cleanNationalId, student);
        }
      }

      if (student.phone) {
        const cleanPhone = ValidationService.normalizeMobilePhone(student.phone);
        if (cleanPhone) {
          this.byPhoneMap.set(cleanPhone, student);
        }
      }

      if (student.status === 'active') active++;
      if (student.status === 'pending_renewal' || student.status === 'expired') expiring++;
      if (student.remainingDebt > 0) debt += student.remainingDebt;
    }

    this.cachedActiveCount = active;
    this.cachedTotalDebt = debt;
    this.cachedExpiringCount = expiring;
  }

  static getAll(): Student[] {
    this.initialize();
    return this.studentsList;
  }

  static getCount(): number {
    this.initialize();
    return this.studentsList.length;
  }

  static getActiveCount(): number {
    this.initialize();
    return this.cachedActiveCount;
  }

  static getTotalDebt(): number {
    this.initialize();
    return this.cachedTotalDebt;
  }

  static getExpiringCount(): number {
    this.initialize();
    return this.cachedExpiringCount;
  }

  static getMetrics(): { total: number; active: number; totalDebt: number; expired: number } {
    this.initialize();
    return {
      total: this.studentsList.length,
      active: this.cachedActiveCount,
      totalDebt: this.cachedTotalDebt,
      expired: this.cachedExpiringCount,
    };
  }

  static getDebtors(): Student[] {
    this.initialize();
    return this.studentsList.filter(s => s.remainingDebt > 0);
  }

  static getById(id: string): Student | undefined {
    this.initialize();
    return this.byIdMap.get(id);
  }

  static getByMemberNumber(memberNumber: string): Student | undefined {
    this.initialize();
    if (!memberNumber) return undefined;
    return this.byMemberNumberMap.get(memberNumber.trim().toLowerCase());
  }

  static getByNationalId(nationalId: string): Student | undefined {
    this.initialize();
    if (!nationalId) return undefined;
    const clean = ValidationService.toEnglishDigits(nationalId).replace(/\D/g, '');
    return this.byNationalIdMap.get(clean);
  }

  static getByPhone(phone: string): Student | undefined {
    this.initialize();
    if (!phone) return undefined;
    const clean = ValidationService.normalizeMobilePhone(phone);
    return this.byPhoneMap.get(clean);
  }

  /**
   * High-speed O(1) duplicate checking for fast reception UX
   */
  static checkDuplicate(input: { phone?: string; nationalId?: string; fullName?: string }): {
    isDuplicate: boolean;
    reason?: string;
    existingMember?: Student;
  } {
    this.initialize();

    if (input.phone) {
      const match = this.getByPhone(input.phone);
      if (match) {
        return {
          isDuplicate: true,
          reason: `ورزشکار با شماره موبایل «${input.phone}» قبلاً با نام «${match.fullName}» (پرونده #${match.memberNumber || match.id}) ثبت شده است.`,
          existingMember: match,
        };
      }
    }

    if (input.nationalId && input.nationalId.trim() !== '') {
      const match = this.getByNationalId(input.nationalId);
      if (match) {
        return {
          isDuplicate: true,
          reason: `ورزشکار با کد ملی «${input.nationalId}» قبلاً با نام «${match.fullName}» ثبت شده است.`,
          existingMember: match,
        };
      }
    }

    if (input.fullName && input.fullName.trim().length >= 3) {
      const trimmed = input.fullName.trim().toLowerCase();
      const match = this.studentsList.find(s => s.fullName.trim().toLowerCase() === trimmed);
      if (match) {
        return {
          isDuplicate: true,
          reason: `ورزشکاری با نام دقیق «${match.fullName}» در سیستم وجود دارد.`,
          existingMember: match,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Fast indexed search supporting name, phone, national ID, and member number
   */
  static search(query: string, limit = 20): Student[] {
    this.initialize();
    if (!query || query.trim() === '') return [];

    const q = query.trim().toLowerCase();
    const cleanDigits = ValidationService.toEnglishDigits(query).replace(/\D/g, '');

    // 1. Direct O(1) checks first for numbers
    if (this.byMemberNumberMap.has(q)) {
      const match = this.byMemberNumberMap.get(q)!;
      return [match];
    }
    if (cleanDigits.length === 10 && this.byNationalIdMap.has(cleanDigits)) {
      return [this.byNationalIdMap.get(cleanDigits)!];
    }
    if (cleanDigits.length >= 10 && this.byPhoneMap.has(cleanDigits)) {
      return [this.byPhoneMap.get(cleanDigits)!];
    }

    // 2. Tokenized scan with early exit at limit
    const results: Student[] = [];
    for (const student of this.studentsList) {
      const nameMatch = student.fullName.toLowerCase().includes(q);
      const phoneMatch = student.phone.includes(q);
      const natMatch = student.nationalId ? student.nationalId.includes(q) : false;
      const numMatch = student.memberNumber ? student.memberNumber.toLowerCase().includes(q) : false;

      if (nameMatch || phoneMatch || natMatch || numMatch) {
        results.push(student);
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  static searchFast(query: string, limit = 10): Student[] {
    return this.search(query, limit);
  }

  /**
   * Server/Repository-side pagination and targeted filtering
   */
  static queryPaginated(params: MemberQueryParams = {}): PaginatedResult<Student> {
    this.initialize();
    const {
      page = 1,
      pageSize = 25,
      search = '',
      status = 'all',
      coachId = 'all',
      debtFilter = 'all',
    } = params;

    let filtered = this.studentsList;

    const hasSearch = search && search.trim() !== '';
    const hasStatus = status && status !== 'all';
    const hasCoach = coachId && coachId !== 'all';
    const hasDebt = debtFilter && debtFilter !== 'all';

    if (hasSearch || hasStatus || hasCoach || hasDebt) {
      const q = hasSearch ? search.trim().toLowerCase() : '';

      filtered = this.studentsList.filter(st => {
        if (hasSearch) {
          const matchSearch =
            st.fullName.toLowerCase().includes(q) ||
            st.phone.includes(q) ||
            (st.nationalId && st.nationalId.includes(q)) ||
            (st.memberNumber && st.memberNumber.toLowerCase().includes(q));
          if (!matchSearch) return false;
        }

        if (hasStatus && st.status !== status) return false;
        if (hasCoach && st.coachId !== coachId) return false;

        if (hasDebt) {
          if (debtFilter === 'with_debt' && st.remainingDebt <= 0) return false;
          if (debtFilter === 'settled' && st.remainingDebt > 0) return false;
        }

        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: safePage,
      pageSize,
    };
  }

  static addMember(student: Student): void {
    this.initialize();
    this.studentsList = [student, ...this.studentsList];
    this.byIdMap.set(student.id, student);

    if (student.memberNumber) {
      this.byMemberNumberMap.set(student.memberNumber.trim().toLowerCase(), student);
    }
    if (student.nationalId) {
      const clean = ValidationService.toEnglishDigits(student.nationalId).replace(/\D/g, '');
      if (clean) this.byNationalIdMap.set(clean, student);
    }
    if (student.phone) {
      const clean = ValidationService.normalizeMobilePhone(student.phone);
      if (clean) this.byPhoneMap.set(clean, student);
    }

    if (student.status === 'active') this.cachedActiveCount++;
    if (student.status === 'pending_renewal' || student.status === 'expired') this.cachedExpiringCount++;
    if (student.remainingDebt > 0) this.cachedTotalDebt += student.remainingDebt;

    LocalDbRepository.setImmediate('students', this.studentsList);
  }

  static updateMember(id: string, partial: Partial<Student>): Student | undefined {
    this.initialize();
    const existing = this.byIdMap.get(id);
    if (!existing) return undefined;

    const oldStatus = existing.status;
    const oldDebt = existing.remainingDebt || 0;

    const updated: Student = { ...existing, ...partial };

    this.byIdMap.set(id, updated);
    const idx = this.studentsList.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.studentsList[idx] = updated;
    }

    // Re-index secondary keys if changed
    if (partial.memberNumber !== undefined) {
      if (existing.memberNumber) this.byMemberNumberMap.delete(existing.memberNumber.trim().toLowerCase());
      if (updated.memberNumber) this.byMemberNumberMap.set(updated.memberNumber.trim().toLowerCase(), updated);
    }

    if (partial.nationalId !== undefined) {
      if (existing.nationalId) {
        const oldClean = ValidationService.toEnglishDigits(existing.nationalId).replace(/\D/g, '');
        if (oldClean) this.byNationalIdMap.delete(oldClean);
      }
      if (updated.nationalId) {
        const newClean = ValidationService.toEnglishDigits(updated.nationalId).replace(/\D/g, '');
        if (newClean) this.byNationalIdMap.set(newClean, updated);
      }
    }

    if (partial.phone !== undefined) {
      if (existing.phone) {
        const oldPhone = ValidationService.normalizeMobilePhone(existing.phone);
        if (oldPhone) this.byPhoneMap.delete(oldPhone);
      }
      if (updated.phone) {
        const newPhone = ValidationService.normalizeMobilePhone(updated.phone);
        if (newPhone) this.byPhoneMap.set(newPhone, updated);
      }
    }

    // Adjust cached counts
    if (oldStatus !== updated.status) {
      if (oldStatus === 'active') this.cachedActiveCount--;
      if (updated.status === 'active') this.cachedActiveCount++;

      if (oldStatus === 'pending_renewal' || oldStatus === 'expired') this.cachedExpiringCount--;
      if (updated.status === 'pending_renewal' || updated.status === 'expired') this.cachedExpiringCount++;
    }

    const newDebt = updated.remainingDebt || 0;
    if (oldDebt !== newDebt) {
      this.cachedTotalDebt += (newDebt - oldDebt);
    }

    LocalDbRepository.setImmediate('students', this.studentsList);
    return updated;
  }

  static deleteMember(id: string): boolean {
    this.initialize();
    const existing = this.byIdMap.get(id);
    if (!existing) return false;

    this.byIdMap.delete(id);
    if (existing.memberNumber) this.byMemberNumberMap.delete(existing.memberNumber.trim().toLowerCase());
    if (existing.nationalId) {
      const clean = ValidationService.toEnglishDigits(existing.nationalId).replace(/\D/g, '');
      if (clean) this.byNationalIdMap.delete(clean);
    }
    if (existing.phone) {
      const clean = ValidationService.normalizeMobilePhone(existing.phone);
      if (clean) this.byPhoneMap.delete(clean);
    }

    if (existing.status === 'active') this.cachedActiveCount--;
    if (existing.status === 'pending_renewal' || existing.status === 'expired') this.cachedExpiringCount--;
    if (existing.remainingDebt > 0) this.cachedTotalDebt -= existing.remainingDebt;

    this.studentsList = this.studentsList.filter(s => s.id !== id);
    LocalDbRepository.setImmediate('students', this.studentsList);
    return true;
  }

  static batchSet(newStudents: Student[]): void {
    this.rebuildIndex(newStudents);
    LocalDbRepository.setImmediate('students', this.studentsList);
  }

  /**
   * Generates a test-only performance dataset (e.g. 1,000 / 5,000 / 10,000 members)
   */
  static generatePerformanceDataset(count: number): { durationMs: number; count: number } {
    const startTime = performance.now();
    const firstNames = ['علی', 'محمد', 'امیر', 'رضا', 'مهدی', 'حسین', 'سارا', 'فاطمه', 'نیما', 'فرزاد', 'آرش', 'پویا', 'مریم', 'الناز', 'کامران', 'سپهر', 'سامان', 'نوید', 'بهزاد', 'سروش'];
    const lastNames = ['حسینی', 'محمدی', 'کریمی', 'شجاعی', 'کمالی', 'صادقی', 'قاسمی', 'رضایی', 'تقوی', 'میرزایی', 'افشار', 'مرادی', 'نادری', 'امیری', 'رستمی', 'اکبری', 'باقری', 'طاهری', 'یوسفی', 'کاظمی'];
    const packages: ('1_month' | '3_months' | '6_months' | '12_months' | 'vip_personal' | '12_sessions' | '24_sessions')[] = [
      '1_month', '3_months', '6_months', '12_months', 'vip_personal', '12_sessions', '24_sessions'
    ];

    const generated: Student[] = [];
    const baseNum = 1000;

    for (let i = 0; i < count; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 7) % lastNames.length];
      const memNum = String(baseNum + i);
      const phoneDigits = String(10000000 + (i % 90000000)).slice(0, 8);
      const phone = `0912${phoneDigits}`;
      const nationalId = String(1000000000 + i);
      const pkg = packages[i % packages.length];
      const isDebtor = i % 5 === 0;
      const totalFee = 2500000 + (i % 4) * 1000000;
      const paid = isDebtor ? totalFee - 500000 : totalFee;
      const status = i % 10 === 0 ? 'expired' : i % 8 === 0 ? 'pending_renewal' : 'active';

      generated.push({
        id: `perf-std-${i + 1}`,
        tenantId: 'gym-org-1',
        branchId: 'branch-tehran-central',
        fullName: `${fn} ${ln} #${i + 1}`,
        nationalId,
        phone,
        memberNumber: memNum,
        gender: i % 3 === 0 ? 'female' : 'male',
        coachId: i % 4 === 0 ? 'c-1' : i % 4 === 1 ? 'c-2' : i % 4 === 2 ? 'c-3' : '',
        packageType: pkg,
        registrationDate: '1403/01/01',
        expireDate: '1403/12/29',
        totalFee,
        paidAmount: paid,
        remainingDebt: totalFee - paid,
        status,
        sessionsTotal: 24,
        sessionsAttended: i % 20,
        height: 175,
        weight: 75,
        goal: 'فیتنس و سلامت',
        medicalNotes: '',
        wantsCoach: i % 2 === 0,
        coachFee: i % 2 === 0 ? 800000 : 0,
        wantsWorkoutPlan: i % 3 === 0,
        wantsDietPlan: i % 4 === 0,
        planFee: 500000,
      });
    }

    this.rebuildIndex(generated);
    LocalDbRepository.setImmediate('students', generated);
    const durationMs = Math.round(performance.now() - startTime);

    return { durationMs, count };
  }

  static async getNextSequentialMemberNumber(): Promise<string> {
    this.initialize();
    let maxNum = 1000;
    for (const student of this.studentsList) {
      if (student.memberNumber) {
        const cleanDigits = student.memberNumber.replace(/\D/g, '');
        const n = parseInt(cleanDigits, 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    }
    return String(maxNum + 1);
  }

  static archive(id: string, archivedBy = 'مدیر سیستم'): boolean {
    this.initialize();
    const existing = this.byIdMap.get(id);
    if (!existing) return false;

    this.updateMember(id, {
      status: 'inactive',
    });
    return true;
  }

  static searchMembers(params: MemberQueryParams = {}): PaginatedResult<Student> {
    return this.queryPaginated(params);
  }

  static restoreSampleData(): void {
    this.rebuildIndex(initialStudents);
    LocalDbRepository.setImmediate('students', initialStudents);
  }
}

