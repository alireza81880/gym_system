import React, { useState, useMemo } from 'react';
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
  Percent, 
  Wallet, 
  Activity,
  Calendar,
  RotateCcw,
  Receipt,
  Layers,
  Info,
  Building
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
  Legend,
  CartesianGrid
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { NavTab } from '../../types';
import { CoachDetailModal } from '../Coaches/CoachDetailModal';
import { PaymentRepository } from '../../services/repositories/paymentRepository';
import { MemberRepository } from '../../services/repositories/memberRepository';
import { AttendanceRepository } from '../../services/repositories/attendanceRepository';
import { LockerRepository } from '../../services/repositories/lockerRepository';
import { FinanceService } from '../../services/finance/financeService';
import { useFinanceStore } from '../../stores/financeStore';
import { useMemberStore } from '../../stores/memberStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useLockerStore } from '../../stores/lockerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassBadge } from '../common/GlassBadge';
import { GlassButton } from '../common/GlassButton';
import { DateService } from '../../services/dateService';

interface DashboardProps {
  setActiveTab?: (tab: NavTab) => void;
  onOpenNewStudent?: () => void;
  onOpenNewPayment?: () => void;
  onOpenQuickCheckIn?: () => void;
  onOpenCheckIn?: () => void;
  onOpenCoachDetail?: (coachId: string) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

type DateRangeFilter = 'today' | '7days' | '30days';

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
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('today');
  const [chartMode, setChartMode] = useState<'sales_vs_collected' | 'profit_flow'>('sales_vs_collected');

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
    formatMoney, 
    formatNum,
    getCoachStats 
  } = appContext;

  // Active branch from settings store
  const activeBranchId = useSettingsStore(s => s.activeBranchId);
  const branches = useSettingsStore(s => s.branches);
  const currentBranch = branches.find(b => b.id === activeBranchId);

  // Granular store versions for high-efficiency memoized recomputations
  const financeVersion = useFinanceStore(s => s.version);
  const memberVersion = useMemberStore(s => s.version);
  const attendanceVersion = useAttendanceStore(s => s.version);
  const lockerVersion = useLockerStore(s => s.version);

  // Target Date calculations
  const todayJalali = useMemo(() => DateService.getTodayJalali(), []);

  // Compute Financial Metrics based on Date & Branch
  const finKPIs = useMemo(() => {
    return FinanceService.getFinancialMetrics({
      branchId: activeBranchId === 'all' ? undefined : activeBranchId,
      targetDate: dateFilter === 'today' ? todayJalali : undefined,
    });
  }, [financeVersion, memberVersion, activeBranchId, dateFilter, todayJalali]);

  const memberMetrics = useMemo(() => MemberRepository.getMetrics(), [memberVersion]);
  const debtorStudents = useMemo(() => MemberRepository.getDebtors(), [memberVersion]);
  const lockerMetrics = useMemo(() => LockerRepository.getMetrics(), [lockerVersion]);
  const liveAttendanceCount = useMemo(() => AttendanceRepository.getLiveVisitors().length, [attendanceVersion]);
  const recentPayments = useMemo(() => PaymentRepository.getAllPayments().slice(0, 6), [financeVersion]);

  // Derived Values
  const activeStudents = memberMetrics.active;
  const expiringSoonCount = memberMetrics.expired;
  const availableLockersCount = lockerMetrics.available;

  // Real Calculated Daily Comparison Chart Data (Last 7 Days)
  const dailyFinancialTrend = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0];
    return days.map(offset => {
      const d = DateService.addDaysToJalali(todayJalali, -offset);
      const metrics = FinanceService.getFinancialMetrics({
        branchId: activeBranchId === 'all' ? undefined : activeBranchId,
        targetDate: d,
      });

      // Split date to MM/DD for clean label
      const parts = d.split('/');
      const shortLabel = parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;

      return {
        date: shortLabel,
        fullDate: d,
        sales: metrics.salesToday,
        collected: metrics.collectedToday,
        outstandingNew: metrics.outstandingCreatedToday,
        refunded: metrics.refundedToday,
      };
    });
  }, [financeVersion, todayJalali, activeBranchId]);

  // Authoritative Monthly Profit Flow Data derived from real persisted records
  const monthlyProfitData = useMemo(() => {
    return FinanceService.getMonthlyProfitFlow({
      branchId: activeBranchId === 'all' ? undefined : activeBranchId,
      lang,
    });
  }, [lang, financeVersion, activeBranchId]);

  // Coach Revenue Distribution
  const coachChartData = useMemo(() => {
    return coaches.map((coach) => {
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
  }, [coaches, getCoachStats, memberVersion, financeVersion]);

  return (
    <div id="dashboard-container" className="space-y-6">
      
      {/* Header Controls: Branch Indicator & Date Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-[var(--gym-border)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-[var(--gym-text-muted)]">شعبه فعال و پایگاه داده مالی</div>
            <div className="text-sm font-bold text-[var(--gym-text,#fff)]">
              {currentBranch ? currentBranch.name : 'تمامی شعب باشگاه'}
            </div>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center bg-[var(--gym-surface-glass-strong)] p-1 rounded-xl border border-[var(--gym-border)] text-xs">
          <button
            id="filter-date-today"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateFilter === 'today'
                ? 'bg-[var(--gym-brand,#10b981)] text-white shadow-sm'
                : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
            }`}
          >
            امروز ({todayJalali})
          </button>
          <button
            id="filter-date-7days"
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateFilter === '7days'
                ? 'bg-[var(--gym-brand,#10b981)] text-white shadow-sm'
                : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
            }`}
          >
            ۷ روز اخیر
          </button>
          <button
            id="filter-date-30days"
            onClick={() => setDateFilter('30days')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              dateFilter === '30days'
                ? 'bg-[var(--gym-brand,#10b981)] text-white shadow-sm'
                : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
            }`}
          >
            ماه جاری
          </button>
        </div>
      </div>

      {/* TOP 5 FINANCIAL TRUTH CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* 1. SALES TODAY */}
        <GlassStatCard
          id="stat-sales-today"
          title={t.kpiSalesToday}
          value={formatMoney(finKPIs.salesToday)}
          icon={<Receipt className="w-5 h-5 text-emerald-400" />}
          description="ارزش ناخالص فاکتورها پس از کسر تخفیف"
          changeType="positive"
        />

        {/* 2. COLLECTED TODAY */}
        <GlassStatCard
          id="stat-collected-today"
          title={t.kpiCollectedToday}
          value={formatMoney(finKPIs.collectedToday)}
          icon={<DollarSign className="w-5 h-5 text-cyan-400" />}
          description="وجوه واریزی قطعی (نقد/پوز) منهای استرداد"
          changeType="positive"
        />

        {/* 3. OUTSTANDING CREATED TODAY */}
        <GlassStatCard
          id="stat-outstanding-created"
          title={t.kpiOutstandingCreatedToday}
          value={formatMoney(finKPIs.outstandingCreatedToday)}
          icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
          description="بدهی جدید ناشی از فروش امروز"
          changeType={finKPIs.outstandingCreatedToday > 0 ? 'negative' : 'neutral'}
        />

        {/* 4. TOTAL OUTSTANDING */}
        <GlassStatCard
          id="stat-total-outstanding"
          title={t.kpiTotalOutstanding}
          value={formatMoney(finKPIs.totalOutstanding)}
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          description={`${formatNum(debtorStudents.length)} عضو دارای مانده بدهی`}
          changeType="negative"
        />

        {/* 5. REFUNDED TODAY */}
        <GlassStatCard
          id="stat-refunded-today"
          title={t.kpiRefundedToday}
          value={formatMoney(finKPIs.refundedToday)}
          icon={<RotateCcw className="w-5 h-5 text-purple-400" />}
          description="استرداد و ابطال‌های ثبت‌شده امروز"
          changeType="neutral"
        />

      </div>

      {/* Operational Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <GlassCard id="card-active-members" padding="compact" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border)] text-[var(--gym-text-secondary)]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--gym-text-muted)]">{t.kpiActiveMembers}</div>
            <div className="text-base sm:text-lg font-bold text-[var(--gym-text,#fff)] font-mono">
              {formatNum(activeStudents)} {lang === 'fa' ? 'نفر' : ''}
            </div>
          </div>
        </GlassCard>

        <GlassCard id="card-today-checkins" padding="compact" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border)] text-[var(--gym-text-secondary)]">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--gym-text-muted)]">{t.kpiTodayCheckins}</div>
            <div className="text-base sm:text-lg font-bold text-[var(--gym-text,#fff)] font-mono">
              {formatNum(liveAttendanceCount)} {lang === 'fa' ? 'ورود' : 'in'}
            </div>
          </div>
        </GlassCard>

        <GlassCard 
          id="card-available-lockers"
          padding="compact"
          onClick={() => setActiveTab('smartLockers')}
          interactive
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-emerald-400 font-medium">{t.availableLockers}</div>
            <div className="text-base sm:text-lg font-bold text-emerald-300 font-mono">
              {formatNum(availableLockersCount)} <span className="text-xs font-normal">آماده</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard id="card-total-coaches" padding="compact" className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--gym-surface-glass-strong)] border border-[var(--gym-border)] text-[var(--gym-text-secondary)]">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-[var(--gym-text-muted)]">{t.kpiTotalCoaches}</div>
            <div className="text-base sm:text-lg font-bold text-[var(--gym-text,#fff)] font-mono">
              {formatNum(coaches.length)} {lang === 'fa' ? 'مربی' : 'coaches'}
            </div>
          </div>
        </GlassCard>

        <GlassCard id="card-expiring-soon" padding="compact" className="flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-amber-400 font-medium">{t.kpiExpiringSoon}</div>
            <div className="text-base sm:text-lg font-bold text-amber-300 font-mono">
              {formatNum(expiringSoonCount)} {lang === 'fa' ? 'نفر' : ''}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Flow Chart */}
        <GlassCard id="card-financial-chart" className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
                {chartMode === 'sales_vs_collected' ? 'نمودار تفکیک فروش و دریافت روزانه' : t.financialTrend}
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)]">
                {chartMode === 'sales_vs_collected' 
                  ? 'مقایسه فروش قطعی (Sale) و وجوه وصول شده (Collected) در ۷ روز گذشته' 
                  : 'مقایسه درآمد ناخالص، هزینه‌های جاری و سود خالص ماهانه'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[var(--gym-surface-glass-strong)] p-1 rounded-xl border border-[var(--gym-border)] text-xs">
                <button
                  onClick={() => setChartMode('sales_vs_collected')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartMode === 'sales_vs_collected'
                      ? 'bg-[var(--gym-brand,#10b981)] text-white shadow-sm'
                      : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
                  }`}
                >
                  فروش و دریافت روزانه
                </button>
                <button
                  onClick={() => setChartMode('profit_flow')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    chartMode === 'profit_flow'
                      ? 'bg-[var(--gym-brand,#10b981)] text-white shadow-sm'
                      : 'text-[var(--gym-text-muted)] hover:text-[var(--gym-text)]'
                  }`}
                >
                  تراز سود ماهانه
                </button>
              </div>

              <button
                onClick={() => setActiveTab('finances')}
                className="text-xs font-semibold text-[var(--gym-brand,#10b981)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t.details}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'sales_vs_collected' ? (
                <BarChart data={dailyFinancialTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gym-border)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--gym-text-muted)" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="var(--gym-text-muted)" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${v / 1000}k`} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [formatMoney(Number(value)), name === 'sales' ? 'فروش قطعی' : name === 'collected' ? 'دریافت شده' : 'مطالبات جدید']}
                    contentStyle={{ backgroundColor: 'var(--gym-surface)', border: '1px solid var(--gym-border-strong)', borderRadius: '12px', color: 'var(--gym-text)', fontSize: '12px' }}
                  />
                  <Legend 
                    formatter={(value) => value === 'sales' ? 'فروش قطعی (Sale)' : value === 'collected' ? 'وصول شده (Collected)' : 'مطالبات جدید (Outstanding)'} 
                  />
                  <Bar dataKey="sales" name="sales" fill="var(--gym-brand,#10b981)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="collected" name="collected" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="outstandingNew" name="outstandingNew" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={monthlyProfitData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gym-brand,#10b981)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--gym-brand,#10b981)" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gym-border)" opacity={0.3} />
                  <XAxis dataKey="month" stroke="var(--gym-text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--gym-text-muted)" fontSize={11} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip 
                    formatter={(value: any) => [formatMoney(Number(value)), '']}
                    contentStyle={{ backgroundColor: 'var(--gym-surface)', border: '1px solid var(--gym-border-strong)', borderRadius: '12px', color: 'var(--gym-text)', fontSize: '12px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name={t.revenue} stroke="var(--gym-brand,#10b981)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name={t.netProfit} stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Coach Revenue Distribution */}
        <GlassCard id="card-coach-chart" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
                {t.coachPerformance}
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)]">
                تفکیک درآمد ایجاد شده توسط هر مربی
              </p>
            </div>
            <button
              onClick={() => setActiveTab('coaches')}
              className="text-xs font-semibold text-[var(--gym-brand,#10b981)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t.coaches}</span>
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coachChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="revenue"
                >
                  {coachChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [formatMoney(Number(value)), 'درآمد']}
                  contentStyle={{ backgroundColor: 'var(--gym-surface)', border: '1px solid var(--gym-border-strong)', borderRadius: '12px', color: 'var(--gym-text)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Coach Mini Breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--gym-border)]">
            {coachChartData.map((item, idx) => (
              <div 
                key={item.id}
                onClick={() => handleCoachClick(item.id)}
                className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-[var(--gym-surface-glass)] cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  <span className="font-medium text-[var(--gym-text,#fff)] truncate">{item.fullName}</span>
                </div>
                <div className="font-mono font-semibold text-[var(--gym-text-secondary)]">
                  {formatMoney(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Bottom Grid: Debtors Alert & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Debtors List */}
        <GlassCard id="card-debtors-alert" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
                {t.debtorsAlert}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-semibold text-[var(--gym-brand,#10b981)] hover:underline cursor-pointer"
            >
              {t.all} ({formatNum(debtorStudents.length)})
            </button>
          </div>

          {debtorStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--gym-text-muted)] glass-subtle rounded-2xl">
              تمامی شاگردان تسویه کامل هستند و بدهی معوقی وجود ندارد.
            </div>
          ) : (
            <div className="divide-y divide-[var(--gym-border)]">
              {debtorStudents.slice(0, 4).map((st) => {
                const coach = coaches.find(c => c.id === st.coachId);
                return (
                  <div key={st.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-[var(--gym-text,#fff)]">
                        {st.fullName}
                      </div>
                      <div className="text-xs text-[var(--gym-text-muted)] flex items-center gap-2 mt-0.5">
                        <span>مربی: {coach ? coach.fullName.split(' ')[0] : 'عمومی'}</span>
                        <span>•</span>
                        <span>{st.phone}</span>
                      </div>
                    </div>

                    <div className="text-left rtl:text-right">
                      <div className="text-sm font-bold text-rose-400 font-mono">
                        {formatMoney(st.remainingDebt)}
                      </div>
                      <button
                        onClick={onOpenNewPayment}
                        className="mt-1 text-xs text-[var(--gym-brand,#10b981)] hover:underline font-medium cursor-pointer"
                      >
                        {t.payDebt}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Recent Transactions */}
        <GlassCard id="card-recent-transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
              {t.recentTransactions}
            </h3>
            <button
              onClick={() => setActiveTab('finances')}
              className="text-xs font-semibold text-[var(--gym-brand,#10b981)] hover:underline cursor-pointer"
            >
              {t.finances}
            </button>
          </div>

          <div className="divide-y divide-[var(--gym-border)]">
            {recentPayments.map((pay) => {
              const isPayout = pay.type === 'coach_settlement';
              const isRefund = pay.type === 'refund' || pay.amount < 0;
              return (
                <div key={pay.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isRefund
                        ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                        : isPayout 
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400' 
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    }`}>
                      {isRefund ? <RotateCcw className="h-4 w-4" /> : isPayout ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--gym-text,#fff)] truncate">
                        {pay.studentName || pay.coachName || pay.description}
                      </div>
                      <div className="text-xs text-[var(--gym-text-muted)] flex items-center gap-2">
                        <span>{pay.date}</span>
                        <span>•</span>
                        <span className="font-mono">{pay.receiptNumber}</span>
                        {isRefund && <GlassBadge variant="purple" size="sm">مرجوعی</GlassBadge>}
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-bold font-mono ${
                    isRefund
                      ? 'text-purple-400'
                      : isPayout 
                      ? 'text-cyan-400' 
                      : 'text-emerald-400'
                  }`}>
                    {isRefund ? '' : isPayout ? '-' : '+'}{formatMoney(pay.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

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
