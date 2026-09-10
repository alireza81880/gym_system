/**
 * Gym OS - License Settings Tab
 * Displays license information, hardware binding state, and allows authorized license management.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Cpu,
  RefreshCw,
  Calendar,
  Layers,
  Building2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Shield,
  Laptop,
} from 'lucide-react';
import { licenseService } from '../../services/licenseService';
import { LicenseInfo } from '../../types/license';
import { AdminLicensePortal } from './AdminLicensePortal';

export const LicenseSettingsTab: React.FC = () => {
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRebindModal, setShowRebindModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const info = await licenseService.getLicenseStatus();
      setLicenseInfo(info);
    } catch (err) {
      console.error('Failed to get license status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRebind = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseInfo?.licenseId || !recoveryCode.trim()) return;

    setIsRecovering(true);
    setRecoveryMessage('');
    try {
      const res = await licenseService.recoverLicense(licenseInfo.licenseId, recoveryCode);
      if (res.success && res.licenseInfo) {
        setLicenseInfo(res.licenseInfo);
        setRecoveryMessage('لایسنس با موفقیت بازیابی و به این رایانه متصل شد');
        setTimeout(() => {
          setShowRebindModal(false);
          setRecoveryCode('');
          setRecoveryMessage('');
        }, 1500);
      } else {
        setRecoveryMessage(res.message || 'کد بازیابی نامعتبر است');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در فرآیند بازیابی';
      setRecoveryMessage(msg);
    } finally {
      setIsRecovering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>در حال بررسی وضعیت لایسنس سخت‌افزاری...</span>
      </div>
    );
  }

  const isActivated = licenseInfo?.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('client')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'client'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4 text-cyan-400" />
            <span>وضعیت لایسنس این سیستم (کلاینت)</span>
          </button>

          <button
            onClick={() => setViewMode('admin')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>مدیریت و صدور لایسنس (Admin Console)</span>
          </button>
        </div>
      </div>

      {viewMode === 'admin' ? (
        <AdminLicensePortal />
      ) : (
        <>
          {/* Top Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isActivated 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}>
              {isActivated ? <ShieldCheck className="w-8 h-8 stroke-[2.5]" /> : <ShieldAlert className="w-8 h-8 stroke-[2.5]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  وضعیت لایسنس نرم‌افزار Gym OS
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActivated
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {isActivated ? 'فعال و معتبر' : (licenseInfo?.status || 'غیرفعال')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                اتصال اختصاصی تک‌کاربره به سخت‌افزار رایانه و مجوز فعالیت آفلاین
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بررسی مجدد وضعیت</span>
          </button>
        </div>
      </div>

      {/* License Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* License ID */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium">شناسه لایسنس (License ID)</span>
            <span className="text-sm font-mono font-bold text-white truncate block" dir="ltr">
              {licenseInfo?.licenseId || 'ثبت نشده'}
            </span>
          </div>
        </div>

        {/* Plan / Tier */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium">طرح و ویرایش نرم‌افزار</span>
            <span className="text-sm font-bold text-white block">
              {licenseInfo?.plan ? `Gym OS — ویرایش ${licenseInfo.plan}` : 'استاندارد'}
            </span>
          </div>
        </div>

        {/* Hardware Binding Status */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium">وضعیت پیوند به سخت‌افزار (Device Binding)</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-bold ${
                licenseInfo?.deviceBindingStatus === 'BOUND_MATCHED'
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {licenseInfo?.deviceBindingStatus === 'BOUND_MATCHED' ? 'متصل به همین رایانه' : 'نیاز به بررسی'}
              </span>
              <span className="text-[11px] font-mono text-slate-500" dir="ltr">
                ({licenseInfo?.deviceFingerprintMasked || 'FP-HW'})
              </span>
            </div>
          </div>
        </div>

        {/* Activation Date */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-slate-400 block font-medium">تاریخ فعالسازی و اعتبار</span>
            <span className="text-xs text-white block mt-0.5">
              {licenseInfo?.activatedAt
                ? new Date(licenseInfo.activatedAt).toLocaleDateString('fa-IR')
                : 'نامشخص'}
              {' — '}
              {licenseInfo?.expiresAt
                ? `انقضا: ${new Date(licenseInfo.expiresAt).toLocaleDateString('fa-IR')}`
                : 'دائمی (بدون انقضا)'}
            </span>
          </div>
        </div>

      </div>

      {/* Policy and Guarantees Box */}
      <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-5 text-xs text-slate-400 leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>ضمانت عملکرد آفلاین و حریم خصوصی</span>
        </div>
        <p>
          این لایسنس به صورت محلی و با استفاده از امضای دیجیتال نامتقارن (Ed25519) در پردازش امن نرم‌افزار بررسی می‌شود. نرم‌افزار Gym OS برای فعالیت روزمره نیازی به اتصال به اینترنت ندارد و اطلاعات پایگاه‌داده و اعضا کاملاً بر روی حافظه همین رایانه نگهداری می‌شوند.
        </p>
      </div>

      {/* Recovery Section */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={() => setShowRebindModal(true)}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>ورود کد بازیابی و اتصال به دستگاه جدید (Recovery)</span>
        </button>
      </div>

      {/* Recovery Modal */}
      {showRebindModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>بازیابی و تغییر سخت‌افزار لایسنس</span>
            </h4>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              اگر مادربورد یا رایانه باشگاه تعویض شده است، کد بازیابی یکبارمصرف ارائه‌شده توسط پشتیبانی نرم‌افزار را وارد کنید:
            </p>

            <form onSubmit={handleRebind} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  کد یکبارمصرف بازیابی
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  placeholder="REC-XXXXXX-XXXXXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-400"
                  dir="ltr"
                />
              </div>

              {recoveryMessage && (
                <div className="text-xs p-2.5 rounded-xl bg-slate-800 text-slate-200">
                  {recoveryMessage}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isRecovering || !recoveryCode.trim()}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {isRecovering ? 'در حال بررسی...' : 'ثبت و اتصال به این رایانه'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRebindModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
