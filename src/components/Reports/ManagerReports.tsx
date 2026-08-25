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

export const ManagerReports: React.FC = () => {
  const { 
    coaches, 
    students, 
    payments, 
    expenses, 
    attendance, 
    getCoachStats, 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const [selectedCoach, setSelectedCoach] = useState('all');

  // Calculations
  const totalRevenue = students.reduce((sum, s) => sum + s.totalFee, 0);
  const totalPaidRevenue = students.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDebts = students.reduce((sum, s) => sum + s.remainingDebt, 0);
  
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
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-amber-500" />
            <span>{t.reportsTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.reportsDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>خروجی داده (JSON)</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>{t.printReport}</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">کل گردش مالی ناخالص شهریه‌ها</span>
          <div className="text-xl font-black text-stone-900 dark:text-white font-mono mt-1">
            {formatMoney(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-mono">
            وصول شده: {formatMoney(totalPaidRevenue)}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">سهم خالص باشگاه از شهریه‌ها</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
            {formatMoney(totalClubShare)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            پس از کسر سهم مربیان
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">بستانکاری و طلب مربیان</span>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {formatMoney(totalCoachOwedBalance)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            تسویه شده: {formatMoney(totalCoachPaidOut)}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-semibold text-stone-500">سود خالص عملیاتی باشگاه</span>
          <div className={`text-xl font-black font-mono mt-1 ${clubNetOperatingProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {formatMoney(clubNetOperatingProfit)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            هزینه‌های جاری: {formatMoney(totalOperatingCosts)}
          </div>
        </div>
      </div>

      {/* Comprehensive Coach Financial Audit Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <span>تراز مالی و کارکرد تفکیکی مربیان باشگاه</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              جزئیات درآمد حاصل از شاگردان هر مربی، درصد پورسانت و مانده حساب بدهی باشگاه به مربی
            </p>
          </div>
        </div>

        <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-right">
            <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
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
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              {coaches.map(c => {
                const s = getCoachStats(c.id);
                return (
                  <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="p-3 font-bold text-stone-900 dark:text-white">{c.fullName}</td>
                    <td className="p-3 text-stone-500">{c.specialty}</td>
                    <td className="p-3 font-mono font-bold">{formatNum(s.totalStudents)} نفر</td>
                    <td className="p-3 font-mono font-semibold">{formatMoney(s.totalGeneratedRevenue)}</td>
                    <td className="p-3 font-mono font-bold text-amber-600">%{c.commissionRate}</td>
                    <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{formatMoney(s.totalCoachShare)}</td>
                    <td className="p-3 font-mono text-stone-600 dark:text-stone-400">{formatMoney(s.totalClubShare)}</td>
                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{formatMoney(s.totalPaidOut)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(s.remainingBalance)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-stone-50 dark:bg-stone-800/60 font-bold border-t border-stone-200 dark:border-stone-700">
              <tr>
                <td colSpan={2} className="p-3 text-stone-900 dark:text-white">مجموع کل:</td>
                <td className="p-3 font-mono">{formatNum(students.length)} نفر</td>
                <td className="p-3 font-mono text-stone-900 dark:text-white">{formatMoney(totalRevenue)}</td>
                <td className="p-3">--</td>
                <td className="p-3 font-mono text-amber-600">{formatMoney(totalCoachCommissions)}</td>
                <td className="p-3 font-mono text-stone-900 dark:text-white">{formatMoney(totalClubShare)}</td>
                <td className="p-3 font-mono text-blue-600">{formatMoney(totalCoachPaidOut)}</td>
                <td className="p-3 font-mono text-emerald-600">{formatMoney(totalCoachOwedBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
