export type Language = 'fa' | 'en';
export type Theme = 'dark' | 'light';

export type NavTab = 
  | 'dashboard' 
  | 'smart_lockers'
  | 'hardware_hub'
  | 'students' // Members
  | 'coaches' 
  | 'attendance' 
  | 'finances' 
  | 'plans' 
  | 'insights' // Smart AI / Rule-based
  | 'reports' 
  | 'migration' // Migration Center
  | 'features' // Module visibility center
  | 'diagnostics' // System & Pilot diagnostics
  | 'settings';

export type PackageType = 
  | '1_month' 
  | '3_months' 
  | '6_months' 
  | '12_months' 
  | 'vip_personal' 
  | '12_sessions' 
  | '24_sessions'
  | string;

export interface MembershipPackage {
  id: string;
  tenantId?: string;
  branchId?: string;
  name: string;
  nameEn?: string;
  type?: PackageType;
  price: number;
  durationMonths?: number;
  durationDays?: number;
  sessionsCount: number;
  description?: string;
  isActive?: boolean;
  includesLocker?: boolean;
  includesCoach?: boolean;
  includesDietPlan?: boolean;
  includesWorkoutPlan?: boolean;
  isVip?: boolean;
  allowedHoursStart?: string; // e.g. "06:00"
  allowedHoursEnd?: string;   // e.g. "14:00" for ladies/morning
  allowedDays?: string[];     // ['saturday', 'sunday', ...]
  debtToleranceAmount?: number; // allow entry if debt < tolerance
}

export type MemberStatus = 'active' | 'expired' | 'pending_renewal' | 'suspended';
export type StudentStatus = MemberStatus; // Compatibility alias

export type PaymentMethod = 'pos' | 'cash' | 'card_transfer' | 'online' | 'installment';

export type TransactionType = 'tuition' | 'coach_settlement' | 'supplement_sale' | 'buffet' | 'expense' | 'other_income';

export type ExpenseCategory = 'rent' | 'salary' | 'utility' | 'equipment' | 'maintenance' | 'marketing' | 'buffet_stock' | 'other';

export interface Coach {
  id: string;
  tenantId?: string;
  branchId?: string;
  fullName: string;
  nationalId: string;
  phone: string;
  specialty: string;
  commissionRate: number;
  joinDate: string;
  avatar?: string;
  status: 'active' | 'inactive';
  notes?: string;
  monthlyTargetStudents?: number;
  bankCard?: string;
  bankShaba?: string;
  bankName?: string;
}

export interface MemberCredential {
  id: string;
  type: 'rfid_card' | 'face' | 'fingerprint' | 'qr_code' | 'pin';
  identifier: string; // RFID UID, facial feature hash ID, PIN
  enrolledAt: string;
  deviceId?: string;
  isActive: boolean;
}

export interface Student {
  id: string;
  tenantId?: string;
  branchId?: string;
  memberNumber?: string; // Configurable label (شماره عضویت / پرونده / ثبت)
  firstName?: string;
  lastName?: string;
  fullName: string;
  nationalId: string;
  phone: string;
  emergencyPhone?: string;
  coachId: string;
  wantsCoach?: boolean;
  wantsWorkoutPlan?: boolean;
  wantsDietPlan?: boolean;
  packageType: PackageType;
  registrationDate: string;
  expireDate: string;
  totalFee: number;
  paidAmount: number;
  remainingDebt: number;
  status: StudentStatus;
  sessionsTotal: number;
  sessionsAttended: number;
  medicalNotes?: string;
  height?: number;
  weight?: number;
  goal?: string;
  avatar?: string;
  birthDate?: string;
  rfidCardUid?: string;
  biometricRegistered?: boolean;
  assignedLocker?: number;
  tags?: string[];
  notes?: string;
  isVip?: boolean;
  lastAccessTime?: string;
  credentials?: MemberCredential[];
  customFields?: Record<string, any>;
  zone?: LockerZone | string;
}

export type Member = Student; // Clean domain alias

