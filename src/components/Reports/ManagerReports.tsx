import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  PieChart as PieIcon,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSettings, useMembers, useFinance, useAttendance } from '../../stores';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';

export const ManagerReports: React.FC = () => {
  const { 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const { 
    coaches, 
    getCoachStats, 
  } = useSettings();

  const { students } = useMembers();
  const { summary, kpis, expenses } = useFinance();
  const { attendance } = useAttendance();

  const [selectedCoach, setSelectedCoach] = useState('all');

  // Authoritative Calculations derived from Finance domain
  const totalPaidRevenue = summary.totalRevenue;
  const totalDebts = kpis.totalOutstanding;
  const totalRevenue = totalPaidRevenue + totalDebts;
  
  const totalCoachCommissions = coaches.reduce((sum, c) => {
    const stats = getCoachStats(c.id);
    return sum + stats.totalCoachShare;
  }, 0);

  const totalClubShare = coaches.reduce((sum, c) => {
    const stats = getCoachStats(c.id);
    return sum + stats.totalClubShare;
  }, 0);

  const totalCoachPaidOut = coaches.reduce((sum, c) => {
    const stats = getCoachStats(c.id);
    return sum + stats.totalPaidOut;
  }, 0);

  const totalCoachOwedBalance = coaches.reduce((sum, c) => {
    const stats = getCoachStats(c.id);
    return sum + stats.remainingBalance;
  }, 0);

  const totalOperatingCosts = expenses.reduce((sum, e) => sum + e.amount, 0);
  const clubNetOperatingProfit = totalClubShare - totalOperatingCosts;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const fullReport = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue,
        totalPaidRevenue,
        totalDebts,
        totalCoachCommissions,
        totalClubShare,
        totalCoachPaidOut,
        totalCoachOwedBalance,
        totalOperatingCosts,
        clubNetOperatingProfit,
        totalActiveStudents: students.filter(s => s.status === 'active').length,
        totalCoaches: coaches.length,
        totalAttendances: attendance.length,
      },
      coachesBreakdown: coaches.map(c => ({
        coachName: c.fullName,
        specialty: c.specialty,
        commissionRate: c.commissionRate,
        ...getCoachStats(c.id),
      })),
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullReport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `gym-manager-audit-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <GlassPageHeader
        title={t.reportsTitle}
        subtitle={t.reportsDesc}
        icon={<BarChart3 className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <div className="flex items-center gap-2 no-print">
            <GlassButton
              variant="secondary"
              size="md"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportJson}
            >
              خروجی داده (JSON)
            </GlassButton>
            <GlassButton
              variant="neon"
              size="md"
              icon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              {t.printReport}
            </GlassButton>
          </div>
        }
      />

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard
          title="کل گردش مالی ناخالص"
          value={formatMoney(totalRevenue)}
          subtitle={`وصول شده: ${formatMoney(totalPaidRevenue)}`}
          badge={{ text: 'شهریه‌ها', variant: 'neutral' }}
        />

        <GlassStatCard
          title="سهم خالص باشگاه"
          value={formatMoney(totalClubShare)}
          subtitle="پس از کسر سهم مربیان"
          badge={{ text: 'درآمد باشگاه', variant: 'warning' }}
        />

        <GlassStatCard
          title="بستانکاری مربیان"
          value={formatMoney(totalCoachOwedBalance)}
          subtitle={`تسویه شده: ${formatMoney(totalCoachPaidOut)}`}
          badge={{ text: 'تعهدات مربی', variant: 'info' }}
        />

        <GlassStatCard
          title="سود خالص عملیاتی"
          value={formatMoney(clubNetOperatingProfit)}
          subtitle={`هزینه‌های جاری: ${formatMoney(totalOperatingCosts)}`}
          neonAccent={clubNetOperatingProfit > 0}
          badge={{ 
            text: clubNetOperatingProfit >= 0 ? 'سودده' : 'زیانده', 
            variant: clubNetOperatingProfit >= 0 ? 'success' : 'danger' 
          }}
        />
      </div>

      {/* Comprehensive Coach Financial Audit Table */}
      <GlassCard variant="regular" className="overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--gym-brand,#10b981)]" />
              <span>تراز مالی و کارکرد تفکیکی مربیان باشگاه</span>
            </h3>
            <p className="text-xs text-[var(--gym-text-muted)] mt-0.5">
              جزئیات درآمد حاصل از شاگردان هر مربی، درصد پورسانت و مانده حساب بدهی باشگاه به مربی
            </p>
          </div>
        </div>

        <div className="border border-[var(--gym-border)] rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
              <tr>
                <th className="p-3">نام مربی</th>
                <th className="p-3">تخصص</th>
                <th className="p-3">تعداد شاگرد</th>
                <th className="p-3">کل شهریه تولیدی</th>
                <th className="p-3">درصد پورسانت</th>
                <th className="p-3">سهم مربی</th>
                <th className="p-3">سهم باشگاه</th>
                <th className="p-3">واریز شده به مربی</th>
                <th className="p-3">مانده طلب مربی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gym-border)]">
              {coaches.map(c => {
                const s = getCoachStats(c.id);
                return (
                  <tr key={c.id} className="hover:bg-[var(--gym-surface-glass)]">
                    <td className="p-3 font-bold text-[var(--gym-text,#fff)]">{c.fullName}</td>
                    <td className="p-3 text-[var(--gym-text-muted)]">{c.specialty}</td>
                    <td className="p-3 font-mono font-bold text-[var(--gym-text)]">{formatNum(s.totalStudents)} نفر</td>
                    <td className="p-3 font-mono font-semibold text-[var(--gym-text)]">{formatMoney(s.totalGeneratedRevenue)}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">%{c.commissionRate}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{formatMoney(s.totalCoachShare)}</td>
                    <td className="p-3 font-mono text-[var(--gym-text-secondary)]">{formatMoney(s.totalClubShare)}</td>
                    <td className="p-3 font-mono text-blue-400">{formatMoney(s.totalPaidOut)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{formatMoney(s.remainingBalance)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="glass-subtle font-bold border-t border-[var(--gym-border)]">
              <tr>
                <td colSpan={2} className="p-3 text-[var(--gym-text,#fff)]">مجموع کل:</td>
                <td className="p-3 font-mono text-[var(--gym-text)]">{formatNum(students.length)} نفر</td>
                <td className="p-3 font-mono text-[var(--gym-text,#fff)]">{formatMoney(totalRevenue)}</td>
                <td className="p-3">--</td>
                <td className="p-3 font-mono text-amber-400">{formatMoney(totalCoachCommissions)}</td>
                <td className="p-3 font-mono text-[var(--gym-text,#fff)]">{formatMoney(totalClubShare)}</td>
                <td className="p-3 font-mono text-blue-400">{formatMoney(totalCoachPaidOut)}</td>
                <td className="p-3 font-mono text-emerald-400">{formatMoney(totalCoachOwedBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
