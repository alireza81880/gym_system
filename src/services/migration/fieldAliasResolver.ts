import { CustomField } from '../../types';

export interface FieldAliasDefinition {
  targetKey: string;
  persianLabel: string;
  category: 'core' | 'contact' | 'membership' | 'finance' | 'hardware' | 'notes' | 'coach' | 'custom';
  required?: boolean;
  type: 'string' | 'number' | 'date' | 'phone';
  aliases: string[];
}

export interface FieldResolutionResult {
  column: string;
  targetKey: string | null;
  persianLabel: string | null;
  confidence: number; // 0 - 100
  isKnown: boolean; // confidence >= 60
  matchedAlias?: string;
  category?: string;
  reason: string;
  isSystemMetadata?: boolean;
}

export interface BatchResolutionResult {
  mappings: Record<string, string>;
  resolutions: FieldResolutionResult[];
  knownCount: number;
  unknownCount: number;
  unknownColumns: string[];
  overallConfidence: number;
}

export class FieldAliasResolver {
  /**
   * System metadata keys from Gym OS exports and backups that should be recognized and ignored cleanly
   */
  static readonly SYSTEM_METADATA_KEYS = new Set([
    '__metadata',
    'exportdate',
    'exportedat',
    'systemversion',
    'schemaversion',
    'gymosbackupversion',
    'gym_os_backup_version',
    'platform',
    'platformversion',
    '_meta',
    'meta',
    'tenantid',
    'branchid',
    'id',
    'createdat',
    'updatedat',
    'data',
    'counts',
    'gym_os_students',
    'gym_os_payments',
    'gym_os_expenses',
    'gym_os_memberships',
    'gym_os_charges',
    'gym_os_smart_lockers',
    'gym_os_attendance',
    'gym_os_coaches',
    'gym_os_packages',
    'gym_os_organization_info',
    'gym_os_branches',
    'gym_os_active_branch_id',
    'gym_os_custom_fields',
    'gym_os_access_policy_config',
    'gym_os_hardware_devices',
    'gym_os_hardware_events',
    'gym_os_audit_logs',
    'gym_os_locker_assignments_history',
    'gym_os_dashboard_widgets',
    'gym_os_module_features',
    'gym_installed',
    'gym_demo_mode',
    'gym_onboarding_completed',
  ]);

