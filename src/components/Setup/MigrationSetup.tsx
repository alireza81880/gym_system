import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  ArrowRightLeft, 
  ShieldCheck, 
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MigrationSetupProps {
  onBack: () => void;
  onComplete: (data: {
    gymName: string;
    managerName: string;
    phone: string;
    city: string;
  }) => void;
}

export const MigrationSetup: React.FC<MigrationSetupProps> = ({
  onBack,
  onComplete,
}) => {
  const [gymName, setGymName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!gymName.trim()) {
      errs.gymName = 'لطفاً نام باشگاه را وارد نمایید.';
    }
    if (!managerName.trim()) {
      errs.managerName = 'لطفاً نام مدیر یا مسئول سامانه را وارد نمایید.';
    }
    if (!phone.trim()) {
      errs.phone = 'لطفاً شماره تماس را وارد نمایید.';
    } else if (!/^09\d{9}$/.test(phone.trim())) {
      errs.phone = 'شماره همراه باید ۱۱ رقمی و با ۰۹ شروع شود.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onComplete({
      gymName: gymName.trim(),
      managerName: managerName.trim(),
      phone: phone.trim(),
      city: city.trim() || 'تهران',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden" dir="rtl">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 z-10 my-auto animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-xs">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>آماده‌سازی انتقال اطلاعات قبلی (Migration Setup)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            مشخصات اولیه باشگاه
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            جهت اتصال صحیح داده‌های ورودی و تفکیک پایگاه داده، اطلاعات هویتی باشگاه را وارد کنید.
          </p>
        </div>

        {/* Card Form */}
        <div className="p-6 sm:p-8 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gym Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>نام باشگاه <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => {
                  setGymName(e.target.value);
                  if (errors.gymName) setErrors(prev => ({ ...prev, gymName: '' }));
                }}
                placeholder="مثال: باشگاه ورزشی المپیک"
                className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${
                  errors.gymName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800 focus:border-amber-500'
                }`}
                autoFocus
              />
              {errors.gymName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.gymName}</span>
                </p>
              )}
            </div>

            {/* Manager Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-400" />
                <span>نام و نام خانوادگی مدیر یا مسئول <span className="text-rose-400">*</span></span>
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => {
                  setManagerName(e.target.value);
                  if (errors.managerName) setErrors(prev => ({ ...prev, managerName: '' }));
                }}
                placeholder="مثال: علی رضایی"
                className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 ${
                  errors.managerName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800 focus:border-amber-500'
                }`}
              />
              {errors.managerName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.managerName}</span>
                </p>
              )}
            </div>

            {/* Phone and City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span>شماره همراه <span className="text-rose-400">*</span></span>
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  placeholder="09123456789"
                  className={`w-full px-4 py-3 bg-slate-950/80 border rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-slate-600 text-left ${
                    errors.phone ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-800 focus:border-amber-500'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.phone}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>شهر</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: تهران / اصفهان"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-2xl text-white text-sm focus:outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Note info box */}
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>فرآیند ایمن و بدون داده‌های فرضی</span>
              </div>
              <p className="leading-relaxed">
                پس از تأیید، مستقیماً وارد مرکز انتقال اطلاعات خواهید شد. هیچ‌گونه عضو یا پکیج ساختگی در سیستم ایجاد نمی‌شود و تمامی اطلاعات از فایل‌های شما استخراج خواهد شد.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت</span>
              </button>

              <button
                type="submit"
                id="btn-confirm-migration-setup"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              >
                <span>ورود به مرکز انتقال اطلاعات</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
