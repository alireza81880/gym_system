import React from 'react';
import { 
  Users, 
  GitMerge, 
  Check, 
  X, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';
import { ImportValidationItem, DuplicateResolution } from '../../../services/migration/migrationTypes';
import { Student } from '../../../types';

interface DuplicateMergeViewerProps {
  item: ImportValidationItem;
  resolution: DuplicateResolution;
  onSetResolution: (resolution: DuplicateResolution) => void;
}

export const DuplicateMergeViewer: React.FC<DuplicateMergeViewerProps> = ({
  item,
  resolution,
  onSetResolution,
}) => {
  const existing = item.duplicateMatch;
  const incoming = item.mappedMember;

  if (!existing) return null;

  return (
    <div className="p-5 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-4">
      {/* Header with confidence & match reason */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--gym-border)]">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[var(--gym-text)]">ردیف #{item.rowIndex}: {incoming.fullName || 'عضو ناشناس'}</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  item.confidence === 'HIGH'
                    ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                    : item.confidence === 'MEDIUM'
                    ? 'bg-amber-950/70 text-amber-300 border border-amber-800'
                    : 'bg-blue-950/70 text-blue-300 border border-blue-800'
                }`}
              >
                تطابق {item.confidence === 'HIGH' ? 'قطعی ۱۰۰٪' : item.confidence === 'MEDIUM' ? 'متوسط' : 'احتمالی'}
              </span>
            </div>
            <p className="text-xs text-[var(--gym-text-muted)] mt-0.5">
              علت شناسایی تکراری: {
                item.matchReason === 'memberNumber'
                  ? `شماره عضویت یکسان (${existing.memberNumber})`
                  : item.matchReason === 'nationalId'
                  ? `کد ملی یکسان (${existing.nationalId})`
                  : item.matchReason === 'phone'
                  ? `شماره موبایل یکسان (${existing.phone})`
                  : `تشابه نام کامل (${existing.fullName})`
              }
            </p>
          </div>
        </div>

        {/* Resolution selector buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onSetResolution('merge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              resolution === 'merge'
                ? 'bg-[var(--gym-brand)] text-[var(--gym-bg)] shadow-md'
                : 'glass-subtle hover:bg-[var(--gym-brand-soft)] text-[var(--gym-text)] border border-[var(--gym-border)]'
            }`}
          >
            ادغام هوشمند (Merge)
          </button>

          <button
            type="button"
            onClick={() => onSetResolution('skip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              resolution === 'skip'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'glass-subtle hover:bg-amber-500/10 text-[var(--gym-text-muted)] border border-[var(--gym-border)]'
            }`}
          >
            رد کردن (Skip)
          </button>

          <button
            type="button"
            onClick={() => onSetResolution('use_imported')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              resolution === 'use_imported'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'glass-subtle hover:bg-cyan-500/10 text-[var(--gym-text-muted)] border border-[var(--gym-border)]'
            }`}
          >
            جایگزینی کامل
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Existing Member Card */}
        <div className="p-4 rounded-xl glass-subtle border border-[var(--gym-border)] space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
            <span className="font-bold text-[var(--gym-text)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              پرونده موجود در Gym OS
            </span>
            <span className="text-[11px] text-[var(--gym-text-muted)] font-mono">#{existing.memberNumber}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">نام و نام خانوادگی:</span>
              <span className="font-semibold text-[var(--gym-text)]">{existing.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">شماره موبایل:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]" dir="ltr">{existing.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">کد ملی:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]">{existing.nationalId || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">تاریخ انقضا:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]">{existing.expireDate || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--gym-text-muted)]">مانده بدهی:</span>
              <span className="font-mono font-bold text-amber-400">{(existing.remainingDebt || 0).toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>

        {/* Incoming Import Record */}
        <div className="p-4 rounded-xl glass-subtle border border-[var(--gym-border)] space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--gym-border)]">
            <span className="font-bold text-[var(--gym-text)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--gym-brand)]" />
              داده‌های جدید در فایل وارد شده
            </span>
            <span className="text-[11px] text-[var(--gym-brand)] font-mono">ردیف {item.rowIndex}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">نام و نام خانوادگی:</span>
              <span className="font-semibold text-[var(--gym-brand)]">{incoming.fullName || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">شماره موبایل:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]" dir="ltr">{incoming.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">کد ملی:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]">{incoming.nationalId || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">تاریخ انقضا:</span>
              <span className="font-mono text-[var(--gym-text-secondary)]">{incoming.expireDate || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--gym-text-muted)]">مانده بدهی:</span>
              <span className="font-mono font-bold text-[var(--gym-brand)]">{(incoming.remainingDebt || 0).toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