  /**
   * Authoritative canonical target definitions mapping English backup fields to Persian UI labels
   */
  static readonly DEFINITIONS: FieldAliasDefinition[] = [
    {
      targetKey: 'fullName',
      persianLabel: 'نام و نام خانوادگی کامل',
      category: 'core',
      type: 'string',
      aliases: [
        'fullname', 'full_name', 'full name', 'name', 'studentname', 'student_name', 
        'membername', 'member_name', 'clientname', 'client_name', 'username', 'user_name',
        'نام و نام خانوادگی', 'نام کامل', 'نام عضو', 'نام ورزشکار', 'نام کاربر'
      ],
    },
    {
      targetKey: 'firstName',
      persianLabel: 'نام کوچک',
      category: 'core',
      type: 'string',
      aliases: [
        'firstname', 'first_name', 'first name', 'fname', 'givenname', 'forename',
        'نام', 'نام کوچک'
      ],
    },
    {
      targetKey: 'lastName',
      persianLabel: 'نام خانوادگی',
      category: 'core',
      type: 'string',
      aliases: [
        'lastname', 'last_name', 'last name', 'lname', 'surname', 'family', 'familyname',
        'نام خانوادگی', 'فامیلی', 'شهرت', 'نام خانوادگي'
      ],
    },
    {
      targetKey: 'memberNumber',
      persianLabel: 'شماره عضویت / کد پرونده',
      category: 'core',
      type: 'string',
      aliases: [
        'membernumber', 'member_number', 'member_no', 'memberid', 'member_id', 'card_no', 
        'cardno', 'user_id', 'userid', 'personcode', 'person_code', 'barcode', 'fileno', 'file_no',
        'شماره عضویت', 'کد عضویت', 'کد پرونده', 'شماره پرونده', 'شماره ثبت', 'کد ثبت', 'کد پرسنلی'
      ],
    },
    {
      targetKey: 'nationalId',
      persianLabel: 'کد ملی',
      category: 'core',
      type: 'string',
      aliases: [
        'nationalid', 'national_id', 'national code', 'nationalcode', 'national_code', 
        'nid', 'ssn', 'mellicode', 'melli_code', 'national_no',
        'کد ملی', 'کدملی', 'شماره ملی', 'شناسه ملی', 'کدملي'
      ],
    },
    {
      targetKey: 'phone',
      persianLabel: 'شماره تلفن همراه (موبایل)',
      category: 'contact',
      required: true,
      type: 'phone',
      aliases: [
        'phone', 'mobile', 'cell', 'cellphone', 'cell_phone', 'tel', 'telephone', 
        'phonenumber', 'phone_number', 'contact', 'mobile_no', 'mobile_phone',
        'موبایل', 'تلفن همراه', 'شماره همراه', 'شماره تماس', 'همراه', 'تلفن', 'شماره موبایل'
      ],
    },
    {
      targetKey: 'emergencyPhone',
      persianLabel: 'شماره تماس اضطراری',
      category: 'contact',
      type: 'phone',
      aliases: [
        'emergencyphone', 'emergency_phone', 'emergencycontact', 'emergency_contact', 
        'sosphone', 'sos', 'relative_phone',
        'تلفن اضطراری', 'شماره اضطراری', 'تماس اضطراری', 'تلفن تماس ضروری'
      ],
    },
    {
      targetKey: 'packageType',
      persianLabel: 'نوع پکیج / اشتراک',
      category: 'membership',
      type: 'string',
      aliases: [
        'packagetype', 'package_type', 'package', 'packagename', 'package_name', 
        'plan', 'planname', 'plan_name', 'membership', 'membershiptype', 'membership_type', 
        'subscription', 'tariff',
        'دوره', 'پکیج', 'نوع پکیج', 'نوع عضویت', 'پلن', 'تعرفه', 'طرح'
      ],
    },
    {
      targetKey: 'registrationDate',
      persianLabel: 'تاریخ ثبت‌نام / عضویت',
      category: 'membership',
      type: 'date',
      aliases: [
        'registrationdate', 'registration_date', 'registerdate', 'register_date', 
        'startdate', 'start_date', 'joindate', 'join_date', 'createdat', 'created_at', 
        'enrolldate', 'enrollment_date',
        'تاریخ ثبت نام', 'تاریخ ثبت‌نام', 'تاریخ عضویت', 'تاریخ شروع', 'تاریخ ثبت'
      ],
    },
    {
      targetKey: 'expireDate',
      persianLabel: 'تاریخ اتمام اعتبار / انقضا',
      category: 'membership',
      type: 'date',
      aliases: [
        'expiredate', 'expire_date', 'expirationdate', 'expiration_date', 
        'enddate', 'end_date', 'validuntil', 'valid_until', 'expiration', 'expiry',
        'تاریخ انقضا', 'تاریخ اتمام', 'تاریخ اعتبار', 'اعتبار تا', 'انقضا'
      ],
    },
    {
      targetKey: 'totalFee',
      persianLabel: 'مبلغ کل شهریه / قرارداد',
      category: 'finance',
      type: 'number',
      aliases: [
        'totalfee', 'total_fee', 'fee', 'price', 'amount', 'tuition', 'cost', 
        'totalprice', 'total_price', 'contract_fee',
        'مبلغ کل', 'شهریه', 'هزینه کل', 'مبلغ قرارداد', 'مبلغ کل شهریه'
      ],
    },
    {
      targetKey: 'paidAmount',
      persianLabel: 'مبلغ پرداختی / دریافتی',
      category: 'finance',
      type: 'number',
      aliases: [
        'paidamount', 'paid_amount', 'paid', 'payment', 'deposit', 'received', 'received_amount',
        'مبلغ پرداختی', 'پرداختی', 'شهریه پرداختی', 'دریافتی', 'مبلغ دریافت شده'
      ],
    },
    {
      targetKey: 'remainingDebt',
      persianLabel: 'مانده بدهی عضو',
      category: 'finance',
      type: 'number',
      aliases: [
        'remainingdebt', 'remaining_debt', 'debt', 'balance', 'due', 'dueamount', 'due_amount', 'outstanding',
        'مانده بدهی', 'بدهی', 'مبلغ بدهی', 'مانده حساب', 'بدهکاری'
      ],
    },
    {
      targetKey: 'rfidCardUid',
      persianLabel: 'کد کارت تردد (RFID / بارکد)',
      category: 'hardware',
      type: 'string',
      aliases: [
        'rfidcarduid', 'rfid_card_uid', 'rfid', 'carduid', 'card_uid', 'cardno', 
        'card_number', 'mifare', 'nfc', 'rfid_uid',
        'کارت تردد', 'کد کارت', 'شماره کارت تردد', 'تگ rfid', 'شماره کارت'
      ],
    },
    {
      targetKey: 'birthDate',
      persianLabel: 'تاریخ تولد',
      category: 'core',
      type: 'date',
      aliases: [
        'birthdate', 'birth_date', 'dob', 'birthday', 'birth_day',
        'تاریخ تولد', 'تولد', 'زادروز'
      ],
    },
    {
      targetKey: 'gender',
      persianLabel: 'جنسیت',
      category: 'core',
      type: 'string',
      aliases: [
        'gender', 'sex', 'جنسیت'
      ],
    },
    {
      targetKey: 'coachId',
      persianLabel: 'مربی تخصصی / مسئول',
      category: 'coach',
      type: 'string',
      aliases: [
        'coachid', 'coach_id', 'coach', 'coachname', 'coach_name', 
        'trainer', 'trainername', 'trainer_name',
        'مربی', 'نام مربی', 'مربی مسئول', 'مربی تخصصی'
      ],
    },
    {
      targetKey: 'notes',
      persianLabel: 'یادداشت و توضیحات پرونده',
      category: 'notes',
      type: 'string',
      aliases: [
        'notes', 'note', 'description', 'comment', 'comments', 'remark', 'remarks',
        'یادداشت', 'توضیحات', 'شرح', 'ملاحظات'
      ],
    },
    {
      targetKey: 'medicalNotes',
      persianLabel: 'ملاحظات پزشکی و آسیب‌شناسی',
      category: 'notes',
      type: 'string',
      aliases: [
        'medicalnotes', 'medical_notes', 'medicalhistory', 'medical_history', 'illness', 'disease',
        'نکات پزشکی', 'بیماری', 'سوابق پزشکی', 'پزشکی', 'آسیب دیدگی'
      ],
    },
    {
      targetKey: 'coachFee',
      persianLabel: 'هزینه مربی اختصاصی',
      category: 'coach',
      type: 'number',
      aliases: ['coachfee', 'coach_fee', 'trainerfee', 'trainer_fee', 'هزینه مربی', 'شهریه مربی'],
    },
    {
      targetKey: 'planFee',
      persianLabel: 'هزینه برنامه تمرینی / غذایی',
      category: 'finance',
      type: 'number',
      aliases: ['planfee', 'plan_fee', 'workoutplanfee', 'workout_plan_fee', 'dietfee', 'diet_fee', 'هزینه برنامه', 'شهریه برنامه'],
    },
    {
      targetKey: 'packageSnapshot',
      persianLabel: 'اسنپ‌شات و جزئیات پکیج',
      category: 'membership',
      type: 'string',
      aliases: ['packagesnapshot', 'package_snapshot', 'snapshot', 'اسنپ شات پکیج', 'اطلاعات پکیج'],
    },
    {
      targetKey: 'customFields',
      persianLabel: 'فیلدهای سفارشی و متغیر',
      category: 'custom',
      type: 'string',
      aliases: ['customfields', 'custom_fields', 'customdata', 'custom_data', 'فیلدهای سفارشی', 'اطلاعات متغیر'],
    },
    {
      targetKey: 'sessionsTotal',
      persianLabel: 'تعداد کل جلسات مجاز',
      category: 'membership',
      type: 'number',
      aliases: ['sessionstotal', 'sessions_total', 'totalsessions', 'total_sessions', 'sessionscount', 'sessions_count', 'sessions', 'تعداد جلسات', 'کل جلسات', 'جلسات مجاز'],
    },
    {
      targetKey: 'sessionsAttended',
      persianLabel: 'جلسات مصرف‌شده / حضوریافته',
      category: 'membership',
      type: 'number',
      aliases: ['sessionsattended', 'sessions_attended', 'attendedsessions', 'attended_sessions', 'usedsessions', 'used_sessions', 'جلسات مصرفی', 'جلسات رفته', 'حضورها'],
    },
    {
      targetKey: 'height',
      persianLabel: 'قد (سانتی‌متر)',
      category: 'core',
      type: 'number',
      aliases: ['height', 'stature', 'قد', 'قد ورزشکار'],
    },
    {
      targetKey: 'weight',
      persianLabel: 'وزن (کیلوگرم)',
      category: 'core',
      type: 'number',
      aliases: ['weight', 'وزن', 'وزن ورزشکار'],
    },
    {
      targetKey: 'goal',
      persianLabel: 'هدف ورزشی',
      category: 'core',
      type: 'string',
      aliases: ['goal', 'target', 'fitnessgoal', 'fitness_goal', 'هدف', 'هدف ورزشی'],
    },
    {
      targetKey: 'assignedLocker',
      persianLabel: 'شماره کمد اختصاصی',
      category: 'hardware',
      type: 'number',
      aliases: ['assignedlocker', 'assigned_locker', 'lockerno', 'locker_number', 'lockernumber', 'کمد', 'شماره کمد'],
    },
    {
      targetKey: 'packageId',
      persianLabel: 'شناسه پکیج / تعرفه',
      category: 'membership',
      type: 'string',
      aliases: ['packageid', 'package_id', 'pkgid', 'pkg_id', 'شناسه پکیج', 'کد پکیج'],
    },
    {
      targetKey: 'status',
      persianLabel: 'وضعیت پرونده',
      category: 'core',
      type: 'string',
      aliases: ['status', 'memberstatus', 'member_status', 'وضعیت', 'وضعیت عضو'],
    },
    {
      targetKey: 'wantsCoach',
      persianLabel: 'درخواست مربی اختصاصی',
      category: 'coach',
      type: 'string',
      aliases: ['wantscoach', 'wants_coach', 'hascoach', 'has_coach', 'مربی اختصاصی'],
    },
    {
      targetKey: 'wantsWorkoutPlan',
      persianLabel: 'درخواست برنامه تمرینی',
      category: 'membership',
      type: 'string',
      aliases: ['wantsworkoutplan', 'wants_workout_plan', 'hasworkoutplan', 'برنامه تمرینی'],
    },
    {
      targetKey: 'wantsDietPlan',
      persianLabel: 'درخواست برنامه غذایی',
      category: 'membership',
      type: 'string',
      aliases: ['wantsdietplan', 'wants_diet_plan', 'hasdietplan', 'برنامه غذایی'],
    },
  ];

