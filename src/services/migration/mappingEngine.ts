import { ImportMappingProfile } from './migrationTypes';
import { CustomField } from '../../types';
import { FieldAliasResolver } from './fieldAliasResolver';

export interface TargetFieldDef {
  key: string;
  label: string;
  category: 'core' | 'contact' | 'membership' | 'finance' | 'hardware' | 'notes' | 'custom';
  required?: boolean;
  type: 'string' | 'number' | 'date' | 'phone';
}

export class MappingEngine {
  /**
   * Standard target Gym OS fields
   */
  static readonly TARGET_FIELDS: TargetFieldDef[] = [
    { key: 'fullName', label: 'نام و نام خانوادگی کامل', category: 'core', type: 'string' },
    { key: 'firstName', label: 'نام کوچک', category: 'core', type: 'string' },
    { key: 'lastName', label: 'نام خانوادگی', category: 'core', type: 'string' },
    { key: 'memberNumber', label: 'شماره عضویت / کد پرونده', category: 'core', type: 'string' },
    { key: 'nationalId', label: 'کد ملی', category: 'core', type: 'string' },
    { key: 'phone', label: 'شماره تلفن همراه (موبایل)', category: 'contact', required: true, type: 'phone' },
    { key: 'emergencyPhone', label: 'شماره تماس اضطراری', category: 'contact', type: 'phone' },
    { key: 'packageType', label: 'نوع پکیج / اشتراک', category: 'membership', type: 'string' },
    { key: 'registrationDate', label: 'تاریخ ثبت‌نام / عضویت', category: 'membership', type: 'date' },
    { key: 'expireDate', label: 'تاریخ اتمام اعتبار / انقضا', category: 'membership', type: 'date' },
    { key: 'totalFee', label: 'مبلغ کل شهریه / قرارداد', category: 'finance', type: 'number' },
    { key: 'paidAmount', label: 'مبلغ پرداختی / دریافتی', category: 'finance', type: 'number' },
    { key: 'remainingDebt', label: 'مانده بدهی عضو', category: 'finance', type: 'number' },
    { key: 'rfidCardUid', label: 'کد کارت تردد (RFID / بارکد)', category: 'hardware', type: 'string' },
    { key: 'fingerprintEnrolled', label: 'ثبت اثر انگشت', category: 'hardware', type: 'string' },
    { key: 'faceIdEnrolled', label: 'ثبت شناسه چهره', category: 'hardware', type: 'string' },
    { key: 'birthDate', label: 'تاریخ تولد', category: 'core', type: 'date' },
    { key: 'notes', label: 'یادداشت و توضیحات پرونده', category: 'notes', type: 'string' },
    { key: 'medicalNotes', label: 'ملاحظات پزشکی و آسیب‌شناسی', category: 'notes', type: 'string' },
  ];

