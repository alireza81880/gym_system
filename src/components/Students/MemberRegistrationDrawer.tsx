import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  Phone, 
  IdCard, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  AlertCircle, 
  Check, 
  Coins, 
  Clock, 
  Flame, 
  Layers, 
  Eye, 
  PlusCircle, 
  Hash,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, PackageType, PaymentMethod, MembershipPackage } from '../../types';
import { DateService } from '../../services/dateService';
import { MoneyService } from '../../services/moneyService';
import { MemberService } from '../../services/memberService';
import { ValidationService } from '../../services/validationService';
import { GlassDrawer } from '../common/GlassDrawer';
import { GlassButton } from '../common/GlassButton';
import { MoneyInput } from '../common/MoneyInput';
import { GlassBadge } from '../common/GlassBadge';

interface MemberRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onViewStudent?: (studentId: string) => void;
}

export const MemberRegistrationDrawer: React.FC<MemberRegistrationDrawerProps> = ({
  isOpen,
  onClose,
  onViewStudent,
}) => {
  const { 
    students, 
    coaches, 
    packages, 
    addStudent, 
    customFields, 
    organizationInfo, 
    formatMoney, 
    formatNum 
  } = useApp();

  // Next sequential member number
  const nextMemberNumber = MemberService.calculateNextMemberNumber(students);
  const memberLabel = organizationInfo.memberNumberLabel || 'شماره عضویت';

  // Primary Info
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');

  // Expandable Extra Info
  const [showExtraInfo, setShowExtraInfo] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [coachId, setCoachId] = useState('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [goal, setGoal] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [rfidCardUid, setRfidCardUid] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Membership & Package State
  const defaultPackage = packages[0] || {
    id: 'pkg-default',
    name: 'اشتراک ماهانه عمومی (۱۲ جلسه)',
    price: 2800000,
    durationDays: 30,
    sessionsCount: 12,
  };

  const [selectedPackageId, setSelectedPackageId] = useState<string>(defaultPackage.id || '');
  const [packageType, setPackageType] = useState<PackageType>(defaultPackage.type || '1_month');
  const [packagePrice, setPackagePrice] = useState<number>(defaultPackage.price || 2800000);
  const [sessionsTotal, setSessionsTotal] = useState<number>(defaultPackage.sessionsCount || 12);
  const [durationDays, setDurationDays] = useState<number>(defaultPackage.durationDays || 30);
  const [startDate, setStartDate] = useState<string>(DateService.getTodayJalali());
  const [expireDate, setExpireDate] = useState<string>(() => DateService.addDaysToJalali(DateService.getTodayJalali(), 30));

  // Payment State
  const [receivedAmount, setReceivedAmount] = useState<number>(defaultPackage.price || 2800000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [isCreditAccepted, setIsCreditAccepted] = useState(false);

  // Status & Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStudentResult, setCreatedStudentResult] = useState<{
    id: string;
    fullName: string;
    memberNumber: string;
    packageName: string;
    receivedAmount: number;
    remainingDebt: number;
  } | null>(null);

  // When selected package changes, recalculate price, duration, and dates automatically
  const handlePackageSelect = (pkg: MembershipPackage) => {
    setSelectedPackageId(pkg.id);
    setPackageType(pkg.type || pkg.name);
    setPackagePrice(pkg.price);
    setSessionsTotal(pkg.sessionsCount || 12);
    const dur = pkg.durationDays || (pkg.durationMonths ? pkg.durationMonths * 30 : 30);
    setDurationDays(dur);
    
    // Auto-calculate end date using exact calendar arithmetic
    const newEnd = DateService.addDaysToJalali(startDate, dur);
    setExpireDate(newEnd);

    // Update received amount default
    setReceivedAmount(pkg.price);
  };

  // Recalculate end date if start date changes
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart.length === 10) {
      setExpireDate(DateService.addDaysToJalali(newStart, durationDays));
    }
  };

  // Full Payment Shortcut
  const handleFullPayment = () => {
    setReceivedAmount(packagePrice);
    setIsCreditAccepted(false);
  };

  // Reset form for next member
  const handleResetForNext = () => {
    setFullName('');
    setNationalId('');
    setPhone('');
    setEmergencyPhone('');
    setMedicalNotes('');
    setHeight('');
    setWeight('');
    setGoal('');
    setRfidCardUid('');
    setCustomFieldValues({});
    setErrorMessage(null);
    setCreatedStudentResult(null);
    setIsCreditAccepted(false);

    // Reset package & payment
    if (packages.length > 0) {
      handlePackageSelect(packages[0]);
    } else {
      setReceivedAmount(packagePrice);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validation
    if (!fullName.trim()) {
      setErrorMessage('نام و نام خانوادگی الزامی است.');
      return;
    }

    if (phone.trim() && !ValidationService.isValidMobilePhone(phone.trim())) {
      setErrorMessage('فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }

    if (nationalId.trim() && !ValidationService.isValidNationalId(nationalId.trim())) {
      setErrorMessage('کد ملی ۱۰ رقمی وارد شده نامعتبر است.');
      return;
    }

    // Check Duplicate
    if (nationalId.trim() && MemberService.isNationalIdDuplicate(nationalId, students)) {
      setErrorMessage(`کاربری با این کد ملی (${nationalId}) قبلاً در سامانه ثبت شده است.`);
      return;
    }

    // Overpayment check
    if (receivedAmount > packagePrice && !isCreditAccepted) {
      setErrorMessage('مبلغ دریافتی بیشتر از مبلغ قابل پرداخت است. در صورت تمایل گزینه ثبت به عنوان بستانکاری را انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { firstName, lastName } = MemberService.parseFullName(fullName);
      const remainingDebt = Math.max(0, packagePrice - receivedAmount);

      const assignedNumber = nextMemberNumber;

      const studentPayload: Omit<Student, 'id' | 'remainingDebt'> = {
        fullName: fullName.trim(),
        firstName,
        lastName,
        nationalId: nationalId.trim(),
        phone: phone.trim(),
        emergencyPhone: emergencyPhone.trim() || undefined,
        coachId: coachId || '',
        packageType,
        registrationDate: startDate,
        expireDate,
        totalFee: packagePrice,
        paidAmount: receivedAmount,
        status: 'active',
        sessionsTotal,
        sessionsAttended: 0,
        memberNumber: assignedNumber,
        height: typeof height === 'number' ? height : undefined,
        weight: typeof weight === 'number' ? weight : undefined,
        goal: goal.trim() || undefined,
        medicalNotes: medicalNotes.trim() || undefined,
        rfidCardUid: rfidCardUid.trim() || undefined,
        customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
      };

      addStudent(studentPayload, receivedAmount, paymentMethod);

      // Find created student
      const selectedPkgName = packages.find(p => p.id === selectedPackageId)?.name || 'عضویت انتخابی';

      setCreatedStudentResult({
        id: `created-${Date.now()}`,
        fullName: fullName.trim(),
        memberNumber: assignedNumber,
        packageName: selectedPkgName,
        receivedAmount,
        remainingDebt,
      });
    } catch (err) {
      setErrorMessage(`خطا در ثبت عضو: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingDebt = Math.max(0, packagePrice - receivedAmount);
  const isOverpaid = receivedAmount > packagePrice;

  return (
    <GlassDrawer
      isOpen={isOpen}
      onClose={() => {
        handleResetForNext();
        onClose();
      }}
      title="ثبت عضو جدید و دریافت شهریه"
      subtitle="پذیرش سریع ورزشکار در گیت و ثبت هوشمند پرونده"
      icon={<UserPlus className="w-5 h-5" />}
      widthClass="max-w-xl sm:max-w-2xl"
    >
      {/* SUCCESS CONFIRMATION SCREEN */}
      {createdStudentResult ? (
        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">عضو با موفقیت ثبت شد</h3>
              <p className="text-sm text-emerald-300/80 mt-1 font-medium">
                {createdStudentResult.fullName} به اعضای فعال باشگاه افزوده شد.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/20 text-right">
              <div>
                <span className="text-[11px] text-slate-400 block">{memberLabel}:</span>
                <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
                  #{createdStudentResult.memberNumber}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">پکیج عضویت:</span>
                <span className="text-xs font-bold text-white mt-0.5 block truncate">
                  {createdStudentResult.packageName}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">مبلغ دریافتی:</span>
                <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5 block">
                  {MoneyService.format(createdStudentResult.receivedAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">مانده بدهی:</span>
                <span className={`text-xs font-bold font-mono mt-0.5 block ${createdStudentResult.remainingDebt > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {createdStudentResult.remainingDebt > 0 ? MoneyService.format(createdStudentResult.remainingDebt) : 'تسویه کامل'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <GlassButton
              variant="primary"
              size="lg"
              className="flex-1"
              icon={<PlusCircle className="w-5 h-5" />}
              onClick={handleResetForNext}
            >
              ثبت عضو بعدی
            </GlassButton>

            {onViewStudent && (
              <GlassButton
                variant="secondary"
                size="lg"
                className="flex-1"
                icon={<Eye className="w-5 h-5" />}
                onClick={() => {
                  onClose();
                  onViewStudent(createdStudentResult.id);
                }}
              >
                مشاهده پرونده عضو
              </GlassButton>
            )}
          </div>
        </div>
      ) : (
        /* FAST RECEPTION REGISTRATION FORM */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: COMPACT PRIMARY INFORMATION */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ۱
                </div>
                <h4 className="text-sm font-bold text-white">مشخصات اصلی ورزشکار</h4>
              </div>

              {/* Read-Only Automatic Member Number */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-amber-500/30 text-xs">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">{memberLabel} بعد از ثبت:</span>
                <span className="font-mono font-bold text-amber-400">{nextMemberNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Single Full Name Field for Speed */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="w-full py-2.5 px-3.5 pl-10 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Mobile Phone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  شماره موبایل
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full py-2.5 px-3.5 pl-10 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-mono text-left focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* National ID */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  کد ملی
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={10}
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="۰۰۱۲۳۴۵۶۷۸"
                    className="w-full py-2.5 px-3.5 pl-9 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-mono text-left focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                  <IdCard className="w-4 h-4 text-slate-500 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Expandable Additional Information Section */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowExtraInfo(!showExtraInfo)}
                className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-slate-400 hover:text-amber-300 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>اطلاعات تکمیلی و پرونده ورزشی</span>
                  <span className="text-[10px] text-slate-500 font-mono">(اختیاری)</span>
                </div>
                {showExtraInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showExtraInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-in fade-in duration-200">
                  {/* Coach Selection */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">مربی اختصاصی</label>
                    <select
                      value={coachId}
                      onChange={(e) => setCoachId(e.target.value)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="">بدون مربی / تمرین آزاد</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.fullName} ({c.specialty})</option>
                      ))}
                    </select>
                  </div>

                  {/* Emergency Phone */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">تلفن تماس اضطراری</label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Height & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">قد (سانتی‌متر)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                        placeholder="180"
                        className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">وزن (کیلوگرم)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                        placeholder="78"
                        className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* RFID Card UID */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">کارت تردد / RFID UID</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={rfidCardUid}
                      onChange={(e) => setRfidCardUid(e.target.value)}
                      placeholder="HEX UID e.g. 94A2F10B"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none"
                    />
                  </div>

                  {/* Goal & Medical Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 mb-1">هدف یا سابقه پزشکی / آسیب‌دیدگی</label>
                    <input
                      type="text"
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="مثال: آسیب دیدگی زانو، هدف کاهش وزن"
                      className="w-full py-2 px-3 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>

                  {/* Dynamic Custom Fields */}
                  {customFields.length > 0 && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>فیلدهای سفارشی باشگاه</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customFields.map((cf) => (
                          <div key={cf.id}>
                            <label className="block text-[10px] text-slate-400 mb-1">{cf.label}</label>
                            <input
                              type={cf.type === 'number' ? 'number' : 'text'}
                              value={customFieldValues[cf.key] || ''}
                              onChange={(e) => setCustomFieldValues({
                                ...customFieldValues,
                                [cf.key]: e.target.value,
                              })}
                              placeholder={cf.placeholder || cf.label}
                              className="w-full py-1.5 px-3 rounded-lg bg-slate-950/80 border border-slate-700 text-white text-xs outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: MEMBERSHIP & PACKAGE SELECTION */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ۲
                </div>
                <h4 className="text-sm font-bold text-white">انتخاب بسته و دوره عضویت</h4>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400">
                {MoneyService.format(packagePrice)}
              </span>
            </div>

            {/* Package Cards Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => handlePackageSelect(pkg)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all duration-150 relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-400/30 bg-emerald-950/30 shadow-md'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">{pkg.name}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {pkg.durationDays || 30} روز
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-slate-500" />
                          {pkg.sessionsCount || 12} جلسه
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-800/80 font-mono font-bold text-xs text-emerald-300">
                      {MoneyService.format(pkg.price)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dates Calculation (Real Calendar Jalali) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  تاریخ شروع عضویت
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full py-2 px-3 pl-9 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                  <span>تاریخ انقضا (محاسبه خودکار)</span>
                  <span className="text-[10px] text-emerald-400">{durationDays} روز</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="w-full py-2 px-3 pl-9 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs font-mono outline-none focus:border-emerald-500"
                  />
                  <Calendar className="w-4 h-4 text-emerald-500 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: PAYMENT & FINANCIAL SETTLEMENT */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ۳
                </div>
                <h4 className="text-sm font-bold text-white">پرداخت شهریه و تسویه</h4>
              </div>

              {/* Instant Full Payment Shortcut */}
              <button
                type="button"
                onClick={handleFullPayment}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>دریافت کامل ({MoneyService.format(packagePrice)})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  مبلغ دریافتی امروز
                </label>
                <MoneyInput
                  value={receivedAmount}
                  onChange={(val) => setReceivedAmount(val)}
                  unit="تومان"
                />
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  روش دریافت
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'pos', label: 'کارتخوان (POS)' },
                    { id: 'cash', label: 'نقدی' },
                    { id: 'card_transfer', label: 'انتقال/کارت' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                        paymentMethod === pm.id
                          ? 'bg-slate-800 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Financial Balance Display */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-400 text-[11px] block">قیمت پکیج:</span>
                  <span className="font-mono font-bold text-white mt-0.5 block">
                    {MoneyService.format(packagePrice)}
                  </span>
                </div>
                <div className="text-slate-600 font-bold">−</div>
                <div>
                  <span className="text-slate-400 text-[11px] block">دریافتی امروز:</span>
                  <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                    {MoneyService.format(receivedAmount)}
                  </span>
                </div>
              </div>

              {/* Result Status */}
              <div>
                {remainingDebt === 0 ? (
                  <GlassBadge variant="success" icon={<Check className="w-3 h-3" />}>
                    تسویه کامل
                  </GlassBadge>
                ) : remainingDebt > 0 ? (
                  <GlassBadge variant="warning">
                    مانده: {MoneyService.format(remainingDebt)}
                  </GlassBadge>
                ) : null}
              </div>
            </div>

            {/* Overpayment Warning */}
            {isOverpaid && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>مبلغ دریافتی ({MoneyService.format(receivedAmount)}) بیشتر از مبلغ پکیج ({MoneyService.format(packagePrice)}) است.</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isCreditAccepted}
                    onChange={(e) => setIsCreditAccepted(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>مازاد مبلغ ({MoneyService.format(receivedAmount - packagePrice)}) به عنوان بستانکاری در حساب عضو ثبت شود.</span>
                </label>
              </div>
            )}
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2">
            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
              icon={<CheckCircle2 className="w-5 h-5" />}
            >
              ثبت عضو و دریافت
            </GlassButton>
          </div>
        </form>
      )}
    </GlassDrawer>
  );
};
