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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white">انتخاب منبع داده برای انتقال</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            قالب داده‌های سوابق باشگاه خود را انتخاب نمایید یا از فایل نمونه استاندارد اکسل جهت تست و ارزیابی استفاده کنید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <button
            type="button"
            id="btn-download-sample-excel-source"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all shadow-md cursor-pointer group"
          >
            <Download className="w-4 h-4 text-emerald-400 group-hover:-translate-y-0.5 transition-transform" />
            <span>دانلود فایل نمونه Excel (۳۲ عضو با حالات خاص)</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
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
                  ? 'bg-slate-850 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/50 hover:bg-slate-850/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {src.isPopular && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                  <Zap className="w-3 h-3" />
                  رایج‌ترین
                </span>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50'
                    }`}
                  >
                    {src.badge}
                  </span>
                </div>

                <div>
                  <h3 className={`text-base font-bold mb-1.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                    {src.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {src.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isSelected ? 'منبع انتخاب شده' : 'کلیک برای انتخاب'}
                </span>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black'
                      : 'border-slate-700 text-slate-600'
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
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/60 transition-all cursor-pointer"
        >
          <span>مرحله بعد: بارگذاری و اتصال منبع</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
