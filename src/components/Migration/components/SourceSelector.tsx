import React from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Code2, 
  Database, 
  Globe, 
  Building2, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Download
} from 'lucide-react';
import { MigrationSourceType } from '../../../services/migration/migrationTypes';
import { SampleExcelGenerator } from '../../../services/migration/sampleExcelGenerator';

interface SourceSelectorProps {
  selectedSource: MigrationSourceType;
  onSelectSource: (source: MigrationSourceType) => void;
  onNext: () => void;
}

export const SourceSelector: React.FC<SourceSelectorProps> = ({
  selectedSource,
  onSelectSource,
  onNext,
}) => {
  const handleDownloadSample = () => {
    SampleExcelGenerator.downloadSampleExcel();
  };

  const sources: {
    id: MigrationSourceType;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    isPopular?: boolean;
  }[] = [
    {
      id: 'xlsx',
      title: 'فایل اکسل (Excel / XLSX)',
      description: 'واردسازی سریع از شیت‌های اکسل (.xlsx / .xls) با قابلیت تشخیص خودکار چند شیت و ستون‌ها',
      badge: 'پشتیبانی کامل',
      icon: FileSpreadsheet,
      accentColor: 'emerald',
      isPopular: true,
    },
    {
      id: 'csv',
      title: 'فایل متنی CSV',
      description: 'فایل‌های متنی با جداکننده‌های کاما، ویرگول، نقطه ویرگول، تب و پایپ با پشتیبانی استاندارد از زبان فارسی UTF-8',
      badge: 'تشخیص هوشمند جداکننده',
      icon: FileText,
      accentColor: 'cyan',
    },
    {
      id: 'json',
      title: 'فایل ساختاریافته JSON',
      description: 'پشتیبان استاندارد Gym OS یا داده‌های آرایه‌ای و درختی خروجی نرم‌افزارهای مدرن',
      badge: 'پایگاه داده ساختاریافته',
      icon: Code2,
      accentColor: 'purple',
    },
    {
      id: 'sql',
      title: 'پشتیبان پایگاه داده SQL',
      description: 'استخراج امن جداول و رکوردهای پایگاه داده‌های MySQL, SQLite, PostgreSQL بدون اجرای کدهای ناامن',
      badge: 'تحلیلگر امن دیتابیس',
      icon: Database,
      accentColor: 'amber',
    },
    {
      id: 'api',
      title: 'وب‌سرویس و API خارجی',
      description: 'اتصال مستقیم به REST API نرم‌افزار قبلی باشگاه با احراز هویت Bearer Token، API Key و Basic Auth',
      badge: 'اتصال زنده تحت وب',
      icon: Globe,
      accentColor: 'blue',
    },
    {
      id: 'vendor',
      title: 'اتصال به نرم‌افزارهای ایرانی و بین‌المللی',
      description: 'کانکتورهای آماده ZKTeco BioSecurity، حساب‌رس، رادین، مکسس، پالیزافزار و دستگاه‌های تردد',
      badge: 'الگوهای آماده باشگاهی',
      icon: Building2,
      accentColor: 'rose',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn" id="migration-source-selector">
      {/* Intro section with Sample Excel Download Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 glass-regular rounded-2xl border border-[var(--gym-border)] shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)]">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-[var(--gym-text)]">انتخاب منبع داده برای انتقال</h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--gym-text-muted)] max-w-2xl">
            قالب داده‌های سوابق باشگاه خود را انتخاب نمایید یا از فایل نمونه استاندارد اکسل جهت تست و ارزیابی استفاده کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <button
            type="button"
            id="btn-download-sample-excel-source"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-subtle hover:bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] text-[var(--gym-brand)] hover:brightness-110 text-xs font-bold transition-all shadow-md cursor-pointer group"
          >
            <Download className="w-4 h-4 text-[var(--gym-brand)] group-hover:-translate-y-0.5 transition-transform" />
            <span>دانلود فایل نمونه Excel (۳۲ عضو با حالات خاص)</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--gym-text-muted)] glass-subtle px-3.5 py-2 rounded-xl border border-[var(--gym-border)]">
            <ShieldCheck className="w-4 h-4 text-[var(--gym-brand)]" />
            <span>پشتیبان‌گیری خودکار و Rollback فعال</span>
          </div>
        </div>
      </div>

      {/* Grid of source cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sources.map((src) => {
          const Icon = src.icon;
          const isSelected = selectedSource === src.id;

          return (
            <button
              key={src.id}
              type="button"
              id={`source-card-${src.id}`}
              onClick={() => onSelectSource(src.id)}
              className={`relative flex flex-col justify-between p-6 text-right rounded-2xl border transition-all duration-200 cursor-pointer text-start ${
                isSelected
                  ? 'glass-neon border-[var(--gym-brand)] shadow-xl ring-2 ring-[var(--gym-brand-soft)]'
                  : 'glass-subtle hover:glass-regular border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
              }`}
            >
              {src.isPopular && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--gym-brand)] bg-[var(--gym-brand-soft)] border border-[var(--gym-border-strong)] px-2.5 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  رایج‌ترین
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-[var(--gym-brand-soft)] border-[var(--gym-border-strong)] text-[var(--gym-brand)]'
                        : 'glass-subtle border-[var(--gym-border)] text-[var(--gym-text-secondary)]'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                      isSelected
                        ? 'bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border-[var(--gym-border-strong)]'
                        : 'glass-subtle text-[var(--gym-text-muted)] border-[var(--gym-border)]'
                    }`}
                  >
                    {src.badge}
                  </span>
                </div>

                <div>
                  <h3 className={`text-base font-bold mb-1.5 ${isSelected ? 'text-[var(--gym-text)]' : 'text-[var(--gym-text)]'}`}>
                    {src.title}
                  </h3>
                  <p className="text-xs text-[var(--gym-text-muted)] leading-relaxed">
                    {src.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--gym-border)] flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-[var(--gym-brand)] font-bold' : 'text-[var(--gym-text-muted)]'}>
                  {isSelected ? 'منبع انتخاب شده' : 'کلیک برای انتخاب'}
                </span>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] transition-colors ${
                    isSelected
                      ? 'bg-[var(--gym-brand)] border-[var(--gym-brand)] text-[var(--gym-bg)] font-black'
                      : 'border-[var(--gym-border)] text-[var(--gym-text-muted)]'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom action */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          id="btn-source-selector-next"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-sm shadow-lg shadow-[var(--gym-brand-soft)] transition-all cursor-pointer"
        >
          <span>مرحله بعد: بارگذاری و اتصال منبع</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
