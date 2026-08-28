import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Eye, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Dumbbell,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PackageType, PaymentMethod, MembershipPackage, Student } from '../../types';
import { DateService } from '../../services/dateService';
import { ValidationService } from '../../services/validationService';
import { MemberService, DuplicateDetectionResult } from '../../services/memberService';
import { FinancialCalculationService } from '../../services/financialCalculationService';
import { GlassDrawer } from '../common/GlassDrawer';
import { MoneyInput } from '../common/MoneyInput';

interface MemberRegistrationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMemberDetail?: (memberId: string) => void;
}

export const MemberRegistrationDrawer: React.FC<MemberRegistrationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenMemberDetail,
}) => {
  const { 
    students, 
    packages, 
    coaches, 
    customFields, 
    addStudent, 
    formatMoney, 
    formatNum, 
    t 
  } = useApp();

  // Next sequential member number preview
  const nextMemberNumber = useMemo(() => {
    return MemberService.calculateNextMemberNumber(students);
  }, [students]);

  // Section 1: Member Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [nationalIdError, setNationalIdError] = useState<string | null>(null);

  // Duplicate Check State
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateDetectionResult | null>(null);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);

  // Expandable Accordion: Extended Profile
  const [isExtendedOpen, setIsExtendedOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [coachId, setCoachId] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [goal, setGoal] = useState<string>('تناسب اندام و هایپرتروفی');
  const [medicalNotes, setMedicalNotes] = useState<string>('');
  const [rfidCardNumber, setRfidCardNumber] = useState<string>('');
  const [customData, setCustomData] = useState<Record<string, any>>({});

  // Section 2: Membership & Package
  const activePackages = useMemo(() => {
    return packages.filter(p => p.isActive);
  }, [packages]);

  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    return activePackages[0]?.id || '';
  });

  // Keep package selection valid when packages load
  useEffect(() => {
    if (!selectedPackageId && activePackages.length > 0) {
      setSelectedPackageId(activePackages[0].id);
    }
  }, [activePackages, selectedPackageId]);

  const selectedPackage = useMemo(() => {
    return packages.find(p => p.id === selectedPackageId) || activePackages[0] || null;
  }, [packages, activePackages, selectedPackageId]);

  // Dates
  const [startDate, setStartDate] = useState<string>(() => DateService.getTodayJalali());
  const [expireDate, setExpireDate] = useState<string>('');
  const [isManualDateOverride, setIsManualDateOverride] = useState(false);

  // Auto-calculate expiration date when package or startDate changes
  useEffect(() => {
    if (!isManualDateOverride && selectedPackage && startDate) {
      const calculatedEnd = DateService.addDaysToJalali(startDate, selectedPackage.durationDays || 30);
      setExpireDate(calculatedEnd);
    }
  }, [selectedPackage, startDate, isManualDateOverride]);

  // Section 3: Financial & Payment
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [recordAsCredit, setRecordAsCredit] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Auto-update received amount to match full price when package changes, unless user modified it
  const [hasUserModifiedPayment, setHasUserModifiedPayment] = useState(false);

  const financial = useMemo(() => {
    const basePrice = selectedPackage ? selectedPackage.price : 0;
    return FinancialCalculationService.calculate(basePrice, receivedAmount, discountAmount);
  }, [selectedPackage, receivedAmount, discountAmount]);

  // When package changes and user hasn't manually altered received amount, set it to final price
  useEffect(() => {
    if (!hasUserModifiedPayment && selectedPackage) {
      const calculated = FinancialCalculationService.calculate(selectedPackage.price, selectedPackage.price, discountAmount);
      setReceivedAmount(calculated.finalPrice);
    }
  }, [selectedPackageId, discountAmount, hasUserModifiedPayment]);

  // Submission & Success State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    memberNumber: string;
    studentId: string;
    studentName: string;
    packageName: string;
    finalPrice: number;
    receivedAmount: number;
    remainingDebt: number;
  } | null>(null);

  // Reset form helper for "ثبت عضو بعدی"
  const handleResetForm = () => {
    setFullName('');
    setPhone('');
    setNationalId('');
    setPhoneError(null);
    setNationalIdError(null);
    setDuplicateWarning(null);
    setAcknowledgedDuplicate(false);
    setIsExtendedOpen(false);
    setGender('male');
    setCoachId('');
    setBirthDate('');
    setEmergencyPhone('');
    setHeight('');
    setWeight('');
    setGoal('تناسب اندام و هایپرتروفی');
    setMedicalNotes('');
    setRfidCardNumber('');
    setCustomData({});
    setDiscountAmount(0);
    setHasUserModifiedPayment(false);
    setIsManualDateOverride(false);
    setStartDate(DateService.getTodayJalali());
    if (activePackages.length > 0) {
      setSelectedPackageId(activePackages[0].id);
      setReceivedAmount(activePackages[0].price);
      setExpireDate(DateService.addDaysToJalali(DateService.getTodayJalali(), activePackages[0].durationDays || 30));
    }
    setPaymentMethod('pos');
    setRecordAsCredit(false);
    setPaymentNotes('');
    setSuccessData(null);
    setIsSubmitting(false);
  };

  // Reset on open if drawer was previously closed
  useEffect(() => {
    if (isOpen && !successData) {
      // Refresh dates to current today
      const today = DateService.getTodayJalali();
      setStartDate(today);
      if (selectedPackage) {
        setExpireDate(DateService.addDaysToJalali(today, selectedPackage.durationDays || 30));
        if (!hasUserModifiedPayment) {
          setReceivedAmount(selectedPackage.price);
        }
      }
    }
  }, [isOpen]);

  // Real-time Phone Validation
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setAcknowledgedDuplicate(false);
    if (!val) {
      setPhoneError(null);
      return;
    }
    const clean = ValidationService.normalizeMobilePhone(val);
    if (val.length >= 10 && !ValidationService.isValidMobilePhone(clean)) {
      setPhoneError('شماره همراه باید ۱۱ رقم با فرمت ۰۹xxxxxxxx باشد.');
    } else {
      setPhoneError(null);
    }
    checkDuplicate({ phone: val, nationalId, fullName });
  };

  // Real-time National ID Validation
  const handleNationalIdChange = (val: string) => {
    setNationalId(val);
    setAcknowledgedDuplicate(false);
    if (!val || val.trim() === '') {
      setNationalIdError(null);
      return;
    }
    const clean = ValidationService.toEnglishDigits(val).replace(/\D/g, '');
    if (clean.length === 10) {
      if (!ValidationService.isValidNationalId(clean)) {
        setNationalIdError('کد ملی وارد شده معتبر نمی‌باشد (بررسی رقم کنترل).');
      } else {
        setNationalIdError(null);
      }
    } else if (clean.length > 10) {
      setNationalIdError('کد ملی باید دقیقاً ۱۰ رقم باشد.');
    } else {
      setNationalIdError(null);
    }
    checkDuplicate({ nationalId: val, phone, fullName });
  };

  // Duplicate Check Trigger
  const checkDuplicate = (input: { phone?: string; nationalId?: string; fullName?: string }) => {
    const result = MemberService.detectDuplicate(
      {
        phone: input.phone || phone,
        nationalId: input.nationalId || nationalId,
        fullName: input.fullName || fullName,
      },
      students
    );

    if (result.isDuplicate) {
      setDuplicateWarning(result);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      alert('لطفاً نام و نام خانوادگی عضو را وارد نمایید.');
      return;
    }

    if (!phone.trim()) {
      alert('لطفاً شماره موبایل عضو را وارد نمایید.');
      return;
    }

    const cleanPhone = ValidationService.normalizeMobilePhone(phone);
    if (!ValidationService.isValidMobilePhone(cleanPhone)) {
      setPhoneError('شماره موبایل وارد شده نامعتبر است.');
      return;
    }

    if (nationalId.trim()) {
      const cleanNat = ValidationService.toEnglishDigits(nationalId).replace(/\D/g, '');
      if (cleanNat.length === 10 && !ValidationService.isValidNationalId(cleanNat)) {
        setNationalIdError('کد ملی نامعتبر است.');
        return;
      }
    }

    // Duplicate Check Stop unless acknowledged
    if (duplicateWarning && duplicateWarning.isDuplicate && !acknowledgedDuplicate) {
      return;
    }

    if (!selectedPackage) {
      alert('لطفاً یک پکیج عضویت معتبر انتخاب کنید.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate next atomic sequential member number
      const allocatedMemberNumber = MemberService.calculateNextMemberNumber(students);
      MemberService.recordAllocatedNumber(parseInt(allocatedMemberNumber, 10));

      const { firstName, lastName } = MemberService.parseFullName(fullName);

      // Create Student Entity
      const newStudent = addStudent(
        {
          fullName: fullName.trim(),
          firstName,
          lastName,
          nationalId: nationalId.trim(),
          phone: cleanPhone,
          emergencyPhone: emergencyPhone.trim(),
          memberNumber: allocatedMemberNumber,
          gender,
          birthDate: birthDate.trim(),
          coachId: coachId || undefined,
          packageType: selectedPackage.type,
          packageId: selectedPackage.id,
          registrationDate: startDate,
          expireDate: expireDate || DateService.addDaysToJalali(startDate, selectedPackage.durationDays || 30),
          totalFee: financial.finalPrice,
          paidAmount: financial.receivedAmount,
          status: 'active',
          sessionsTotal: selectedPackage.sessionsCount || 12,
          sessionsAttended: 0,
          height: height ? Number(height) : undefined,
          weight: weight ? Number(weight) : undefined,
          goal: goal.trim(),
          medicalNotes: medicalNotes.trim(),
          rfidCardNumber: rfidCardNumber.trim() || undefined,
          customData,
        },
        financial.receivedAmount,
        paymentMethod
      );

      // Show Success State
      setSuccessData({
        memberNumber: allocatedMemberNumber,
        studentId: newStudent.id,
        studentName: fullName.trim(),
        packageName: selectedPackage.name,
        finalPrice: financial.finalPrice,
        receivedAmount: financial.receivedAmount,
        remainingDebt: financial.remainingDebt,
      });
    } catch (err) {
      console.error('Registration failed:', err);
      alert('خطا در ثبت اطلاعات عضو.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={successData ? 'عضویت با موفقیت صادر شد' : 'ثبت عضو جدید و صدور اشتراک'}
      subtitle={successData ? `شماره پرونده: #${successData.memberNumber}` : 'پذیرش سریع باشگاه — ثبت مشخصات، پکیج و دریافت شهریه'}
      icon={successData ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <UserPlus className="w-5 h-5 text-amber-500" />}
      widthClass="max-w-xl"
    >
      {/* 1. SUCCESS VIEW STATE */}
      {successData ? (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-stone-900 dark:text-white">
              عضو با موفقیت در سیستم ثبت گردید!
            </h4>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-sm shadow-xs">
              <span>شماره عضویت:</span>
              <span className="font-mono text-base">#{successData.memberNumber}</span>
            </div>
          </div>

          {/* Registration Receipt Summary */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-stone-200 dark:border-stone-700/60">
              <span className="text-stone-500">نام و نام خانوادگی:</span>
              <span className="font-bold text-stone-900 dark:text-white">{successData.studentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-200 dark:border-stone-700/60">
              <span className="text-stone-500">پکیج انتخابی:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">{successData.packageName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-200 dark:border-stone-700/60">
              <span className="text-stone-500">مبلغ قابل پرداخت:</span>
              <span className="font-mono font-bold text-stone-900 dark:text-white">{formatMoney(successData.finalPrice)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-stone-200 dark:border-stone-700/60">
              <span className="text-stone-500">مبلغ دریافتی امروز:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(successData.receivedAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-stone-500">مانده بدهی:</span>
              <span className={`font-mono font-bold ${successData.remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {successData.remainingDebt > 0 ? formatMoney(successData.remainingDebt) : 'تسویه کامل ✓'}
              </span>
            </div>
          </div>

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت عضو بعدی</span>
            </button>

            {onOpenMemberDetail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMemberDetail(successData.studentId);
                }}
                className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-200 dark:border-stone-700 transition-colors"
              >
                <Eye className="w-4 h-4 text-amber-500" />
                <span>مشاهده پرونده</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold"
            >
              بستن
            </button>
          </div>
        </div>
      ) : (
        /* 2. REGISTRATION FORM (3 Sections) */
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          
          {/* ========================================================
              SECTION 1: مشخصات عضو (Member Info)
          ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
              <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-[var(--gym-brand,#10b981)]/15 text-[var(--gym-brand,#10b981)] flex items-center justify-center font-mono text-xs">۱</span>
                <span>مشخصات فردی عضو</span>
              </h4>

              {/* Sequential Number Preview Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-subtle border border-[var(--gym-border)] text-[11px]">
                <span className="text-[var(--gym-text-muted)]">شماره عضویت:</span>
                <span className="font-mono font-bold text-[var(--gym-brand,#10b981)]">پیش‌نمایش: #{nextMemberNumber}</span>
              </div>
            </div>

            {/* Duplicate Warning Dialog */}
            {duplicateWarning && duplicateWarning.isDuplicate && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>عضو مشابه در سیستم پیدا شد!</span>
                </div>
                <p className="text-[var(--gym-text-secondary)] text-[11px] leading-relaxed">
                  {duplicateWarning.reason}
                  {duplicateWarning.matchedMember && (
                    <span className="block mt-1 font-semibold">
                      نام: {duplicateWarning.matchedMember.fullName} (شماره عضویت: #{duplicateWarning.matchedMember.memberNumber || duplicateWarning.matchedMember.id})
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {duplicateWarning.matchedMember && onOpenMemberDetail && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenMemberDetail(duplicateWarning.matchedMember!.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 text-stone-950 font-bold text-[11px] hover:bg-amber-600 transition-colors"
                    >
                      مشاهده پرونده عضو موجود
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAcknowledgedDuplicate(true)}
                    className="px-2.5 py-1 rounded-xl glass-subtle text-[var(--gym-text-secondary)] font-medium text-[11px] hover:text-[var(--gym-text)]"
                  >
                    ادامه و ثبت عضو جدید
                  </button>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                نام و نام خانوادگی <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setAcknowledgedDuplicate(false);
                }}
                onBlur={() => checkDuplicate({ fullName, phone, nationalId })}
                placeholder="مثال: علی رضایی"
                className="w-full px-3.5 py-2.5 rounded-2xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text,#fff)] text-sm focus:border-[var(--gym-brand,#10b981)] focus:ring-2 focus:ring-[var(--gym-brand,#10b981)]/20 outline-none"
              />
            </div>

            {/* Phone & National ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                  شماره موبایل <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="09123456789"
                  dir="ltr"
                  className={`w-full px-3.5 py-2.5 rounded-2xl glass-subtle border font-mono text-sm outline-none transition-all ${
                    phoneError
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 focus:ring-rose-500/20'
                      : 'border-[var(--gym-border)] text-[var(--gym-text,#fff)] focus:border-[var(--gym-brand,#10b981)] focus:ring-2 focus:ring-[var(--gym-brand,#10b981)]/20'
                  }`}
                />
                {phoneError && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{phoneError}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                  کد ملی <span className="text-[var(--gym-text-muted)] font-normal">(اختیاری)</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={nationalId}
                  onChange={(e) => handleNationalIdChange(e.target.value)}
                  placeholder="۱۰ رقمی"
                  dir="ltr"
                  className={`w-full px-3.5 py-2.5 rounded-2xl glass-subtle border font-mono text-sm outline-none transition-all ${
                    nationalIdError
                      ? 'border-rose-500 bg-rose-500/10 text-rose-400 focus:ring-rose-500/20'
                      : 'border-[var(--gym-border)] text-[var(--gym-text,#fff)] focus:border-[var(--gym-brand,#10b981)] focus:ring-2 focus:ring-[var(--gym-brand,#10b981)]/20'
                  }`}
                />
                {nationalIdError && (
                  <span className="text-[11px] text-rose-400 mt-1 block">{nationalIdError}</span>
                )}
              </div>
            </div>

            {/* Expandable Accordion for Extended Dossier */}
            <div className="rounded-2xl border border-[var(--gym-border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setIsExtendedOpen(!isExtendedOpen)}
                className="w-full px-4 py-2.5 glass-subtle text-[var(--gym-text-secondary)] text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--gym-brand,#10b981)]" />
                  <span>اطلاعات تکمیلی و پرونده ورزشی (مربی، هدف، کارت، فیلد سفارشی)</span>
                </span>
                {isExtendedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isExtendedOpen && (
                <div className="p-4 glass-regular space-y-3.5 border-t border-[var(--gym-border)] text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">جنسیت</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)]"
                      >
                        <option value="male" className="bg-stone-900 text-white">آقا</option>
                        <option value="female" className="bg-stone-900 text-white">خانم</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">مربی اختصاصی</label>
                      <select
                        value={coachId}
                        onChange={(e) => setCoachId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)]"
                      >
                        <option value="" className="bg-stone-900 text-white">بدون مربی / تمرین آزاد</option>
                        {coaches.map(c => (
                          <option key={c.id} value={c.id} className="bg-stone-900 text-white">
                            {c.fullName} ({c.specialty})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">قد (سانتی‌متر)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                        placeholder="180"
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">وزن (کیلوگرم)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                        placeholder="78"
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">تلفن اضطراری</label>
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="021..."
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">هدف ورزشی</label>
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="کاهش وزن، بدنسازی، فیتنس..."
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">کارت تردد / RFID UID</label>
                      <input
                        type="text"
                        value={rfidCardNumber}
                        onChange={(e) => setRfidCardNumber(e.target.value)}
                        placeholder="شناسه کارت یا مچ‌بند..."
                        className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--gym-text-muted)] mb-1">سوابق پزشکی / آسیب‌دیدگی</label>
                    <input
                      type="text"
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="دیسک، جراحی قبلی یا توضیحات پزشکی..."
                      className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)]"
                    />
                  </div>

                  {/* Custom Organization Fields */}
                  {customFields.length > 0 && (
                    <div className="pt-2 border-t border-[var(--gym-border)] space-y-2">
                      <span className="font-semibold text-[var(--gym-text-secondary)] block">فیلدهای سفارشی باشگاه:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {customFields.map((cf) => (
                          <div key={cf.id}>
                            <label className="block text-[11px] text-[var(--gym-text-muted)] mb-1">{cf.label}</label>
                            <input
                              type="text"
                              value={customData[cf.key] || ''}
                              onChange={(e) => setCustomData({ ...customData, [cf.key]: e.target.value })}
                              placeholder={cf.placeholder || cf.label}
                              className="w-full px-2.5 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-xs text-[var(--gym-text)]"
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


          {/* ========================================================
              SECTION 2: انتخاب پکیج و دوره عضویت (Membership & Package)
          ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono text-xs">۲</span>
                <span>انتخاب پکیج و دوره عضویت</span>
              </h4>
            </div>

            {/* Package Cards Selector */}
            {activePackages.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center text-xs text-stone-600 dark:text-stone-300 space-y-1">
                <p className="font-semibold">هنوز پکیج فعالی در سیستم تعریف نشده است.</p>
                <p className="text-[11px] text-stone-500">لطفاً از بخش تنظیمات نسبت به تعریف پکیج‌ها اقدام نمایید.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activePackages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setHasUserModifiedPayment(false);
                      }}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-stone-900 dark:text-white shadow-xs ring-1 ring-amber-500'
                          : 'bg-stone-50 dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-700/80 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs block text-stone-900 dark:text-white">
                            {pkg.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-500" />
                              <span>{pkg.durationDays} روزه</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-500" />
                              <span>{pkg.sessionsCount ? `${pkg.sessionsCount} جلسه` : 'نامحدود'}</span>
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pkg.allowsLocker ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-stone-200 dark:bg-stone-800 text-stone-500'}`}>
                          {pkg.allowsLocker ? 'کمد مجاز' : 'بدون کمد'}
                        </span>
                        <span className="font-mono font-bold text-xs text-stone-900 dark:text-white">
                          {formatMoney(pkg.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Date Calculation & Manual Override */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>دوره اعتبار عضویت</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualDateOverride(!isManualDateOverride)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {isManualDateOverride ? 'بازگشت به محاسبه خودکار' : 'ویرایش دستی تاریخ'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">تاریخ شروع</label>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!isManualDateOverride && selectedPackage) {
                        setExpireDate(DateService.addDaysToJalali(e.target.value, selectedPackage.durationDays || 30));
                      }
                    }}
                    placeholder="1403/05/25"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">تاریخ پایان و انقضا</label>
                  <input
                    type="text"
                    value={expireDate}
                    onChange={(e) => {
                      setExpireDate(e.target.value);
                      setIsManualDateOverride(true);
                    }}
                    placeholder="1403/06/25"
                    className={`w-full px-3 py-1.5 rounded-lg border font-mono text-xs text-center ${
                      isManualDateOverride
                        ? 'border-amber-500 bg-white dark:bg-stone-900'
                        : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  />
                </div>
              </div>

              {!isManualDateOverride && selectedPackage && (
                <div className="text-[11px] text-stone-500 flex items-center gap-1 justify-end">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>محاسبه خودکار بر اساس {selectedPackage.durationDays} روز اعتبار</span>
                </div>
              )}
            </div>

            {/* Optional Discount Input */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="text-stone-700 dark:text-stone-300 font-medium whitespace-nowrap">
                تخفیف ویژه دوره:
              </label>
              <div className="w-44">
                <MoneyInput
                  value={discountAmount}
                  onChange={(val) => {
                    setDiscountAmount(val);
                    setHasUserModifiedPayment(false);
                  }}
                  placeholder="مبلغ تخفیف (تومان)"
                />
              </div>
            </div>
          </div>


          {/* ========================================================
              SECTION 3: پرداخت و تسویه مالی (Payment & Financial)
          ======================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono text-xs">۳</span>
                <span>پرداخت و تسویه مالی</span>
              </h4>
            </div>

            {/* Financial Calculation Summary Card */}
            <div className="p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-600 dark:text-stone-400">
                <span>قیمت پایه پکیج:</span>
                <span className="font-mono font-semibold text-stone-900 dark:text-white">{formatMoney(financial.basePrice)}</span>
              </div>

              {financial.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>تخفیف اعمال شده:</span>
                  <span className="font-mono">-{formatMoney(financial.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-amber-500/20 font-bold text-stone-900 dark:text-white">
                <span>مبلغ قابل پرداخت نهایی:</span>
                <span className="font-mono text-sm text-amber-600 dark:text-amber-400">{formatMoney(financial.finalPrice)}</span>
              </div>
            </div>

            {/* Money Input for Received Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 dark:text-white">
                  مبلغ دریافتی امروز (شهریه / پیش‌پرداخت):
                </label>
                <span className="text-[11px] text-stone-500">
                  {financial.isFullPayment ? 'تسویه کامل' : financial.isPartialPayment ? 'پرداخت اقساطی / بیعانه' : ''}
                </span>
              </div>

              <MoneyInput
                value={receivedAmount}
                onChange={(val) => {
                  setReceivedAmount(val);
                  setHasUserModifiedPayment(true);
                }}
                onFullAmount={() => {
                  setReceivedAmount(financial.finalPrice);
                  setHasUserModifiedPayment(true);
                }}
                fullAmountLabel="دریافت کامل شهریه"
                placeholder="مبلغ پرداختی امروز"
              />
            </div>

            {/* Live Remaining Debt Status */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-400 font-medium">مانده بدهی عضو:</span>
              <span className={`font-mono font-bold text-sm ${
                financial.remainingDebt > 0 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {financial.remainingDebt > 0 ? formatMoney(financial.remainingDebt) : 'تسویه کامل (بدون بدهی) ✓'}
              </span>
            </div>

            {/* Overpayment Detection */}
            {financial.isOverpaid && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 space-y-2">
                <p className="font-semibold">
                  مبلغ دریافتی {formatMoney(financial.creditAmount)} بیشتر از شهریه دوره است.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={recordAsCredit}
                    onChange={(e) => setRecordAsCredit(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>ثبت مازاد به عنوان بستانکاری (شارژ کیف پول عضو)</span>
                </label>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'pos', label: 'کارتخوان (POS)' },
                { id: 'card_transfer', label: 'کارت به کارت' },
                { id: 'cash', label: 'نقدی (صندوق)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`py-2 px-2.5 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-stone-900 dark:border-white shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>


          {/* ========================================================
              DRAWER ACTIONS / FOOTER
          ======================================================== */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-stone-900/95 py-3 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              لغو
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (duplicateWarning?.isDuplicate && !acknowledgedDuplicate)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-stone-950 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>ثبت عضو و دریافت</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </GlassDrawer>
  );
};
