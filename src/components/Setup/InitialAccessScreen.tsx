import React from 'react';
import { 
  Building2, 
  ArrowRightLeft, 
  Play, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Database, 
  Layers, 
  ChevronLeft,
  Server,
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';

interface InitialAccessScreenProps {
  onStartNewGym: () => void;
  onStartMigration: () => void;
  onEnterDemo: () => void;
}

export const InitialAccessScreen: React.FC<InitialAccessScreenProps> = ({
  onStartNewGym,
  onStartMigration,
  onEnterDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" dir="rtl">
      {/* Ambient background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 z-10 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>نسخه استاندارد ۳.۰ — پایگاه داده آفلاین امن</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            <span>GYM OS</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 font-medium max-w-xl mx-auto">
            سیستم عامل جامع و هوشمند مدیریت باشگاه، گیت‌های تردد، کمدهای هوشمند و مالی
          </p>
        </div>

        {/* 3 Primary Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* 1. New Gym Setup */}
          <div
            onClick={onStartNewGym}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-850 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  راه‌اندازی باشگاه
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تنظیم مشخصات اولیه باشگاه، ظرفیت کمدها، بسته‌های عضویت، ساعات کاری و آغاز به‌کار با داده‌های کاملاً پاک.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>شروع ویزارد راه‌اندازی</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Migration / Import Center Direct */}
          <div
            onClick={onStartMigration}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-850 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    انتقال اطلاعات قبلی
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    مهاجرت
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  انتقال آسان اکسل، CSV، فایل‌های بکاپ سیستم‌های قدیمی یا دستگاه‌های ZKTeco با حفظ کامل شماره عضویت‌ها.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>ورود به مرکز انتقال</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Demo Mode */}
          <div
            onClick={onEnterDemo}
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-850 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  نسخه آزمایشی (Demo)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  مشاهده تمام امکانات سامانه با داده‌های شبیه‌سازی‌شده (ورزشکاران، ترددها، گزارش‌ها) در یک محیط ایزوله.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>ورود به حالت آزمایشی</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Footer Quick Access Link */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>داده‌ها به صورت کاملاً محلی و رمزنگاری‌شده در حافظه مرورگر شما ذخیره می‌شوند.</span>
          </div>

          <div className="flex items-center gap-2">
            <span>اطلاعات قبلی دارید؟</span>
            <button
              onClick={onStartMigration}
              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              [ انتقال اطلاعات قبلی ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
