import React, { useState } from 'react';
import { 
  Users, 
  GitMerge, 
  CheckCheck, 
  Filter, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ImportValidationItem, DuplicateResolution } from '../../../services/migration/migrationTypes';
import { DuplicateMergeViewer } from './DuplicateMergeViewer';

interface DuplicateReviewModalProps {
  duplicateItems: ImportValidationItem[];
  conflictResolutions: Record<string, DuplicateResolution>;
  onUpdateResolution: (matchId: string, resolution: DuplicateResolution) => void;
  onApplyBatchResolution: (resolution: DuplicateResolution, confidenceFilter?: 'HIGH' | 'ALL') => void;
  onNext: () => void;
  onBack: () => void;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  duplicateItems,
  conflictResolutions,
  onUpdateResolution,
  onApplyBatchResolution,
  onNext,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filteredItems = duplicateItems.filter(item => {
    if (activeFilter === 'ALL') return true;
    return item.confidence === activeFilter;
  });

  const highConfidenceCount = duplicateItems.filter(i => i.confidence === 'HIGH').length;

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-duplicate-review">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">بررسی و حل تعارض رکوردهای تکراری ({duplicateItems.length.toLocaleString('fa-IR')} مورد)</h2>
              <p className="text-xs text-slate-400">
                این افراد پیش‌تر در سامانه ثبت‌نام داشته‌اند. نحوه برخورد با سوابق هر عضو را انتخاب فرمایید.
              </p>
            </div>
          </div>

          {/* Quick batch resolution toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyBatchResolution('merge', 'ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>ادغام هوشمند همه ({duplicateItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => onApplyBatchResolution('skip', 'ALL')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>رد کردن همه تکراری‌ها</span>
            </button>
          </div>
        </div>

        {/* Confidence filter tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            فیلتر بر اساس درجه اطمینان:
          </span>

          {[
            { id: 'ALL', label: `همه (${duplicateItems.length})` },
            { id: 'HIGH', label: `تطابق قطعی (${highConfidenceCount})` },
            { id: 'MEDIUM', label: `تطابق متوسط (${duplicateItems.filter(i => i.confidence === 'MEDIUM').length})` },
            { id: 'LOW', label: `احتمالی (${duplicateItems.filter(i => i.confidence === 'LOW').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate items list */}
      <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const matchId = item.duplicateMatch?.id || '';
          const currentRes = conflictResolutions[matchId] || 'merge';

          return (
            <DuplicateMergeViewer
              key={item.rowIndex}
              item={item}
              resolution={currentRes}
              onSetResolution={(res) => onUpdateResolution(matchId, res)}
            />
          );
        })}
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
          id="btn-duplicate-review-next"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
        >
          <span>تأیید و مشاهده پیش‌نمایش نهایی واردسازی</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
