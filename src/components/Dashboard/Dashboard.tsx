import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  UserCheck, 
  KeyRound,
  AlertTriangle, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  FileSpreadsheet, 
  Sparkles,
  Percent,
  Wallet,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { NavTab } from '../../types';
import { CoachDetailModal } from '../Coaches/CoachDetailModal';

interface DashboardProps {
  setActiveTab?: (tab: NavTab) => void;
  onOpenNewStudent?: () => void;
  onOpenNewPayment?: () => void;
  onOpenQuickCheckIn?: () => void;
  onOpenCheckIn?: () => void;
  onOpenCoachDetail?: (coachId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab: propSetActiveTab,
  onOpenNewStudent,
  onOpenNewPayment,
  onOpenQuickCheckIn,
  onOpenCheckIn,
  onOpenCoachDetail,
}) => {
  const appContext = useApp();
  const setActiveTab = propSetActiveTab ?? appContext.setActiveTab;
  const [internalCoachDetailId, setInternalCoachDetailId] = useState<string | null>(null);

  const handleCoachClick = (coachId: string) => {
    if (onOpenCoachDetail) {
      onOpenCoachDetail(coachId);
    } else {
      setInternalCoachDetailId(coachId);
    }
  };

  const { 
    t, 
    lang, 
    coaches, 
    students, 
    payments, 
    expenses, 
    attendance, 
    smartLockers,
    formatMoney, 
    formatNum,
    getCoachStats 
  } = appContext;

  const availableLockersCount = smartLockers?.filter(l => l.status === 'available').length ?? 0;

  // Metrics Calculations
  // Total Revenue from students, supplements, buffet
  const totalRevenue = payments
    .filter(p => p.type !== 'coach_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  // Total Coach settlements paid out
  const totalCoachPayouts = payments
    .filter(p => p.type === 'coach_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  // Operational expenses
  const totalOperationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Total club outgoings
  const totalClubOutgoings = totalOperationalExpenses + totalCoachPayouts;

  // Club Net Profit
  const netProfit = totalRevenue - totalClubOutgoings;

  // Outstanding student debts
  const totalDebts = students.reduce((sum, s) => sum + s.remainingDebt, 0);

  // Active students
  const activeStudents = students.filter(s => s.status === 'active').length;

  // Expiring soon (less than 7 days)
  const expiringSoonCount = students.filter(s => s.status === 'pending_renewal' || s.status === 'expired').length;

  // Today's check-ins
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAttendanceCount = attendance.filter(a => a.date.includes('25') || a.date === todayStr).length;

  // Chart Data: Revenue per Coach
  const coachChartData = coaches.map((coach, idx) => {
    const stats = getCoachStats(coach.id);
    return {
      name: coach.fullName.split(' ')[0],
      fullName: coach.fullName,
      revenue: stats.totalGeneratedRevenue,
      coachShare: stats.totalCoachShare,
      clubShare: stats.totalClubShare,
      students: stats.totalStudents,
      id: coach.id,
    };
  });

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  // Monthly Simulation Data for visual trend
  const financialMonthlyData = [
    { month: lang === 'fa' ? 'فروردین' : 'Apr', revenue: 28000000, expenses: 19000000, profit: 9000000 },
    { month: lang === 'fa' ? 'اردیبهشت' : 'May', revenue: 34000000, expenses: 22000000, profit: 12000000 },
    { month: lang === 'fa' ? 'خرداد' : 'Jun', revenue: 39000000, expenses: 25000000, profit: 14000000 },
    { month: lang === 'fa' ? 'تیر' : 'Jul', revenue: 42000000, expenses: 27000000, profit: 15000000 },
    { month: lang === 'fa' ? 'مرداد' : 'Aug', revenue: totalRevenue, expenses: totalClubOutgoings, profit: netProfit },
  ];

  // Debtors list
  const debtorStudents = students.filter(s => s.remainingDebt > 0);

  return (
    <div className="space-y-6">
      
      {/* Top Manager KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t.kpiTotalRevenue}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900 dark:text-white tracking-tight font-mono">
              {formatMoney(totalRevenue)}
            </div>
            <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0" />
              <span>+۱۴٪ نسبت به ماه گذشته</span>
            </div>
          </div>
        </div>

        {/* Club Net Profit */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t.kpiNetProfit}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black tracking-tight font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatMoney(netProfit)}
            </div>
            <div className="mt-2 flex items-center text-xs text-stone-500 dark:text-stone-400">
              <span>سهم خالص مدیر پس از کسر سهم مربیان و مخارج</span>
            </div>
          </div>
        </div>

        {/* Coach Settlements Payouts */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {t.kpiCoachPayouts}
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900 dark:text-white tracking-tight font-mono">
              {formatMoney(totalCoachPayouts)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span>واریز شده به حساب مربیان</span>
              <button
                onClick={() => setActiveTab('coaches')}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                مشاهده حساب‌ها
              </button>
            </div>
          </div>
        </div>

        {/* Outstanding Debts */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              {t.kpiOutstandingDebts}
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
              {formatMoney(totalDebts)}
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-800 dark:text-amber-300 font-medium">
              <span>{formatNum(debtorStudents.length)} {lang === 'fa' ? 'ورزشکار دارای بدهی شهریه' : 'members pending'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t.kpiActiveMembers}</div>
            <div className="text-lg font-bold text-stone-900 dark:text-white font-mono">
              {formatNum(activeStudents)} {lang === 'fa' ? 'نفر' : ''}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t.kpiTodayCheckins}</div>
            <div className="text-lg font-bold text-stone-900 dark:text-white font-mono">
              {formatNum(todayAttendanceCount)} {lang === 'fa' ? 'ورود' : 'in'}
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('smartLockers')}
          className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-400 flex items-center gap-3 cursor-pointer transition-colors"
        >
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t.availableLockers}</div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              {formatNum(availableLockersCount)} <span className="text-xs font-normal">آماده</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t.kpiTotalCoaches}</div>
            <div className="text-lg font-bold text-stone-900 dark:text-white font-mono">
              {formatNum(coaches.length)} {lang === 'fa' ? 'مربی' : 'coaches'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            <Activity className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-stone-500 dark:text-stone-400">{t.kpiExpiringSoon}</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">
              {formatNum(expiringSoonCount)} {lang === 'fa' ? 'نفر' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Flow Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t.financialTrend}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                مقایسه درآمد ناخالص، هزینه‌های جاری و سود خالص ماهانه
              </p>
            </div>
            <button
              onClick={() => setActiveTab('finances')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>{t.details}</span>
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialMonthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip 
                  formatter={(value: any) => [formatMoney(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" name={t.revenue} stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="profit" name={t.netProfit} stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coach Revenue Distribution */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t.coachPerformance}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                تفکیک درآمد ایجاد شده توسط هر مربی
              </p>
            </div>
            <button
              onClick={() => setActiveTab('coaches')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>{t.coaches}</span>
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coachChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="revenue"
                >
                  {coachChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [formatMoney(Number(value)), 'درآمد']}
                  contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Coach Mini Breakdown */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            {coachChartData.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => handleCoachClick(item.id)}
                className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse truncate">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-medium text-stone-800 dark:text-stone-200 truncate">{item.fullName}</span>
                </div>
                <div className="font-mono font-semibold text-stone-700 dark:text-stone-300">
                  {formatMoney(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid: Debtors Alert & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Debtors List */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t.debtorsAlert}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              {t.all} ({formatNum(debtorStudents.length)})
            </button>
          </div>

          {debtorStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
              تمامی شاگردان تسویه کامل هستند و بدهی معوقی وجود ندارد.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {debtorStudents.slice(0, 4).map((st) => {
                const coach = coaches.find(c => c.id === st.coachId);
                return (
                  <div key={st.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-stone-900 dark:text-white">
                        {st.fullName}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                        <span>مربی: {coach ? coach.fullName.split(' ')[0] : 'عمومی'}</span>
                        <span>•</span>
                        <span>{st.phone}</span>
                      </div>
                    </div>

                    <div className="text-left rtl:text-right">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                        {formatMoney(st.remainingDebt)}
                      </div>
                      <button
                        onClick={onOpenNewPayment}
                        className="mt-1 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                      >
                        {t.payDebt}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              {t.recentTransactions}
            </h3>
            <button
              onClick={() => setActiveTab('finances')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              {t.finances}
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {payments.slice(0, 5).map((pay) => {
              const isPayout = pay.type === 'coach_settlement';
              return (
                <div key={pay.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`p-2 rounded-xl flex-shrink-0 ${
                      isPayout 
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' 
                        : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isPayout ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
                        {pay.studentName || pay.coachName || pay.description}
                      </div>
                      <div className="text-xs text-stone-400 flex items-center gap-2">
                        <span>{pay.date}</span>
                        <span>•</span>
                        <span className="font-mono">{pay.receiptNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-bold font-mono ${
                    isPayout 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {isPayout ? '-' : '+'}{formatMoney(pay.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {internalCoachDetailId && (
        <CoachDetailModal
          coachId={internalCoachDetailId}
          onClose={() => setInternalCoachDetailId(null)}
        />
      )}

    </div>
  );
};
