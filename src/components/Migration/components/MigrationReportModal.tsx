import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  Download, 
  Users, 
  UserPlus, 
  FileText, 
  ArrowLeft,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { MigrationReport } from '../../../services/migration/migrationTypes';
import { MigrationEngine } from '../../../services/migration/migrationEngine';
import { useAppContext } from '../../../context/AppContext';

interface MigrationReportModalProps {
  report: MigrationReport;
  onClose: () => void;
  onRollback: (migrationId: string) => void;
}

export const MigrationReportModal: React.FC<MigrationReportModalProps> = ({
  report,
  onClose,
  onRollback,
}) => {
  const { setActiveTab } = useAppContext();

  const handleDownloadCsvErrors = () => {
    if (!report.errors || report.errors.length === 0) return;
    const csv = MigrationEngine.generateErrorReportCsv(report.errors);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-errors-${report.migrationId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-report-view">
      {/* Main Success / Status Banner */}
      <div className="p-8 glass-regular rounded-3xl border border-[var(--gym-border)] text-center space-y-4 shadow-2xl relative overflow-hidden">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand)] flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-black text-[var(--gym-text)]">انتقال اطلاعات با موفقیت کامل انجام شد</h2>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
              {report.status}
            </span>
          </div>
          <p className="text-xs text-[var(--gym-text-muted)]">
            داده‌های اعضا در پایگاه داده Gym OS مستقر گردید و سیستم برای پذیرش و ثبت‌نام سریع در پذیرش آماده است.
          </p>
        </div>

        {/* Migration Metadata tag */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs text-[var(--gym-text-secondary)] font-mono">
          <span>شناسه انتقال: <strong className="text-[var(--gym-brand)]">{report.migrationId}</strong></span>
          <span>•</span>
          <span>منبع: <strong className="text-[var(--gym-text)]">{report.sourceType.toUpperCase()}</strong></span>
          <span>•</span>
          <span>زمان: <strong className="text-[var(--gym-text-muted)]">{new Date(report.timestamp).toLocaleTimeString('fa-IR')}</strong></span>
        </div>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 glass-subtle rounded-2xl border border-[var(--gym-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--gym-text-muted)] mb-1">
            <span>اعضای جدید ایجاد شده</span>
            <UserPlus className="w-4 h-4 text-[var(--gym-brand)]" />
          </div>
          <p className="text-2xl font-black text-[var(--gym-brand)]">{report.importedCount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">نفر</span></p>
        </div>

        <div className="p-5 glass-subtle rounded-2xl border border-[var(--gym-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--gym-text-muted)] mb-1">
            <span>پرونده‌های به‌روزرسانی شده</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{report.updatedCount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">پرونده</span></p>
        </div>

        <div className="p-5 glass-subtle rounded-2xl border border-[var(--gym-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--gym-text-muted)] mb-1">
            <span>ردیف‌های نادیده‌گرفته شده</span>
            <FileText className="w-4 h-4 text-[var(--gym-text-muted)]" />
          </div>
          <p className="text-2xl font-black text-[var(--gym-text)]">{report.skippedCount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">مورد</span></p>
        </div>

        <div className="p-5 glass-subtle rounded-2xl border border-[var(--gym-border)]">
          <div className="flex items-center justify-between text-xs text-[var(--gym-text-muted)] mb-1">
            <span>خطاهای مسدودکننده</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-300">{report.errorCount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-[var(--gym-text-muted)]">ردیف</span></p>
        </div>
      </div>

      {/* Errors list if any */}
      {report.errors && report.errors.length > 0 && (
        <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>گزارش خطاهای رخ داده در حین پردازش</span>
            </h3>

            <button
              type="button"
              onClick={handleDownloadCsvErrors}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800 text-xs font-semibold hover:bg-rose-900/60 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود خروجی CSV خطاها</span>
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
            {report.errors.map((err, idx) => (
              <div key={idx} className="p-3 glass-subtle rounded-xl border border-[var(--gym-border)] flex items-center justify-between">
                <span className="font-mono text-[var(--gym-text-muted)]">ردیف #{err.row}</span>
                <span className="text-rose-300 font-medium">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--gym-border)]">
        {/* Rollback button */}
        {report.rollbackAvailable ? (
          <button
            type="button"
            id="btn-rollback-migration"
            onClick={() => {
              if (window.confirm('آیا از بازگردانی تمام تغییرات این انتقال و برگشت به نسخه قبل اطمینان دارید؟')) {
                onRollback(report.migrationId);
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازگردانی کامل به نسخه قبل (Rollback)</span>
          </button>
        ) : (
          <span className="text-xs text-[var(--gym-text-muted)]">نسخه پشتیبان بازگردانی شده است</span>
        )}

        {/* Direct Action Links */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setActiveTab('students');
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl glass-subtle hover:bg-[var(--gym-brand-soft)] text-[var(--gym-text)] font-bold text-xs border border-[var(--gym-border)] transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-[var(--gym-brand)]" />
            <span>مشاهده فهرست اعضا در باشگاه</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-black text-xs shadow-lg transition-all cursor-pointer"
          >
            <span>بستن و اتمام</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
