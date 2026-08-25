export type Language = 'fa' | 'en';
export type Theme = 'dark' | 'light';

export type NavTab = 
  | 'dashboard' 
  | 'coaches' 
  | 'students' 
  | 'finances' 
  | 'attendance' 
  | 'smart_lockers'
  | 'plans' 
  | 'reports' 
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
}

export type StudentStatus = 'active' | 'expired' | 'pending_renewal' | 'suspended';

export type PaymentMethod = 'pos' | 'cash' | 'card_transfer' | 'online';

export type TransactionType = 'tuition' | 'coach_settlement' | 'supplement_sale' | 'buffet' | 'expense' | 'other_income';

export type ExpenseCategory = 'rent' | 'salary' | 'utility' | 'equipment' | 'maintenance' | 'marketing' | 'buffet_stock' | 'other';

export interface Coach {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  specialty: string; // e.g. بدنسازی، کراس‌فیت، فیتنس، تی‌آر‌ایکس، تغذیه
  commissionRate: number; // e.g. 70 means 70% to coach, 30% to club
  joinDate: string;
  avatar?: string;
  status: 'active' | 'inactive';
  notes?: string;
  monthlyTargetStudents?: number;
  bankCard?: string;
  bankShaba?: string;
  bankName?: string;
}

export interface Student {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  emergencyPhone?: string;
  coachId: string; // Assigned coach ID or '' / 'none' for Free Workout (بدون مربی)
  wantsCoach?: boolean; // آیا مربی اختصاصی می‌خواهد؟
  wantsWorkoutPlan?: boolean; // آیا برنامه تمرینی می‌خواهد؟
  wantsDietPlan?: boolean; // آیا برنامه رژیم غذایی می‌خواهد؟
  packageType: PackageType;
  registrationDate: string;
  expireDate: string;
  totalFee: number; // شهریه کل دوره
  paidAmount: number; // مبلغ پرداختی
  remainingDebt: number; // مانده بدهی (totalFee - paidAmount)
  status: StudentStatus;
  sessionsTotal: number;
  sessionsAttended: number;
  medicalNotes?: string;
  height?: number; // cm
  weight?: number; // kg
  goal?: string; // کاهش وزن، افزایش حجم، آمادگی جسمانی
  avatar?: string;
  birthDate?: string;
  rfidCardUid?: string; // UID تگ RFID یا مچ‌بند
  biometricRegistered?: boolean; // آیا چهره یا اثر انگشت ثبت شده؟
  assignedLocker?: number; // کمد اختصاص یافته فعال
}

export interface PaymentRecord {
  id: string;
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
}

export interface CoachSettlement {
  id: string;
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
  studentId: string;
  studentName: string;
  coachName: string;
  checkInTime: string; // e.g. 17:30
  date: string; // e.g. 1403/06/04 or 2026-08-25
  lockerNumber?: number;
  method?: 'manual' | 'face_scan' | 'rfid_wristband' | 'fingerprint' | 'qr_code';
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: PaymentMethod;
  description?: string;
  receiptNumber?: string;
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
  dayTitle: string; // e.g. شنبه: سینه و جلو بازو
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: string;
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
  mealName: string; // e.g. صبحانه، میان‌وعده، ناهار
  timing: string;
  items: string;
  caloriesEstimate?: number;
}

export interface DietPlan {
  id: string;
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
export type LockerStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';
export type LockerLockType = 'rfid_relay' | 'solenoid' | 'magnetic' | 'ble_iot';

export interface SmartLocker {
  id: string;
  number: number;
  zone: LockerZone;
  status: LockerStatus;
  currentStudentId?: string;
  currentStudentName?: string;
  assignedAt?: string;
  isLocked: boolean;
  batteryLevel?: number; // percentage (for wireless locks)
  lastUnlockedAt?: string;
  lockType: LockerLockType;
  relayPort?: number; // e.g. Relay #1 to #64 on Modbus/ESP32 board
}

export type HardwareDeviceType = 
  | 'rfid_nfc' 
  | 'biometric_face' 
  | 'fingerprint' 
  | 'barcode_turnstile' 
  | 'locker_relay_board';

export type HardwareProtocol = 
  | 'websocket' 
  | 'mqtt' 
  | 'serial_webusb' 
  | 'modbus_tcp' 
  | 'http_webhook';

export interface HardwareDevice {
  id: string;
  name: string;
  type: HardwareDeviceType;
  status: 'online' | 'offline' | 'simulated';
  ipAddress: string;
  port: number;
  protocol: HardwareProtocol;
  lastPing: string;
  location: string;
  relayPinsCount?: number;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName: string;
  deviceType: string;
  method: 'face_recognition' | 'rfid_card' | 'fingerprint' | 'qr_code' | 'manual_override';
  result: 'granted' | 'denied_expired' | 'denied_debt' | 'denied_unknown';
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
}