export interface PaymentRecord {
  id: string;
  tenantId?: string;
  branchId?: string;
  studentId?: string;
  studentName?: string;
  coachId?: string;
  coachName?: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  description: string;
  receiptNumber: string;
  recordedBy: string;
  status?: 'completed' | 'voided' | 'refunded';
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface CoachSettlement {
  id: string;
  tenantId?: string;
  branchId?: string;
  coachId: string;
  coachName: string;
  date: string;
  periodDescription: string;
  totalStudentsCount: number;
  totalRevenueGenerated: number;
  coachShare: number;
  clubShare: number;
  amountPaid: number;
  remainingCoachBalance: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId?: string;
  branchId?: string;
  studentId: string;
  studentName: string;
  coachName: string;
  checkInTime: string;
  date: string;
  checkOutTime?: string;
  durationMinutes?: number;
  lockerNumber?: number;
  method?: 'manual' | 'face_scan' | 'rfid_wristband' | 'fingerprint' | 'qr_code';
  notes?: string;
  isCurrentlyInside?: boolean;
}

export interface ExpenseRecord {
  id: string;
  tenantId?: string;
  branchId?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: PaymentMethod;
  description?: string;
  receiptNumber?: string;
  status?: 'completed' | 'voided';
  voidReason?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  restTime?: string;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  dayTitle: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
  tenantId?: string;
  branchId?: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  title: string;
  createdAt: string;
  validUntil: string;
  goal: string;
  days: WorkoutDay[];
  coachNotes?: string;
}

export interface DietMeal {
  id: string;
  mealName: string;
  timing: string;
  items: string;
  caloriesEstimate?: number;
}

export interface DietPlan {
  id: string;
  tenantId?: string;
  branchId?: string;
  studentId: string;
  studentName: string;
  coachId: string;
  coachName: string;
  title: string;
  dailyCaloriesTarget: number;
  createdAt: string;
  meals: DietMeal[];
  waterIntakeLiters: number;
  supplementsNotes?: string;
}

// ----------------------------------------------------
// SMART LOCKERS & HARDWARE ACCESS CONTROL TYPES
// ----------------------------------------------------

export type LockerZone = 'general' | 'vip' | 'men' | 'women';
export type LockerStatus = 'available' | 'occupied' | 'maintenance' | 'reserved' | 'error';
export type LockerLockType = 'rfid_relay' | 'solenoid' | 'magnetic' | 'ble_iot';

export interface SmartLocker {
  id: string;
  tenantId?: string;
  branchId?: string;
  number: number;
  zone: LockerZone;
  status: LockerStatus;
  currentStudentId?: string;
  currentStudentName?: string;
  assignedAt?: string;
  isLocked: boolean;
  batteryLevel?: number;
  lastUnlockedAt?: string;
  lockType: LockerLockType;
  relayPort?: number;
  controllerId?: string;
}

export interface LockerAssignment {
  id: string;
  tenantId?: string;
  branchId?: string;
  lockerNumber: number;
  memberId: string;
  memberName: string;
  assignedAt: string;
  releasedAt?: string;
  assignedBy: 'auto_gate' | 'reception_manual' | 'kiosk';
  zone: LockerZone;
}

// ----------------------------------------------------
// HARDWARE HUB & INTEGRATION ARCHITECTURE TYPES
// ----------------------------------------------------

export type IntegrationMode = 
  | 'shadow'        // Mode A: Observe only (No actuation, logs only, safe for coexisting)
  | 'hybrid'        // Mode B: Hybrid (Logs + Explicit user-approved actions)
  | 'full_control'; // Mode C: Full control (Gym OS is source of truth)

export type HardwareDeviceType = 
  | 'rfid_nfc' 
  | 'biometric_face' 
  | 'fingerprint' 
  | 'barcode_turnstile' 
  | 'locker_relay_board'
  | 'door_controller'
  | 'turnstile'
  | 'camera'
  | 'sensor'
  | 'other';

export type HardwareVendor = 
  | 'zkteco'
  | 'hikvision'
  | 'suprema'
  | 'dahua'
  | 'generic_relay'
  | 'generic_wiegand'
  | 'custom_iot';

export type HardwareProtocol = 
  | 'websocket' 
  | 'mqtt' 
  | 'serial_webusb' 
  | 'modbus_tcp' 
  | 'http_webhook'
  | 'tcp_raw'
  | 'udp';

export type HardwareCapability = 
  | 'FACE_RECOGNITION'
  | 'FINGERPRINT'
  | 'RFID_NFC'
  | 'QR_CODE'
  | 'PIN_CODE'
  | 'DOOR_ACTUATION'
  | 'LOCKER_RELAY_PULSE'
  | 'TEMPERATURE_SENSOR'
  | 'EVENT_PULL'
  | 'EVENT_STREAM_PUSH'
  | 'USER_ENROLLMENT'
  | 'DEVICE_TIME_SYNC';

export interface HardwareDevice {
  id: string;
  tenantId?: string;
  branchId?: string;
  name: string;
  vendor: HardwareVendor;
  model: string;
  type: HardwareDeviceType;
  status: 'online' | 'offline' | 'warning' | 'simulated';
  ipAddress: string;
  port: number;
  protocol: HardwareProtocol;
  lastPing: string;
  location: string;
  zone?: LockerZone | 'entrance' | 'exit' | 'vip_lounge';
  relayPinsCount?: number;
  capabilities: HardwareCapability[];
  adapter: string;
  latencyMs?: number;
  firmware?: string;
  serialNumber?: string;
  isSimulated?: boolean;
}

export type HardwareEventType = 
  | 'ACCESS_GRANTED'
  | 'ACCESS_DENIED'
  | 'FACE_MATCH'
  | 'FINGERPRINT_MATCH'
  | 'RFID_MATCH'
  | 'QR_SCAN'
  | 'UNKNOWN_PERSON'
  | 'DOOR_OPENED'
  | 'DOOR_CLOSED'
  | 'LOCKER_OPENED'
  | 'LOCKER_CLOSED'
  | 'DEVICE_ONLINE'
  | 'DEVICE_OFFLINE'
  | 'DEVICE_ERROR'
  | 'USER_ENROLLED'
  | 'USER_REMOVED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED';

export interface HardwareEvent {
  id: string;
  tenantId?: string;
  branchId?: string;
  deviceId: string;
  deviceName?: string;
  vendor?: HardwareVendor;
  eventType: HardwareEventType;
  timestamp: string;
  externalUserId?: string;
  memberId?: string;
  memberName?: string;
  credentialType?: 'face' | 'rfid' | 'fingerprint' | 'qr' | 'pin';
  authenticationResult?: 'success' | 'failed' | 'unrecognized';
  accessResult?: 'granted' | 'denied' | 'ignored_shadow_mode';
  accessReason?: string;
  direction?: 'entry' | 'exit';
  rawPayload?: string;
  normalizedPayload?: Record<string, unknown>;
  source: 'hardware_gateway' | 'simulator' | 'webhook' | 'shadow_listener';
  processingStatus: 'processed' | 'pending' | 'ignored';
  correlationId?: string;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  deviceType: string;
  method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code' | 'manual_override';
  result: 'granted' | 'denied_expired' | 'denied_debt' | 'denied_unknown' | 'denied_time_restriction' | 'denied_suspended';
  assignedLocker?: number;
  message: string;
}

export interface ScanResult {
  success: boolean;
  student?: Student;
  lockerNumber?: number;
  message: string;
  alertType: 'success' | 'warning' | 'error';
  method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code' | 'manual_override';
  decisionCode?: 'ALLOW' | 'DENY' | 'ALLOW_WITH_WARNING';
  reason?: string;
}

// ----------------------------------------------------
// ACCESS DECISION ENGINE TYPES
// ----------------------------------------------------

export type DecisionResult = 'ALLOW' | 'DENY' | 'ALLOW_WITH_WARNING';

export interface AccessDecision {
  result: DecisionResult;
  member?: Student;
  reasonCode: 
    | 'ACTIVE_MEMBERSHIP'
    | 'EXPIRED_MEMBERSHIP'
    | 'DEBT_EXCEEDED'
    | 'DEBT_TOLERATED_WARNING'
    | 'SESSION_LIMIT_REACHED'
    | 'OUTSIDE_ALLOWED_HOURS'
    | 'SUSPENDED_MEMBER'
    | 'UNKNOWN_IDENTITY'
    | 'DUPLICATE_ENTRY_WARNING';
  messageFa: string;
  messageEn: string;
  assignedLocker?: number;
  requiresLocker: boolean;
  warnings?: string[];
  timestamp: string;
}

// ----------------------------------------------------
// RBAC & AUDIT LOG TYPES
// ----------------------------------------------------

export type UserRole = 
  | 'super_admin' 
  | 'gym_owner' 
  | 'branch_manager' 
  | 'receptionist' 
  | 'coach' 
  | 'accountant' 
  | 'hardware_tech';

export interface StaffUser {
  id: string;
  tenantId?: string;
  branchId?: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
}

export type PermissionKey = 
  | 'members.view'
  | 'members.create'
  | 'members.edit'
  | 'members.delete'
  | 'finance.view'
  | 'finance.create'
  | 'finance.reverse'
  | 'hardware.view'
  | 'hardware.configure'
  | 'hardware.test'
  | 'hardware.control'
  | 'lockers.open'
  | 'lockers.masterUnlock'
  | 'reports.view'
  | 'settings.manage'
  | 'audit.view'
  | 'insights.view';

export interface AuditLog {
  id: string;
  tenantId?: string;
  branchId?: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'member' | 'payment' | 'locker' | 'hardware' | 'setting' | 'attendance' | 'auth';
  entityId?: string;
  description: string;
  beforeState?: string;
  afterState?: string;
  timestamp: string;
  ipAddress?: string;
  correlationId?: string;
}

// ----------------------------------------------------
// SMART INSIGHTS ENGINE (RULE-BASED INTELLIGENCE)
// ----------------------------------------------------

export type InsightType = 
  | 'CHURN_RISK'
  | 'LOYAL_MEMBER'
  | 'GYM_CROWDING_BUSY'
  | 'GYM_CROWDING_QUIET'
  | 'MEMBERSHIP_EXPIRING'
  | 'HIGH_DEBT_ALERT'
  | 'PEAK_HOURS'
  | 'LOCKER_UTILIZATION_HIGH';

export interface SmartInsight {
  id: string;
  type: InsightType;
  severity: 'info' | 'warning' | 'critical' | 'success';
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  descriptionEn: string;
  targetEntity?: string;
  targetId?: string;
  actionLabelFa?: string;
  actionLabelEn?: string;
  actionTab?: NavTab;
  valueMetric?: string | number;
  createdAt: string;
}

// ----------------------------------------------------
// SYNC & OFFLINE-FIRST ARCHITECTURE
// ----------------------------------------------------

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_ERROR' | 'PARTIALLY_SYNCED';

export interface SyncJob {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retries: number;
  lastAttempt?: string;
  errorMessage?: string;
  createdAt: string;
}

// ----------------------------------------------------
// MULTI-BRANCH & ORGANIZATION
// ----------------------------------------------------

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  isMain: boolean;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  brandTitle: string;
  licenseNumber?: string;
  managerName: string;
  phone: string;
  currency: 'تومان' | 'ریال' | 'IRR' | 'USD';
  timezone: string;
  calendar: 'jalali' | 'gregorian';
  integrationMode: IntegrationMode;
}

