import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Moon, 
  Sun, 
  Building2, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Palette, 
  KeyRound, 
  PlayCircle, 
  Tag, 
  ArrowRightLeft,
  Shield,
  Check,
  Archive,
  ArchiveRestore,
  AlertTriangle,
  Info,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme, useSettings, useLockers } from '../../stores';
import { MembershipPackage, CustomField, CustomFieldType } from '../../types';
import { ThemeEngineService } from '../../services/themeEngine';
import { InstallationWizard } from '../Setup/InstallationWizard';
import { MigrationCenter } from '../Migration/MigrationCenter';
import { LocalDatabase } from '../../services/database/localDatabase';
import { StoragePathService } from '../../services/database/storagePathService';

export const SettingsView: React.FC = () => {
  const { 
    resetToEmptyProduction,
    exportAllDataAsJson, 
    importDataFromJson, 
    formatMoney,
  } = useApp();

  const {
    activeThemeKey,
    setActiveThemeKey,
  } = useTheme();

  const {
    organizationInfo,
    updateOrganizationInfo,
    customFields,
    saveCustomField,
    deleteCustomField,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    packages,
    addPackage,
    updatePackage,
    deletePackage,
    archivePackage,
    reactivatePackage,
    checkPackageUsage,
  } = useSettings();

  const {
    lockers: smartLockers,
    setLockerCount,
  } = useLockers();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'theme' | 'org' | 'packages' | 'lockers' | 'custom_fields' | 'migration' | 'backup'>('theme');

  // Package Filter State
  const [packageFilter, setPackageFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [blockedDeleteInfo, setBlockedDeleteInfo] = useState<{ pkg: MembershipPackage; reason: string } | null>(null);

  // Org State
  const [gymName, setGymName] = useState(organizationInfo.name || '');
  const [managerName, setManagerName] = useState(organizationInfo.managerName || '');
  const [managerMobile, setManagerMobile] = useState(organizationInfo.managerMobile || '');
  const [phone, setPhone] = useState(organizationInfo.phone || '');
  const [city, setCity] = useState(organizationInfo.city || '');
  const [address, setAddress] = useState(organizationInfo.address || '');
  const [memberNumberLabel, setMemberNumberLabel] = useState(organizationInfo.memberNumberLabel || 'شماره عضویت');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize local form inputs whenever organizationInfo in store is updated
  useEffect(() => {
    setGymName(organizationInfo.name || '');
    setManagerName(organizationInfo.managerName || '');
    setManagerMobile(organizationInfo.managerMobile || '');
    setPhone(organizationInfo.phone || '');
    setCity(organizationInfo.city || '');
    setAddress(organizationInfo.address || '');
    setMemberNumberLabel(organizationInfo.memberNumberLabel || 'شماره عضویت');
  }, [organizationInfo]);

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
  const [pkgIsActive, setPkgIsActive] = useState(true);

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
    setPkgIsActive(true);
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
    setPkgIsActive(pkg.isActive !== false && !pkg.isArchived);
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
      isActive: pkgIsActive,
      isArchived: !pkgIsActive,
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
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (text) {
          try {
            const res = await importDataFromJson(text);
            const isOk = typeof res === 'object' ? res.success : Boolean(res);
            if (isOk) {
              const counts = typeof res === 'object' ? res.counts : null;
              if (counts) {
                alert(
                  `اطلاعات پشتیبان با موفقیت بازیابی شد.\n\n` +
                  `📊 آمار داده‌های بازیابی‌شده:\n` +
                  `• اعضا: ${counts.members}\n` +
                  `• دوره‌های عضویت: ${counts.memberships}\n` +
                  `• بسته‌ها و تعرفه‌ها: ${counts.packages}\n` +
                  `• صورت‌حساب‌های مالی: ${counts.charges}\n` +
                  `• پرداخت‌ها: ${counts.payments}\n` +
                  `• هزینه‌ها: ${counts.expenses}\n` +
                  `• ترددها: ${counts.attendance}\n` +
                  `• کمدها: ${counts.lockers}\n` +
                  `• مربیان: ${counts.coaches}\n` +
                  `• لاگ‌های سیستمی: ${counts.auditLogs}`
                );
              } else {
                alert('اطلاعات پشتیبان با موفقیت بازیابی شد و تمامی داده‌های سامانه به‌روز شدند.');
              }
            } else {
              alert('فرمت فایل پشتیبان نامعتبر است یا ساختار داده همخوانی ندارد.');
            }
          } catch (err) {
            alert(`خطا در بازیابی اطلاعات: ${(err as Error).message}`);
          }
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const allThemes = ThemeEngineService.getAllThemes();
  const darkThemes = allThemes.filter(t => t.category === 'dark');
  const lightThemes = allThemes.filter(t => t.category === 'light');
  const specialThemes = allThemes.filter(t => t.category === 'special');

  return (
    <div className="space-y-6">
      {/* Wizard Modal */}
      {showWizardModal && (
        <InstallationWizard onClose={() => setShowWizardModal(false)} isInitialSetup={false} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-regular border border-[var(--gym-border)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gym-brand)] to-[var(--gym-accent)] flex items-center justify-center text-white shadow-lg">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
              تنظیمات پیشرفته و سفارشی‌سازی
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] font-semibold border border-[var(--gym-border)]">Gym OS V2.4</span>
            </h1>
            <p className="text-sm text-[var(--gym-text-muted)] mt-1">
              موتور تم‌های ۱۵ گانه، مشخصات برندینگ، کمدهای رله، فیلدهای سفارشی و بسته‌های عضویت
            </p>
          </div>
        </div>

        {/* Sandbox & Setup Wizard Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {isDemoMode ? (
            <button
              onClick={exitDemoMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>خروج از محیط دمو (Sandbox)</span>
            </button>
          ) : (
            <button
              onClick={enterDemoMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass-subtle hover:border-[var(--gym-border-strong)] text-amber-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ورود به محیط دمو</span>
            </button>
          )}

          <button
            onClick={() => setShowWizardModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gym-brand-soft)] hover:bg-[var(--gym-brand-soft)] text-[var(--gym-brand)] border border-[var(--gym-border-strong)] text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>اجرای مجدد ویزارد راه‌اندازی</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl glass-subtle border border-[var(--gym-border)]">
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--gym-brand)] text-white shadow-md'
                  : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] hover:bg-[var(--gym-surface-glass)]'
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
        <div className="space-y-6">
          {/* Dark Themes */}
          <div className="p-6 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">تم‌های استودیویی تیره (Dark Themes)</h3>
              </div>
              <span className="text-xs text-[var(--gym-text-muted)]">مخصوص محیط‌های پذیرش و مانیتورهای شبانه</span>
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
                        ? 'border-[var(--gym-brand)] ring-2 ring-[var(--gym-brand-soft)] bg-[var(--gym-surface-glass-strong)] shadow-lg'
                        : 'border-[var(--gym-border)] glass-subtle hover:border-[var(--gym-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--gym-text,#fff)]">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--gym-brand)] text-white flex items-center justify-center text-xs font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--gym-text-muted)] font-mono mt-0.5 block">{tItem.name}</span>
                    </div>

                    {/* Color Swatch Preview */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--gym-border)]">
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.bg }} title="پس‌زمینه اصلی"></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.surface }} title="سطح کارت‌ها"></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }} title="رنگ شاخص"></div>
                      <span className="text-[10px] text-[var(--gym-text-muted)] font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Light Themes */}
          <div className="p-6 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">تم‌های استاندارد روشن (Light Themes)</h3>
              </div>
              <span className="text-xs text-[var(--gym-text-muted)]">وضوح بالا و کنتراست حداکثری برای فضاهای پرنور</span>
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
                        ? 'border-[var(--gym-brand)] ring-2 ring-[var(--gym-brand-soft)] bg-[var(--gym-surface-glass-strong)] shadow-lg'
                        : 'border-[var(--gym-border)] glass-subtle hover:border-[var(--gym-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--gym-text,#fff)]">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--gym-brand)] text-white flex items-center justify-center text-xs font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--gym-text-muted)] font-mono mt-0.5 block">{tItem.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--gym-border)]">
                      <div className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: tItem.colors.bg }} title="پس‌زمینه اصلی"></div>
                      <div className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: tItem.colors.surface }} title="سطح کارت‌ها"></div>
                      <div className="w-5 h-5 rounded-md border border-black/10" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }} title="رنگ شاخص"></div>
                      <span className="text-[10px] text-[var(--gym-text-muted)] font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cyber & Special Themes */}
          <div className="p-6 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">تم‌های نئونی و ویژه (Special / Cyberpunk)</h3>
              </div>
              <span className="text-xs text-[var(--gym-text-muted)]">جلوه‌های نورانی و های‌تک</span>
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
                        ? 'border-[var(--gym-brand)] ring-2 ring-[var(--gym-brand-soft)] bg-[var(--gym-surface-glass-strong)] shadow-lg'
                        : 'border-[var(--gym-border)] glass-subtle hover:border-[var(--gym-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[var(--gym-text,#fff)]">{tItem.nameFa}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[var(--gym-brand)] text-white flex items-center justify-center text-xs font-bold">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--gym-text-muted)] font-mono mt-0.5 block">{tItem.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--gym-border)]">
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.bg }}></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.surface }}></div>
                      <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: tItem.colors.brand || tItem.colors.accent }}></div>
                      <span className="text-[10px] text-[var(--gym-text-muted)] font-mono mr-auto">{tItem.colors.brand || tItem.colors.accent}</span>
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
        <div className="p-8 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--gym-brand)]" />
                مشخصات و اطلاعات سازمانی باشگاه
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)] mt-1">این اطلاعات روی سربرگ فاکتورها، رسیدهای تردد و پیامک‌ها درج می‌شود.</p>
            </div>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">نام مجموعه ورزشی / باشگاه</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">نام و نام خانوادگی مدیر ارشد</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">شماره همراه مدیریت</label>
                <input
                  type="text"
                  value={managerMobile}
                  onChange={(e) => setManagerMobile(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm text-left font-mono focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">تلفن ثابت پذیرش</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm text-left font-mono focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">شهر</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">عنوان شناسه ورزشکار در سیستم</label>
                <input
                  type="text"
                  value={memberNumberLabel}
                  onChange={(e) => setMemberNumberLabel(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[var(--gym-text)] mb-2">آدرس دقیق مجموعه</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] text-sm focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>اطلاعات باشگاه با موفقیت ذخیره شد.</span>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--gym-brand)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl glass-regular border border-[var(--gym-border)]">
            <div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <Package className="w-5 h-5 text-[var(--gym-brand)]" />
                تعریف، ویرایش و چرخه عمر پکیج‌ها (Lifecycle & Pricing)
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)] mt-1">تعیین شهریه، تعداد جلسات، مدت اعتبار، بایگانی یا فعال‌سازی دوره‌های عضویت</p>
            </div>

            <button
              onClick={openAddPackageModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gym-brand)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن پکیج جدید</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'همه پکیج‌ها', count: packages.length },
              { id: 'active', label: 'پکیج‌های فعال', count: packages.filter(p => p.isActive !== false && !p.isArchived).length },
              { id: 'archived', label: 'بایگانی‌شده (تاریخچه)', count: packages.filter(p => p.isArchived || p.isActive === false).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPackageFilter(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  packageFilter === tab.id
                    ? 'bg-[var(--gym-brand)] text-white shadow-sm'
                    : 'glass-subtle border border-[var(--gym-border)] text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${packageFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--gym-surface-glass-strong)] text-[var(--gym-text-muted)]'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages
              .filter(pkg => {
                const isArchived = pkg.isArchived || pkg.isActive === false;
                if (packageFilter === 'active') return !isArchived;
                if (packageFilter === 'archived') return isArchived;
                return true;
              })
              .map((pkg) => {
                const isArchived = pkg.isArchived || pkg.isActive === false;
                return (
                  <div
                    key={pkg.id}
                    className={`p-5 rounded-2xl glass-regular border transition-all flex flex-col justify-between space-y-4 ${
                      isArchived 
                        ? 'border-amber-500/30 opacity-80 bg-amber-500/5' 
                        : 'border-[var(--gym-border)] hover:border-[var(--gym-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[var(--gym-text,#fff)]">{pkg.name}</h4>
                            {isArchived ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                                بایگانی‌شده
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                                فعال
                              </span>
                            )}
                          </div>
                          {pkg.nameEn && <span className="text-[11px] text-[var(--gym-text-muted)] font-mono">{pkg.nameEn}</span>}
                        </div>
                        <span className="text-sm font-extrabold text-[var(--gym-brand,#10b981)] font-mono shrink-0">
                          {formatMoney(pkg.price)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-[var(--gym-text)]">
                        <div className="p-2 rounded-lg glass-subtle border border-[var(--gym-border)]">
                          <span className="text-[10px] text-[var(--gym-text-muted)] block">مدت روز</span>
                          <span className="font-bold">{pkg.durationDays || (pkg.durationMonths ? pkg.durationMonths * 30 : 30)} روز</span>
                        </div>
                        <div className="p-2 rounded-lg glass-subtle border border-[var(--gym-border)]">
                          <span className="text-[10px] text-[var(--gym-text-muted)] block">تعداد جلسات</span>
                          <span className="font-bold">{pkg.sessionsCount || 24} جلسه</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {pkg.includesLocker && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            کمد اختصاصی
                          </span>
                        )}
                        {pkg.includesCoach && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            مربی خصوصی
                          </span>
                        )}
                        {pkg.isVip && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            VIP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--gym-border)]">
                      <div>
                        {isArchived ? (
                          <button
                            onClick={() => reactivatePackage(pkg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer"
                            title="فعال‌سازی مجدد برای ثبت‌نام‌های جدید"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" />
                            <span>فعال‌سازی</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => archivePackage(pkg.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                            title="بایگانی کردن (عدم نمایش در ثبت‌نام جدید، حفظ سوابق قبلی)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>بایگانی</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditPackageModal(pkg)}
                          className="p-1.5 rounded-lg glass-subtle hover:border-[var(--gym-border-strong)] text-[var(--gym-text)] transition-all cursor-pointer"
                          title="ویرایش پکیج"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const res = deletePackage(pkg.id);
                            if (!res.success) {
                              setBlockedDeleteInfo({
                                pkg,
                                reason: res.reason || 'این پکیج در عضویت‌ها یا تراکنش‌های مالی استفاده شده است.'
                              });
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                          title="حذف پکیج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: SMART LOCKER SIZING & RELAYS                  */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'lockers' && (
        <div className="p-8 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                تنظیم پویای ظرفیت کمدهای هوشمند
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)] mt-1">
                تغییر تعداد کمدهای رله از ۱۰ تا ۱۰۰۰ کمد به صورت خودکار و بدون از دست رفتن سابقه کمدهای تحویل شده
              </p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono text-sm font-bold">
              تعداد فعلی: {smartLockers.length} کمد
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-subtle border border-[var(--gym-border)] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--gym-text)] block mb-1">تعداد کل کمدهای سالن:</label>
                <span className="text-[11px] text-[var(--gym-text-muted)]">شماره ۱ تا {newLockerCount} به کنترلرهای رله متصل می‌شوند.</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={newLockerCount}
                  onChange={(e) => setNewLockerCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-28 px-3 py-2 glass-subtle border border-cyan-500/50 rounded-xl text-[var(--gym-text)] font-mono text-center text-lg font-bold focus:outline-none"
                />
                <button
                  onClick={handleApplyLockerResize}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  اعمال تغییرات ظرفیت
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs text-[var(--gym-text-muted)] self-center">تنظیم سریع:</span>
              {[50, 80, 100, 120, 150, 200, 250, 300].map(cnt => (
                <button
                  key={cnt}
                  onClick={() => setNewLockerCount(cnt)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    newLockerCount === cnt 
                      ? 'bg-cyan-500 text-slate-950 font-bold' 
                      : 'glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] hover:border-[var(--gym-border-strong)]'
                  }`}
                >
                  {cnt} کمد
                </button>
              ))}
            </div>

            {lockerResizeMessage && (
              <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2">
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl glass-regular border border-[var(--gym-border)]">
            <div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <Tag className="w-5 h-5 text-[var(--gym-brand)]" />
                مدیریت فیلدهای اختصاصی پرونده ورزشکاران
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)] mt-1">افزودن فیلدهای دلخواه به فرم ثبت‌نام اعضا و اکسل واردسازی</p>
            </div>

            <button
              onClick={() => setIsFieldModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gym-brand)] hover:opacity-90 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن فیلد سفارشی</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customFields.map((field) => (
              <div
                key={field.id}
                className="p-5 rounded-2xl glass-regular border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold text-[var(--gym-text,#fff)]">{field.label}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] font-mono">
                      {field.type}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--gym-text-muted)] font-mono mt-1 block">کلید: {field.key}</span>
                  {field.options && field.options.length > 0 && (
                    <div className="text-[11px] text-[var(--gym-text-muted)] mt-2">
                      گزینه‌ها: {field.options.join(' • ')}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--gym-border)]">
                  <span className="text-[10px] text-[var(--gym-text-muted)]">
                    {field.required ? 'الزامی' : 'اختیاری'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`آیا از حذف فیلد «${field.label}» اطمینان دارید؟`)) {
                        deleteCustomField(field.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-all cursor-pointer"
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
        <div className="p-8 rounded-3xl glass-regular border border-[var(--gym-border)] space-y-6">
          <div>
            <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              پشتیبان‌گیری کامل و بازنشانی دیتابیس (SQLite Production)
            </h3>
            <p className="text-xs text-[var(--gym-text-muted)] mt-1">پشتیبان‌گیری مطمئن، دانلود دیتابیس باینری SQLite و بازیابی اطلاعات</p>
          </div>

          {/* SQLite Runtime Diagnostic Box */}
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-[var(--gym-border)] space-y-2 text-xs">
            <div className="flex items-center justify-between text-[var(--gym-text)]">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Database className="w-4 h-4" />
                <span>موتور پایگاه‌داده فعال: Real SQLite 3 (ACID Relational)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-mono text-[11px] border border-emerald-500/30">
                Schema v3
              </span>
            </div>
            <div className="text-[11px] text-[var(--gym-text-muted)] flex flex-col gap-1 font-mono">
              <div>مسیر داده‌های محلی: {StoragePathService.getStorageSummary().dbPath}</div>
              <div>حالت اجرا: {StoragePathService.getStorageSummary().runtime}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <button
              onClick={() => {
                const binary = LocalDatabase.exportBinaryDatabase();
                if (binary) {
                  const blob = new Blob([binary], { type: 'application/x-sqlite3' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `gym_os_production_${new Date().toISOString().slice(0, 10)}.db`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else {
                  exportAllDataAsJson();
                }
              }}
              className="p-5 rounded-2xl glass-subtle border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] flex flex-col items-center text-center gap-2 transition-all group cursor-pointer"
            >
              <Database className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-[var(--gym-text,#fff)]">دانلود دیتابیس SQLite (.db)</span>
              <span className="text-[11px] text-[var(--gym-text-muted)]">فایل استاندارد باینری SQLite</span>
            </button>

            <button
              onClick={exportAllDataAsJson}
              className="p-5 rounded-2xl glass-subtle border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] flex flex-col items-center text-center gap-2 transition-all group cursor-pointer"
            >
              <Download className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-[var(--gym-text,#fff)]">دانلود بک‌آپ (JSON)</span>
              <span className="text-[11px] text-[var(--gym-text-muted)]">خروجی ساخت‌یافته JSON</span>
            </button>

            <label className="p-5 rounded-2xl glass-subtle border border-[var(--gym-border)] hover:border-[var(--gym-border-strong)] flex flex-col items-center text-center gap-2 transition-all cursor-pointer group">
              <Upload className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-[var(--gym-text,#fff)]">بازیابی فایل پشتیبان</span>
              <span className="text-[11px] text-[var(--gym-text-muted)]">بارگذاری فایل JSON بک‌آپ</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={() => {
                if (confirm('آیا از ریست کامل و اجرای دوباره ویزارد راه‌اندازی اطمینان دارید؟ تمامی داده‌های محلی پاکسازی می‌شوند.')) {
                  resetToEmptyProduction();
                }
              }}
              className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 flex flex-col items-center text-center gap-2 transition-all group cursor-pointer"
            >
              <RotateCcw className="w-6 h-6 text-red-400 group-hover:scale-110 transition-all" />
              <span className="text-xs font-bold text-red-400">پاکسازی و راه‌اندازی از صفر</span>
              <span className="text-[11px] text-red-400/80">ریست کامل به حالت نصب جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Field Modal */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-regular border border-[var(--gym-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">تعریف فیلد سفارشی جدید</h3>
            <form onSubmit={handleSaveCustomFieldSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--gym-text)] font-semibold mb-1">عنوان فارسی فیلد *</label>
                <input
                  type="text"
                  required
                  value={cfLabel}
                  onChange={(e) => setCfLabel(e.target.value)}
                  placeholder="مثال: گروه خونی / کد معرف / رشته ورزشی"
                  className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div>
                <label className="block text-[var(--gym-text)] font-semibold mb-1">نوع فیلد</label>
                <select
                  value={cfType}
                  onChange={(e) => setCfType(e.target.value as CustomFieldType)}
                  className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] focus:outline-none focus:border-[var(--gym-brand)]"
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
                  <label className="block text-[var(--gym-text)] font-semibold mb-1">گزینه‌ها (با کاما یا خط جدید جدا کنید)</label>
                  <textarea
                    value={cfOptions}
                    onChange={(e) => setCfOptions(e.target.value)}
                    placeholder="گزینه ۱, گزینه ۲, گزینه ۳"
                    className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] focus:outline-none focus:border-[var(--gym-brand)] h-20"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cfReq"
                  checked={cfRequired}
                  onChange={(e) => setCfRequired(e.target.checked)}
                  className="rounded border-[var(--gym-border)] text-[var(--gym-brand)]"
                />
                <label htmlFor="cfReq" className="text-[var(--gym-text)] cursor-pointer">پر کردن این فیلد در ثبت‌نام الزامی است</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-subtle text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--gym-brand)] text-white font-bold cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-regular border border-[var(--gym-border-strong)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
              {editingPackage ? 'ویرایش پکیج عضویت' : 'افزودن پکیج عضویت جدید'}
            </h3>
            <form onSubmit={handleSavePackageSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--gym-text)] font-semibold mb-1">نام پکیج *</label>
                <input
                  type="text"
                  required
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  placeholder="مثال: ۳ ماهه عمومی (۳۶ جلسه)"
                  className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--gym-text)] font-semibold mb-1">شهریه (تومان) *</label>
                  <input
                    type="number"
                    required
                    step={50000}
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] font-mono focus:outline-none focus:border-[var(--gym-brand)]"
                  />
                </div>
                <div>
                  <label className="block text-[var(--gym-text)] font-semibold mb-1">مدت روز *</label>
                  <input
                    type="number"
                    required
                    value={pkgDurationDays}
                    onChange={(e) => setPkgDurationDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] font-mono focus:outline-none focus:border-[var(--gym-brand)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--gym-text)] font-semibold mb-1">تعداد جلسات مجاز *</label>
                <input
                  type="number"
                  required
                  value={pkgSessionsCount}
                  onChange={(e) => setPkgSessionsCount(parseInt(e.target.value) || 24)}
                  className="w-full px-3 py-2 glass-subtle border border-[var(--gym-border)] rounded-xl text-[var(--gym-text)] font-mono focus:outline-none focus:border-[var(--gym-brand)]"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIncludesLocker}
                    onChange={(e) => setPkgIncludesLocker(e.target.checked)}
                    className="rounded border-[var(--gym-border)] text-[var(--gym-brand)]"
                  />
                  <span className="text-[var(--gym-text)]">شامل کمد رله</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsVip}
                    onChange={(e) => setPkgIsVip(e.target.checked)}
                    className="rounded border-[var(--gym-border)] text-[var(--gym-brand)]"
                  />
                  <span className="text-[var(--gym-text)]">پکیج VIP</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkgIsActive}
                    onChange={(e) => setPkgIsActive(e.target.checked)}
                    className="rounded border-[var(--gym-border)] text-[var(--gym-brand)]"
                  />
                  <span className="text-[var(--gym-text)]">وضعیت فعال (قابل انتخاب برای ثبت‌نام)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-subtle text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--gym-brand)] text-white font-bold cursor-pointer"
                >
                  ذخیره پکیج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blocked Package Deletion Dialog (Immutability & Safety) */}
      {blockedDeleteInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md glass-regular border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">حفاظت از صحت تاریخچه مالی</h3>
                <span className="text-xs text-amber-300/90 font-medium">عدم امکان حذف فیزیکی پکیج دارای سابقه</span>
              </div>
            </div>

            <p className="text-xs text-[var(--gym-text-muted)] leading-relaxed">
              {blockedDeleteInfo.reason}
            </p>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--gym-text)] space-y-1">
              <div className="font-semibold text-amber-300">راهکار استاندارد:</div>
              <p className="text-[11px] text-[var(--gym-text-muted)]">
                با «بایگانی» کردن، این پکیج دیگر در فرم‌های ثبت‌نام یا تمدید اعضا نمایش داده نمی‌شود؛ اما تمامی گزارش‌های حسابداری و پرونده‌های گذشته معتبر باقی می‌مانند.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockedDeleteInfo(null)}
                className="px-4 py-2 rounded-xl glass-subtle text-[var(--gym-text-muted)] hover:text-[var(--gym-text)] text-xs cursor-pointer"
              >
                بستن
              </button>
              <button
                type="button"
                onClick={() => {
                  archivePackage(blockedDeleteInfo.pkg.id);
                  setBlockedDeleteInfo(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Archive className="w-4 h-4" />
                <span>بایگانی این پکیج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-run Setup Wizard Modal */}
      {showWizardModal && (
        <InstallationWizard
          isInitialSetup={false}
          onClose={() => setShowWizardModal(false)}
        />
      )}
    </div>
  );
};
