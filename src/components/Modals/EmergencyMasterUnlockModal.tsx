import React, { useState } from 'react';
import { AlertTriangle, KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';

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
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title="بازگشایی اضطراری مستر (Master Unlock)"
      subtitle="ارسال همزمان پالس الکترونیکی به تمام رله‌ها و قفل‌های هوشمند"
      icon={<ShieldAlert className="w-5 h-5 text-rose-400" />}
      maxWidth="max-w-lg"
    >
      {successDone ? (
        <div className="text-center py-6 space-y-3">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-[var(--gym-text,#fff)]">
            دستور بازگشایی همگانی با موفقیت صادر شد
          </h3>
          <p className="text-xs text-[var(--gym-text-muted,#9ca3af)]">
            سیگنال رله به تمام {totalLockersCount} کمد ارسال شد و لاگ امنیتی با هویت «{currentUser.fullName}» ثبت گردید.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Warning Box */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-300">هشدار امنیتی درجه یک:</div>
              <div>
                این عملیات درب تمامی <strong>{totalLockersCount} کمد الکترونیکی</strong> سالن را به صورت آنی باز می‌کند. این اقدام همراه با مشخصات شما در دفتر ثبت رویدادهای امنیتی ذخیره می‌شود.
              </div>
            </div>
          </div>

          {/* Step 1: Form */}
          {confirmStep === 1 ? (
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text-secondary,#d1d5db)] mb-1.5">
                  علت بازگشایی مستر را انتخاب فرمایید:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text,#fff)] text-xs sm:text-sm outline-none bg-[var(--gym-surface)]"
                >
                  <option value="تخلیه و نظافت پایان روز" className="bg-stone-900 text-white">نظافت، تخلیه و تحویل شیفت پایان سانس</option>
                  <option value="بررسی لوازم جا مانده ورزشکاران" className="bg-stone-900 text-white">بررسی لوازم جا مانده با حضور مسئول شیفت</option>
                  <option value="تست سخت‌افزاری بورد رله و سرویس دوره‌ای" className="bg-stone-900 text-white">تست دوره‌ای سخت‌افزار و بوردهای رله</option>
                  <option value="وضعیت اضطراری حریق / قطع برق" className="bg-stone-900 text-white">وضعیت اضطراری (سیستم ایمنی حریق / تخلیه سریع)</option>
                  <option value="other" className="bg-stone-900 text-white">سایر دلایل (توضیح دهید)</option>
                </select>
              </div>

              {reason === 'other' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1.5">
                    شرح علت بازگشایی:
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="شرح دقیق دلیل بازگشایی مستر..."
                    className="w-full px-3.5 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-xs outline-none bg-[var(--gym-surface)]"
                  />
                </div>
              )}

              <div className="p-3 rounded-2xl glass-subtle text-xs text-[var(--gym-text-muted)] space-y-1">
                <div><strong>اپراتور مسئول:</strong> {currentUser.fullName} ({currentUser.role})</div>
                <div><strong>شعبه:</strong> شعبه مرکزی</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  انصراف
                </GlassButton>
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmStep(2)}
                >
                  مرحله بعد: تایید امنیتی
                </GlassButton>
              </div>
            </div>
          ) : (
            /* Step 2: Final Confirmation */
            <div className="space-y-4 text-sm animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="font-bold text-center">آیا از بازگشایی همگانی تمام کمدهای سالن اطمینان کامل دارید؟</div>
                <div className="text-xs text-center text-amber-400/80">
                  علت انتخابی: «{reason === 'other' ? customReason : reason}»
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmStep(1)}
                  disabled={isExecuting}
                >
                  بازگشت و اصلاح
                </GlassButton>
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  icon={<KeyRound className="h-4 w-4" />}
                >
                  {isExecuting ? 'در حال ارسال پالس رله...' : 'تایید نهایی و بازگشایی همه کمدها'}
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassModal>
  );
};