// ----------------------------------------------------
// FEATURE VISIBILITY / CUSTOMIZATION
// ----------------------------------------------------

export interface ModuleFeature {
  id: NavTab;
  labelFa: string;
  labelEn: string;
  descriptionFa: string;
  descriptionEn: string;
  iconName: string;
  isEnabled: boolean;
  isPinned: boolean;
  order: number;
  category: 'core' | 'access' | 'finance' | 'planning' | 'system';
  isFutureReady?: boolean;
}

// ----------------------------------------------------
// PILOT DIAGNOSTICS & MISMATCH LOG
// ----------------------------------------------------

export interface PilotComparisonLog {
  id: string;
  timestamp: string;
  deviceId: string;
  deviceName: string;
  memberId?: string;
  memberName: string;
  externalDecision: 'ALLOW' | 'DENY';
  gymOsDecision: 'ALLOW' | 'DENY' | 'ALLOW_WITH_WARNING';
  isMatch: boolean;
  mismatchReason?: string;
}

// ----------------------------------------------------
// THEME ENGINE TOKENS & SYSTEM
// ----------------------------------------------------

export type ThemeKey = 
  | 'obsidian'
  | 'midnight'
  | 'purple'
  | 'emerald'
  | 'rose'
  | 'cyan'
  | 'pearl'
  | 'ice'
  | 'mint'
  | 'rose_light'
  | 'sand'
  | 'lavender'
  | 'oled'
  | 'carbon'
  | 'glass_neon'
  | 'graphite';

