import React from 'react';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Layers, 
  ArrowLeft, 
  ArrowRight,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { ParseResult } from '../../../services/migration/migrationTypes';

interface FileAnalyzerProps {
  parseResult: ParseResult;
  onNext: () => void;
  onBack: () => void;
}

export const FileAnalyzer: React.FC<FileAnalyzerProps> = ({
  parseResult,
  onNext,
  onBack,
}) => {
  const { columns, rows, totalRows, fileName, fileSize, selectedSheet, detectedDelimiter } = parseResult;

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-file-analyzer">
      {/* Header analysis card */}
      <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">تحلیل اولیه ساختار داده‌های ورودی</h2>
              <p className="text-xs text-slate-400">
                منبع با موفقیت خوانده و ساختار ستون‌ها و نمونه رکوردهای آن استخراج شد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              آماده نگاشت فیلدها
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400">تعداد کل رکوردهای خوانده شده</span>
            <p className="text-xl font-black text-white mt-1">{totalRows.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">ردیف</span></p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400">تعداد ستون‌های شناسایی شده</span>
            <p className="text-xl font-black text-white mt-1">{columns.length.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-400">ستون</span></p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400">نام فایل / منبع</span>
            <p className="text-xs font-bold text-slate-200 mt-2 truncate" dir="ltr">{fileName || 'داده مستقیم'}</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-xs text-slate-400">شیت / جداکننده</span>
            <p className="text-xs font-bold text-slate-200 mt-2">
              {selectedSheet ? `شیت: ${selectedSheet}` : detectedDelimiter ? `جداکننده: "${detectedDelimiter}"` : 'استاندارد'}
            </p>
          </div>
        </div>
      </div>

      {/* Sample preview table */}
      <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">پیش‌نمایش ستون‌ها و ۳ سطر نخست فایل</h3>
          </div>
          <span className="text-xs text-slate-500">برای نگاشت هر ستون به فیلد متناظر در Gym OS، به مرحله بعد بروید</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-3 w-12 text-center">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-3 whitespace-nowrap text-slate-300">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.slice(0, 3).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  <td className="p-3 text-center text-slate-500 font-mono">{rIdx + 1}</td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-3 whitespace-nowrap text-slate-300">
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل</span>
        </button>

        <button
          type="button"
          id="btn-analyzer-next"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <span>مرحله بعد: تطبیق و نگاشت ستون‌ها</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
