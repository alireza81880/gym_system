import { Component, ErrorInfo, ReactNode, createRef } from 'react';
import { AlertOctagon, RefreshCw, Database, Terminal, UploadCloud } from 'lucide-react';
import { LocalDatabase } from '../../services/database/localDatabase';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryStatus: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private fileInputRef = createRef<HTMLInputElement>();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryStatus: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[GymOS ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleExportEmergencyBackup = async () => {
    try {
      const backupJson = await LocalDatabase.exportFullBackup();
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym_os_emergency_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.setState({ recoveryStatus: 'نسخه پشتیبان اضطراری با موفقیت ذخیره شد.' });
    } catch (e) {
      alert(`خطا در ایجاد خروجی اضطراری: ${(e as Error).message}`);
    }
  };

  private handleRestoreBackupClick = () => {
    this.fileInputRef.current?.click();
  };

  private handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      this.setState({ recoveryStatus: 'در حال بازیابی فایل پشتیبان...' });
      if (file.name.endsWith('.json')) {
        const text = await file.text();
        const success = await LocalDatabase.importFullBackup(text);
        if (success) {
          this.setState({ recoveryStatus: 'اطلاعات با موفقیت بازیابی شد. در حال راه‌اندازی مجدد...' });
          setTimeout(() => window.location.reload(), 1200);
        } else {
          this.setState({ recoveryStatus: 'خطا: فایل JSON پشتیبان نامعتبر است یا ساختار درستی ندارد.' });
        }
      } else {
        // Desktop native restore
        if ((window as any).gymDesktopApi?.restoreBackup) {
          const res = await (window as any).gymDesktopApi.restoreBackup((file as any).path || file.name);
          if (res?.success) {
            this.setState({ recoveryStatus: 'پایگاه‌داده SQLite بازیابی شد. در حال بازنشانی...' });
            setTimeout(() => window.location.reload(), 1200);
          } else {
            this.setState({ recoveryStatus: `خطا در بازیابی دسکتاپ: ${res?.message || 'فایل نامعتبر است'}` });
          }
        } else {
          this.setState({ recoveryStatus: 'برای بازیابی فایل‌های .db لطفاً در نسخه دسکتاپ اقدام فرمایید.' });
        }
      }
    } catch (err: any) {
      this.setState({ recoveryStatus: `خطا در پردازش فایل: ${err?.message}` });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-2xl w-full bg-stone-900/90 border border-red-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4 text-red-400">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">خطای غیرمنتظره در اجرای سامانه (Crash Recovery)</h1>
                <p className="text-xs text-stone-400 mt-1">
                  پایگاه‌داده SQLite و اطلاعات مالی شما در امان است. برای ادامه یکی از گزینه‌های زیر را انتخاب نمایید.
                </p>
              </div>
            </div>

            {/* Error detail box */}
            <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 font-mono text-xs text-red-300 overflow-x-auto space-y-2">
              <div className="font-bold flex items-center gap-2 text-stone-400">
                <Terminal className="w-4 h-4" />
                <span>پیام خطا:</span>
              </div>
              <div className="p-2 rounded bg-red-950/30 border border-red-900/50">
                {this.state.error?.message || 'Unknown Runtime Error'}
              </div>
              {this.state.error?.stack && (
                <details className="text-[11px] text-stone-500 cursor-pointer pt-2">
                  <summary>مشاهده پشته خطا (Stack Trace)</summary>
                  <pre className="mt-2 text-[10px] text-stone-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            {this.state.recoveryStatus && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                {this.state.recoveryStatus}
              </div>
            )}

            <input
              type="file"
              ref={this.fileInputRef}
              onChange={this.handleFileSelected}
              accept=".json,.db"
              className="hidden"
            />

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleExportEmergencyBackup}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all cursor-pointer"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>دانلود نسخه پشتیبان اضطراری</span>
                </button>

                <button
                  onClick={this.handleRestoreBackupClick}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-cyan-400" />
                  <span>بازیابی از فایل پشتیبان</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleReload}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>بارگذاری مجدد نرم‌افزار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
