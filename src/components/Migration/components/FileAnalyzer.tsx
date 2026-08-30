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
      <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
              <FileCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base font-bold text-[var(--gym-text)]">تحلیل اولیه ساختار داده‌های ورودی</h2>
              <p className="text-xs text-[var(--gym-text-muted)]">
                منبع با موفقیت خوانده و ساختار ستون‌ها و نمونه رکوردهای آن استخراج شد.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              آماده نگاشت فیلدها
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)]">
            <span className="text-xs text-[var(--gym-text-muted)]">تعداد کل رکوردهای خوانده شده</span>
            <p className="text-xl font-black text-[var(--gym-text)] mt-1">{totalRows.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">ردیف</span></p>
          </div>

          <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)]">
            <span className="text-xs text-[var(--gym-text-muted)]">تعداد ستون‌های شناسایی شده</span>
            <p className="text-xl font-black text-[var(--gym-text)] mt-1">{columns.length.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">ستون</span></p>
          </div>

          <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)]">
            <span className="text-xs text-[var(--gym-text-muted)]">نام فایل / منبع</span>
            <p className="text-xs font-bold text-[var(--gym-text)] mt-2 truncate" dir="ltr">{fileName || 'داده مستقیم'}</p>
          </div>

          <div className="p-4 glass-subtle rounded-xl border border-[var(--gym-border)]">
            <span className="text-xs text-[var(--gym-text-muted)]">شیت / جداکننده</span>
            <p className="text-xs font-bold text-[var(--gym-text)] mt-2">
              {selectedSheet ? `شیت: ${selectedSheet}` : detectedDelimiter ? `جداکننده: "${detectedDelimiter}"` : 'استاندارد'}
            </p>
          </div>
        </div>
      </div>

      {/* Sample preview table */}
      <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--gym-brand)]" />
            <h3 className="text-sm font-bold text-[var(--gym-text)]">پیش‌نمایش ستون‌ها و ۳ سطر نخست فایل</h3>
          </div>
          <span className="text-xs text-[var(--gym-text-muted)]">برای نگاشت هر ستون به فیلد متناظر در Gym OS، به مرحله بعد بروید</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--gym-border)] glass-subtle">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-[var(--gym-border)] text-[var(--gym-text-muted)] font-semibold glass-subtle">
                <th className="p-3 w-12 text-center">#</th>
                {columns.map((col, idx) => (
                  <th key={idx} className="p-3 whitespace-nowrap text-[var(--gym-text-secondary)]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gym-border)]">
              {rows.slice(0, 3).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--gym-brand-soft)] transition-colors">
                  <td className="p-3 text-center text-[var(--gym-text-muted)] font-mono">{rIdx + 1}</td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-3 whitespace-nowrap text-[var(--gym-text)]">
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] text-[var(--gym-text)] text-xs font-semibold transition-colors cursor-pointer glass-subtle"
        >
          <ArrowRight className="w-4 h-4" />
          <span>مرحله قبل</span>
        </button>

        <button
          type="button"
          id="btn-analyzer-next"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs shadow-lg shadow-[var(--gym-brand-soft)] transition-all cursor-pointer"
        >
          <span>مرحله بعد: تطبیق و نگاشت ستون‌ها</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
