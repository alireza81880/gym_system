import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Clock, 
  Search,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Users
} from 'lucide-react';
import { MigrationReport } from '../../../services/migration/migrationTypes';
import { MigrationEngine } from '../../../services/migration/migrationEngine';

interface MigrationHistoryProps {
  reports: MigrationReport[];
  onRollback: (migrationId: string) => void;
  onStartNewMigration: () => void;
  onViewReport: (report: MigrationReport) => void;
}

export const MigrationHistory: React.FC<MigrationHistoryProps> = ({
  reports,
  onRollback,
  onStartNewMigration,
  onViewReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(r => {
    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    return (
      r.migrationId.toLowerCase().includes(query) ||
      (r.fileName || '').toLowerCase().includes(query) ||
      r.sourceType.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-history-tab">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-regular rounded-2xl border border-[var(--gym-border)]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <History className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[var(--gym-text)]">تاریخچه و سوابق انتقال داده‌ها</h2>
            <p className="text-xs text-[var(--gym-text-muted)]">
              مشاهده گزارش‌های جامع و قابلیت بازگردانی (Rollback) نسخه‌های پشتیبان با یک کلیک.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartNewMigration}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-center"
        >
          <Zap className="w-4 h-4" />
          <span>شروع انتقال اطلاعات جدید</span>
        </button>
      </div>

      {/* Empty State */}
      {reports.length === 0 ? (
        <div className="p-12 glass-subtle rounded-3xl border border-dashed border-[var(--gym-border)] text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] flex items-center justify-center">
            <History className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--gym-text)]">هنوز انتقال اطلاعاتی انجام نشده است.</h3>
            <p className="text-xs text-[var(--gym-text-muted)] max-w-sm mx-auto">
              شما می‌توانید فایل‌های اکسل، CSV یا پایگاه داده سیستم قبلی باشگاه خود را به سادگی و با ایمنی کامل به Gym OS منتقل کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewMigration}
            className="px-6 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            شروع اولین انتقال داده
          </button>
        </div>
      ) : (
        /* History Table */
        <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-4">
          {/* Search bar */}
          <div className="flex items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[var(--gym-text-muted)] absolute right-3.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو با شناسه یا نام فایل..."
                className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
              />
            </div>

            <span className="text-xs text-[var(--gym-text-muted)]">
              {filteredReports.length} عملیات ثبت شده
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--gym-border)] glass-subtle">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="glass-regular border-b border-[var(--gym-border)] text-[var(--gym-text-muted)] font-semibold">
                  <th className="p-3.5">شناسه انتقال</th>
                  <th className="p-3.5">منبع / فایل</th>
                  <th className="p-3.5">تاریخ و زمان</th>
                  <th className="p-3.5 text-center">اعضای جدید</th>
                  <th className="p-3.5 text-center">به‌روزرسانی</th>
                  <th className="p-3.5 text-center">وضعیت</th>
                  <th className="p-3.5 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--gym-border)]">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-[var(--gym-brand-soft)] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[var(--gym-brand)]">
                      {report.migrationId}
                    </td>

                    <td className="p-3.5 text-[var(--gym-text)]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--gym-text)] uppercase">{report.sourceType}</span>
                        {report.fileName && <span className="text-[var(--gym-text-muted)] truncate max-w-xs">({report.fileName})</span>}
                      </div>
                    </td>

                    <td className="p-3.5 text-[var(--gym-text-secondary)] font-mono">
                      {new Date(report.timestamp).toLocaleString('fa-IR')}
                    </td>

                    <td className="p-3.5 text-center font-mono font-bold text-[var(--gym-brand)]">
                      {report.importedCount.toLocaleString('fa-IR')}
                    </td>

                    <td className="p-3.5 text-center font-mono font-semibold text-amber-400">
                      {report.updatedCount.toLocaleString('fa-IR')}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
                        {report.status}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewReport(report)}
                          className="px-2.5 py-1 rounded-lg glass-subtle hover:bg-[var(--gym-brand-soft)] text-[var(--gym-text)] text-xs font-semibold transition-colors cursor-pointer border border-[var(--gym-border)]"
                        >
                          مشاهده جزئیات
                        </button>

                        {report.rollbackAvailable && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`آیا از بازگردانی کامل تغییرات انتقال ${report.migrationId} اطمینان دارید؟`)) {
                                onRollback(report.migrationId);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
