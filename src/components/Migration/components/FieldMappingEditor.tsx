import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  BookmarkPlus, 
  Plus, 
  SlidersHorizontal,
  Info,
  DollarSign,
  UserCheck,
  Split,
  EyeOff
} from 'lucide-react';
import { 
  ParseResult, 
  ImportMappingProfile,
  CurrencyUnit
} from '../../../services/migration/migrationTypes';
import { MappingEngine } from '../../../services/migration/mappingEngine';
import { useAppContext } from '../../../context/AppContext';

interface FieldMappingEditorProps {
  parseResult: ParseResult;
  mappings: Record<string, string>;
  fullNameMode: 'split' | 'preserve';
  currencyUnit: CurrencyUnit;
  preserveMemberNumbers: boolean;
  onUpdateMappings: (mappings: Record<string, string>) => void;
  onUpdateFullNameMode: (mode: 'split' | 'preserve') => void;
  onUpdateCurrencyUnit: (unit: CurrencyUnit) => void;
  onUpdatePreserveMemberNumbers: (preserve: boolean) => void;
  onSaveProfile: (profileName: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({
  parseResult,
  mappings,
  fullNameMode,
  currencyUnit,
  preserveMemberNumbers,
  onUpdateMappings,
  onUpdateFullNameMode,
  onUpdateCurrencyUnit,
  onUpdatePreserveMemberNumbers,
  onSaveProfile,
  onNext,
  onBack,
}) => {
  const { customFields, mappingProfiles } = useAppContext();
  const { columns, rows } = parseResult;

  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [matchedProfile, setMatchedProfile] = useState<ImportMappingProfile | null>(null);

  // Check for auto-matched profile on load
  useEffect(() => {
    const allProfiles = [...mappingProfiles, ...MappingEngine.SYSTEM_TEMPLATES];
    const best = MappingEngine.findBestMatchingProfile(columns, allProfiles);
    if (best) {
      setMatchedProfile(best.profile);
    }
  }, [columns, mappingProfiles]);

  const handleApplyMatchedProfile = () => {
    if (!matchedProfile) return;
    const newMappings = { ...mappings };
    Object.entries(matchedProfile.mappings).forEach(([srcCol, target]) => {
      // Find matching column case-insensitively
      const actualCol = columns.find(c => c.toLowerCase().trim() === srcCol.toLowerCase().trim());
      if (actualCol) {
        newMappings[actualCol] = target;
      }
    });
    onUpdateMappings(newMappings);
  };

  const handleFieldChange = (colName: string, targetKey: string) => {
    const next = { ...mappings };
    if (!targetKey || targetKey === 'ignore') {
      delete next[colName];
    } else {
      next[colName] = targetKey;
    }
    onUpdateMappings(next);
  };

  const handleAutoSuggestAll = () => {
    const suggested = MappingEngine.suggestMappings(columns, customFields);
    onUpdateMappings(suggested);
  };

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) return;
    onSaveProfile(profileNameInput.trim());
    setShowSaveProfileModal(false);
    setProfileNameInput('');
  };

  const mappedCount = Object.keys(mappings).length;

