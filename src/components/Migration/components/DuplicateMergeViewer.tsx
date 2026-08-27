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
    <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
      {/* Header with confidence & match reason */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">ردیف #{item.rowIndex}: {incoming.fullName || 'عضو ناشناس'}</h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  item.confidence === 'HIGH'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : item.confidence === 'MEDIUM'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-blue-950 text-blue-300 border border-blue-800'
                }`}
              >
                تطابق {item.confidence === 'HIGH' ? 'قطعی ۱۰۰٪' : item.confidence === 'MEDIUM' ? 'متوسط' : 'احتمالی'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
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
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
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
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
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
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            جایگزینی کامل
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Existing Member Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              پرونده موجود در Gym OS
            </span>
            <span className="text-[11px] text-slate-500 font-mono">#{existing.memberNumber}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">نام و نام خانوادگی:</span>
              <span className="font-semibold text-white">{existing.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">شماره موبایل:</span>
              <span className="font-mono text-slate-200" dir="ltr">{existing.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">کد ملی:</span>
              <span className="font-mono text-slate-200">{existing.nationalId || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">تاریخ انقضا:</span>
              <span className="font-mono text-slate-200">{existing.expireDate || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">مانده بدهی:</span>
              <span className="font-mono font-bold text-amber-400">{(existing.remainingDebt || 0).toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>

        {/* Incoming Import Record */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              داده‌های جدید در فایل وارد شده
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">ردیف {item.rowIndex}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">نام و نام خانوادگی:</span>
              <span className="font-semibold text-emerald-300">{incoming.fullName || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">شماره موبایل:</span>
              <span className="font-mono text-slate-200" dir="ltr">{incoming.phone || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">کد ملی:</span>
              <span className="font-mono text-slate-200">{incoming.nationalId || '-'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-500">تاریخ انقضا:</span>
              <span className="font-mono text-slate-200">{incoming.expireDate || '-'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">مانده بدهی:</span>
              <span className="font-mono font-bold text-emerald-400">{(incoming.remainingDebt || 0).toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
