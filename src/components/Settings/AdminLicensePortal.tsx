/**
 * Gym OS - Admin License Management Portal
 * Allows administrators to manually create, inspect, and revoke licenses.
 * Strictly adheres to security rules: never exposes service_role or Ed25519 private keys.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Shield,
  Clock,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Search,
  PlusCircle,
  FileText,
  AlertTriangle,
  Ban,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { licenseService } from '../../services/licenseService';
import { LicenseRecord, LicenseType } from '../../types/license';
import { calculateLicenseExpiry, formatPersianDate, getDurationLabel, generateLicenseReceipt } from '../../utils/licenseUtils';

export const AdminLicensePortal: React.FC = () => {
  // Navigation subtabs
  const [subTab, setSubTab] = useState<'create' | 'list'>('create');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [plan, setPlan] = useState('Professional');
  const [licenseType, setLicenseType] = useState<LicenseType>('YEARLY');
  const [durationPreset, setDurationPreset] = useState<'12' | '24' | '36' | '1' | 'custom' | 'lifetime'>('12');
  const [customMonths, setCustomMonths] = useState<number>(6);
  const [maxDevices, setMaxDevices] = useState<number>(1);
  const [customKey, setCustomKey] = useState('');
  const [notes, setNotes] = useState('');

  // Creation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdLicense, setCreatedLicense] = useState<LicenseRecord | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // List states
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNUSED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED'>('ALL');
  const [selectedLicenseForReceipt, setSelectedLicenseForReceipt] = useState<LicenseRecord | null>(null);
  const [receiptCopied, setReceiptCopied] = useState(false);

  // Determine current active durationMonths
  const currentDurationMonths: number | null = useMemo(() => {
    if (durationPreset === 'lifetime') return null;
    if (durationPreset === '1') return 1;
    if (durationPreset === '12') return 12;
    if (durationPreset === '24') return 24;
    if (durationPreset === '36') return 36;
    if (durationPreset === 'custom') return Math.max(1, customMonths || 1);
    return 12;
  }, [durationPreset, customMonths]);

  // Live calculation of expires_at
  const calculatedExpiry = useMemo(() => {
    return calculateLicenseExpiry(new Date(), currentDurationMonths);
  }, [currentDurationMonths]);

  const loadLicenses = async () => {
    setIsLoadingList(true);
    try {
      const res = await licenseService.listLicenses();
      if (res.success && res.licenses) {
        setLicenses(res.licenses);
      }
    } catch (err) {
      console.error('Failed to load licenses:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (subTab === 'list') {
      loadLicenses();
    }
  }, [subTab]);

  const handleDurationPresetChange = (preset: '12' | '24' | '36' | '1' | 'custom' | 'lifetime') => {
    setDurationPreset(preset);
    if (preset === 'lifetime') {
      setLicenseType('LIFETIME');
    } else if (preset === '1') {
      setLicenseType('TRIAL');
    } else if (preset === '12') {
      setLicenseType('YEARLY');
    } else if (preset === '24' || preset === '36') {
      setLicenseType('MULTI_YEAR');
    } else {
      setLicenseType('CUSTOM');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setSubmitError('نام مشتری یا نام باشگاه را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCreatedLicense(null);

    try {
      const res = await licenseService.createLicense({
        customer_name: customerName.trim(),
        plan,
        license_type: licenseType,
        duration_months: currentDurationMonths,
        max_devices: maxDevices,
        custom_license_key: customKey.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.license) {
        setCreatedLicense(res.license);
        // Reset inputs
        setCustomerName('');
        setCustomKey('');
        setNotes('');
        loadLicenses();
      } else {
        setSubmitError(res.error || 'خطا در ایجاد لایسنس');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطای ارتباط با سرور';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRevoke = async (licenseKey: string) => {
    if (!window.confirm(`آیا از باطل کردن لایسنس ${licenseKey} اطمینان دارید؟`)) return;
    try {
      const res = await licenseService.revokeLicense(licenseKey);
      if (res.success) {
        loadLicenses();
      } else {
        alert(res.error || 'خطا در ابطال لایسنس');
      }
    } catch {
      alert('خطای سیستمی');
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const matchesSearch =
        (lic.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lic.license_key || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || lic.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [licenses, searchQuery, statusFilter]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Subtab navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSubTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'create'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>صدور دستی لایسنس جدید</span>
          </button>
          <button
            onClick={() => setSubTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'list'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>فهرست لایسنس‌های صادر شده ({licenses.length})</span>
          </button>
        </div>
      </div>

      {/* CREATE TAB */}
      {subTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Creation Form */}
          <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>اطلاعات صدور لایسنس</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تولید شناسنامه لایسنس با محاسبه خودکار انقضا، کد بازیابی و تنظیمات اختصاصی.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نام خریدار / باشگاه <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: باشگاه بدنسازی اکسیژن (شعبه فرمانیه)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  طرح و ویرایش نرم‌افزار
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'Trial', label: 'آزمایشی (Trial)' },
                    { id: 'Standard', label: 'استاندارد' },
                    { id: 'Professional', label: 'حرفه‌ای (Pro)' },
                    { id: 'Enterprise', label: 'سازمانی نامحدود' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPlan(item.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                        plan === item.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Options */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  مدت زمان لایسنس (Duration)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('12')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === '12'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ۱ ساله (۱۲ ماه)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('24')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === '24'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ۲ ساله (۲۴ ماه)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('36')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === '36'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ۳ ساله (۳۶ ماه)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('1')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === '1'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    نسخه آزمایشی (۱ ماه)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('lifetime')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === 'lifetime'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    مادام‌العمر (بدون انقضا)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDurationPresetChange('custom')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      durationPreset === 'custom'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    تعداد ماه دلخواه...
                  </button>
                </div>

                {/* Custom Months Input */}
                {durationPreset === 'custom' && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-3">
                    <span className="text-xs text-amber-300 font-medium">تعداد ماه دلخواه:</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={customMonths}
                      onChange={(e) => setCustomMonths(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-bold text-white text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-400">ماه (محاسبه دقیق انقضا از امروز)</span>
                  </div>
                )}
              </div>

              {/* Max Devices & Custom Key in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تعداد مجاز دستگاه‌ها (max_devices)
                  </label>
                  <select
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value={1}>۱ رایانه (تک‌کاربره اختصاصی)</option>
                    <option value={2}>۲ رایانه (پذیرش + مدیریت)</option>
                    <option value={3}>۳ رایانه (شبکه داخلی ۳ کلاینت)</option>
                    <option value={5}>۵ رایانه (سازمانی متوسط)</option>
                    <option value={10}>۱۰ رایانه (مجموعه بزرگ چند سالنه)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    کلید سفارشی لایسنس (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                    placeholder="خودکار تولید می‌شود (مثال: GYM-XXXX-...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  یادداشت و شماره فاکتور (اختیاری)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: قرارداد سالانه شماره ۱۴۰۵/۸۲ - پرداخت نقدی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !customerName.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال صدور و ثبت در پایگاه داده...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>صدور نهایی لایسنس</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Real-time Calculation & Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Expiry Preview Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>محاسبه خودکار تاریخ انقضا (Auto Calculated)</span>
              </h4>

              <div className="space-y-3 bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تاریخ صدور (created_at):</span>
                  <span className="text-white font-bold">{formatPersianDate(new Date().toISOString())}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">مدت اعتبار (duration):</span>
                  <span className="text-emerald-400 font-bold">
                    {getDurationLabel(licenseType, currentDurationMonths)}
                  </span>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تاریخ انقضا (expires_at):</span>
                  <span className="text-purple-400 font-bold">
                    {calculatedExpiry ? formatPersianDate(calculatedExpiry) : 'مادام‌العمر (بدون انقضا)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تعداد مجاز رایانه:</span>
                  <span className="text-cyan-400 font-bold">{maxDevices} دستگاه</span>
                </div>
              </div>
            </div>

            {/* Created License Result Showcase */}
            {createdLicense && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-3xl p-5 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>لایسنس با موفقیت صادر گردید</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {createdLicense.status}
                  </span>
                </div>

                {/* License Key Card */}
                <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-medium">کلید لایسنس (ارسال به مشتری):</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono font-bold text-emerald-300 select-all" dir="ltr">
                      {createdLicense.license_key}
                    </span>
                    <button
                      onClick={() => handleCopy(createdLicense.license_key, 'key')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      title="کپی کلید لایسنس"
                    >
                      {copiedField === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Recovery Code Card */}
                <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 block font-medium">کد بازیابی سخت‌افزار (محرمانه):</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono font-bold text-amber-300 select-all" dir="ltr">
                      {createdLicense.recovery_code}
                    </span>
                    <button
                      onClick={() => handleCopy(createdLicense.recovery_code, 'recovery')}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                      title="کپی کد بازیابی"
                    >
                      {copiedField === 'recovery' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Copy Full Receipt Button */}
                <button
                  onClick={() => handleCopy(generateLicenseReceipt(createdLicense), 'receipt')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedField === 'receipt' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>متن شناسنامه و رسید کپی شد</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-slate-300" />
                      <span>کپی شناسنامه رسمی جهت ارسال به خریدار</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {subTab === 'list' && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <span>بانک لایسنس‌های مدیریت شده</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاهده وضعیت، زمان انقضا، تعداد دستگاه و ابطال لایسنس‌های مشتریان.
              </p>
            </div>

            <button
              onClick={loadLicenses}
              disabled={isLoadingList}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-emerald-400' : ''}`} />
              <span>تازه‌سازی فهرست</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام باشگاه، خریدار یا کلید لایسنس..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'ACTIVE', 'UNUSED', 'EXPIRED', 'REVOKED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL'
                    ? 'همه'
                    : st === 'ACTIVE'
                    ? 'فعال'
                    : st === 'UNUSED'
                    ? 'استفاده‌نشده'
                    : st === 'EXPIRED'
                    ? 'منقضی'
                    : 'باطل‌شده'}
                </button>
              ))}
            </div>
          </div>

          {/* Licenses Table / Cards */}
          {isLoadingList ? (
            <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span>در حال بارگذاری لایسنس‌ها...</span>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <span>هیچ لایسنسی با این مشخصات یافت نشد.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLicenses.map((lic) => {
                const isLifetime = !lic.expires_at;
                const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() < Date.now();

                return (
                  <div
                    key={lic.id || lic.license_key}
                    className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Customer & Key */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold text-white">{lic.customer_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            lic.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : lic.status === 'UNUSED'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              : lic.status === 'REVOKED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {lic.status === 'ACTIVE' ? 'فعال' : lic.status === 'UNUSED' ? 'استفاده‌نشده' : lic.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            {lic.plan}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 flex items-center gap-1">
                            <Laptop className="w-3 h-3" />
                            <span>{lic.max_devices} دستگاه</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                          <span className="text-emerald-400 font-bold select-all" dir="ltr">
                            {lic.license_key}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-400" dir="ltr">
                            بازیابی: {lic.recovery_code}
                          </span>
                        </div>
                      </div>

                      {/* Expiration Info */}
                      <div className="text-xs text-slate-400 space-y-0.5 text-right">
                        <div>
                          صدور: <span className="text-slate-300">{formatPersianDate(lic.created_at)}</span>
                        </div>
                        <div>
                          انقضا:{' '}
                          <span className={isLifetime ? 'text-purple-400 font-bold' : isExpired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {isLifetime ? 'مادام‌العمر' : formatPersianDate(lic.expires_at)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center">
                        <button
                          onClick={() => setSelectedLicenseForReceipt(lic)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="مشاهده و کپی شناسنامه"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(lic.license_key, `row-${lic.license_key}`)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="کپی کلید لایسنس"
                        >
                          {copiedField === `row-${lic.license_key}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        {lic.status !== 'REVOKED' && (
                          <button
                            onClick={() => handleRevoke(lic.license_key)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                            title="ابطال لایسنس"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Official Receipt Modal */}
      {selectedLicenseForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>شناسنامه رسمی لایسنس</span>
              </h4>
              <button
                onClick={() => setSelectedLicenseForReceipt(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
              {generateLicenseReceipt(selectedLicenseForReceipt)}
            </pre>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateLicenseReceipt(selectedLicenseForReceipt));
                  setReceiptCopied(true);
                  setTimeout(() => setReceiptCopied(false), 2000);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {receiptCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>متن شناسنامه کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی کل متن شناسنامه</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedLicenseForReceipt(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
