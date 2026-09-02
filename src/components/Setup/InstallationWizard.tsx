import React, { useState } from 'react';
import { 
  Building2, 
  KeyRound, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Layers, 
  Phone, 
  MapPin, 
  User,
  Zap,
  PlayCircle,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ValidationService } from '../../services/validationService';

interface InstallationWizardProps {
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const InstallationWizard: React.FC<InstallationWizardProps> = ({ onClose, isInitialSetup = true }) => {
  const { completeInstallation, enterDemoMode, formatMoney, organizationInfo } = useApp();

  const [step, setStep] = useState<number>(1);

  // Form State initialized from current authoritative organizationInfo
  const [gymName, setGymName] = useState(organizationInfo?.name || 'باشگاه ورزشی و بدنسازی آریا');
  const [managerName, setManagerName] = useState(organizationInfo?.managerName || 'علیرضا احمدی');
  const [managerMobile, setManagerMobile] = useState(organizationInfo?.managerMobile || '09121112233');
  const [city, setCity] = useState(organizationInfo?.city || 'تهران');
  const [address, setAddress] = useState(organizationInfo?.address || 'تهران، خیابان شریعتی، بالاتر از پل رومی');
  const [phone, setPhone] = useState(organizationInfo?.phone || '021-22001122');
  const [currency, setCurrency] = useState<'تومان' | 'IRR' | 'ریال'>(organizationInfo?.currency || 'تومان');
  const [memberNumberLabel, setMemberNumberLabel] = useState(organizationInfo?.memberNumberLabel || 'شماره عضویت');

  // Lockers
  const [lockerCount, setLockerCount] = useState<number>(100);

  // First Package
  const [packageName, setPackageName] = useState('۱ ماهه عمومی (۱۲ جلسه)');
  const [packagePrice, setPackagePrice] = useState<number>(2800000);
  const [packageSessions, setPackageSessions] = useState<number>(12);
  const [packageDuration, setPackageDuration] = useState<number>(30);

  // Access Policy
  const [maxAllowedDebt, setMaxAllowedDebt] = useState<number>(500000);
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(2);
  const [allowLockerOnExpired, setAllowLockerOnExpired] = useState<boolean>(false);
  const [integrationMode, setIntegrationMode] = useState<'shadow' | 'hybrid' | 'full_control'>('shadow');

  // Validation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!gymName.trim()) {
        setErrorMsg('لطفاً نام باشگاه را وارد نمایید.');
        return;
      }
      if (!managerName.trim()) {
        setErrorMsg('نام مدیر یا مؤسس باشگاه الزامی است.');
        return;
      }
      if (!managerMobile.trim()) {
        setErrorMsg('شماره موبایل مدیر جهت ثبت اسناد الزامی است.');
        return;
      }
      if (!ValidationService.isValidMobilePhone(managerMobile)) {
        setErrorMsg('فرمت شماره موبایل نامعتبر است (مثال: ۰۹۱۲۱۱۱۲۲۳۳).');
        return;
      }
    }

    if (step === 2) {
      if (lockerCount < 1) {
        setErrorMsg('تعداد کمدها باید حداقل ۱ عدد باشد.');
        return;
      }
    }

    if (step === 3) {
      if (!packageName.trim()) {
        setErrorMsg('لطفاً نام پکیج عضویت را مشخص کنید.');
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handleFinish = () => {
    completeInstallation({
      orgData: {
        name: gymName.trim(),
        managerName: managerName.trim(),
        managerMobile: managerMobile.trim(),
        city: city.trim(),
        address: address.trim(),
        phone: phone.trim(),
        currency,
        memberNumberLabel,
      },
      lockerCount,
      firstPackage: {
        name: packageName,
        price: packagePrice,
        sessionsCount: packageSessions,
        durationDays: packageDuration,
      },
      accessPolicy: {
        maxDebtTolerance: maxAllowedDebt,
        gracePeriodDays,
        allowLockerOnExpired,
      },
      ownerData: {
        fullName: managerName.trim(),
        phone: managerMobile.trim(),
        username: 'admin',
      },
    });
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  دستیار راه‌اندازی باشگاه Gym OS
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">نسخه ۲.۴</span>
                </h2>
                <p className="text-sm text-slate-400">پیکربندی هوشمند و شروع به کار بدون نیاز به دانش فنی</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isInitialSetup && (
                <button
                  onClick={enterDemoMode}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-500/30 text-xs font-medium transition-all cursor-pointer"
                  title="تست سامانه با داده‌های آماده شبیه‌سازی شده"
                >
                  <PlayCircle className="w-4 h-4 text-amber-400" />
                  <span>ورود به محیط دمو و داده‌های آزمایشی</span>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
                  title="بستن پنجره"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-5 gap-2 mt-6">
            {[
              { num: 1, title: 'مشخصات باشگاه', icon: Building2 },
              { num: 2, title: 'کمدهای رله', icon: KeyRound },
              { num: 3, title: 'پکیج عضویت', icon: CreditCard },
              { num: 4, title: 'سیاست گیت', icon: ShieldCheck },
              { num: 5, title: 'تأیید نهایی', icon: CheckCircle2 },
            ].map((s) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div 
                  key={s.num}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                      : isPast 
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300' 
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-emerald-500 text-slate-950' : isPast ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isPast ? '✓' : s.num}
                  </div>
                  <span className="text-[11px] font-medium hidden sm:inline">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
              {errorMsg}
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  مشخصات اولیه و هویت باشگاه
                </h3>
                <p className="text-sm text-slate-400">اطلاعات باشگاه بر روی فاکتورها، رسیدهای تردد و اسناد رسمی درج خواهد شد.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    نام مجموعه ورزشی / باشگاه <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="مثال: باشگاه تخصصی بدنسازی و فیتنس پروشات"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    نام و نام خانوادگی مؤسس / مدیر ارشد <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="مثال: مهندس علیرضا حسینی"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    شماره موبایل مدیر (جهت ثبت لاگ و حساب کاربری) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={managerMobile}
                    onChange={(e) => setManagerMobile(e.target.value)}
                    placeholder="09121112233"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm text-left font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    تلفن ثابت مجموعه
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="021-22800112"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm text-left font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    شهر
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="تهران / اصفهان / مشهد / ..."
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    عنوان شناسه ورزشکار در نرم‌افزار
                  </label>
                  <input
                    type="text"
                    value={memberNumberLabel}
                    onChange={(e) => setMemberNumberLabel(e.target.value)}
                    placeholder="شماره عضویت / شماره پرونده / کد ورزشکار"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    نشانی دقیق سالن
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="خیابان، پلاک، طبقه یا مجتمع تجاری ورزشی"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Smart Lockers */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  کمدهای الکترونیکی و ظرفیت سالن
                </h3>
                <p className="text-sm text-slate-400">تعداد کمدهای رله سالن را مشخص کنید. این مقدار در هر زمان قابل افزایش یا کاهش است.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-300 font-medium">تعداد کل کمدهای هوشمند:</span>
                    <p className="text-xs text-slate-500 mt-0.5">کمدهای شماره ۱ تا {lockerCount} به‌صورت خودکار ایجاد می‌شوند.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={lockerCount}
                      onChange={(e) => setLockerCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-xl text-white font-mono text-center text-lg font-bold focus:outline-none"
                    />
                    <span className="text-sm text-slate-400">کمد</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={10}
                  max={300}
                  step={10}
                  value={lockerCount}
                  onChange={(e) => setLockerCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />

                {/* Zone Breakdown Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/60">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-xs text-amber-400 font-medium">زون VIP</span>
                    <p className="text-lg font-bold text-white mt-1">{Math.floor(lockerCount * 0.15)} کمد</p>
                    <span className="text-[10px] text-slate-500">شماره ۱ تا {Math.floor(lockerCount * 0.15)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-xs text-blue-400 font-medium">زون آقایان</span>
                    <p className="text-lg font-bold text-white mt-1">{Math.floor(lockerCount * 0.40)} کمد</p>
                    <span className="text-[10px] text-slate-500">شماره {Math.floor(lockerCount * 0.15) + 1} تا {Math.floor(lockerCount * 0.55)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-xs text-pink-400 font-medium">زون بانوان</span>
                    <p className="text-lg font-bold text-white mt-1">{Math.floor(lockerCount * 0.35)} کمد</p>
                    <span className="text-[10px] text-slate-500">شماره {Math.floor(lockerCount * 0.55) + 1} تا {Math.floor(lockerCount * 0.90)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <span className="text-xs text-emerald-400 font-medium">زون عمومی</span>
                    <p className="text-lg font-bold text-white mt-1">{lockerCount - Math.floor(lockerCount * 0.90)} کمد</p>
                    <span className="text-[10px] text-slate-500">شماره‌های پایانی</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Membership Package */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  تعریف اولین پکیج عضویت و شهریه
                </h3>
                <p className="text-sm text-slate-400">می‌توانید پکیج پایه باشگاه را ثبت کنید. سایر پکیج‌ها در منوی تنظیمات قابل افزودن هستند.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    عنوان پکیج / دوره
                  </label>
                  <input
                    type="text"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="مثال: ۱ ماهه بدنسازی عمومی (۱۲ جلسه)"
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    شهریه پکیج ({currency})
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500 mt-1 block font-mono">
                    معادل: {formatMoney(packagePrice)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    تعداد جلسات مجاز ورود
                  </label>
                  <input
                    type="number"
                    value={packageSessions}
                    onChange={(e) => setPackageSessions(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    مدت اعتبار پکیج (روز)
                  </label>
                  <input
                    type="number"
                    value={packageDuration}
                    onChange={(e) => setPackageDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Access Policies */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  قوانین دسترسی گیت و مطالبات مالی
                </h3>
                <p className="text-sm text-slate-400">موتور تصمیم‌گیری گیت ورودی و کمدها بر اساس این قوانین به‌صورت بلادرنگ عمل می‌کند.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">سقف مجاز بدهی برای ورود به سالن</h4>
                    <p className="text-xs text-slate-400 mt-0.5">در صورت داشتن بدهی کمتر از این رقم، ورود با هشدار مجاز است.</p>
                  </div>
                  <div className="w-44">
                    <input
                      type="number"
                      step={50000}
                      value={maxAllowedDebt}
                      onChange={(e) => setMaxAllowedDebt(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-xs text-left focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">مهلت ارفاق پس از انقضای تاریخ اشتراک (روز)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">فرصت تمدید به ورزشکار برای عدم توقف ورزش</p>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      max={14}
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-xs text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-2">حالت یکپارچه‌سازی اولیه گیت و سخت‌افزار</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      integrationMode === 'shadow' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="mode"
                        className="hidden"
                        checked={integrationMode === 'shadow'}
                        onChange={() => setIntegrationMode('shadow')}
                      />
                      <div className="font-semibold text-xs text-white">حالت شنود (Shadow Mode)</div>
                      <p className="text-[11px] mt-1 text-slate-400">پیشنهادی برای پایلوت بدون دخالت در رله فیزیکی</p>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      integrationMode === 'hybrid' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="mode"
                        className="hidden"
                        checked={integrationMode === 'hybrid'}
                        onChange={() => setIntegrationMode('hybrid')}
                      />
                      <div className="font-semibold text-xs text-white">حالت ترکیبی (Hybrid)</div>
                      <p className="text-[11px] mt-1 text-slate-400">تصمیم‌گیری مستقل با قابلیت بازگشت به دستگاه</p>
                    </label>

                    <label className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      integrationMode === 'full_control' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="mode"
                        className="hidden"
                        checked={integrationMode === 'full_control'}
                        onChange={() => setIntegrationMode('full_control')}
                      />
                      <div className="font-semibold text-xs text-white">کنترل کامل (Full Control)</div>
                      <p className="text-[11px] mt-1 text-slate-400">فرمان مستقیم پالس به گیت و کمدهای هوشمند</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Confirmation */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">آماده راه‌اندازی باشگاه شما هستیم!</h3>
                <p className="text-sm text-slate-400 mt-1">اطلاعات را مرور کرده و با فشردن دکمه زیر باشگاه خود را افتتاح کنید.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl bg-slate-800/40 border border-slate-700/80 text-sm">
                <div>
                  <span className="text-xs text-slate-400">نام باشگاه:</span>
                  <p className="font-bold text-white mt-0.5">{gymName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">مدیر ارشد:</span>
                  <p className="font-bold text-white mt-0.5">{managerName} ({managerMobile})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">ظرفیت کمدهای الکترونیکی:</span>
                  <p className="font-bold text-cyan-400 mt-0.5">{lockerCount} کمد رله هوشمند</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">پکیج پایه راه‌اندازی:</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{packageName} - {formatMoney(packagePrice)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">سقف مجاز بدهی ورود:</span>
                  <p className="font-bold text-amber-400 mt-0.5">{formatMoney(maxAllowedDebt)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">حالت اتصال گیت:</span>
                  <p className="font-bold text-indigo-400 mt-0.5 font-mono">
                    {integrationMode === 'shadow' ? 'Shadow Mode (شنود)' : integrationMode === 'hybrid' ? 'Hybrid (ترکیبی)' : 'Full Control'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-8 py-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all"
            >
              <ArrowRight className="w-4 h-4" />
              <span>مرحله قبلی</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>مرحله بعدی</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-sm font-extrabold shadow-xl shadow-emerald-500/30 transition-all"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>راه‌اندازی و افتتاح باشگاه</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