  /**
   * System Templates (Built-in examples, distinct from gym-saved profiles)
   */
  static readonly SYSTEM_TEMPLATES: ImportMappingProfile[] = [
    {
      id: 'template-zkteco-biosecurity',
      name: 'سامانه حضور و غیاب ZKTeco (BioSecurity / BioTime)',
      description: 'الگوی آماده برای فایل اکسل و CSV کاربران دستگاه‌های ZKTeco',
      sourceType: 'xlsx',
      sourceVendor: 'zkteco',
      isSystemTemplate: true,
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
      id: 'template-hesabras-gym',
      name: 'نرم‌افزار جامع مدیریت حساب‌رس (Hesabras)',
      description: 'الگوی آماده واردسازی اعضا، بدهی‌ها و پکیج‌های حساب‌رس',
      sourceType: 'xlsx',
      sourceVendor: 'hesabras',
      isSystemTemplate: true,
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
      id: 'template-generic-excel',
      name: 'اکسل عمومی فارسی اعضا و شهریه',
      description: 'الگوی پیش‌فرض ستون‌های رایج اکسل شامل نام، موبایل، کد ملی و بدهی',
      sourceType: 'xlsx',
      sourceVendor: 'generic',
      isSystemTemplate: true,
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
   * Field Aliases for intelligent automatic matching
   */
  static readonly FIELD_ALIASES: Record<string, string[]> = {
    fullName: ['نام و نام خانوادگی', 'نام کامل', 'نام عضو', 'نام ورزشکار', 'نام کاربر', 'full name', 'fullname', 'member name', 'client name'],
    firstName: ['نام', 'نام کوچک', 'first name', 'firstname', 'fname', 'name'],
    lastName: ['نام خانوادگی', 'فامیلی', 'شهرت', 'last name', 'lastname', 'family', 'lname'],
    memberNumber: ['شماره عضویت', 'شماره پرونده', 'شماره ثبت', 'کد عضویت', 'کد پرونده', 'کد ثبت', 'شماره کارت', 'کد پرسنلی', 'member number', 'member id', 'member_no', 'id', 'user id', 'personcode'],
    nationalId: ['کد ملی', 'کدملی', 'شماره ملی', 'شناسه ملی', 'national id', 'national code', 'national_id', 'ssn', 'nid'],
    phone: ['موبایل', 'تلفن همراه', 'شماره تماس', 'شماره همراه', 'همراه', 'تلفن', 'شماره موبایل', 'mobile', 'phone', 'cell', 'cellphone', 'tel'],
    emergencyPhone: ['تلفن اضطراری', 'شماره اضطراری', 'تماس اضطراری', 'emergency phone', 'emergency contact', 'sos phone'],
    registrationDate: ['تاریخ عضویت', 'تاریخ ثبت نام', 'تاریخ ثبت‌نام', 'تاریخ شروع', 'تاریخ ثبت', 'join date', 'registration date', 'start date', 'created_at'],
    expireDate: ['تاریخ انقضا', 'تاریخ اتمام', 'تاریخ اعتبار', 'انقضا', 'اعتبار تا', 'expire date', 'end date', 'expiration', 'valid_until'],
    packageType: ['پکیج', 'نوع پکیج', 'دوره', 'نوع عضویت', 'پلن', 'package', 'plan', 'membership', 'package_type'],
    remainingDebt: ['بدهی', 'مانده بدهی', 'مبلغ بدهی', 'مانده حساب', 'بدهکاری', 'debt', 'remaining debt', 'balance', 'due'],
    paidAmount: ['مبلغ پرداختی', 'پرداختی', 'شهریه پرداختی', 'دریافتی', 'paid amount', 'paid', 'payment'],
    totalFee: ['مبلغ کل', 'شهریه', 'هزینه کل', 'مبلغ قرارداد', 'total fee', 'fee', 'price', 'amount', 'cost'],
    rfidCardUid: ['کد کارت', 'کارت تردد', 'شماره کارت تردد', 'تگ rfid', 'rfid', 'card uid', 'card no', 'card_number', 'mifare'],
    birthDate: ['تاریخ تولد', 'تولد', 'birth date', 'dob', 'birthday'],
    notes: ['یادداشت', 'توضیحات', 'شرح', 'ملاحظات', 'notes', 'description', 'comment'],
    medicalNotes: ['نکات پزشکی', 'بیماری', 'سوابق پزشکی', 'پزشکی', 'medical notes', 'medical history'],
  };

  /**
   * Suggest automatic field mappings based on detected column names using FieldAliasResolver
   */
  static suggestMappings(columns: string[], customFields: CustomField[] = []): Record<string, string> {
    const result = FieldAliasResolver.resolveAll(columns, customFields);
    return result.mappings;
  }

  /**
   * Find matching profile (user profiles + system templates) based on column overlap score
   */
  static findBestMatchingProfile(
    columns: string[], 
    availableProfiles: ImportMappingProfile[]
  ): { profile: ImportMappingProfile; score: number; matchCount: number } | null {
    if (!columns || columns.length === 0 || !availableProfiles || availableProfiles.length === 0) {
      return null;
    }

    const cleanCols = columns.map(c => c.trim().toLowerCase());
    let bestMatch: { profile: ImportMappingProfile; score: number; matchCount: number } | null = null;

    availableProfiles.forEach(profile => {
      const profileSourceCols = Object.keys(profile.mappings).map(k => k.trim().toLowerCase());
      if (profileSourceCols.length === 0) return;

      let matchCount = 0;
      profileSourceCols.forEach(pCol => {
        if (cleanCols.includes(pCol)) {
          matchCount++;
        }
      });

      const score = matchCount / profileSourceCols.length;

      // Match threshold at least 60% of profile columns
      if (score >= 0.6 && matchCount >= 2) {
        if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && !profile.isSystemTemplate)) {
          bestMatch = { profile, score, matchCount };
        }
      }
    });

    return bestMatch;
  }
}
