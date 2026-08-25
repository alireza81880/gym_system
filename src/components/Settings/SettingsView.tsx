import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Languages,
  Shield,
  Building2,
  Phone,
  MapPin,
  Package,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MembershipPackage, PackageType } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    lang, 
    setLang, 
    theme, 
    setTheme, 
    resetToInitialData, 
    exportAllDataAsJson, 
    importDataFromJson, 
    packages,
    addPackage,
    updatePackage,
    deletePackage,
    formatMoney,
    formatNum,
    t 
  } = useApp();

  const [clubName, setClubName] = useState('باشگاه بدنسازی و فیتنس پروشات');
  const [managerPhone, setManagerPhone] = useState('021-88776655');
  const [clubAddress, setClubAddress] = useState('تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۴');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Package Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgNameEn, setPkgNameEn] = useState('');
  const [pkgType, setPkgType] = useState<PackageType>('1_month');
  const [pkgDurationDays, setPkgDurationDays] = useState<number>(30);
  const [pkgSessionsCount, setPkgSessionsCount] = useState<number>(24);
  const [pkgPrice, setPkgPrice] = useState<number>(2800000);
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgIncludesLocker, setPkgIncludesLocker] = useState(true);
  const [pkgIncludesCoach, setPkgIncludesCoach] = useState(false);
  const [pkgIncludesWorkoutPlan, setPkgIncludesWorkoutPlan] = useState(false);
  const [pkgIsVip, setPkgIsVip] = useState(false);

  const openAddPackageModal = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgNameEn('');
    setPkgType(`custom_${Date.now()}` as any);
    setPkgDurationDays(30);
    setPkgSessionsCount(24);
    setPkgPrice(3000000);
    setPkgDescription('');
    setPkgIncludesLocker(true);
    setPkgIncludesCoach(false);
    setPkgIncludesWorkoutPlan(false);
    setPkgIsVip(false);
    setIsPackageModalOpen(true);
  };

  const openEditPackageModal = (pkg: MembershipPackage) => {
    setEditingPackage(pkg);
    setPkgName(pkg.name);
    setPkgNameEn(pkg.nameEn || '');
    setPkgType(pkg.type);
    setPkgDurationDays(pkg.durationDays);
    setPkgSessionsCount(pkg.sessionsCount);
    setPkgPrice(pkg.price);
    setPkgDescription(pkg.description || '');
    setPkgIncludesLocker(Boolean(pkg.includesLocker));
    setPkgIncludesCoach(Boolean(pkg.includesCoach));
    setPkgIncludesWorkoutPlan(Boolean(pkg.includesWorkoutPlan));
    setPkgIsVip(Boolean(pkg.isVip));
    setIsPackageModalOpen(true);
  };

  const handleSavePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName || pkgPrice <= 0) return;

    if (editingPackage) {
      updatePackage(editingPackage.id, {
        name: pkgName,
        nameEn: pkgNameEn || pkgName,
        type: pkgType,
        durationDays: pkgDurationDays,
        sessionsCount: pkgSessionsCount,
        price: pkgPrice,
        description: pkgDescription,
        includesLocker: pkgIncludesLocker,
        includesCoach: pkgIncludesCoach,
        includesWorkoutPlan: pkgIncludesWorkoutPlan,
        isVip: pkgIsVip,
      });
    } else {
      addPackage({
        name: pkgName,
        nameEn: pkgNameEn || pkgName,
        type: pkgType,
        durationDays: pkgDurationDays,
        sessionsCount: pkgSessionsCount,
        price: pkgPrice,
        description: pkgDescription,
        isActive: true,
        includesLocker: pkgIncludesLocker,
        includesCoach: pkgIncludesCoach,
        includesWorkoutPlan: pkgIncludesWorkoutPlan,
        isVip: pkgIsVip,
      });
    }

    setIsPackageModalOpen(false);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        const content = event.target?.result as string;
        const success = importDataFromJson(content);
        if (success) {
          alert('اطلاعات با موفقیت بازیابی شد.');
        } else {
          alert('فرمت فایل پشتیبان نامعتبر است.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-amber-500" />
            <span>{t.settingsTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            تنظیمات عمومی، برندینگ، قیمت‌گذاری پکیج‌ها و تعرفه‌های خدمات
          </p>
        </div>
      </div>

      {/* Pricing & Packages Management (Requested by user) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              <span>مدیریت پکیج‌های عضویت و تعرفه‌های باشگاه</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              مدیر می‌تواند تعرفه‌ها را تغییر دهد، پکیج جدید اضافه کند یا پکیج‌های فعلی را ویرایش کند.
            </p>
          </div>

          <button
            onClick={openAddPackageModal}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>افزودن پکیج جدید</span>
          </button>
        </div>

        {/* Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                pkg.isVip 
                  ? 'bg-amber-500/5 border-amber-500/30' 
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
                      {pkg.name}
                      {pkg.isVip && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-stone-950">
                          VIP
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-stone-400 font-mono">{pkg.nameEn}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPackageModal(pkg)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="ویرایش تعرفه پکیج"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {packages.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`آیا از حذف پکیج «${pkg.name}» اطمینان دارید؟`)) {
                            deletePackage(pkg.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="حذف پکیج"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 my-2">
                  {formatMoney(pkg.price)}
                </div>

                <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                  <div className="flex items-center justify-between">
                    <span>مدت اعتبار:</span>
                    <span className="font-bold font-mono">{pkg.durationDays} روز</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تعداد جلسات مجاز:</span>
                    <span className="font-bold font-mono">{pkg.sessionsCount} جلسه</span>
                  </div>
                </div>

                {/* Badges of included services */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-stone-200 dark:border-stone-700/60 text-[10px]">
                  {pkg.includesLocker && (
                    <span className="px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200">
                      ✓ کمد هوشمند
                    </span>
                  )}
                  {pkg.includesCoach && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      ✓ مربی اختصاصی
                    </span>
                  )}
                  {pkg.includesWorkoutPlan && (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ✓ برنامه تمرینی
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Add/Edit Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 p-6">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-4">
              {editingPackage ? 'ویرایش پکیج و تغییر قیمت' : 'تعریف پکیج عضویت جدید'}
            </h3>

            <form onSubmit={handleSavePackageSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    نام پکیج (فارسی) *
                  </label>
                  <input
                    type="text"
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    placeholder="مثلاً ۳ ماهه عمومی، VIP..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    نام انگلیسی / لاتین
                  </label>
                  <input
                    type="text"
                    value={pkgNameEn}
                    onChange={(e) => setPkgNameEn(e.target.value)}
                    placeholder="e.g. 3 Months Standard"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    شهریه پکیج ({t.currency}) *
                  </label>
                  <input
                    type="number"
                    value={pkgPrice || ''}
                    onChange={(e) => setPkgPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-amber-500/40 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-amber-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    مدت اعتبار (روز)
                  </label>
                  <input
                    type="number"
                    value={pkgDurationDays || ''}
                    onChange={(e) => setPkgDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    تعداد جلسات
                  </label>
                  <input
                    type="number"
                    value={pkgSessionsCount || ''}
                    onChange={(e) => setPkgSessionsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  توضیحات و شرایط پکیج
                </label>
                <input
                  type="text"
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  placeholder="ساعت ورود آزاد، شامل استفاده از سونا و جکوزی..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              {/* Package Included Features */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="font-bold text-stone-800 dark:text-stone-200 mb-1">
                  خدمات پیش‌فرض شامل شده در این پکیج:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgIncludesLocker}
                      onChange={(e) => setPkgIncludesLocker(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>کمد هوشمند رایگان</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgIncludesCoach}
                      onChange={(e) => setPkgIncludesCoach(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>شامل مربی اختصاصی</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgIncludesWorkoutPlan}
                      onChange={(e) => setPkgIncludesWorkoutPlan(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>شامل برنامه تمرین</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkgIsVip}
                      onChange={(e) => setPkgIsVip(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span>پکیج VIP و سالن اختصاصی</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Club Profile Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-amber-500" />
          <span>مشخصات و برندینگ باشگاه</span>
        </h3>

        <form onSubmit={handleSaveInfo} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
              نام مجموعه ورزشی
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                تلفن تماس مدیریت / پذیرش
              </label>
              <input
                type="text"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                واحد پول سیستم
              </label>
              <input
                type="text"
                disabled
                value="تومان (IRR)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-sm font-mono text-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
              آدرس باشگاه (جهت درج در فیش‌های چاپی)
            </label>
            <input
              type="text"
              value={clubAddress}
              onChange={(e) => setClubAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>تنظیمات باشگاه با موفقیت ذخیره شد.</span>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>ذخیره تغییرات</span>
            </button>
          </div>
        </form>
      </div>

      {/* Language & Theme Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-white">
          تنظیمات نمایش و زبان
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-sm font-bold text-stone-900 dark:text-white">زبان نرم‌افزار</div>
                <div className="text-xs text-stone-500">فارسی (راست‌چین) / English</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setLang('fa')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${lang === 'fa' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'}`}
              >
                فارسی
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${lang === 'en' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'}`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-amber-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              <div>
                <div className="text-sm font-bold text-stone-900 dark:text-white">حالت شب / دارک‌مود</div>
                <div className="text-xs text-stone-500">تم تیره و روشن</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${theme === 'light' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'}`}
              >
                روشن
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${theme === 'dark' ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'}`}
              >
                تیره
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore System */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-500" />
          <span>پشتیبان‌گیری و بازیابی پایگاه داده (Backup / Restore)</span>
        </h3>
        <p className="text-xs text-stone-500">
          تمامی داده‌های مربیان، شاگردان، پکیج‌های عضویت، کمدها، دریافتی‌ها و ترددها را در یک فایل JSON امن دانلود یا بازیابی کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={exportAllDataAsJson}
            className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 flex flex-col items-center justify-center text-center gap-2 transition-all"
          >
            <Download className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-bold text-stone-900 dark:text-white">دانلود نسخه پشتیبان (JSON)</span>
            <span className="text-[10px] text-stone-500">ذخیره تمام اطلاعات روی هارد</span>
          </button>

          <label className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 hover:bg-stone-100 dark:hover:bg-stone-800 flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer">
            <Upload className="h-5 w-5 text-emerald-500" />
            <span className="text-xs font-bold text-stone-900 dark:text-white">بازیابی فایل پشتیبان</span>
            <span className="text-[10px] text-stone-500">بارگذاری فایل JSON قبلی</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm('آیا مایلید تمام داده‌ها به حالت نمونه اولیه بازگردانی شوند؟')) {
                resetToInitialData();
                alert('داده‌ها به حالت نمونه پیش‌فرض باشگاه بازنشانی شدند.');
              }
            }}
            className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 flex flex-col items-center justify-center text-center gap-2 transition-all"
          >
            <RotateCcw className="h-5 w-5 text-rose-600" />
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">بازنشانی به داده‌های نمونه</span>
            <span className="text-[10px] text-rose-500">ریست به دیتابیس تست اولیه</span>
          </button>
        </div>
      </div>

    </div>
  );
};
