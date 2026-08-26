import React, { useState } from 'react';
import { AlertTriangle, KeyRound, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface EmergencyMasterUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyMasterUnlockModal: React.FC<EmergencyMasterUnlockModalProps> = ({ isOpen, onClose }) => {
  const { triggerMasterUnlock, smartLockers, currentUser, lang } = useApp();
  const [reason, setReason] = useState('تخلیه و نظافت پایان روز');
  const [customReason, setCustomReason] = useState('');
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  if (!isOpen) return null;

  const totalLockersCount = smartLockers.length;

  const handleExecute = () => {
    setIsExecuting(true);
    const finalReason = reason === 'other' ? (customReason || 'عملیات اضطراری متفرقه') : reason;
    
    setTimeout(() => {
      triggerMasterUnlock(finalReason);
      setIsExecuting(false);
      setSuccessDone(true);
      setTimeout(() => {
        setSuccessDone(false);
        setConfirmStep(1);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl overflow-hidden p-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <X className="h-5 w-5" />
        </button>

        {successDone ? (
          <div className="text-center py-8 space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              دستور بازگشایی همگانی با موفقیت صادر شد
            </h3>
            <p className="text-sm text-stone-500">
              سیگنال رله به تمام {totalLockersCount} کمد ارسال شد و لاگ امنیتی با هویت «{currentUser.fullName}» ثبت گردید.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header with Danger Accent */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  بازگشایی اضطراری مستر (Master Unlock)
                </h3>
                <p className="text-xs text-stone-500">
                  ارسال همزمان پالس الکترونیکی به تمام رله‌ها و قفل‌های هوشمند
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">هشدار امنیتی درجه یک:</div>
                <div>
                  این عملیات درب تمامی <strong>{totalLockersCount} کمد الکترونیکی</strong> سالن را به صورت آنی باز می‌کند. این اقدام همراه با مشخصات شما در دفتر ثبت رویدادهای امنیتی (Audit Log) ذخیره می‌شود.
                </div>
              </div>
            </div>

            {/* Step 1: Form */}
            {confirmStep === 1 ? (
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    علت بازگشایی مستر را انتخاب فرمایید:
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="تخلیه و نظافت پایان روز">نظافت، تخلیه و تحویل شیفت پایان سانس</option>
                    <option value="بررسی لوازم جا مانده ورزشکاران">بررسی لوازم جا مانده با حضور مسئول شیفت</option>
                    <option value="تست سخت‌افزاری بورد رله و سرویس دوره‌ای">تست دوره‌ای سخت‌افزار و بوردهای رله</option>
                    <option value="وضعیت اضطراری حریق / قطع برق">وضعیت اضطراری (سیستم ایمنی حریق / تخلیه سریع)</option>
                    <option value="other">سایر دلایل (توضیح دهید)</option>
                  </select>
                </div>

                {reason === 'other' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      شرح علت بازگشایی:
                    </label>
                    <textarea
                      rows={2}
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="شرح دقیق دلیل بازگشایی مستر..."
                      className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-400 space-y-1">
                  <div><strong>اپراتور مسئول:</strong> {currentUser.fullName} ({currentUser.role})</div>
                  <div><strong>شعبه:</strong> شعبه مرکزی (نیاوران)</div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmStep(2)}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
                  >
                    <span>مرحله بعد: تایید امنیتی</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Final Confirmation */
              <div className="space-y-4 text-sm animate-in fade-in">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="font-bold text-center">آیا از بازگشایی همگانی تمام کمدهای سالن اطمینان کامل دارید؟</div>
                  <div className="text-xs text-center text-amber-700 dark:text-amber-300">
                    علت انتخابی: «{reason === 'other' ? customReason : reason}»
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmStep(1)}
                    disabled={isExecuting}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 text-sm font-medium"
                  >
                    بازگشت و اصلاح
                  </button>
                  <button
                    type="button"
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>{isExecuting ? 'در حال ارسال پالس رله...' : 'تایید نهایی و بازگشایی همه کمدها'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