  /**
   * Normalizes strings for invariant comparison
   */
  static normalize(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[_\s\-\.\/\\:]+/g, '')
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک');
  }

  /**
   * Resolves a single source column to a target Gym OS field with confidence score
   */
  static resolveField(
    columnName: string,
    customFields: CustomField[] = [],
    alreadyUsedTargets: Set<string> = new Set()
  ): FieldResolutionResult {
    const rawCol = columnName.trim();
    const normCol = this.normalize(rawCol);

    if (!normCol) {
      return {
        column: rawCol,
        targetKey: null,
        persianLabel: null,
        confidence: 0,
        isKnown: false,
        reason: 'ستون خالی یا بدون نام',
      };
    }

    // 0. Check system metadata keys
    if (this.SYSTEM_METADATA_KEYS.has(normCol)) {
      return {
        column: rawCol,
        targetKey: null,
        persianLabel: 'متادیتای سیستمی (صرف‌نظر می‌شود)',
        confidence: 100,
        isKnown: true,
        isSystemMetadata: true,
        category: 'metadata',
        reason: 'متادیتای ساختاری سیستم یا نسخه پشتیبان',
      };
    }

    // 1. Check custom fields
    for (const cf of customFields) {
      const targetKey = `custom:${cf.key}`;
      if (alreadyUsedTargets.has(targetKey)) continue;

      const normKey = this.normalize(cf.key);
      const normLabel = this.normalize(cf.label);

      if (normCol === normKey || normCol === normLabel) {
        return {
          column: rawCol,
          targetKey,
          persianLabel: `فیلد اختصاصی: ${cf.label}`,
          confidence: 95,
          isKnown: true,
          category: 'custom',
          reason: 'تطبیق مستقیم با فیلد اختصاصی تعریف‌شده',
        };
      }
    }

    // 2. Check standard definitions
    let bestMatch: {
      def: FieldAliasDefinition;
      confidence: number;
      matchedAlias: string;
      reason: string;
    } | null = null;

    for (const def of this.DEFINITIONS) {
      if (alreadyUsedTargets.has(def.targetKey)) continue;

      const normTarget = this.normalize(def.targetKey);

      // Exact match with key
      if (normCol === normTarget) {
        return {
          column: rawCol,
          targetKey: def.targetKey,
          persianLabel: def.persianLabel,
          confidence: 100,
          isKnown: true,
          matchedAlias: def.targetKey,
          category: def.category,
          reason: 'تطبیق ۱۰۰٪ کلید استاندارد انگلیسی',
        };
      }

      // Check aliases
      for (const alias of def.aliases) {
        const normAlias = this.normalize(alias);

        // Exact match with alias
        if (normCol === normAlias) {
          return {
            column: rawCol,
            targetKey: def.targetKey,
            persianLabel: def.persianLabel,
            confidence: 95,
            isKnown: true,
            matchedAlias: alias,
            category: def.category,
            reason: `تطبیق ۹۵٪ با معادل شناخته‌شده «${alias}»`,
          };
        }

        // Substring / containment match
        if (normCol.length >= 3 && normAlias.length >= 3) {
          if (normCol.includes(normAlias) || normAlias.includes(normCol)) {
            const score = 75;
            if (!bestMatch || score > bestMatch.confidence) {
              bestMatch = {
                def,
                confidence: score,
                matchedAlias: alias,
                reason: `تطبیق تقریبی ۷۵٪ با کلمه کلیدی «${alias}»`,
              };
            }
          }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= 60) {
      return {
        column: rawCol,
        targetKey: bestMatch.def.targetKey,
        persianLabel: bestMatch.def.persianLabel,
        confidence: bestMatch.confidence,
        isKnown: true,
        matchedAlias: bestMatch.matchedAlias,
        category: bestMatch.def.category,
        reason: bestMatch.reason,
      };
    }

    // Unknown field requiring user clarification
    return {
      column: rawCol,
      targetKey: null,
      persianLabel: null,
      confidence: 0,
      isKnown: false,
      reason: 'فیلد ناشناخته - نیازمند انتخاب دستی توسط کاربر',
    };
  }

  /**
   * Resolves all columns, auto-matches known fields with confidence scores,
   * and isolates unknown fields for explicit user clarification.
   */
  static resolveAll(columns: string[], customFields: CustomField[] = []): BatchResolutionResult {
    const mappings: Record<string, string> = {};
    const resolutions: FieldResolutionResult[] = [];
    const usedTargets = new Set<string>();
    const unknownColumns: string[] = [];

    let totalConfidence = 0;

    for (const col of columns) {
      const res = this.resolveField(col, customFields, usedTargets);
      resolutions.push(res);
      totalConfidence += res.confidence;

      if (res.isKnown && res.targetKey) {
        mappings[col] = res.targetKey;
        usedTargets.add(res.targetKey);
      } else if (!res.isSystemMetadata) {
        unknownColumns.push(col);
      }
    }

    const knownCount = columns.length - unknownColumns.length;
    const overallConfidence = columns.length > 0 ? Math.round(totalConfidence / columns.length) : 0;

    return {
      mappings,
      resolutions,
      knownCount,
      unknownCount: unknownColumns.length,
      unknownColumns,
      overallConfidence,
    };
  }
}