export type GlassLevel = 'subtle' | 'regular' | 'neon';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceGlass: string;
  surfaceGlassStrong: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  brand: string;
  brandSoft: string;
  neon: string;
  accent: string;
  glow: string;
  sidebarBg: string;
  cardBg: string;
  buttonBg: string;
  buttonText: string;
}

export interface ThemeConfig {
  id: ThemeKey;
  name: string;
  nameFa: string;
  category: 'dark' | 'light' | 'special';
  colors: ThemeColors;
}

// ----------------------------------------------------
// ORGANIZATION & REAL INSTALLATION SETTINGS
// ----------------------------------------------------

export interface WorkingHoursConfig {
  openingTime: string; // e.g. "06:00"
  closingTime: string; // e.g. "23:30"
  activeDays: string[]; // ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  holidaysDescription?: string;
}

export interface OrganizationInfo {
  id: string;
  tenantId: string;
  name: string;
  managerName: string;
  managerMobile: string;
  city: string;
  address: string;
  phone: string;
  logoUrl?: string;
  website?: string;
  instagram?: string;
  currency: 'تومان' | 'ریال' | 'IRR';
  timezone: string;
  memberNumberLabel: string; // Default: 'شماره عضویت' (Can be 'شماره پرونده', 'کد ثبت', etc.)
  workingHours: WorkingHoursConfig;
  createdAt: string;
  updatedAt?: string;
}

