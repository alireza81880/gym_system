/**
 * Gym OS - Desktop License Management Screen
 * Provides complete license inspection, manual activation, manual hardware recovery,
 * and local deactivation with cryptographic hardware verification.
 * Respects strict architectural invariants: preserves SQLite data, IPC boundaries,
 * and clear distinction between local deactivation vs server revocation.
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
  CheckCircle2,
  AlertCircle,
  Lock,
  Shield,
  Laptop,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { licenseService } from '../../services/licenseService';
import { LicenseInfo, LicenseStatus } from '../../types/license';
import { AuthService } from '../../services/auth/authService';
import { supabaseAuthService, SuperAdminProfile } from '../../services/auth/supabaseAuthService';
import { StaffUser } from '../../types';
import { AdminLicensePortal } from './AdminLicensePortal';

interface LicenseSettingsTabProps {
  onLicenseChanged?: (info: LicenseInfo | null) => void;
}

export const LicenseSettingsTab: React.FC<LicenseSettingsTabProps> = ({ onLicenseChanged }) => {
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Client User & Role
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    AuthService.initialize();
    return AuthService.getCurrentUser();
  });

  // Real Super Admin Auth State for Admin Portal
  const [adminProfile, setAdminProfile] = useState<SuperAdminProfile | null>(() => {
    return supabaseAuthService.getCurrentProfile();
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return supabaseAuthService.isSuperAdmin();
  });

  // Admin inline login state with Supabase Auth
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  useEffect(() => {
    AuthService.initialize();
    const unsubscribeLocal = AuthService.subscribe((session) => {
      setCurrentUser(session?.user || null);
    });

    const unsubscribeSupabase = supabaseAuthService.subscribe((_session, profile) => {
      setAdminProfile(profile);
      setIsSuperAdmin(profile?.role === 'super_admin');
    });

    // Check existing server session
    supabaseAuthService.checkSession().then((res) => {
      if (res.isSuperAdmin) {
        setIsSuperAdmin(true);
        setAdminProfile(supabaseAuthService.getCurrentProfile());
      }
    });

    return () => {
      unsubscribeLocal();
      unsubscribeSupabase();
    };
  }, []);

  const openDedicatedAdminConsole = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('route', 'admin-license');
    window.history.pushState(null, '', url.pathname + (url.search ? url.search : ''));
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleAdminInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);

    try {
      const res = await supabaseAuthService.signIn(adminEmail.trim(), adminPassword);
      if (res.success && res.isSuperAdmin) {
        setIsSuperAdmin(true);
        setAdminProfile(supabaseAuthService.getCurrentProfile());
      } else {
        setAdminLoginError(res.error || 'ورود ناموفق بود: نیاز به حساب راهبر ارشد (super_admin) در سرور است.');
      }
    } catch {
      setAdminLoginError('خطای سیستمی در احراز هویت سرور.');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // Manual Activation Form
  const [activateKey, setActivateKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activateMessage, setActivateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Recovery Form
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Local Deactivation Confirmation Modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // UI helpers
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedFp, setCopiedFp] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const info = await licenseService.getLicenseStatus();
      setLicenseInfo(info);
      if (info.licenseId && !recoveryKey) {
        setRecoveryKey(info.licenseId);
      }
    } catch (err) {
      console.error('Failed to get license status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const maskLicenseKey = (key: string | null | undefined): string => {
    if (!key) return 'ثبت نشده';
    const clean = key.trim();
    if (clean.length <= 8) return clean;
    const start = clean.slice(0, 4);
    const end = clean.slice(-4);
    return `${start}-****-****-${end}`;
  };

  const getStatusDisplay = (status: LicenseStatus | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return {
          title: 'لایسنس فعال است',
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          containerClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: ShieldCheck,
        };
      case 'REVOKED':
        return {
          title: 'این لایسنس توسط مدیریت لغو شده',
          badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          containerClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: ShieldAlert,
        };
      case 'EXPIRED':
        return {
          title: 'لایسنس منقضی شده',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          containerClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: ShieldAlert,
        };
      case 'DEVICE_LIMIT_REACHED':
        return {
          title: 'سقف مجاز دستگاه‌ها تکمیل شده است',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          containerClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: ShieldAlert,
        };
      case 'DEVICE_MISMATCH':
        return {
          title: 'عدم تطابق شناسه سخت‌افزار (نیاز به بازیابی)',
          badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          containerClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: ShieldAlert,
        };
      case 'UNACTIVATED':
      default:
        return {
          title: 'لایسنس غیرفعال است',
          badgeClass: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          containerClass: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          icon: ShieldAlert,
        };
    }
  };

  // 1. Manual Activation Handler
  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateKey.trim()) return;

    setIsActivating(true);
    setActivateMessage(null);

    try {
      const res = await licenseService.activateLicense(activateKey.trim());
      if (res.success && res.licenseInfo) {
        setLicenseInfo(res.licenseInfo);
        setActivateMessage({ type: 'success', text: 'لایسنس جدید با موفقیت فعال و پیوند داده شد.' });
        setActivateKey('');
        if (onLicenseChanged) {
          onLicenseChanged(res.licenseInfo);
        }
      } else {
        setActivateMessage({
          type: 'error',
          text: res.message || 'خطا در فعالسازی لایسنس',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای سیستمی';
      setActivateMessage({ type: 'error', text: msg });
    } finally {
      setIsActivating(false);
    }
  };

  // 2. Manual Recovery Handler
  const handleManualRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetKey = recoveryKey.trim() || licenseInfo?.licenseId || '';
    if (!targetKey || !recoveryCode.trim()) return;

    setIsRecovering(true);
    setRecoveryMessage(null);

    try {
      const res = await licenseService.recoverLicense(targetKey, recoveryCode.trim());
      if (res.success && res.licenseInfo) {
        setLicenseInfo(res.licenseInfo);
        setRecoveryMessage({
          type: 'success',
          text: 'لایسنس با موفقیت به این رایانه منتقل و فعال شد.',
        });
        setRecoveryCode('');
        if (onLicenseChanged) {
          onLicenseChanged(res.licenseInfo);
        }
      } else {
        setRecoveryMessage({
          type: 'error',
          text: res.message || 'کد بازیابی یا کلید لایسنس نامعتبر است',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای سیستمی در فرآیند بازیابی';
      setRecoveryMessage({ type: 'error', text: msg });
    } finally {
      setIsRecovering(false);
    }
  };

  // 3. Local Deactivation Handler (Removes local token only, preserves SQLite data)
  const handleConfirmDeactivateLocal = async () => {
    setIsDeactivating(true);
    try {
      const res = await licenseService.deactivateLicense();
      setShowDeactivateModal(false);

      if (res.success) {
        const unactivatedInfo: LicenseInfo = {
          status: 'UNACTIVATED',
          licenseId: null,
          gymId: null,
          gymName: null,
          plan: null,
          activatedAt: null,
          expiresAt: null,
          deviceBindingStatus: 'UNBOUND',
          tokenVersion: 1,
          deviceFingerprintMasked: licenseInfo?.deviceFingerprintMasked || 'FP-UNBOUND',
          isOfflineValid: false,
          message: 'لایسنس محلی حذف شد',
        };
        setLicenseInfo(unactivatedInfo);

        // Notify parent App.tsx to immediately return to LicenseActivationScreen
        if (onLicenseChanged) {
          onLicenseChanged(unactivatedInfo);
        } else {
          // Fallback reload to activate the root gate
          window.location.reload();
        }
      } else {
        alert(res.message || 'خطا در حذف لایسنس محلی');
      }
    } catch (err) {
      console.error('Failed to deactivate locally:', err);
      alert('خطا در ارتباط با کلاینت دسکتاپ');
    } finally {
      setIsDeactivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-semibold">در حال بارگذاری اطلاعات لایسنس...</span>
      </div>
    );
  }

  const isActivated = licenseInfo?.status === 'ACTIVE';
  const statusCfg = getStatusDisplay(licenseInfo?.status);
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-900/80 p-2 rounded-2xl border border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('client')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'client'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Laptop className="w-4 h-4 text-cyan-400" />
            <span>مشخصات لایسنس این سیستم (کلاینت)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('admin')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'admin'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-extrabold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>مدیریت و صدور لایسنس (ادمین)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={openDedicatedAdminConsole}
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
          title="باز کردن کنسول در صفحه مستقل و تمام‌صفحه"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>کنسول مستقل تمام‌صفحه</span>
        </button>
      </div>

      {viewMode === 'admin' ? (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 max-w-md mx-auto my-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  احراز هویت سروری مدیر لایسنس
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  مشاهده و صدور لایسنس‌ها مستلزم احراز هویت با دسترسی <strong className="text-emerald-400">super_admin</strong> در Supabase Auth است.
                </p>
              </div>

              {adminLoginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                  {adminLoginError}
                </div>
              )}

              <form onSubmit={handleAdminInlineLogin} className="space-y-3 text-right">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    ایمیل راهبر ارشد (Super Admin):
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@gymos.internal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    رمز عبور:
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAdminLoggingIn}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Key className="w-4 h-4" />
                  <span>{isAdminLoggingIn ? 'در حال بررسی هویت سرور...' : 'تایید دسترسی سروری و ورود'}</span>
                </button>
              </form>
            </div>
          ) : (
            <AdminLicensePortal />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Status Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${statusCfg.containerClass}`}>
                  <StatusIcon className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">
                      {statusCfg.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}>
                      {licenseInfo?.status || 'UNACTIVATED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    اتصال سخت‌افزاری رمزنگاری‌شده و اعتبارسنجی آفلاین با امضای Ed25519
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

          {/* 2. License Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* License ID Masked */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">شناسه لایسنس (License Key)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-mono font-bold text-white truncate block" dir="ltr">
                    {maskLicenseKey(licenseInfo?.licenseId)}
                  </span>
                  {licenseInfo?.licenseId && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(licenseInfo.licenseId || '');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded"
                      title="کپی کلید کامل"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Plan / Tier */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">طرح و ویرایش نرم‌افزار</span>
                <span className="text-sm font-bold text-white block truncate mt-0.5">
                  {licenseInfo?.plan ? `Gym OS — ویرایش ${licenseInfo.plan}` : 'ثبت نشده'}
                </span>
              </div>
            </div>

            {/* Expiration Date */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-purple-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">تاریخ انقضای لایسنس</span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {licenseInfo?.expiresAt
                    ? new Date(licenseInfo.expiresAt).toLocaleDateString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'دائمی (مادام‌العمر بدون انقضا)'}
                </span>
              </div>
            </div>

            {/* Hardware Binding Status */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">وضعیت پیوند به سخت‌افزار</span>
                <span className={`text-xs font-bold block mt-0.5 ${
                  licenseInfo?.deviceBindingStatus === 'BOUND_MATCHED'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {licenseInfo?.deviceBindingStatus === 'BOUND_MATCHED'
                    ? 'متصل و تطبیق‌یافته با این رایانه'
                    : 'نامنطبق یا بررسی نشده'}
                </span>
              </div>
            </div>

            {/* Device Fingerprint Masked */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">اثرانگشت سخت‌افزار این رایانه</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-bold text-white truncate block" dir="ltr">
                    {licenseInfo?.deviceFingerprintMasked || 'FP-HW'}
                  </span>
                  {licenseInfo?.deviceFingerprintMasked && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(licenseInfo.deviceFingerprintMasked || '');
                        setCopiedFp(true);
                        setTimeout(() => setCopiedFp(false), 2000);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1 rounded"
                      title="کپی شناسه سخت‌افزار"
                    >
                      {copiedFp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Offline Verification Status */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-400 block font-medium">اعتبارسنجی آفلاین محلی</span>
                <span className="text-xs font-bold text-emerald-400 block truncate mt-0.5">
                  {licenseInfo?.isOfflineValid ? 'امضای دیجیتال معتبر است' : 'نیازمند فعالسازی'}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Action Cards: Manual Activation & Manual Recovery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Manual Activation Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">فعالسازی لایسنس جدید</h4>
                  <p className="text-xs text-slate-400">وارد کردن یا تعویض کد لایسنس برای این رایانه</p>
                </div>
              </div>

              <form onSubmit={handleManualActivate} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    کلید لایسنس (License Key)
                  </label>
                  <input
                    type="text"
                    value={activateKey}
                    onChange={(e) => setActivateKey(e.target.value.toUpperCase())}
                    placeholder="GYM-XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-500 placeholder-slate-600"
                    dir="ltr"
                  />
                </div>

                {activateMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    activateMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {activateMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{activateMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isActivating || !activateKey.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {isActivating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال اعتبارسنجی با سرور...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>فعالسازی لایسنس</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Manual Recovery Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">بازیابی و انتقال لایسنس (Recovery)</h4>
                  <p className="text-xs text-slate-400">انتقال لایسنس پس از تعویض مادربورد، قطعات یا سیستم</p>
                </div>
              </div>

              <form onSubmit={handleManualRecover} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    کد لایسنس قبلی
                  </label>
                  <input
                    type="text"
                    value={recoveryKey}
                    onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
                    placeholder="GYM-XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-400 placeholder-slate-600"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    کد یکبارمصرف بازیابی (Recovery Code)
                  </label>
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    placeholder="REC-XXXX-XXXXXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-amber-400 placeholder-slate-600"
                    dir="ltr"
                  />
                </div>

                {recoveryMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    recoveryMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {recoveryMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{recoveryMessage.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRecovering || !recoveryCode.trim() || (!recoveryKey.trim() && !licenseInfo?.licenseId)}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  {isRecovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال انتقال سخت‌افزاری...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>بازیابی و اتصال به این رایانه</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* 4. Distinction Card & Local Deactivation Area */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Info className="w-5 h-5 text-cyan-400" />
              <span>تفاوت میان «غیرفعالسازی محلی این رایانه» و «ابطال سروری لایسنس»</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-400">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
                <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span>الف) غیرفعالسازی محلی (این سیستم)</span>
                </span>
                <p>
                  فقط فایل توکن لایسنس محلی از روی این رایانه پاک می‌شود. این عمل به شما امکان می‌دهد سیستم را با لایسنس دیگری فعال کنید. پایگاه‌داده اعضا، پکیج‌ها و پرداخت‌های باشگاه دست‌نخورده باقی مانده و لایسنس در سرور ابطال نمی‌گردد.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-1.5">
                <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>ب) ابطال سروری (Revoke)</span>
                </span>
                <p>
                  عملیاتی مدیریتی در سرور مرکزی است که لایسنس را در سراسر سیستم باطل می‌سازد. این عملیات تنها توسط مدیر در پنل ادمین (Admin Console) قابل انجام بوده و در دسترس کاربران عادی در این رایانه قرار ندارد.
                </p>
              </div>
            </div>

            {/* Local Deactivation Trigger */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h5 className="text-xs font-bold text-slate-200">حذف لایسنس از این رایانه</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  برای انتقال برنامه یا فعالسازی با کدی دیگر، می‌توانید توکن این رایانه را پاک کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف فعالسازی محلی از این سیستم</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Local Deactivation */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                تایید حذف لایسنس از این رایانه
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                آیا از حذف لایسنس محلی از روی این رایانه اطمینان دارید؟
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-emerald-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ضمانت حفظ کامل داده‌های باشگاه:</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                کلیه اطلاعات اعضا، پرداخت‌ها، پکیج‌ها و فایل پایگاه‌داده محلی SQLite محفوظ مانده و لایسنس شما در سرور ابطال نمی‌گردد. پس از تایید به صفحه فعالسازی لایسنس بازگردانده می‌شوید.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isDeactivating}
                onClick={handleConfirmDeactivateLocal}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isDeactivating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال حذف فایل لایسنس...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>بله، لایسنس این سیستم حذف شود</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isDeactivating}
                onClick={() => setShowDeactivateModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
