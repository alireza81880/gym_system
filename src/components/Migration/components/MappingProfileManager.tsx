import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Layers,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import { ImportMappingProfile } from '../../../services/migration/migrationTypes';
import { MappingEngine } from '../../../services/migration/mappingEngine';

interface MappingProfileManagerProps {
  userProfiles: ImportMappingProfile[];
  onSaveProfile: (profile: ImportMappingProfile) => void;
  onDeleteProfile: (id: string) => void;
}

export const MappingProfileManager: React.FC<MappingProfileManagerProps> = ({
  userProfiles,
  onSaveProfile,
  onDeleteProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'user' | 'system'>('user');
  const [importJsonText, setImportJsonText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const systemTemplates = MappingEngine.SYSTEM_TEMPLATES;

  // Export Profile JSON without any personal data
  const handleExportProfile = (profile: ImportMappingProfile) => {
    const exportData = {
      name: profile.name,
      description: profile.description,
      sourceType: profile.sourceType,
      sourceVendor: profile.sourceVendor,
      mappings: profile.mappings,
      fullNameMode: profile.fullNameMode,
      currencyUnit: profile.currencyUnit,
      exportedAt: new Date().toISOString(),
      generator: 'Gym OS Migration Center',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-mapping-profile-${profile.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Profile from JSON
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (!parsed.name || !parsed.mappings || typeof parsed.mappings !== 'object') {
        throw new Error('ساختار فایل JSON پروفایل نامعتبر است (فیلدهای name و mappings الزامی هستند).');
      }

      const newProfile: ImportMappingProfile = {
        id: `profile-${Date.now()}`,
        name: parsed.name,
        description: parsed.description || 'وارد شده از فایل JSON',
        sourceType: parsed.sourceType || 'xlsx',
        sourceVendor: parsed.sourceVendor || 'generic',
        mappings: parsed.mappings,
        fullNameMode: parsed.fullNameMode || 'split',
        currencyUnit: parsed.currencyUnit || 'toman',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSaveProfile(newProfile);
      setShowImportModal(false);
      setImportJsonText('');
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="mapping-profile-manager">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 glass-regular rounded-2xl border border-[var(--gym-border)]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bookmark className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-base font-bold text-[var(--gym-text)]">مدیریت الگوهای نگاشت ستون‌ها (Mapping Profiles)</h2>
            <p className="text-xs text-[var(--gym-text-muted)]">
              الگوهای سفارشی ذخیره شده برای تطبیق آنی ستون‌های فایل اکسل و CSV در دوره‌های بعدی انتقال
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-subtle hover:bg-[var(--gym-brand-soft)] text-cyan-300 font-bold text-xs border border-[var(--gym-border)] transition-colors cursor-pointer self-start sm:self-center"
        >
          <Upload className="w-4 h-4" />
          <span>بارگذاری الگوی JSON</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--gym-border)] pb-3 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'user'
              ? 'bg-[var(--gym-brand)] text-[var(--gym-bg)] shadow-md'
              : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] glass-subtle border border-[var(--gym-border)]'
          }`}
        >
          الگوهای اختصاصی باشگاه ({userProfiles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[var(--gym-brand)] text-[var(--gym-bg)] shadow-md'
              : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] glass-subtle border border-[var(--gym-border)]'
          }`}
        >
          الگوهای پیش‌فرض سیستمی ({systemTemplates.length})
        </button>
      </div>

      {/* Content list */}
      {activeTab === 'user' ? (
        userProfiles.length === 0 ? (
          <div className="p-12 glass-subtle rounded-2xl border border-dashed border-[var(--gym-border)] text-center space-y-3">
            <Bookmark className="w-10 h-10 mx-auto text-[var(--gym-text-muted)]" />
            <p className="text-sm font-bold text-[var(--gym-text)]">هنوز الگوی اختصاصی ذخیره نشده است.</p>
            <p className="text-xs text-[var(--gym-text-muted)] max-w-sm mx-auto">
              در مرحله نگاشت ستون‌ها می‌توانید تنظیمات خود را با یک نام ذخیره کنید تا در دفعات بعدی فایل‌ها به صورت خودکار منطبق شوند.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProfiles.map((p) => (
              <div key={p.id} className="p-5 rounded-2xl glass-regular border border-[var(--gym-border)] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--gym-text)] mb-1">{p.name}</h4>
                    <p className="text-xs text-[var(--gym-text-muted)]">{p.description || 'الگوی ذخیره شده توسط کاربر'}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExportProfile(p)}
                      title="دانلود فایل JSON الگو"
                      className="p-2 rounded-lg glass-subtle hover:bg-[var(--gym-brand-soft)] text-[var(--gym-text)] transition-colors border border-[var(--gym-border)]"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProfile(p.id)}
                      title="حذف الگو"
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-colors border border-rose-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--gym-border)] flex items-center justify-between text-xs text-[var(--gym-text-muted)]">
                  <span>تعداد فیلدهای نگاشت شده: <strong className="text-[var(--gym-brand)] font-mono">{Object.keys(p.mappings).length}</strong></span>
                  <span className="font-mono text-[11px] text-[var(--gym-text-secondary)]">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemTemplates.map((tpl) => (
            <div key={tpl.id} className="p-5 rounded-2xl glass-regular border border-[var(--gym-border)] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--gym-text)]">{tpl.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 font-semibold">
                      سیستمی
                    </span>
                  </div>
                  <p className="text-xs text-[var(--gym-text-muted)] mt-1">{tpl.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportProfile(tpl)}
                  title="دانلود فایل JSON الگو"
                  className="p-2 rounded-lg glass-subtle hover:bg-[var(--gym-brand-soft)] text-[var(--gym-text)] transition-colors border border-[var(--gym-border)]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-[var(--gym-border)] flex items-center justify-between text-xs text-[var(--gym-text-muted)]">
                <span>تعداد فیلدهای استاندارد: <strong className="text-cyan-400 font-mono">{Object.keys(tpl.mappings).length}</strong></span>
                <span className="text-[11px] text-[var(--gym-brand)] font-semibold">تست شده و معتبر ✓</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg glass-regular border border-[var(--gym-border)] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Upload className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-[var(--gym-text)]">واردسازی الگوی نگاشت JSON</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {importError}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--gym-text)]">محتوای فایل JSON الگو</label>
                <textarea
                  rows={8}
                  dir="ltr"
                  required
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`{\n  "name": "الگوی من",\n  "mappings": {\n    "نام": "firstName",\n    "موبایل": "phone"\n  }\n}`}
                  className="w-full p-3 rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] text-xs font-mono focus:border-[var(--gym-brand)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--gym-border)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] text-xs font-semibold glass-subtle"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--gym-brand)] hover:brightness-110 text-[var(--gym-bg)] font-bold text-xs shadow-md"
                >
                  افزودن به الگوها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
