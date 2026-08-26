import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Pin, 
  PinOff, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  CheckCircle2, 
  Sliders,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavTab, ModuleFeature } from '../../types';

export const FeatureCenterView: React.FC = () => {
  const { 
    moduleFeatures, 
    toggleFeatureEnabled, 
    toggleFeaturePinned, 
    restoreDefaultFeatures, 
    setActiveTab, 
    lang 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', labelFa: 'همه ماژول‌ها', labelEn: 'All Modules' },
    { id: 'core', labelFa: 'ماژول‌های اصلی', labelEn: 'Core' },
    { id: 'access', labelFa: 'سخت‌افزار و تردد', labelEn: 'Access & IoT' },
    { id: 'finance', labelFa: 'مالی و حسابداری', labelEn: 'Finance' },
    { id: 'planning', labelFa: 'برنامه‌ریزی و تمرین', labelEn: 'Planning' },
    { id: 'system', labelFa: 'سامانه و عیب‌یابی', labelEn: 'System & Pilot' },
  ];

  const filteredFeatures = moduleFeatures.filter(f => {
    const matchesSearch = 
      f.labelFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.labelEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.descriptionFa.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const enabledCount = moduleFeatures.filter(f => f.isEnabled).length;
  const pinnedCount = moduleFeatures.filter(f => f.isPinned).length;

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Boxes;
    return <IconComponent className="h-6 w-6 text-amber-500" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sliders className="h-3.5 w-3.5" />
            <span>مرکز ماژول‌ها و سفارشی‌سازی سامانه</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-100">
            مدیریت قابلیت‌ها و شخصی‌سازی نوار منو
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            بخش‌های مورد نیاز باشگاه خود را فعال یا غیرفعال کنید. ماژول‌های غیرفعال از نوار کناری پنهان می‌شوند اما داده‌های آن‌ها محفوظ خواهد ماند.
          </p>
        </div>

        {/* Quick Stats & Reset */}
        <div className="flex items-center gap-4">
          <div className="p-3.5 px-5 rounded-2xl bg-stone-800/80 border border-stone-700 text-center">
            <div className="text-xl font-bold text-amber-400">{enabledCount} / {moduleFeatures.length}</div>
            <div className="text-[11px] text-stone-400">ماژول‌های فعال</div>
          </div>
          <button
            onClick={restoreDefaultFeatures}
            className="px-4 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-bold transition-all border border-stone-700 flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4 text-amber-400" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
            >
              {lang === 'fa' ? cat.labelFa : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder={lang === 'fa' ? 'جستجوی ماژول یا قابلیت...' : 'Search modules...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 rtl:pr-9 rtl:pl-4 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map(feat => {
          const isDashboard = feat.id === 'dashboard';

          return (
            <div
              key={feat.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${feat.isEnabled ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm' : 'bg-stone-50/50 dark:bg-stone-950/40 border-dashed border-stone-300 dark:border-stone-800 opacity-60'}`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20">
                    {renderIcon(feat.iconName)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Pin button */}
                    <button
                      onClick={() => toggleFeaturePinned(feat.id)}
                      title={feat.isPinned ? 'حذف از پین شده‌ها' : 'پین کردن در بالای منو'}
                      className={`p-2 rounded-xl transition-colors ${feat.isPinned ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                    >
                      {feat.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                    </button>
                    {/* Enable toggle */}
                    {!isDashboard && (
                      <button
                        onClick={() => toggleFeatureEnabled(feat.id)}
                        title={feat.isEnabled ? 'غیرفعال کردن ماژول' : 'فعال‌سازی ماژول'}
                        className={`p-2 rounded-xl transition-colors ${feat.isEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}
                      >
                        {feat.isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {lang === 'fa' ? feat.labelFa : feat.labelEn}
                    </h3>
                    {isDashboard && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        همیشه فعال
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed line-clamp-2">
                    {lang === 'fa' ? feat.descriptionFa : feat.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${feat.isEnabled ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-stone-100 dark:bg-stone-800 text-stone-500'}`}>
                  {feat.isEnabled ? 'فعال در سیستم' : 'غیرفعال / پنهان'}
                </span>

                {feat.isEnabled && (
                  <button
                    onClick={() => setActiveTab(feat.id)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>ورود به ماژول</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
