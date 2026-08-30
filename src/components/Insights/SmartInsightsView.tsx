import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Users, 
  AlertTriangle, 
  Award, 
  Clock, 
  CreditCard, 
  KeyRound, 
  ArrowRight, 
  Flame, 
  TrendingDown, 
  Phone,
  Sparkles,
  CheckCircle,
  Filter
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMembers, useAttendance, useFinance, useLockers } from '../../stores';
import { SmartInsightsEngine } from '../../services/insightsService';

export const SmartInsightsView: React.FC = () => {
  const { 
    setActiveTab, 
    formatMoney, 
    lang 
  } = useApp();

  const { students } = useMembers();
  const { attendance } = useAttendance();
  const { payments } = useFinance();
  const { lockers: smartLockers } = useLockers();

  const [activeFilter, setActiveFilter] = useState<'all' | 'churn' | 'crowding' | 'expiring' | 'debt'>('all');

  const churnRiskMembers = SmartInsightsEngine.detectChurnRisk(students, attendance, 12);
  const loyalMembers = SmartInsightsEngine.detectLoyalMembers(students, attendance, 8);
  const expiringSoonMembers = SmartInsightsEngine.getExpiringSoonMembers(students, 7);
  const highDebtMembers = SmartInsightsEngine.getHighDebtMembers(students, 1000000);
  const crowding = SmartInsightsEngine.analyzeCrowding(attendance, 60);

  const totalInsightsCount = churnRiskMembers.length + expiringSoonMembers.length + highDebtMembers.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-stone-900 via-stone-900 to-stone-950 text-white border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>موتور هوش تحلیلی و بینش‌های عملیاتی باشگاه</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-100">
            شناسایی هوشمند الگوهای رفتار، ریسک ریزش و ترافیک سالن
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            الگوریتم‌های تطبیقی داده‌های تردد، پرداخت‌ها و غیبت‌های غیرعادی را پردازش کرده و هشدارهای پیشگیرانه جهت حفظ درآمد و رضایت ورزشکاران ارائه می‌دهند.
          </p>
        </div>

        {/* Crowding Gauge Pill */}
        <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">ترافیک لحظه‌ای سالن:</span>
            <span className="font-bold text-amber-400">{crowding.statusFa}</span>
          </div>
          <div className="w-full bg-stone-700 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${crowding.level === 'crowded' ? 'bg-rose-500' : crowding.level === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${crowding.percentage}%` }}
            />
          </div>
          <div className="text-[11px] text-stone-400 flex justify-between">
            <span>{crowding.activeCount} ورزشکار در سالن</span>
            <span>ظرفیت بهینه: {crowding.capacity}</span>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Churn Risk KPI */}
        <div 
          onClick={() => setActiveFilter('churn')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${activeFilter === 'churn' ? 'ring-2 ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20 border-rose-500' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
              ریسک ریزش
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{churnRiskMembers.length} نفر</div>
            <div className="text-xs text-stone-500 mt-1">غیبت بیش از ۱۲ روز با اشتراک فعال</div>
          </div>
        </div>

        {/* Expiring Soon KPI */}
        <div 
          onClick={() => setActiveFilter('expiring')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${activeFilter === 'expiring' ? 'ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20 border-amber-500' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              ۷ روز آینده
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{expiringSoonMembers.length} نفر</div>
            <div className="text-xs text-stone-500 mt-1">نیازمند پیامک و تماس تمدید</div>
          </div>
        </div>

        {/* High Debt KPI */}
        <div 
          onClick={() => setActiveFilter('debt')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all ${activeFilter === 'debt' ? 'ring-2 ring-orange-500 bg-orange-50/20 dark:bg-orange-950/20 border-orange-500' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}`}
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
              مطالبات بالای ۱ م.ت
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{highDebtMembers.length} نفر</div>
            <div className="text-xs text-stone-500 mt-1">مجموع بدهی قابل وصول</div>
          </div>
        </div>

        {/* Loyal Members KPI */}
        <div 
          onClick={() => setActiveFilter('all')}
          className="p-5 rounded-3xl border bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
        >
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              اعضای وفادار
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-stone-900 dark:text-stone-100">{loyalMembers.length} نفر</div>
            <div className="text-xs text-stone-500 mt-1">ورزشکاران منظم با حضور مستمر</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'all' ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          همه تحلیل‌ها ({totalInsightsCount + loyalMembers.length})
        </button>
        <button
          onClick={() => setActiveFilter('churn')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'churn' ? 'bg-rose-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          اعضای در معرض ریزش ({churnRiskMembers.length})
        </button>
        <button
          onClick={() => setActiveFilter('expiring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'expiring' ? 'bg-amber-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          تمدیدهای فوری ({expiringSoonMembers.length})
        </button>
        <button
          onClick={() => setActiveFilter('debt')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === 'debt' ? 'bg-orange-600 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
        >
          بدهکاران شهریه ({highDebtMembers.length})
        </button>
      </div>

      {/* Churn Risk Section */}
      {(activeFilter === 'all' || activeFilter === 'churn') && churnRiskMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <Flame className="h-4 w-4" />
            <span>ورزشکاران با احتمال ریزش و انصراف (غیبت طولانی با اشتراک فعال)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {churnRiskMembers.map(item => (
              <div
                key={item.student.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{item.student.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-normal">
                      {item.daysSinceLastSeen} روز بدون حضور
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    پکیج: {item.student.packageType} • جلسات باقیمانده: <strong>{(item.student.sessionsTotal || 12) - (item.student.sessionsAttended || 0)} جلسه</strong>
                  </div>
                  <div className="text-xs text-stone-400 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{item.student.phone}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('students')}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1"
                >
                  <span>پیگیری</span>
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon Section */}
      {(activeFilter === 'all' || activeFilter === 'expiring') && expiringSoonMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>اشتراک‌های منقضی‌شونده در ۷ روز آینده</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {expiringSoonMembers.map(item => (
              <div
                key={item.student.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{item.student.fullName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-normal">
                      {item.daysLeft === 0 ? 'امروز منقضی می‌شود' : `${item.daysLeft} روز باقیمانده`}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    تاریخ انقضا: {item.student.expireDate} • تلفن: {item.student.phone}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('students')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold transition-all shadow-xs"
                >
                  تمدید عضویت
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* High Debt Section */}
      {(activeFilter === 'all' || activeFilter === 'debt') && highDebtMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400">
            <CreditCard className="h-4 w-4" />
            <span>مطالبات معوق و بدهی‌های بالای ۱ میلیون تومان</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highDebtMembers.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-orange-200 dark:border-orange-900/60 shadow-xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>{s.fullName}</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {formatMoney(s.remainingDebt)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500">
                    شهریه کل: {formatMoney(s.totalFee)} • پرداختی: {formatMoney(s.paidAmount)}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('finances')}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
                >
                  تسویه بدهی
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loyal Members Section */}
      {(activeFilter === 'all') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400">
            <Award className="h-4 w-4" />
            <span>ورزشکاران وفادار و با نظم بالا (کاندیدای پاداش و پکیج‌های سالانه)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loyalMembers.map(item => (
              <div
                key={item.student.id}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1"
              >
                <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                  <span>{item.student.fullName}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
                    {item.totalAttendances} جلسه حضور
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  عضو پکیج {item.student.packageType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