  return (
    <div className="space-y-6 animate-fadeIn" id="migration-mapping-editor">
      {/* Top Banner: Auto matched profile notification */}
      {matchedProfile && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300">پروفایل نگاشت هوشمند پیدا شد:</span>
                <span className="text-xs font-black text-white">{matchedProfile.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{matchedProfile.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyMatchedProfile}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            اعمال خودکار این نگاشت
          </button>
        </div>
      )}

      {/* Migration global options bar */}
      <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            <span>تنظیمات عمومی تبدیل و نرمال‌سازی داده‌ها</span>
          </div>
          <button
            type="button"
            onClick={handleAutoSuggestAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تطبیق خودکار هوشمند همه ستون‌ها</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          {/* Full Name Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-cyan-400" />
              <span>نحوه پردازش «نام و نام خانوادگی»</span>
            </label>
            <select
              value={fullNameMode}
              onChange={(e) => onUpdateFullNameMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="split">تفکیک هوشمند به نام + نام خانوادگی (توصیه شده)</option>
              <option value="preserve">ذخیره یکپارچه در نام کامل</option>
            </select>
          </div>

          {/* Currency Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>واحد مبالغ مالی در فایل ورودی</span>
            </label>
            <select
              value={currencyUnit}
              onChange={(e) => onUpdateCurrencyUnit(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="toman">تومان (بدون تغییر در ارقام)</option>
              <option value="rial">ریال (تبدیل خودکار با تقسیم بر ۱۰ به تومان)</option>
            </select>
          </div>

          {/* Preserve Member Numbers */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>شماره پرونده / عضویت اعضا</span>
            </label>
            <select
              value={preserveMemberNumbers ? 'preserve' : 'renumber'}
              onChange={(e) => onUpdatePreserveMemberNumbers(e.target.value === 'preserve')}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="preserve">حفظ دقیق شماره‌های قبلی (مثلاً ۹۲۹)</option>
              <option value="renumber">شماره‌گذاری مجدد ترتیبی از ابتدا</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white">تطبیق فیلدهای منبع با Gym OS</h3>
            <p className="text-xs text-slate-400">
              مشخص کنید داده‌های هر ستون در کدام بخش از پرونده ورزشکار در Gym OS ذخیره شود.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              {mappedCount} از {columns.length} ستون نگاشت شده
            </span>

            <button
              type="button"
              onClick={() => setShowSaveProfileModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>ذخیره این نگاشت به عنوان الگو</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-3.5 w-1/4">ستون در فایل شما (Source)</th>
                <th className="p-3.5 w-1/4">نمونه مقادیر (Sample Data)</th>
                <th className="p-3.5 w-1/3">فیلد مقصد در Gym OS (Target Field)</th>
                <th className="p-3.5 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {columns.map((col, idx) => {
                const currentTarget = mappings[col] || '';
                const samples = rows.slice(0, 2).map(r => String(r[col] ?? '')).filter(Boolean);

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    {/* Source Column Name */}
                    <td className="p-3.5 font-semibold text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span>{col}</span>
                      </div>
                    </td>

                    {/* Sample Values */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {samples.length > 0 ? (
                        <div className="truncate max-w-xs">{samples.join(' ، ')}</div>
                      ) : (
                        <span className="text-slate-600">بدون مقدار</span>
                      )}
                    </td>

                    {/* Target Field Dropdown */}
                    <td className="p-3.5">
                      <select
                        value={currentTarget}
                        onChange={(e) => handleFieldChange(col, e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-all ${
                          currentTarget
                            ? 'bg-slate-900 border-emerald-500/60 text-emerald-300 font-semibold ring-1 ring-emerald-500/20'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <option value="">-- نادیده‌گرفتن این ستون (عدم واردسازی) --</option>
                        
                        <optgroup label="فیلدهای اصلی و هویتی">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'core').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label} {f.required ? ' (الزامی)' : ''}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="فیلدهای تماس و اضطراری">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'contact').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="پکیج و دوره عضویت">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'membership').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="امور مالی و شهریه">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'finance').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="سخت‌افزار و کارت تردد">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'hardware').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>

                        <optgroup label="یادداشت و پزشکی">
                          {MappingEngine.TARGET_FIELDS.filter(f => f.category === 'notes').map(f => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>

                        {customFields.length > 0 && (
                          <optgroup label="فیلدهای اختصاصی باشگاه شما">
                            {customFields.map(cf => (
                              <option key={cf.id} value={`custom:${cf.key}`}>
                                {cf.label} (اختصاصی)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      {currentTarget ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          نگاشت شد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                          <EyeOff className="w-3 h-3" />
                          نادیده
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

      {/* Save Profile Modal */}
      {showSaveProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BookmarkPlus className="w-5 h-5" />
              </span>
              <h3 className="text-base font-bold text-white">ذخیره الگوی نگاشت ستون‌ها</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              با ذخیره این الگو، در دفعات بعد با بارگذاری فایلی با همین ساختار، ستون‌ها به صورت کاملاً خودکار و بدون نیاز به تنظیم دستی منطبق خواهند شد.
            </p>

            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">نام الگو (مثلاً خروجی هفتگی اکسل)</label>
                <input
                  type="text"
                  required
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  placeholder="مثال: نگاشت استاندارد نرم‌افزار قدیمی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  ذخیره الگو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          id="btn-mapping-next"
          onClick={onNext}
          disabled={mappedCount === 0}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
        >
          <span>مرحله بعد: اعتبارسنجی و بررسی تکراری‌ها</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
