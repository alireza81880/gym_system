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
  PlusCircle, 
  FileSpreadsheet, 
  Sparkles,
  Percent,
  Wallet,
  Activity,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
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
import { PaymentRepository } from '../../services/repositories/paymentRepository';
import { MemberRepository } from '../../services/repositories/memberRepository';
import { AttendanceRepository } from '../../services/repositories/attendanceRepository';
import { LockerRepository } from '../../services/repositories/lockerRepository';
import { useFinanceStore } from '../../stores/financeStore';
import { useMemberStore } from '../../stores/memberStore';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useLockerStore } from '../../stores/lockerStore';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassBadge } from '../common/GlassBadge';
import { GlassButton } from '../common/GlassButton';

interface DashboardProps {
  setActiveTab?: (tab: NavTab) => void;
  onOpenNewStudent?: () => void;
  onOpenNewPayment?: () => void;
  onOpenQuickCheckIn?: () => void;
  onOpenCheckIn?: () => void;
  onOpenCoachDetail?: (coachId: string) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

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
    formatMoney, 
    formatNum,
    getCoachStats 
  } = appContext;

  // Granular store versions for high-efficiency memoized recomputations
  const financeVersion = useFinanceStore(s => s.version);
  const memberVersion = useMemberStore(s => s.version);
  const attendanceVersion = useAttendanceStore(s => s.version);
  const lockerVersion = useLockerStore(s => s.version);

  // Fast Memoized Metrics using Repository Engines
  const finMetrics = useMemo(() => PaymentRepository.getFinancialMetrics(), [financeVersion]);
  const memberMetrics = useMemo(() => MemberRepository.getMetrics(), [memberVersion]);
  const debtorStudents = useMemo(() => MemberRepository.getDebtors(), [memberVersion]);
  const lockerMetrics = useMemo(() => LockerRepository.getMetrics(), [lockerVersion]);
  const liveAttendanceCount = useMemo(() => AttendanceRepository.getLiveVisitors().length, [attendanceVersion]);
  const recentPayments = useMemo(() => PaymentRepository.getAllPayments().slice(0, 5), [financeVersion]);

  // Derived KPI values
  const totalRevenue = finMetrics.totalRevenue;
  const totalCoachPayouts = finMetrics.totalCoachPayouts;
  const totalClubOutgoings = finMetrics.totalExpenses;
  const netProfit = finMetrics.netProfit;
  const totalDebts = memberMetrics.totalDebt;
  const activeStudents = memberMetrics.active;
  const expiringSoonCount = memberMetrics.expired;
  const availableLockersCount = lockerMetrics.available;

  // Chart Data: Revenue per Coach
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

  // Monthly Simulation Data for visual trend
  const financialMonthlyData = useMemo(() => [
    { month: lang === 'fa' ? 'فروردین' : 'Apr', revenue: 28000000, expenses: 19000000, profit: 9000000 },
    { month: lang === 'fa' ? 'اردیبهشت' : 'May', revenue: 34000000, expenses: 22000000, profit: 12000000 },
    { month: lang === 'fa' ? 'خرداد' : 'Jun', revenue: 39000000, expenses: 25000000, profit: 14000000 },
    { month: lang === 'fa' ? 'تیر' : 'Jul', revenue: 42000000, expenses: 27000000, profit: 15000000 },
    { month: lang === 'fa' ? 'مرداد' : 'Aug', revenue: totalRevenue, expenses: totalClubOutgoings, profit: netProfit },
  ], [lang, totalRevenue, totalClubOutgoings, netProfit]);

  return (
    <div className="space-y-6">
      
      {/* Top Manager KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <GlassStatCard
          title={t.kpiTotalRevenue}
          value={formatMoney(totalRevenue)}
          icon={<DollarSign className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
          change="+۱۴٪ نسبت به ماه پیش"
          changeType="positive"
        />

        {/* Club Net Profit */}
        <GlassStatCard
          title={t.kpiNetProfit}
          value={formatMoney(netProfit)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          description="سهم خالص مدیر پس از کسر مربیان و مخارج"
          changeType={netProfit >= 0 ? 'positive' : 'negative'}
        />

        {/* Coach Settlements Payouts */}
        <GlassStatCard
          title={t.kpiCoachPayouts}
          value={formatMoney(totalCoachPayouts)}
          icon={<Wallet className="w-5 h-5 text-cyan-400" />}
          description="واریز شده به حساب مربیان"
        />

        {/* Outstanding Debts */}
        <GlassStatCard
          title={t.kpiOutstandingDebts}
          value={formatMoney(totalDebts)}
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          description={`${formatNum(debtorStudents.length)} ورزشکار دارای بدهی`}
          changeType="negative"
        />

      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <GlassCard padding="compact" className="flex items-center gap-3">
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

        <GlassCard padding="compact" className="flex items-center gap-3">
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

        <GlassCard padding="compact" className="flex items-center gap-3">
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

        <GlassCard padding="compact" className="flex items-center gap-3 col-span-2 sm:col-span-1">
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
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--gym-text,#fff)]">
                {t.financialTrend}
              </h3>
              <p className="text-xs text-[var(--gym-text-muted)]">
                مقایسه درآمد ناخالص، هزینه‌های جاری و سود خالص ماهانه
              </p>
            </div>
            <button
              onClick={() => setActiveTab('finances')}
              className="text-xs font-semibold text-[var(--gym-brand,#10b981)] hover:underline flex items-center gap-1 cursor-pointer"
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
                    <stop offset="5%" stopColor="var(--gym-brand,#10b981)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--gym-brand,#10b981)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
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
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Coach Revenue Distribution */}
        <GlassCard className="space-y-4">
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
        <GlassCard className="space-y-4">
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
        <GlassCard className="space-y-4">
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
              return (
                <div key={pay.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isPayout 
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400' 
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    }`}>
                      {isPayout ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--gym-text,#fff)] truncate">
                        {pay.studentName || pay.coachName || pay.description}
                      </div>
                      <div className="text-xs text-[var(--gym-text-muted)] flex items-center gap-2">
                        <span>{pay.date}</span>
                        <span>•</span>
                        <span className="font-mono">{pay.receiptNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-bold font-mono ${
                    isPayout 
                      ? 'text-cyan-400' 
                      : 'text-emerald-400'
                  }`}>
                    {isPayout ? '-' : '+'}{formatMoney(pay.amount)}
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

