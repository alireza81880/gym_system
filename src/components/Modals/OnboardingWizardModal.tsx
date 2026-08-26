import React, { useState } from 'react';
import { 
  Dumbbell, 
  Clock, 
  Boxes, 
  ShieldCheck, 
  KeyRound, 
  Cpu, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  X,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onClose }) => {
  const { setIntegrationMode } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [clubName, setClubName] = useState('باشگاه ورزشی رویال اکسیژن');
  const [phone, setPhone] = useState('021-22800112');
  const [city, setCity] = useState('تهران');
  const [enableVipZone, setEnableVipZone] = useState(true);
  const [allowDebtEntry, setAllowDebtEntry] = useState(true);
  const [pilotShadowMode, setPilotShadowMode] = useState(true);

  if (!isOpen) return null;

  const totalSteps = 8;

  const handleFinish = () => {
    if (pilotShadowMode) {
      setIntegrationMode('shadow');
    }
    localStorage.setItem('gym_onboarding_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Progress Bar & Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  راهنمای پیکربندی گام‌به‌گام Gym OS
                </h2>
                <p className="text-xs text-stone-500">
                  گام {currentStep} از {totalSteps}: راه‌اندازی استاندارد سالن و تجهیزات
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline"
            >
              رد شدن و بستن
            </button>
          </div>

          <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-stone-700 dark:text-stone-300">
          
          {/* Step 1: Gym Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <Dumbbell className="h-5 w-5 text-amber-500" />
                <span>۱. مشخصات عمومی مجموعه ورزشی</span>
              </div>
              <p className="text-xs text-stone-500">
                اطلاعات پایه جهت درج در فیش‌های مالی، قراردادها و سربرگ گزارشات باشگاه.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">نام باشگاه / مجموعه ورزشی:</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">شماره تماس ثابت/همراه:</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">شهر / منطقه:</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hours & Shifts */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <Clock className="h-5 w-5 text-amber-500" />
                <span>۲. ساعات کاری و شیفت‌های تفکیک‌شده</span>
              </div>
              <p className="text-xs text-stone-500">
                تعیین ساعات مجاز ورود بانوان و آقایان برای اعتبارسنجی خودکار گیت.
              </p>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="font-semibold text-xs text-amber-600 dark:text-amber-400">شیفت بانوان:</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">از ساعت: <strong>۰۷:۰۰</strong></span>
                    <span className="text-xs">تا ساعت: <strong>۱۴:۳۰</strong></span>
                    <span className="text-xs text-stone-400">(شنبه تا پنج‌شنبه)</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="font-semibold text-xs text-blue-600 dark:text-blue-400">شیفت آقایان:</div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">از ساعت: <strong>۱۵:۰۰</strong></span>
                    <span className="text-xs">تا ساعت: <strong>۲۳:۳۰</strong></span>
                    <span className="text-xs text-stone-400">(همه روزه)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Packages */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <Boxes className="h-5 w-5 text-amber-500" />
                <span>۳. تعرفه‌ها و پکیج‌های پیش‌فرض عضویت</span>
              </div>
              <p className="text-xs text-stone-500">
                پکیج‌های آماده برای شروع سریع ثبت‌نام در سامانه بارگذاری شده‌اند:
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                  <div><strong>۱ ماهه عمومی (۱۲ جلسه)</strong> • دسترسی به سالن و کمد</div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">۲,۸۰۰,۰۰۰ تومان</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex justify-between items-center">
                  <div><strong>۳ ماهه فصلی (۳۶ جلسه)</strong> • تخفیف ویژه</div>
                  <span className="font-bold">۶,۸۰۰,۰۰۰ تومان</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex justify-between items-center">
                  <div><strong>۱ ساله VIP پلاتینیوم (۱۵۰ جلسه)</strong> • کمد دائمی + مربی</div>
                  <span className="font-bold text-purple-700 dark:text-purple-300">۲۲,۰۰۰,۰۰۰ تومان</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Access Rules */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <span>۴. سیاست‌های دسترسی و بازگشایی گیت</span>
              </div>
              <p className="text-xs text-stone-500">
                موتور تصمیم‌گیری خودکار تردد (Access Policy Engine) را متناسب با باشگاه خود تنظیم نمایید:
              </p>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100">اجازه ورود به اعضای با بدهی جزیی</div>
                    <div className="text-stone-500">تا سقف ۵۰۰,۰۰۰ تومان با نمایش هشدار به پذیرش</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowDebtEntry}
                    onChange={(e) => setAllowDebtEntry(e.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                </label>
                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                  ✓ مسدودسازی خودکار اعضای منقضی‌شده فعال است.
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Lockers */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <KeyRound className="h-5 w-5 text-amber-500" />
                <span>۵. زون‌بندی و کمدهای هوشمند</span>
              </div>
              <p className="text-xs text-stone-500">
                پیکربندی سیستم کمدها و تفکیک زون VIP و عمومی:
              </p>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 cursor-pointer">
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100">فعال‌سازی بخش کمدهای VIP اختصاصی</div>
                    <div className="text-stone-500">تخصیص کمدهای ۱ تا ۸ منحصراً به اعضای پکیج‌های پلاتینیوم</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableVipZone}
                    onChange={(e) => setEnableVipZone(e.target.checked)}
                    className="h-5 w-5 accent-amber-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Hardware & Shadow Mode */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <Cpu className="h-5 w-5 text-amber-500" />
                <span>۶. اتصال سخت‌افزار در حالت شنود (Shadow Mode)</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-200">
                  توصیه ایمنی و معماری پایلوت:
                </div>
                <div className="text-emerald-700 dark:text-emerald-300">
                  در حالت <strong>Shadow Mode</strong>، سامانه بدون دستکاری رله‌ها و قفل‌ها، ترددها را پایش می‌کند تا از صحت عملکرد پایگاه داده و تطبیق با نرم‌افزار قدیمی مطمئن شوید.
                </div>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pilotShadowMode}
                    onChange={(e) => setPilotShadowMode(e.target.checked)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">راه‌اندازی اولیه در حالت شنود غیرمخرب (Shadow Mode)</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 7: Staff */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                <Users className="h-5 w-5 text-amber-500" />
                <span>۷. نقش‌ها و سطوح دسترسی کارکنان (RBAC)</span>
              </div>
              <p className="text-xs text-stone-500">
                تفکیک اختیارات پذیرش، مربیان و حسابداری برای حفظ امنیت مالی و حریم خصوصی:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold">مسئول پذیرش</div>
                  <div className="text-stone-500 text-[11px]">کنترل گیت، ثبت‌نام و کمدها</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold">مربی ورزشی</div>
                  <div className="text-stone-500 text-[11px]">برنامه تمرینی و شاگردان خود</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold">حسابدار</div>
                  <div className="text-stone-500 text-[11px]">دفتر کل، شهریه‌ها و تسویه‌ها</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <div className="font-bold">کارشناس سخت‌افزار</div>
                  <div className="text-stone-500 text-[11px]">پیکربندی گیت، رله و عیب‌یابی</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Ready */}
          {currentStep === 8 && (
            <div className="space-y-4 text-center py-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                پیکربندی اولیه Gym OS با موفقیت انجام شد!
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                مجموعه ورزشی «{clubName}» آماده بهره‌برداری است. شما در هر زمان می‌توانید از بخش «تنظیمات» یا «مرکز ماژول‌ها» تنظیمات را ویرایش نمایید.
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 px-6 bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 text-sm font-medium flex items-center gap-1.5"
            >
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              <span>مرحله قبل</span>
            </button>
          ) : <div />}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-sm font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <span>مرحله بعد</span>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>شروع به کار با سامانه</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
