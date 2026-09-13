/**
 * Gym OS - Dedicated Admin License Console Screen
 * Independent protected screen for license issuing, search, filter, revocation, restoration,
 * and signed offline activation/renewal packages.
 * 
 * Invariants:
 * 1. Strictly separated from client activation flow.
 * 2. Protected by role-based authentication (gym_owner / admin).
 * 3. Never embeds service_role or Ed25519 private keys.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  ArrowRight,
  LogOut,
  UserCheck,
  AlertCircle,
  Sparkles,
  Settings,
} from 'lucide-react';
import { supabaseAuthService, SuperAdminProfile } from '../../services/auth/supabaseAuthService';
import { AdminLicensePortal } from '../Settings/AdminLicensePortal';

interface AdminLicenseConsoleScreenProps {
  onExit?: () => void;
}

export const AdminLicenseConsoleScreen: React.FC<AdminLicenseConsoleScreenProps> = ({ onExit }) => {
  const [currentProfile, setCurrentProfile] = useState<SuperAdminProfile | null>(() => {
    return supabaseAuthService.getCurrentProfile();
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return supabaseAuthService.isSuperAdmin();
  });
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Login form state for authentication gate
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Supabase Config settings dialog inside admin gate (for zero-config setup)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => supabaseAuthService.getConfig().url);
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState(() => supabaseAuthService.getConfig().anonKey);
  const [configSuccessMessage, setConfigSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check active session on mount
    const verifySession = async () => {
      try {
        const res = await supabaseAuthService.checkSession();
        if (isMounted) {
          setIsSuperAdmin(Boolean(res.isSuperAdmin));
          setCurrentProfile(supabaseAuthService.getCurrentProfile());
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    verifySession();

    // Subscribe to auth state changes
    const unsubscribe = supabaseAuthService.subscribe((_session, profile) => {
      if (isMounted) {
        setCurrentProfile(profile);
        setIsSuperAdmin(profile?.role === 'super_admin');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cleanEmail = email.trim();
      const res = await supabaseAuthService.signIn(cleanEmail, password);

      if (res.success && res.isSuperAdmin) {
        setIsSuperAdmin(true);
        setCurrentProfile(supabaseAuthService.getCurrentProfile());
      } else {
        setLoginError(res.error || 'ایمیل یا رمز عبور نامعتبر است.');
      }
    } catch {
      setLoginError('خطای سیستمی در احراز هویت ادمین.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await supabaseAuthService.signOut();
      setIsSuperAdmin(false);
      setCurrentProfile(null);
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseAuthService.saveConfig({
      url: supabaseUrlInput.trim(),
      anonKey: supabaseAnonKeyInput.trim(),
    });
    setConfigSuccessMessage('تنظیمات اتصال به Supabase ذخیره شد.');
    setTimeout(() => {
      setConfigSuccessMessage(null);
      setShowConfigModal(false);
    }, 1200);
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Clear admin route parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('route');
      url.searchParams.delete('admin');
      window.history.pushState(null, '', url.pathname + (url.search ? url.search : ''));
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                کنسول مستقل مدیریت لایسنس
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Super Admin Server Enforced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              پنل کنترل و صدور لایسنس‌های نرم‌افزار، تمدید آفلاین و ابطال با احراز هویت واقعی سرور
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60"
            title="تنظیمات اتصال سرور Supabase"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">تنظیمات سرور</span>
          </button>

          {isSuperAdmin && currentProfile && (
            <div className="hidden md:flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-bold">{currentProfile.fullName || currentProfile.email}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                راهبر ارشد (super_admin)
              </span>
            </div>
          )}

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
              title="خروج از حساب مدیر ارشد"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-slate-700/60 shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به برنامه مشتری</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {isCheckingSession ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-medium">در حال بررسی نشست امنیتی سرور...</span>
          </div>
        ) : !isSuperAdmin ? (
          /* Admin Authentication Gate */
          <div className="min-h-[70vh] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  ورود امن به کنسول مدیریت لایسنس
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  دسترسی به بخش صدور، بازیابی و ابطال لایسنس مستلزم تایید هویت سروری با دسترسی <strong className="text-emerald-400">super_admin</strong> از طریق Supabase Auth است.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    ایمیل مدیر ارشد (Super Admin):
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gymos.internal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    رمز عبور:
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Key className="w-4 h-4" />
                  <span>{isLoggingIn ? 'در حال تایید هویت سروری...' : 'تایید هویت و ورود به کنسول'}</span>
                </button>
              </form>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>تنظیم سرور Supabase</span>
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  انصراف و بازگشت
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Authorized Admin Portal */
          <div className="space-y-6">
            <AdminLicensePortal />
          </div>
        )}
      </main>

      {/* Supabase Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span>پیکربندی سرور Supabase برای احراز هویت</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                بستن
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              آدرس و Anon Key پروژه Supabase را در اینجا وارد کنید (همچنین می‌توانید از متغیرهای VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY در فایل .env استفاده فرمایید).
            </p>

            {configSuccessMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                {configSuccessMessage}
              </div>
            )}

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 text-right">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  آدرس Supabase URL:
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  کلید عمومی Supabase Anon Key:
                </label>
                <input
                  type="password"
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseAnonKeyInput}
                  onChange={(e) => setSupabaseAnonKeyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  ذخیره تنظیمات
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

