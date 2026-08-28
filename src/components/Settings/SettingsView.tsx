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
  Check,
  Palette,
  KeyRound,
  Sliders,
  PlayCircle,
  Clock,
  HelpCircle,
  Tag,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MembershipPackage, PackageType, CustomField, CustomFieldType, ThemeKey } from '../../types';
import { ThemeEngineService } from '../../services/themeEngine';
import { InstallationWizard } from '../Setup/InstallationWizard';
import { MigrationCenter } from '../Migration/MigrationCenter';

export const SettingsView: React.FC = () => {
  const { 
    lang, 
    setLang, 
    theme, 
    setTheme, 
    activeThemeKey,
    setActiveThemeKey,
    organizationInfo,
    updateOrganizationInfo,
    customFields,
    saveCustomField,
    deleteCustomField,
    smartLockers,
    setLockerCount,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    resetToEmptyProduction,
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

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'theme' | 'org' | 'packages' | 'lockers' | 'custom_fields' | 'migration' | 'backup'>('theme');

  // Org State
  const [gymName, setGymName] = useState(organizationInfo.name);
  const [managerName, setManagerName] = useState(organizationInfo.managerName);
  const [managerMobile, setManagerMobile] = useState(organizationInfo.managerMobile);
  const [phone, setPhone] = useState(organizationInfo.phone);
  const [city, setCity] = useState(organizationInfo.city);
  const [address, setAddress] = useState(organizationInfo.address);
  const [memberNumberLabel, setMemberNumberLabel] = useState(organizationInfo.memberNumberLabel);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Lockers Resize State
  const [newLockerCount, setNewLockerCount] = useState<number>(smartLockers.length || 100);
  const [lockerResizeMessage, setLockerResizeMessage] = useState<string | null>(null);

  // Custom Field Form State
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [cfLabel, setCfLabel] = useState('');
  const [cfKey, setCfKey] = useState('');
  const [cfType, setCfType] = useState<CustomFieldType>('text');
  const [cfOptions, setCfOptions] = useState('');
  const [cfRequired, setCfRequired] = useState(false);

  // Package Modal State
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [pkgName, setPkgName] = useState('');
  const [pkgNameEn, setPkgNameEn] = useState('');
  const [pkgDurationDays, setPkgDurationDays] = useState<number>(30);
  const [pkgSessionsCount, setPkgSessionsCount] = useState<number>(24);
  const [pkgPrice, setPkgPrice] = useState<number>(2800000);
  const [pkgDescription, setPkgDescription] = useState('');
  const [pkgIncludesLocker, setPkgIncludesLocker] = useState(true);
  const [pkgIncludesCoach, setPkgIncludesCoach] = useState(false);
  const [pkgIncludesWorkoutPlan, setPkgIncludesWorkoutPlan] = useState(false);
  const [pkgIsVip, setPkgIsVip] = useState(false);

  // Re-run setup wizard modal
  const [showWizardModal, setShowWizardModal] = useState(false);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganizationInfo({
      name: gymName,
      managerName,
      managerMobile,
      phone,
      city,
      address,
      memberNumberLabel,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleApplyLockerResize = () => {
    const res = setLockerCount(newLockerCount);
    if (res.warning) {
      setLockerResizeMessage(res.warning);
    } else {
      setLockerResizeMessage(`تعداد کمدها با موفقیت به ${newLockerCount} عدد به‌روزرسانی شد.`);
    }
    setTimeout(() => setLockerResizeMessage(null), 5000);
  };

  const handleSaveCustomFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfLabel.trim()) return;

    const generatedKey = cfKey.trim() || `field_${Date.now()}`;
    const optionsArray = cfType === 'select' 
      ? cfOptions.split(/[\n,]+/).map(o => o.trim()).filter(Boolean)
      : undefined;

    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      key: generatedKey,
      label: cfLabel.trim(),
      type: cfType,
      options: optionsArray,
      required: cfRequired,
      visible: true,
      category: 'general',
    };

    saveCustomField(newField);
    setIsFieldModalOpen(false);
    setCfLabel('');
    setCfKey('');
    setCfOptions('');
    setCfRequired(false);
  };

  const openAddPackageModal = () => {
    setEditingPackage(null);
    setPkgName('');
    setPkgNameEn('');
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
    setPkgDurationDays(pkg.durationDays || 30);
    setPkgSessionsCount(pkg.sessionsCount || 24);
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
    if (!pkgName.trim()) return;

    const pkgData = {
      name: pkgName.trim(),
      nameEn: pkgNameEn.trim(),
      price: pkgPrice,
      durationDays: pkgDurationDays,
      sessionsCount: pkgSessionsCount,
      description: pkgDescription.trim(),
      includesLocker: pkgIncludesLocker,
      includesCoach: pkgIncludesCoach,
      includesWorkoutPlan: pkgIncludesWorkoutPlan,
      isVip: pkgIsVip,
    };

    if (editingPackage) {
      updatePackage(editingPackage.id, pkgData);
    } else {
      addPackage(pkgData);
    }
    setIsPackageModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const success = importDataFromJson(text);
          if (success) {
            alert('اطلاعات با موفقیت بازیابی شد.');
          } else {
            alert('فرمت فایل نامعتبر است.');
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const allThemes = ThemeEngineService.getAllThemes();
  const darkThemes = allThemes.filter(t => t.category === 'dark');
  const lightThemes = allThemes.filter(t => t.category === 'light');
  const specialThemes = allThemes.filter(t => t.category === 'special');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Wizard Modal */}
      {showWizardModal && (
        <InstallationWizard onClose={() => setShowWizardModal(false)} isInitialSetup={false} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              تنظیمات پیشرفته و سفارشی‌سازی
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">Gym OS V2.4</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              موتور تم‌های ۱۵ گانه، مشخصات برندینگ، کمدهای رله، فیلدهای سفارشی و بسته‌های عضویت
            </p>
          </div>
        </div>

        {/* Sandbox & Setup Wizard Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {isDemoMode ? (
            <button
              onClick={exitDemoMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>خروج از محیط دمو (Sandbox)</span>
            </button>
          ) : (
            <button
              onClick={enterDemoMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ورود به محیط دمو</span>
            </button>
          )}

          <button
            onClick={() => setShowWizardModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>اجرای مجدد ویزارد راه‌اندازی</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        {[
          { id: 'theme', label: 'موتور تم‌های ۱۵ گانه', icon: Palette },
          { id: 'org', label: 'مشخصات و برندینگ', icon: Building2 },
          { id: 'packages', label: 'پکیج‌ها و تعرفه‌ها', icon: Package },
          { id: 'lockers', label: 'ظرفیت کمدهای هوشمند', icon: KeyRound },
          { id: 'custom_fields', label: 'فیلدهای اختصاصی پرونده', icon: Tag },
          { id: 'migration', label: 'انتقال اطلاعات (Migration)', icon: ArrowRightLeft },
          { id: 'backup', label: 'پشتیبان و ریست سیستم', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: THEME ENGINE STUDIO                           */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'theme' && (
        <div className="space-y-8">
          {/* Dark Themes */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">تم‌های استودیویی تیره (Dark Themes)</h3>
              </div>
              <span className="text-xs text-slate-500">مخصوص محیط‌های پذیرش و مانیتورهای شبانه</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {darkThemes.map((tItem) => {
                const isSelected = activeThemeKey === tItem.id;
                return (
                  <div
                    key={tItem.id}
                    onClick={() => setActiveThemeKey(tItem.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-800/90 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{tItem.name}</span>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{tItem.nameFa}</p>
                    </div>

                    {/* Color Swatch Preview */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.bg }} title="پس‌زمینه اصلی"></div>
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.surface }} title="سطح کارت‌ها"></div>
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }} title="رنگ شاخص"></div>
                      <span className="text-[10px] text-slate-500 font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Light Themes */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">تم‌های استاندارد روشن (Light Themes)</h3>
              </div>
              <span className="text-xs text-slate-500">وضوح بالا و کنتراست حداکثری برای فضاهای پرنور</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lightThemes.map((tItem) => {
                const isSelected = activeThemeKey === tItem.id;
                return (
                  <div
                    key={tItem.id}
                    onClick={() => setActiveThemeKey(tItem.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-500/30 bg-slate-800/90 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{tItem.name}</span>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{tItem.nameFa}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.bg }} title="پس‌زمینه اصلی"></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.surface }} title="سطح کارت‌ها"></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }} title="رنگ شاخص"></div>
                      <span className="text-[10px] text-slate-500 font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cyber & Special Themes */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-bold text-white">تم‌های نئونی و ویژه (Special / Cyberpunk)</h3>
              </div>
              <span className="text-xs text-slate-500">جلوه‌های نورانی و های‌تک</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialThemes.map((tItem) => {
                const isSelected = activeThemeKey === tItem.id;
                return (
                  <div
                    key={tItem.id}
                    onClick={() => setActiveThemeKey(tItem.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                      isSelected
                        ? 'border-fuchsia-500 ring-2 ring-fuchsia-500/30 bg-slate-800/90 shadow-lg'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-fuchsia-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{tItem.name}</span>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{tItem.nameFa}</p>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.bg }}></div>
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.surface }}></div>
                      <div className="w-5 h-5 rounded-md border border-white/10" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }}></div>
                      <span className="text-[10px] text-slate-500 font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: ORGANIZATION INFO & BRANDING                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'org' && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                مشخصات و اطلاعات سازمانی باشگاه
              </h3>
              <p className="text-xs text-slate-400 mt-1">این اطلاعات روی سربرگ فاکتورها، رسیدهای تردد و پیامک‌ها درج می‌شود.</p>
            </div>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">نام مجموعه ورزشی / باشگاه</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">نام و نام خانوادگی مدیر ارشد</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">شماره همراه مدیریت</label>
                <input
                  type="text"
                  value={managerMobile}
                  onChange={(e) => setManagerMobile(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm text-left font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">تلفن ثابت پذیرش</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm text-left font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">شهر</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">عنوان شناسه ورزشکار در سیستم</label>
                <input
                  type="text"
                  value={memberNumberLabel}
                  onChange={(e) => setMemberNumberLabel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2">آدرس دقیق مجموعه</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>اطلاعات باشگاه با موفقیت ذخیره شد.</span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات مشخصات باشگاه</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: PACKAGES & PRICING BUILDER                    */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                تعریف و ویرایش دوره‌ها و پکیج‌های عضویت
              </h3>
              <p className="text-xs text-slate-400 mt-1">تعیین شهریه، تعداد جلسات، مدت اعتبار و امکانات پکیج‌ها</p>
            </div>

            <button
              onClick={openAddPackageModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن پکیج جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                      {pkg.nameEn && <span className="text-[11px] text-slate-500 font-mono">{pkg.nameEn}</span>}
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400 font-mono">
                      {formatMoney(pkg.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">مدت روز</span>
                      <span className="font-bold">{pkg.durationDays || 30} روز</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/60">
                      <span className="text-[10px] text-slate-500 block">تعداد جلسات</span>
                      <span className="font-bold">{pkg.sessionsCount || 24} جلسه</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {pkg.includesLocker && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        کمد اختصاصی
                      </span>
                    )}
                    {pkg.includesCoach && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        مربی خصوصی
                      </span>
                    )}
                    {pkg.isVip && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        VIP
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => openEditPackageModal(pkg)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف پکیج «${pkg.name}» اطمینان دارید؟`)) {
                        deletePackage(pkg.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: SMART LOCKER SIZING & RELAYS                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'lockers' && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                تنظیم پویای ظرفیت کمدهای هوشمند
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تغییر تعداد کمدهای رله از ۱۰ تا ۱۰۰۰ کمد به صورت خودکار و بدون از دست رفتن سابقه کمدهای تحویل شده
              </p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-sm font-bold">
              تعداد فعلی: {smartLockers.length} کمد
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">تعداد کل کمدهای سالن:</label>
                <span className="text-[11px] text-slate-500">شماره ۱ تا {newLockerCount} به کنترلرهای رله متصل می‌شوند.</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newLockerCount}
                  onChange={(e) => setNewLockerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 px-3 py-2 bg-slate-900 border border-cyan-500/50 rounded-xl text-white font-mono text-center text-lg font-bold focus:outline-none"
                />
                <button
                  onClick={handleApplyLockerResize}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
                >
                  اعمال تغییرات ظرفیت
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-slate-400 self-center">تنظیم سریع:</span>
              {[50, 80, 100, 120, 150, 200, 250, 300].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setNewLockerCount(cnt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    newLockerCount === cnt ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cnt} کمد
                </button>
              ))}
            </div>

            {lockerResizeMessage && (
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{lockerResizeMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 5: CUSTOM FIELDS SYSTEM                          */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'custom_fields' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                مدیریت فیلدهای اختصاصی پرونده ورزشکاران
              </h3>
              <p className="text-xs text-slate-400 mt-1">افزودن فیلدهای دلخواه به فرم ثبت‌نام اعضا و اکسل واردسازی</p>
            </div>

            <button
              onClick={() => setIsFieldModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن فیلد سفارشی</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-white">{field.label}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {field.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">کلید: {field.key}</span>
                  {field.options && field.options.length > 0 && (
                    <div className="text-[11px] text-slate-400 mt-2">
                      گزینه‌ها: {field.options.join(' • ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">
                    {field.required ? 'الزامی' : 'اختیاری'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف فیلد «${field.label}» اطمینان دارید؟`)) {
                        deleteCustomField(field.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 6: MIGRATION CENTER                              */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'migration' && (
        <div className="space-y-6">
          <MigrationCenter />
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 7: BACKUP & SYSTEM RESET                         */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'backup' && (
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              پشتیبان‌گیری کامل و بازنشانی دیتابیس
            </h3>
            <p className="text-xs text-slate-400 mt-1">پشتیبان‌گیری رمزنگاری شده و انتقال دیتابیس کامل به سیستم دیگر</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              onClick={exportAllDataAsJson}
              className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <Download className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-white">دانلود نسخه پشتیبان (JSON)</span>
              <span className="text-[11px] text-slate-400">شامل تمامی اعضا، مالی و کمدها</span>
            </button>

            <label className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:bg-slate-800 flex flex-col items-center text-center gap-2 transition-all cursor-pointer group">
              <Upload className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-white">بازیابی فایل پشتیبان</span>
              <span className="text-[11px] text-slate-400">بارگذاری فایل JSON بک‌آپ قبلی</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('آیا از ریست کامل و اجرای دوباره ویزارد راه‌اندازی اطمینان دارید؟ تمامی داده‌های محلی پاکسازی می‌شوند.')) {
                  resetToEmptyProduction();
                }
              }}
              className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <RotateCcw className="w-6 h-6 text-red-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-red-300">پاکسازی و راه‌اندازی از صفر</span>
              <span className="text-[11px] text-red-400/80">ریست کامل به حالت نصب جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">تعریف فیلد سفارشی جدید</h3>
            <form onSubmit={handleSaveCustomFieldSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان فارسی فیلد *</label>
                <input
                  type="text"
                  required
                  value={cfLabel}
                  onChange={(e) => setCfLabel(e.target.value)}
                  placeholder="مثال: گروه خونی / کد معرف / رشته ورزشی"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">نوع فیلد</label>
                <select
                  value={cfType}
                  onChange={(e) => setCfType(e.target.value as CustomFieldType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="text">متن تک‌خطی (Text)</option>
                  <option value="number">عدد (Number)</option>
                  <option value="select">لیست انتخابی (Dropdown)</option>
                  <option value="boolean">بله / خیر (Checkbox)</option>
                  <option value="date">تاریخ (Date)</option>
                </select>
              </div>

              {cfType === 'select' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">گزینه‌ها (با کاما یا خط جدید جدا کنید)</label>
                  <textarea
                    value={cfOptions}
                    onChange={(e) => setCfOptions(e.target.value)}
                    placeholder="گزینه ۱, گزینه ۲, گزینه ۳"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 h-20"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cfReq"
                  checked={cfRequired}
                  onChange={(e) => setCfRequired(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <label htmlFor="cfReq" className="text-slate-300 cursor-pointer">پر کردن این فیلد در ثبت‌نام الزامی است</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold"
                >
                  ذخیره فیلد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingPackage ? 'ویرایش پکیج عضویت' : 'افزودن پکیج عضویت جدید'}
            </h3>
            <form onSubmit={handleSavePackageSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">نام پکیج *</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="مثال: ۳ ماهه عمومی (۳۶ جلسه)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">شهریه (تومان) *</label>
                  <input
                    type="number"
                    required
                    step={50000}
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">مدت روز *</label>
                  <input
                    type="number"
                    required
                    value={pkgDurationDays}
                    onChange={(e) => setPkgDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">تعداد جلسات مجاز *</label>
                <input
                  type="number"
                  required
                  value={pkgSessionsCount}
                  onChange={(e) => setPkgSessionsCount(parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIncludesLocker}
                    onChange={(e) => setPkgIncludesLocker(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500"
                  />
                  <span className="text-slate-300">شامل کمد رله</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsVip}
                    onChange={(e) => setPkgIsVip(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500"
                  />
                  <span className="text-slate-300">پکیج VIP</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  ذخیره پکیج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
