import React from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { MigrationProgressState } from '../../../services/migration/migrationTypes';

interface MigrationProgressModalProps {
  progress: MigrationProgressState;
}

export const MigrationProgressModal: React.FC<MigrationProgressModalProps> = ({
  progress,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" id="migration-progress-modal">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
        {/* Animated Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center relative">
          <RefreshCw className="w-10 h-10 animate-spin" />
          <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-slate-950">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>

        {/* Title & status */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-white">در حال انتقال ایمن داده‌ها به Gym OS</h3>
          <p className="text-xs text-slate-400 font-medium">
            {progress.currentStepTitle || 'در حال اعتبارسنجی و نگاشت رکوردهای پایگاه داده...'}
          </p>
        </div>

        {/* Real Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-semibold">
            <span className="text-slate-400">
              {progress.recordsProcessed.toLocaleString('fa-IR')} از {progress.recordsTotal.toLocaleString('fa-IR')} رکورد
            </span>
            <span className="text-emerald-400 font-bold">{progress.overallPercentage}%</span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-500/50"
              style={{ width: `${Math.max(5, progress.overallPercentage)}%` }}
            />
          </div>
        </div>

        {/* Stats footer */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              زمان سپری شده
            </span>
            <p className="font-mono font-bold text-slate-200 mt-1">{progress.elapsedSeconds} ثانیه</p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
            <span className="text-slate-500">پشتیبان قبل از شروع</span>
            <p className="font-bold text-emerald-400 mt-1">ایمن ذخیره شد ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
};
