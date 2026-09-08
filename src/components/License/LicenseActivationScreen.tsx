/**
 * Gym OS - License Activation Screen
 * Production Persian license verification, hardware binding, and recovery gateway.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { licenseService } from '../../services/licenseService';
import { LicenseInfo, LicenseStatus } from '../../types/license';

interface LicenseActivationScreenProps {
  onActivated: (info: LicenseInfo) => void;
  initialInfo?: LicenseInfo | null;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({
  onActivated,
  initialInfo,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [status, setStatus] = useState<LicenseStatus>(initialInfo?.status || 'UNACTIVATED');
  const [statusMessage, setStatusMessage] = useState<string>(initialInfo?.message || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<LicenseInfo | null>(initialInfo || null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('در حال محاسبه...');

  useEffect(() => {
    let isMounted = true;

    async function loadStatus() {
      const info = await licenseService.getLicenseStatus();
      if (!isMounted) return;

      setCurrentInfo(info);
      setStatus(info.status);
      if (info.message) setStatusMessage(info.message);
      if (info.deviceFingerprintMasked) {
        setDeviceFingerprint(info.deviceFingerprintMasked);
      } else if (window.gymDesktopApi?.getDeviceFingerprint) {
        const fp = await window.gymDesktopApi.getDeviceFingerprint();
        if (isMounted) setDeviceFingerprint(fp);
      }

      if (info.status === 'DEVICE_MISMATCH' || info.status === 'RECOVERY_REQUIRED') {
        setShowRecoveryInput(true);
      }

      if (info.status === 'ACTIVE') {
        onActivated(info);
      }
    }

    loadStatus();
    return () => {
      isMounted = false;
    };
  }, [onActivated]);

  const handleActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!licenseKey.trim()) {
      setStatusMessage('لطفاً کد لایسنس را وارد نمایید');
      return;
    }

    setIsProcessing(true);
    setStatus('ACTIVATING');
    setStatusMessage('در حال بررسی و اعتبارسنجی لایسنس با سرور...');

    try {
      const res = await licenseService.activateLicense(licenseKey);
      setIsProcessing(false);
      setStatus(res.status);

      if (res.success && res.licenseInfo) {
        setStatus('ACTIVE');
        setStatusMessage('فعال شد');
        setCurrentInfo(res.licenseInfo);
        setTimeout(() => {
          onActivated(res.licenseInfo!);
        }, 1200);
      } else {
        if (res.status === 'DEVICE_MISMATCH') {
          setStatus('DEVICE_MISMATCH');
          setStatusMessage('این لایسنس قبلاً روی دستگاه دیگری فعال شده');
          setShowRecoveryInput(true);
        } else if (res.status === 'RECOVERY_REQUIRED') {
          setStatus('RECOVERY_REQUIRED');
          setStatusMessage('فعالسازی نیاز به بازیابی دارد');
          setShowRecoveryInput(true);
        } else {
          setStatus('UNACTIVATED');
          setStatusMessage(res.message || 'لایسنس نامعتبر است');
        }
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      setStatus('UNACTIVATED');
      const msg = err instanceof Error ? err.message : 'خطا در ارتباط با سامانه فعالسازی';
      setStatusMessage(msg);
    }
  };

  const handleRecover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!licenseKey.trim() || !recoveryCode.trim()) {
      setStatusMessage('ورود کد لایسنس و کد بازیابی الزامی است');
      return;
    }

    setIsProcessing(true);
    setStatus('ACTIVATING');
    setStatusMessage('در حال اعتبارسنجی کد بازیابی و اتصال به دستگاه جدید...');

    try {
      const res = await licenseService.recoverLicense(licenseKey, recoveryCode);
      setIsProcessing(false);

      if (res.success && res.licenseInfo) {
        setStatus('ACTIVE');
        setStatusMessage('فعال شد');
        setCurrentInfo(res.licenseInfo);
        setTimeout(() => {
          onActivated(res.licenseInfo!);
        }, 1200);
      } else {
        setStatus('RECOVERY_REQUIRED');
        setStatusMessage(res.message || 'کد بازیابی نامعتبر است');
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      setStatus('RECOVERY_REQUIRED');
      const msg = err instanceof Error ? err.message : 'خطا در فرآیند بازیابی لایسنس';
      setStatusMessage(msg);
    }
  };

  // Status Badge Rendering
  const renderStatusBadge = () => {
    switch (status) {
      case 'ACTIVATING':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>در حال بررسی</span>
          </div>
        );
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>فعال شد</span>
          </div>
        );
      case 'DEVICE_MISMATCH':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>این لایسنس قبلاً روی دستگاه دیگری فعال شده</span>
          </div>
        );
      case 'RECOVERY_REQUIRED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>فعالسازی نیاز به بازیابی دارد</span>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>لایسنس منقضی شده است</span>
          </div>
        );
      case 'REVOKED':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            <Lock className="w-4 h-4" />
            <span>لایسنس ابطال شده است</span>
          </div>
        );
      case 'UNACTIVATED':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-400 text-xs font-semibold">
            <Key className="w-4 h-4" />
            <span>{statusMessage ? 'لایسنس نامعتبر است' : 'آماده فعالسازی'}</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6" dir="rtl">
      {/* Background Decorative Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
        
        {/* App Title & Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            فعالسازی Gym OS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            سامانه یکپارچه مدیریت باشگاه ورزشی — اتصال پایدار به سخت‌افزار رایانه
          </p>
        </div>

        {/* Status Notification Area */}
        <div className="flex justify-center mb-6">
          {renderStatusBadge()}
        </div>

        {statusMessage && status !== 'ACTIVE' && (
          <div className={`mb-6 p-3.5 rounded-2xl text-xs sm:text-sm border flex items-start gap-2.5 ${
            status === 'DEVICE_MISMATCH' || status === 'RECOVERY_REQUIRED'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : status === 'ACTIVATING'
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-slate-800/70 border-slate-700 text-slate-300'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">
              {statusMessage}
            </div>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={showRecoveryInput ? handleRecover : handleActivate} className="space-y-4">
          
          {/* License Key Input Field */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              کلید لایسنس (License Key)
            </label>
            <div className="relative">
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="مثال: GYM-2026-001"
                disabled={isProcessing || status === 'ACTIVE'}
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl px-4 py-3.5 text-sm text-white font-mono placeholder:text-slate-600 outline-none transition-all pl-11"
                dir="ltr"
              />
              <Key className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Recovery Code Input Field (Shown on Device Mismatch or toggle) */}
          {showRecoveryInput && (
            <div className="pt-2 animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-amber-400">
                  کد یکبارمصرف بازیابی لایسنس (Recovery Code)
                </label>
                <span className="text-[11px] text-slate-500">ارائه‌شده توسط پشتیبانی نرم‌افزار</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="REC-XXXXXX-XXXXXX"
                  disabled={isProcessing || status === 'ACTIVE'}
                  className="w-full bg-slate-950/80 border border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 rounded-2xl px-4 py-3.5 text-sm text-white font-mono placeholder:text-slate-600 outline-none transition-all pl-11"
                  dir="ltr"
                />
                <Lock className="w-5 h-5 text-amber-500/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Device Fingerprint Indicator */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40 px-3.5 py-2.5 rounded-xl border border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>شناسه سخت‌افزار این رایانه:</span>
            </span>
            <span className="font-mono text-slate-300 font-bold" dir="ltr">
              {deviceFingerprint}
            </span>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-3">
            {status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => currentInfo && onActivated(currentInfo)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>ورود به سامانه Gym OS</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            ) : showRecoveryInput ? (
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isProcessing || !licenseKey.trim() || !recoveryCode.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>در حال بازیابی و اتصال...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>بازیابی و اتصال لایسنس به این رایانه</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecoveryInput(false)}
                  className="w-full text-xs text-slate-400 hover:text-white py-2 text-center transition-colors cursor-pointer"
                >
                  بازگشت به فعالسازی عادی
                </button>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isProcessing || !licenseKey.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>در حال بررسی...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>فعالسازی نرم‌افزار</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Bottom Help / Toggle Recovery */}
        {!showRecoveryInput && status !== 'ACTIVE' && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => setShowRecoveryInput(true)}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>نیاز به انتقال یا بازیابی لایسنس بر روی این رایانه دارید؟</span>
            </button>
          </div>
        )}

        {/* Security & Offline Guarantee Note */}
        <div className="mt-6 text-center text-[11px] text-slate-500 leading-relaxed">
          پس از فعالسازی اولیه، سامانه به صورت کاملاً آفلاین و بدون نیاز به اینترنت فعالیت خواهد نمود.
        </div>

      </div>
    </div>
  );
};
