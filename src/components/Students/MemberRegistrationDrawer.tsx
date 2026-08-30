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
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMembers, useSettings } from '../../stores';
import { PackageType, PaymentMethod, MembershipPackage, Student } from '../../types';
import { DateService } from '../../services/dateService';
import { ValidationService } from '../../services/validationService';
import { MemberService, DuplicateDetectionResult } from '../../services/memberService';
import { FinancialCalculationService } from '../../services/financialCalculationService';
import { GlassDrawer } from '../common/GlassDrawer';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
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
    formatMoney, 
    formatNum, 
    t 
  } = useApp();

  const {
    students,
    addStudent,
  } = useMembers();

  const {
    packages, 
    coaches, 
    customFields, 
    addPackage,
  } = useSettings();

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
    return (packages || []).filter(p => p.isActive !== false);
  }, [packages]);

  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    return activePackages[0]?.id || '';
  });

  // Inline Package Creation State
  const [isCreatingPackageInline, setIsCreatingPackageInline] = useState(false);
  const [inlinePkgName, setInlinePkgName] = useState('');
  const [inlinePkgPrice, setInlinePkgPrice] = useState<number | ''>('');
  const [inlinePkgDuration, setInlinePkgDuration] = useState<number>(30);
  const [inlinePkgSessions, setInlinePkgSessions] = useState<number | ''>(0);
  const [inlinePkgLocker, setInlinePkgLocker] = useState(true);
  const [inlinePkgVip, setInlinePkgVip] = useState(false);

  // Keep package selection valid when packages load or change
  useEffect(() => {
    if (!selectedPackageId && activePackages.length > 0) {
      setSelectedPackageId(activePackages[0].id);
    }
  }, [activePackages, selectedPackageId]);

  const selectedPackage = useMemo(() => {
    return activePackages.find(p => p.id === selectedPackageId) || activePackages[0] || null;
  }, [activePackages, selectedPackageId]);

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
  }, [selectedPackage, discountAmount, hasUserModifiedPayment]);

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
    setSuccessData(null);
  };

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

  // Inline Package Save Handler
  const handleSaveInlinePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePkgName.trim()) {
      alert('لطفاً نام پکیج را وارد کنید.');
      return;
    }
    const price = Number(inlinePkgPrice) || 0;
    const duration = Number(inlinePkgDuration) || 30;
    const sessions = Number(inlinePkgSessions) || 0;

    const newPkgId = `pkg-${Date.now()}`;
    const newPkg: MembershipPackage = {
      id: newPkgId,
      name: inlinePkgName.trim(),
      price,
      durationDays: duration,
      sessionsCount: sessions,
      includesLocker: inlinePkgLocker,
      isVip: inlinePkgVip,
      isActive: true,
    };

    addPackage(newPkg);
    setSelectedPackageId(newPkgId);
    setInlinePkgName('');
    setInlinePkgPrice('');
    setInlinePkgDuration(30);
    setInlinePkgSessions(0);
    setIsCreatingPackageInline(false);
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

    if (duplicateWarning && duplicateWarning.isDuplicate && !acknowledgedDuplicate) {
      return;
    }

    if (!selectedPackage) {
      alert('لطفاً یک پکیج عضویت معتبر انتخاب کنید یا پکیج جدید ایجاد نمایید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const allocatedMemberNumber = MemberService.calculateNextMemberNumber(students);
      MemberService.recordAllocatedNumber(parseInt(allocatedMemberNumber, 10));

      const { firstName, lastName } = MemberService.parseFullName(fullName);

      // Create Student Entity
      addStudent(
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
          coachId: coachId || '',
          packageType: selectedPackage.type || selectedPackage.name,
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
          rfidCardUid: rfidCardNumber.trim() || undefined,
          customFields: customData,
        },
        financial.receivedAmount,
        paymentMethod,
        {
          basePrice: financial.basePrice,
          discountAmount: financial.discountAmount,
        }
      );

      // Show Success State
      setSuccessData({
        memberNumber: allocatedMemberNumber,
        studentId: `std-${Date.now()}`,
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
      icon={successData ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <UserPlus className="w-5 h-5 text-[var(--gym-brand)]" />}
      widthClass="max-w-xl"
    >
      {/* 1. SUCCESS VIEW STATE */}
      {successData ? (
        <div className="space-y-6 animate-fade-in" dir="rtl">
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-[var(--gym-text)]">
              عضو با موفقیت در سیستم ثبت گردید!
            </h4>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--gym-brand)] text-stone-950 font-black text-sm shadow-xs">
              <span>شماره عضویت:</span>
              <span className="font-mono text-base">#{successData.memberNumber}</span>
            </div>
          </div>

          {/* Registration Receipt Summary */}
          <div className="p-4 rounded-xl glass-subtle border border-[var(--gym-border)] space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">نام و نام خانوادگی:</span>
              <span className="font-bold text-[var(--gym-text)]">{successData.studentName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">پکیج انتخابی:</span>
              <span className="font-semibold text-[var(--gym-text)]">{successData.packageName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">مبلغ قابل پرداخت:</span>
              <span className="font-mono font-bold text-[var(--gym-text)]">{formatMoney(successData.finalPrice)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">مبلغ دریافتی امروز:</span>
              <span className="font-mono font-bold text-emerald-500">{formatMoney(successData.receivedAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-[var(--gym-text-muted)]">مانده بدهی:</span>
              <span className={`font-mono font-bold ${successData.remainingDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {successData.remainingDebt > 0 ? formatMoney(successData.remainingDebt) : 'تسویه کامل ✓'}
              </span>
            </div>
          </div>

          {/* Next Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <GlassButton
              variant="neon"
              size="md"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={handleResetForm}
              className="flex-1"
            >
              ثبت عضو بعدی
            </GlassButton>

            {onOpenMemberDetail && (
              <GlassButton
                variant="secondary"
                size="md"
                icon={<Eye className="w-4 h-4" />}
                onClick={() => {
                  onClose();
                  onOpenMemberDetail(successData.studentId);
                }}
              >
                مشاهده پرونده
              </GlassButton>
            )}

            <GlassButton
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              بستن
            </GlassButton>
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
              <h4 className="text-sm font-bold text-[var(--gym-text)] flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-[var(--gym-brand)]/15 text-[var(--gym-brand)] flex items-center justify-center font-mono text-xs font-bold">۱</span>
                <span>مشخصات فردی و پرونده</span>
              </h4>
              <span className="text-xs font-mono text-[var(--gym-brand)] bg-[var(--gym-brand)]/10 px-2.5 py-1 rounded-lg border border-[var(--gym-brand)]/20">
                پیش‌نمایش کد: #{nextMemberNumber}
              </span>
            </div>

            {/* Core Required Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--gym-text-muted)] mb-1 font-medium">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setAcknowledgedDuplicate(false);
                    checkDuplicate({ fullName: e.target.value, phone, nationalId });
                  }}
                  placeholder="مثال: علی رضایی"
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:ring-1 focus:ring-[var(--gym-brand)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--gym-text-muted)] mb-1 font-medium">
                    شماره همراه <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className={`w-full px-3 py-2 rounded-xl glass-subtle border text-[var(--gym-text)] font-mono text-xs text-left ${
                      phoneError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[var(--gym-border)]'
                    }`}
                  />
                  {phoneError && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{phoneError}</span>
                  )}
                </div>

                <div>
                  <label className="block text-[var(--gym-text-muted)] mb-1 font-medium">
                    کد ملی (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => handleNationalIdChange(e.target.value)}
                    placeholder="۰۰۱۲۳۴۵۶۷۸"
                    className={`w-full px-3 py-2 rounded-xl glass-subtle border text-[var(--gym-text)] font-mono text-xs text-left ${
                      nationalIdError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[var(--gym-border)]'
                    }`}
                  />
                  {nationalIdError && (
                    <span className="text-[11px] text-rose-400 mt-1 block">{nationalIdError}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Duplicate Detection Warning Banner */}
            {duplicateWarning && duplicateWarning.isDuplicate && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>هشدار: احتمال وجود عضو تکراری در سیستم</span>
                </div>
                <p className="text-[11px] text-[var(--gym-text-secondary)] leading-relaxed">
                  عضوی با مشخصات مشابه (شماره: {duplicateWarning.existingStudent?.phone}، نام: {duplicateWarning.existingStudent?.fullName}، شماره عضویت: #{duplicateWarning.existingStudent?.memberNumber}) قبلاً ثبت شده است.
                </p>
                <label className="flex items-center gap-2 pt-1 text-[11px] font-medium text-[var(--gym-text)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgedDuplicate}
                    onChange={(e) => setAcknowledgedDuplicate(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--gym-brand)]"
                  />
                  <span>با علم به این مورد، ثبت عضو جدید را ادامه می‌دهم.</span>
                </label>
              </div>
            )}

            {/* Expandable Accordion for Extended Fields */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsExtendedOpen(!isExtendedOpen)}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl glass-subtle hover:bg-[var(--gym-surface-glass)] text-xs text-[var(--gym-text-secondary)] transition-colors cursor-pointer border border-[var(--gym-border)]"
              >
                <span className="font-semibold flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[var(--gym-brand)]" />
                  <span>مشخصات تکمیلی، پزشکی و مربی اختصاصی</span>
                </span>
                {isExtendedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isExtendedOpen && (
                <div className="pt-3 space-y-3 text-xs animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[var(--gym-text-muted)] mb-1">جنسیت</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                            gender === 'male' 
                              ? 'bg-[var(--gym-brand)] text-stone-950 border-[var(--gym-brand)] font-bold' 
                              : 'glass-subtle text-[var(--gym-text-secondary)] border-[var(--gym-border)]'
                          }`}
                        >
                          آقا
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                            gender === 'female' 
                              ? 'bg-[var(--gym-brand)] text-stone-950 border-[var(--gym-brand)] font-bold' 
                              : 'glass-subtle text-[var(--gym-text-secondary)] border-[var(--gym-border)]'
                          }`}
                        >
                          بانو
                        </button>
                      </div>
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
            <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
              <h4 className="text-sm font-bold text-[var(--gym-text)] flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-[var(--gym-brand)]/15 text-[var(--gym-brand)] flex items-center justify-center font-mono text-xs font-bold">۲</span>
                <span>انتخاب پکیج و دوره عضویت</span>
              </h4>

              <button
                type="button"
                onClick={() => setIsCreatingPackageInline(!isCreatingPackageInline)}
                className="text-xs font-semibold text-[var(--gym-brand)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ایجاد پکیج جدید</span>
              </button>
            </div>

            {/* Inline Quick Package Creator Sub-Panel */}
            {isCreatingPackageInline && (
              <div className="p-4 rounded-2xl glass-regular border border-[var(--gym-brand)]/40 space-y-3 animate-fade-in bg-[var(--gym-surface-glass-strong)]">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
                  <span className="font-bold text-xs text-[var(--gym-text)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--gym-brand)]" />
                    <span>تعریف سریع پکیج عضویت</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingPackageInline(false)}
                    className="text-[var(--gym-text-muted)] hover:text-rose-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[var(--gym-text-muted)] mb-1">نام پکیج <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={inlinePkgName}
                      onChange={(e) => setInlinePkgName(e.target.value)}
                      placeholder="مثال: ۱ ماهه بدنسازی"
                      className="w-full px-3 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--gym-text-muted)] mb-1">شهریه پکیج (تومان) <span className="text-rose-500">*</span></label>
                    <input
                      type="number"
                      required
                      value={inlinePkgPrice}
                      onChange={(e) => setInlinePkgPrice(e.target.value ? Number(e.target.value) : '')}
                      placeholder="1,200,000"
                      className="w-full px-3 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--gym-text-muted)] mb-1">مدت اعتبار (روز)</label>
                    <input
                      type="number"
                      value={inlinePkgDuration}
                      onChange={(e) => setInlinePkgDuration(Number(e.target.value) || 30)}
                      placeholder="30"
                      className="w-full px-3 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--gym-text-muted)] mb-1">تعداد جلسات (۰ = نامحدود)</label>
                    <input
                      type="number"
                      value={inlinePkgSessions}
                      onChange={(e) => setInlinePkgSessions(e.target.value ? Number(e.target.value) : '')}
                      placeholder="0"
                      className="w-full px-3 py-1.5 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-left"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--gym-text)]">
                    <input
                      type="checkbox"
                      checked={inlinePkgLocker}
                      onChange={(e) => setInlinePkgLocker(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--gym-brand)]"
                    />
                    <span>شامل کمد هوشمند</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[var(--gym-text)]">
                    <input
                      type="checkbox"
                      checked={inlinePkgVip}
                      onChange={(e) => setInlinePkgVip(e.target.checked)}
                      className="w-4 h-4 rounded text-[var(--gym-brand)]"
                    />
                    <span>پکیج VIP</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--gym-border)]">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPackageInline(false)}
                    className="px-3 py-1.5 rounded-xl glass-subtle text-xs text-[var(--gym-text-muted)] hover:bg-[var(--gym-surface-glass)]"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInlinePackage}
                    className="px-4 py-1.5 rounded-xl bg-[var(--gym-brand)] text-stone-950 font-bold text-xs hover:brightness-110 shadow-xs"
                  >
                    ذخیره و انتخاب پکیج
                  </button>
                </div>
              </div>
            )}

            {/* Package Cards Selector */}
            {activePackages.length === 0 ? (
              <div className="p-5 rounded-2xl glass-subtle border border-[var(--gym-border)] text-center space-y-3">
                <p className="font-bold text-[var(--gym-text)]">هنوز پکیجی تعریف نشده است.</p>
                <p className="text-xs text-[var(--gym-text-muted)]">جهت ثبت‌نام عضو، لطفاً ابتدا یک پکیج عضویت تعریف نمایید.</p>
                <div className="flex justify-center gap-2 pt-2">
                  <GlassButton
                    variant="neon"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsCreatingPackageInline(true)}
                  >
                    ایجاد پکیج جدید
                  </GlassButton>
                </div>
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
                          ? 'glass-regular border-[var(--gym-brand)] text-[var(--gym-text)] shadow-xs ring-1 ring-[var(--gym-brand)]'
                          : 'glass-subtle hover:bg-[var(--gym-surface-glass)] border-[var(--gym-border)] text-[var(--gym-text-secondary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-xs block text-[var(--gym-text)]">
                            {pkg.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--gym-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[var(--gym-brand)]" />
                              <span>{pkg.durationDays || 30} روزه</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span>{pkg.sessionsCount ? `${pkg.sessionsCount} جلسه` : 'نامحدود'}</span>
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--gym-brand)] text-stone-950 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--gym-border)] text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pkg.includesLocker !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-stone-500/15 text-[var(--gym-text-muted)]'}`}>
                          {pkg.includesLocker !== false ? 'کمد مجاز' : 'بدون کمد'}
                        </span>
                        <span className="font-mono font-bold text-xs text-[var(--gym-text)]">
                          {formatMoney(pkg.price)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Date Calculation & Manual Override */}
            <div className="p-3.5 rounded-xl glass-subtle border border-[var(--gym-border)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--gym-text)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--gym-brand)]" />
                  <span>دوره اعتبار عضویت</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualDateOverride(!isManualDateOverride)}
                  className="text-[11px] text-[var(--gym-brand)] hover:underline cursor-pointer"
                >
                  {isManualDateOverride ? 'بازگشت به محاسبه خودکار' : 'ویرایش دستی تاریخ'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--gym-text-muted)] mb-1">تاریخ شروع</label>
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
                    className="w-full px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] font-mono text-xs text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[var(--gym-text-muted)] mb-1">تاریخ پایان و انقضا</label>
                  <input
                    type="text"
                    value={expireDate}
                    onChange={(e) => {
                      setExpireDate(e.target.value);
                      setIsManualDateOverride(true);
                    }}
                    placeholder="1403/06/25"
                    className={`w-full px-3 py-1.5 rounded-xl font-mono text-xs text-center border ${
                      isManualDateOverride
                        ? 'border-[var(--gym-brand)] glass-regular text-[var(--gym-text)]'
                        : 'border-[var(--gym-border)] glass-subtle text-[var(--gym-text-secondary)]'
                    }`}
                  />
                </div>
              </div>

              {!isManualDateOverride && selectedPackage && (
                <div className="text-[11px] text-[var(--gym-text-muted)] flex items-center gap-1 justify-end">
                  <Sparkles className="w-3 h-3 text-[var(--gym-brand)]" />
                  <span>محاسبه خودکار بر اساس {selectedPackage.durationDays || 30} روز اعتبار</span>
                </div>
              )}
            </div>

            {/* Optional Discount Input */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="text-[var(--gym-text)] font-medium whitespace-nowrap">
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
            <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
              <h4 className="text-sm font-bold text-[var(--gym-text)] flex items-center gap-2">
                <span className="w-6 h-6 rounded-xl bg-[var(--gym-brand)]/15 text-[var(--gym-brand)] flex items-center justify-center font-mono text-xs font-bold">۳</span>
                <span>پرداخت و تسویه مالی</span>
              </h4>
            </div>

            {/* Financial Calculation Summary Card */}
            <div className="p-4 rounded-xl glass-regular border border-[var(--gym-brand)]/30 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[var(--gym-text-muted)]">
                <span>قیمت پایه پکیج:</span>
                <span className="font-mono font-semibold text-[var(--gym-text)]">{formatMoney(financial.basePrice)}</span>
              </div>

              {financial.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-semibold">
                  <span>تخفیف اعمال شده:</span>
                  <span className="font-mono">-{formatMoney(financial.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-[var(--gym-border)] font-bold text-[var(--gym-text)]">
                <span>مبلغ قابل پرداخت نهایی:</span>
                <span className="font-mono text-sm text-[var(--gym-brand)]">{formatMoney(financial.finalPrice)}</span>
              </div>
            </div>

            {/* Money Input for Received Amount */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[var(--gym-text)]">
                  مبلغ دریافتی امروز (شهریه / پیش‌پرداخت):
                </label>
                <span className="text-[11px] text-[var(--gym-text-muted)]">
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
            <div className="p-3 rounded-xl glass-subtle border border-[var(--gym-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--gym-text-muted)] font-medium">مانده بدهی عضو:</span>
              <span className={`font-mono font-bold text-sm ${
                financial.remainingDebt > 0 
                  ? 'text-rose-400' 
                  : 'text-emerald-400'
              }`}>
                {financial.remainingDebt > 0 ? formatMoney(financial.remainingDebt) : 'تسویه کامل (بدون بدهی) ✓'}
              </span>
            </div>

            {/* Overpayment Detection */}
            {financial.isOverpaid && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-cyan-300 space-y-2">
                <p className="font-semibold">
                  مبلغ دریافتی {formatMoney(financial.creditAmount)} بیشتر از شهریه دوره است.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={recordAsCredit}
                    onChange={(e) => setRecordAsCredit(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-400"
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
                      ? 'bg-[var(--gym-brand)] text-stone-950 border-[var(--gym-brand)] shadow-xs'
                      : 'glass-subtle text-[var(--gym-text-secondary)] border-[var(--gym-border)] hover:bg-[var(--gym-surface-glass)]'
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
          <div className="pt-4 border-t border-[var(--gym-border)] flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--gym-surface)]/95 py-3 backdrop-blur-md">
            <GlassButton
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              لغو
            </GlassButton>

            <GlassButton
              variant="neon"
              size="md"
              type="submit"
              disabled={isSubmitting || (duplicateWarning?.isDuplicate && !acknowledgedDuplicate)}
              icon={isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت عضو و صدور اشتراک'}
            </GlassButton>
          </div>

        </form>
      )}
    </GlassDrawer>
  );
};
