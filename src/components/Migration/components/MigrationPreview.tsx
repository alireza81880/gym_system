import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Users, 
  UserPlus, 
  GitMerge, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  Search, 
  ShieldAlert, 
  FileSpreadsheet, 
  Filter,
  Sparkles,
  Layers
} from 'lucide-react';
import { 
  ImportValidationItem, 
  ImportMode, 
  HistoricalMigrationScope 
} from '../../../services/migration/migrationTypes';
import { MigrationEngine } from '../../../services/migration/migrationEngine';

interface MigrationPreviewProps {
  validatedItems: ImportValidationItem[];
  importMode: ImportMode;
  scope: HistoricalMigrationScope;
  isImporting?: boolean;
  onUpdateImportMode: (mode: ImportMode) => void;
  onUpdateScope: (scope: HistoricalMigrationScope) => void;
  onExecute: () => void;
  onBack: () => void;
}

export const MigrationPreview: React.FC<MigrationPreviewProps> = ({
  validatedItems,
  importMode,
  scope,
  isImporting = false,
  onUpdateImportMode,
  onUpdateScope,
  onExecute,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'updates' | 'duplicates' | 'warnings' | 'errors'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Counters
  const totalCount = validatedItems.length;
  const validNewCount = validatedItems.filter(i => i.isValid && !i.isDuplicate).length;
  const duplicateCount = validatedItems.filter(i => i.isDuplicate).length;
  const warningCount = validatedItems.filter(i => i.warnings.length > 0).length;
  const errorCount = validatedItems.filter(i => !i.isValid).length;

  // Filter items
  const filteredItems = useMemo(() => {
    return validatedItems.filter(item => {
      // Tab filter
      if (activeTab === 'valid' && (!item.isValid || item.isDuplicate)) return false;
      if (activeTab === 'updates' && (!item.isDuplicate || !item.isValid)) return false;
      if (activeTab === 'duplicates' && !item.isDuplicate) return false;
      if (activeTab === 'warnings' && item.warnings.length === 0) return false;
      if (activeTab === 'errors' && item.isValid) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const name = (item.mappedMember.fullName || '').toLowerCase();
        const phone = (item.mappedMember.phone || '').toLowerCase();
        const num = (item.mappedMember.memberNumber || '').toLowerCase();
        const nat = (item.mappedMember.nationalId || '').toLowerCase();
        return name.includes(query) || phone.includes(query) || num.includes(query) || nat.includes(query);
      }

      return true;
    });
  }, [validatedItems, activeTab, searchTerm]);

  // Download Error Report CSV
  const handleDownloadErrorReport = () => {
    const errorRecords = validatedItems
      .filter(i => !i.isValid)
      .map(i => ({
        row: i.rowIndex,
        field: 'اطلاعات پرونده',
        message: i.errors.join(' | '),
        data: i.mappedMember,
      }));

    const csvData = MigrationEngine.generateErrorReportCsv(errorRecords);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-errors-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-preview">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'glass-neon border-[var(--gym-brand)] ring-2 ring-[var(--gym-brand-soft)]'
              : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
          }`}
        >
          <span className="text-xs text-[var(--gym-text-muted)]">کل رکوردها</span>
          <p className="text-xl font-black text-[var(--gym-text)] mt-1">{totalCount.toLocaleString('fa-IR')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('valid')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeTab === 'valid'
              ? 'bg-[var(--gym-brand-soft)] border-[var(--gym-border-strong)] ring-2 ring-[var(--gym-brand-soft)]'
              : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
          }`}
        >
          <span className="text-xs text-[var(--gym-brand)]">اعضای جدید (ایجاد)</span>
          <p className="text-xl font-black text-[var(--gym-brand)] mt-1">{validNewCount.toLocaleString('fa-IR')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('duplicates')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeTab === 'duplicates'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
          }`}
        >
          <span className="text-xs text-amber-400">تکراری / به‌روزرسانی</span>
          <p className="text-xl font-black text-amber-300 mt-1">{duplicateCount.toLocaleString('fa-IR')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warnings')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeTab === 'warnings'
              ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
              : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
          }`}
        >
          <span className="text-xs text-blue-400">هشدارهای اصلاح‌شده</span>
          <p className="text-xl font-black text-blue-300 mt-1">{warningCount.toLocaleString('fa-IR')}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('errors')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeTab === 'errors'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'glass-subtle border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
          }`}
        >
          <span className="text-xs text-rose-400">خطاهای رد شده</span>
          <p className="text-xl font-black text-rose-300 mt-1">{errorCount.toLocaleString('fa-IR')}</p>
        </button>
      </div>

      {/* Migration scope & mode settings bar */}
      <div className="p-5 glass-regular rounded-2xl border border-[var(--gym-border)] grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Import Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--gym-text-secondary)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--gym-brand)]" />
            <span>حالت عملیات انتقال (Import Mode)</span>
          </label>
          <select
            value={importMode}
            onChange={(e) => onUpdateImportMode(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
          >
            <option value="create_and_update">ایجاد اعضای جدید + به‌روزرسانی افراد تکراری (توصیه شده)</option>
            <option value="create_only">فقط ایجاد افراد جدید (عدم تغییر افراد تکراری)</option>
            <option value="update_only">فقط به‌روزرسانی رکوردهای موجود (عدم ایجاد عضو جدید)</option>
          </select>
        </div>

        {/* Scope */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--gym-text-secondary)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>دامنه اطلاعات انتقالی (Migration Scope)</span>
          </label>
          <select
            value={scope}
            onChange={(e) => onUpdateScope(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
          >
            <option value="members_only">فقط اطلاعات پرونده اعضا و اشتراک فعلی</option>
            <option value="current_membership">پرونده اعضا + مانده بدهی و شهریه فعال</option>
            <option value="full_migration">مهاجرت کامل (اعضا، شهریه‌ها، پرداختی‌ها و سوابق تردد)</option>
          </select>
        </div>
      </div>

      {/* Preview Table with Search & Actions */}
      <div className="p-6 glass-regular rounded-2xl border border-[var(--gym-border)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[var(--gym-text-muted)] absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام، شماره تماس، کد ملی یا عضویت..."
              className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs focus:border-[var(--gym-brand)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <button
                type="button"
                onClick={handleDownloadErrorReport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود گزارش خطاهای رد شده (CSV)</span>
              </button>
            )}

            <span className="text-xs text-[var(--gym-text-muted)] font-medium">
              نمایش {Math.min(100, filteredItems.length)} از {filteredItems.length.toLocaleString('fa-IR')} ردیف
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[var(--gym-border)] glass-subtle max-h-[480px]">
          <table className="w-full text-right text-xs">
            <thead className="sticky top-0 z-10 glass-regular shadow-md">
              <tr className="border-b border-[var(--gym-border)] text-[var(--gym-text-muted)] font-semibold">
                <th className="p-3 w-12 text-center">ردیف</th>
                <th className="p-3">نام و نام خانوادگی</th>
                <th className="p-3">شماره تماس</th>
                <th className="p-3">کد ملی</th>
                <th className="p-3">شماره عضویت</th>
                <th className="p-3">تاریخ انقضا</th>
                <th className="p-3">مانده بدهی</th>
                <th className="p-3 text-center">وضعیت اعتبارسنجی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gym-border)]">
              {filteredItems.slice(0, 100).map((item) => {
                const member = item.mappedMember;
                return (
                  <tr key={item.rowIndex} className="hover:bg-[var(--gym-brand-soft)] transition-colors">
                    <td className="p-3 text-center font-mono text-[var(--gym-text-muted)]">{item.rowIndex}</td>
                    
                    <td className="p-3 font-semibold text-[var(--gym-text)]">
                      {member.fullName || <span className="text-rose-400">بدون نام</span>}
                    </td>

                    <td className="p-3 font-mono text-[var(--gym-text-secondary)]" dir="ltr">
                      {member.phone || <span className="text-[var(--gym-text-muted)] opacity-50">-</span>}
                    </td>

                    <td className="p-3 font-mono text-[var(--gym-text-secondary)]">
                      {member.nationalId || <span className="text-[var(--gym-text-muted)] opacity-50">-</span>}
                    </td>

                    <td className="p-3 font-mono font-bold text-[var(--gym-brand)]">
                      #{member.memberNumber || 'خودکار'}
                    </td>

                    <td className="p-3 font-mono text-[var(--gym-text-secondary)]">
                      {member.expireDate || <span className="text-[var(--gym-text-muted)] opacity-50">-</span>}
                    </td>

                    <td className="p-3 font-mono font-semibold text-[var(--gym-text)]">
                      {(member.remainingDebt || 0).toLocaleString('fa-IR')} ت
                    </td>

                    <td className="p-3 text-center">
                      {!item.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800 px-2.5 py-0.5 rounded-full" title={item.errors.join(' | ')}>
                          <XCircle className="w-3 h-3" />
                          خطا در اطلاعات
                        </span>
                      ) : item.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded-full">
                          <GitMerge className="w-3 h-3" />
                          تکراری (ادغام)
                        </span>
                      ) : item.warnings.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800 px-2.5 py-0.5 rounded-full" title={item.warnings.join(' | ')}>
                          <AlertTriangle className="w-3 h-3" />
                          معتبر با هشدار
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--gym-brand)] bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          عضو جدید
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal before starting migration */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-regular border border-[var(--gym-border)] rounded-3xl p-7 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[var(--gym-text)]">تأیید نهایی انتقال و ایجاد نسخه پشتیبان</h3>
                <p className="text-xs text-[var(--gym-text-muted)]">عملیات انتقال داده‌ها با امنیت کامل آغاز خواهد شد.</p>
              </div>
            </div>

            <div className="p-4 glass-subtle rounded-2xl border border-[var(--gym-border)] space-y-2 text-xs text-[var(--gym-text-secondary)]">
              <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
                <span className="text-[var(--gym-text-muted)]">تعداد اعضای جدید برای ایجاد:</span>
                <span className="font-bold text-[var(--gym-brand)] font-mono">{validNewCount.toLocaleString('fa-IR')} نفر</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
                <span className="text-[var(--gym-text-muted)]">تعداد اعضای موجود برای به‌روزرسانی:</span>
                <span className="font-bold text-amber-400 font-mono">{duplicateCount.toLocaleString('fa-IR')} پرونده</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--gym-text-muted)]">نسخه پشتیبان خودکار (Rollback):</span>
                <span className="font-bold text-[var(--gym-brand)] font-mono">فعال (ذخیره قبل از شروع)</span>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[var(--gym-brand)] focus:ring-[var(--gym-brand)]"
              />
              <span className="text-xs text-[var(--gym-text)] font-semibold leading-relaxed">
                متوجه هستم که اطلاعات وارد پایگاه داده باشگاه خواهد شد و در صورت نیاز می‌توانم با ۱ کلیک آن را بازگردانی (Rollback) کنم.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[var(--gym-border)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] text-xs font-semibold glass-subtle"
              >
                انصراف و بازبینی
              </button>
              <button
                type="button"
                id="btn-confirm-migration-final"
                disabled={!confirmChecked || isImporting}
                onClick={() => {
                  setShowConfirmModal(false);
                  onExecute();
                }}
                className="px-7 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-black text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? 'در حال انتقال...' : 'شروع عملیات انتقال داده‌ها'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
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
          id="btn-preview-start-migration"
          onClick={() => setShowConfirmModal(true)}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-black text-sm shadow-lg shadow-[var(--gym-brand-soft)] transition-all cursor-pointer"
        >
          <span>تأیید و اجرای نهایی انتقال</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
