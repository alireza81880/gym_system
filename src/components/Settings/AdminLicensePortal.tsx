/**
 * Gym OS - Admin License Management Portal
 * Allows administrators to manually create, inspect, search, filter, and revoke/restore licenses.
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
  Info,
  RotateCcw,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { licenseService } from '../../services/licenseService';
import { LicenseRecord, LicenseType } from '../../types/license';
import { calculateLicenseExpiry, formatPersianDate, getDurationLabel, generateLicenseReceipt } from '../../utils/licenseUtils';

export const AdminLicensePortal: React.FC = () => {
  // Navigation subtabs
  const [subTab, setSubTab] = useState<'create' | 'list'>('create');

  // Form states for manual license creation
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

  // Details Modal state
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [receiptCopied, setReceiptCopied] = useState(false);

  // Revocation Confirmation Modal state
  const [licenseToRevoke, setLicenseToRevoke] = useState<LicenseRecord | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Restore/Unrevoke state
  const [isRestoring, setIsRestoring] = useState(false);

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

  // Revoke Action with confirmation modal
  const handleConfirmRevoke = async () => {
    if (!licenseToRevoke) return;
    setIsRevoking(true);
    try {
      const res = await licenseService.revokeLicense(licenseToRevoke.license_key);
      if (res.success) {
        setLicenseToRevoke(null);
        if (selectedLicense?.license_key === licenseToRevoke.license_key) {
          setSelectedLicense({ ...selectedLicense, status: 'REVOKED' });
        }
        await loadLicenses();
      } else {
        alert(res.error || 'خطا در ابطال لایسنس');
      }
    } catch {
      alert('خطای سیستمی');
    } finally {
      setIsRevoking(false);
    }
  };

  // Restore Action
  const handleRestore = async (licenseKey: string) => {
    setIsRestoring(true);
    try {
      const res = await licenseService.restoreLicense(licenseKey);
      if (res.success) {
        if (selectedLicense?.license_key === licenseKey) {
          setSelectedLicense({ ...selectedLicense, status: 'ACTIVE' });
        }
        await loadLicenses();
      } else {
        alert(res.error || 'خطا در بازگردانی لایسنس');
      }
    } catch {
      alert('خطای سیستمی');
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter((lic) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (lic.customer_name || '').toLowerCase().includes(q) ||
        (lic.license_key || '').toLowerCase().includes(q) ||
        (lic.plan || '').toLowerCase().includes(q);
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
                تولید شناسنامه لایسنس با محاسبه خودکار انقضا، کد بازیابی و ثبت در سامانه مرکزی.
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
                      onChange={(e) => setCustomMonths(parseInt(e.target.value) || 1)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white font-mono text-center focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-400">ماه (محاسبه انقضا از امروز)</span>
                  </div>
                )}
              </div>

              {/* Max Devices */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>سقف تعداد دستگاه‌های مجاز (Max Devices)</span>
                  <span className="text-emerald-400 font-mono">{maxDevices} سیستم</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMaxDevices(num)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          maxDevices === num
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Custom License Key */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  کلید لایسنس سفارشی (اختیاری)
                </label>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value.toUpperCase())}
                  placeholder="خالی بگذارید تا به صورت خودکار تولید شود (GYM-XXXX-XXXX...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  یادداشت پشتیبانی / شماره فاکتور (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات مربوط به قرارداد، تخفیف، پشتیبان یا شماره پیگیری..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال صدور لایسنس...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>تولید و ثبت نهایی لایسنس</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Preview & Created Result Card */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Calculation Box */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>محاسبه خودکار تاریخ و وضعیت لایسنس</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">مدت اعتبار:</span>
                  <span className="font-bold text-white">
                    {getDurationLabel(licenseType, currentDurationMonths)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">تاریخ صدور:</span>
                  <span className="font-mono text-slate-300">{formatPersianDate(new Date().toISOString())}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">تاریخ انقضای محاسبه‌شده:</span>
                  <span className={`font-mono font-bold ${calculatedExpiry ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {calculatedExpiry ? formatPersianDate(calculatedExpiry) : 'مادام‌العمر (بدون انقضا)'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-slate-800/80">
                  <span className="text-slate-400">سقف دستگاه‌ها:</span>
                  <span className="font-bold text-cyan-400">{maxDevices} رایانه همزمان</span>
                </div>
              </div>
            </div>

            {/* Created License Result Card */}
            {createdLicense && (
              <div className="bg-emerald-950/20 border-2 border-emerald-500/50 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>لایسنس با موفقیت صادر گردید!</span>
                </div>

                <div className="space-y-3 bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/30">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">کلید لایسنس جهت تحویل به مشتری:</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-sm font-mono font-bold text-emerald-400 select-all" dir="ltr">
                        {createdLicense.license_key}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdLicense.license_key, 'createdKey')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="کپی کلید لایسنس"
                      >
                        {copiedField === 'createdKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-medium">کد بازیابی سخت‌افزار (Recovery Code):</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-amber-400 select-all" dir="ltr">
                        {createdLicense.recovery_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdLicense.recovery_code, 'createdRec')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                        title="کپی کد بازیابی"
                      >
                        {copiedField === 'createdRec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLicense(createdLicense)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>مشاهده شناسنامه و اطلاعات کامل</span>
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
                <span>فهرست لایسنس‌های ثبت‌شده</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاهده وضعیت، زمان انقضا، تعداد دستگاه‌های فعال و مدیریت لایسنس‌های مشتریان.
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
                const activeCount = lic.active_devices_count ?? (lic.status === 'ACTIVE' ? 1 : 0);

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
                            {lic.status === 'ACTIVE' ? 'فعال' : lic.status === 'UNUSED' ? 'استفاده‌نشده' : lic.status === 'REVOKED' ? 'باطل‌شده' : 'منقضی'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                            طرح {lic.plan}
                          </span>
                          {/* Active / Max devices */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-cyan-300 flex items-center gap-1">
                            <Laptop className="w-3 h-3" />
                            <span>
                              {activeCount} از {lic.max_devices} دستگاه فعال
                            </span>
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
                          onClick={() => setSelectedLicense(lic)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="مشاهده مشخصات کامل"
                        >
                          <Eye className="w-4 h-4" />
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

                        {lic.status !== 'REVOKED' ? (
                          <button
                            onClick={() => setLicenseToRevoke(lic)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                            title="ابطال لایسنس (Revoke)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(lic.license_key)}
                            disabled={isRestoring}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                            title="بازگردانی لایسنس (Unrevoke)"
                          >
                            <RotateCcw className="w-4 h-4" />
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

      {/* Structured Details Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>مشخصات و شناسنامه کامل لایسنس</span>
              </h4>
              <button
                onClick={() => setSelectedLicense(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                بستن
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">خریدار / باشگاه:</span>
                <span className="text-white font-bold block mt-1">{selectedLicense.customer_name}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">طرح:</span>
                <span className="text-emerald-400 font-bold block mt-1">Gym OS — {selectedLicense.plan}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2">
                <span className="text-slate-400 block text-[11px]">کلید لایسنس (License Key):</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-white font-mono font-bold select-all" dir="ltr">{selectedLicense.license_key}</span>
                  <button
                    onClick={() => handleCopy(selectedLicense.license_key, 'modalKey')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'modalKey' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[11px]">کد یکبارمصرف بازیابی (Recovery Code):</span>
                  <span className="text-[10px] text-amber-400 font-semibold">محرمانه — جهت تعویض قطعه یا سیستم</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-amber-400 font-mono font-bold select-all" dir="ltr">{selectedLicense.recovery_code}</span>
                  <button
                    onClick={() => handleCopy(selectedLicense.recovery_code, 'modalRec')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedField === 'modalRec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">سقف دستگاه‌ها:</span>
                <span className="text-white font-bold block mt-1">{selectedLicense.max_devices} رایانه</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">دستگاه‌های فعال:</span>
                <span className="text-cyan-400 font-bold block mt-1">
                  {selectedLicense.active_devices_count ?? (selectedLicense.status === 'ACTIVE' ? 1 : 0)} دستگاه
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">تاریخ صدور:</span>
                <span className="text-slate-300 font-mono block mt-1">{formatPersianDate(selectedLicense.created_at)}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">تاریخ انقضا:</span>
                <span className="text-slate-300 font-mono block mt-1">
                  {selectedLicense.expires_at ? formatPersianDate(selectedLicense.expires_at) : 'مادام‌العمر'}
                </span>
              </div>

              {selectedLicense.notes && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2">
                  <span className="text-slate-400 block text-[11px]">یادداشت:</span>
                  <span className="text-slate-300 block mt-1 text-xs">{selectedLicense.notes}</span>
                </div>
              )}
            </div>

            {/* Receipt text preview */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">متن آماده تحویل به مشتری (شناسنامه چاپی):</span>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto select-all">
                {generateLicenseReceipt(selectedLicense)}
              </pre>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateLicenseReceipt(selectedLicense));
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
                    <span>کپی کل متن شناسنامه مشتری</span>
                  </>
                )}
              </button>

              {selectedLicense.status !== 'REVOKED' ? (
                <button
                  onClick={() => {
                    setLicenseToRevoke(selectedLicense);
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Ban className="w-4 h-4" />
                  <span>ابطال لایسنس</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRestore(selectedLicense.license_key)}
                  disabled={isRestoring}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>بازگردانی لایسنس</span>
                </button>
              )}

              <button
                onClick={() => setSelectedLicense(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Server Revocation */}
      {licenseToRevoke && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Ban className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">
                تایید ابطال سروری لایسنس (Revoke)
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                آیا از ابطال کامل لایسنس متعلق به <strong className="text-white">{licenseToRevoke.customer_name}</strong> اطمینان دارید؟
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono text-rose-400 select-all" dir="ltr">
              {licenseToRevoke.license_key}
            </div>

            <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-3 text-xs text-rose-300 space-y-1">
              <span className="font-bold block">اثرات این عملیات:</span>
              <p className="text-[11px] text-slate-400">
                وضعیت لایسنس در پایگاه داده سرور به REVOKED تغییر می‌کند و کلاینت‌ها خطای REVOKED_LICENSE دریافت می‌کنند. رکوردها و لاگ‌های فعالسازی حذف فیزیکی نخواهند شد و امکان بازگردانی در آینده وجود دارد.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevoke}
                className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isRevoking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ابطال در سرور...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4" />
                    <span>بله، لایسنس ابطال شود</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setLicenseToRevoke(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