export interface AccessPolicyConfig {
  expiredMembership: 'deny' | 'warn' | 'allow';
  debtPolicy: 'deny' | 'warn' | 'allow';
  sessionLimit: 'enforce' | 'ignore';
  duplicateEntrySameDay: 'allow' | 'warn' | 'block';
  lockerRequired: boolean;
  maxDebtAllowed: number;
}

// ----------------------------------------------------
// DYNAMIC CUSTOM FIELDS SYSTEM
// ----------------------------------------------------

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'phone';

export interface CustomField {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[]; // For 'select' dropdown
  required: boolean;
  visible: boolean;
  placeholder?: string;
  category?: 'general' | 'medical' | 'contract';
}

// ----------------------------------------------------
// MIGRATION & IMPORT CENTER DATA MODELS
// ----------------------------------------------------

export type MigrationSourceType = 'xlsx' | 'csv' | 'json' | 'sql' | 'api' | 'vendor';

export interface ImportMappingProfile {
  id: string;
  name: string;
  description?: string;
  sourceType: MigrationSourceType;
  sourceVendor?: string; // 'zkteco' | 'legacy_a' | 'generic'
  mappings: Record<string, string>; // e.g. { 'نام': 'firstName', 'شماره تماس': 'phone' }
  defaultValues?: Record<string, any>;
  customTransforms?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
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
  errors: MigrationErrorRecord[];
  rollbackAvailable: boolean;
}

export interface MigrationSnapshot {
  id: string;
  timestamp: string;
  description: string;
  dataBackup: string; // JSON serialized state
}

export type DuplicateResolution = 'merge' | 'skip' | 'create_new' | 'keep_existing' | 'use_imported';

export interface DuplicateConflict {
  id: string;
  incomingRecord: any;
  existingStudent: Student;
  matchReason: string; // 'memberNumber' | 'nationalId' | 'phone' | 'name'
  conflicts: {
    field: string;
    fieldLabel: string;
    existingValue: any;
    incomingValue: any;
  }[];
  resolved: boolean;
  resolution?: DuplicateResolution;
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
  jsonPath?: string; // e.g. "data.members"
}

export interface DashboardWidgetConfig {
  id: string;
  name: string;
  nameFa: string;
  visible: boolean;
  order: number;
}

