import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  DollarSign, 
  Users, 
  CheckCircle, 
  ArrowDownRight, 
  Printer, 
  PlusCircle, 
  Building,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Coach, PaymentMethod } from '../../types';

interface CoachDetailModalProps {
  coachId: string;
  onClose: () => void;
}

export const CoachDetailModal: React.FC<CoachDetailModalProps> = ({ coachId, onClose }) => {
  const { 
    coaches, 
    students, 
    payments, 
    getCoachStats, 
    settleCoachPayment, 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const coach = coaches.find(c => c.id === coachId);
  const [showSettleForm, setShowSettleForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [settleSuccess, setSettleSuccess] = useState(false);

  if (!coach) return null;

  const stats = getCoachStats(coach.id);
  const assignedStudents = students.filter(s => s.coachId === coach.id);
  const payoutHistory = payments.filter(p => p.coachId === coach.id && p.type === 'coach_settlement');

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutAmount <= 0) return;

    settleCoachPayment(coach.id, payoutAmount, paymentMethod, payoutNotes);
    setSettleSuccess(true);
    setPayoutAmount(0);
    setPayoutNotes('');
    setTimeout(() => {
      setSettleSuccess(false);
      setShowSettleForm(false);
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="h-12 w-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-lg">
              {coach.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  {coach.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {coach.specialty}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t.commissionPercent}: <span className="font-bold text-amber-600 dark:text-amber-400">%{coach.commissionRate} مربی</span> / %{100 - coach.commissionRate} سهم باشگاه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5"
              title="چاپ صورت‌حساب"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">چاپ فیش</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
              <span className="text-xs text-stone-500 dark:text-stone-400">{t.totalGenerated}</span>
              <div className="text-base font-bold text-stone-900 dark:text-white font-mono mt-1">
                {formatMoney(stats.totalGeneratedRevenue)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
              <span className="text-xs text-amber-800 dark:text-amber-300">{t.coachEarned} ({coach.commissionRate}%)</span>
              <div className="text-base font-bold text-amber-700 dark:text-amber-400 font-mono mt-1">
                {formatMoney(stats.totalCoachShare)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <span className="text-xs text-blue-800 dark:text-blue-300">{t.coachPaidOut}</span>
              <div className="text-base font-bold text-blue-700 dark:text-blue-400 font-mono mt-1">
                {formatMoney(stats.totalPaidOut)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-xs text-emerald-800 dark:text-emerald-300">{t.remainingCoachBalance}</span>
              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                {formatMoney(stats.remainingBalance)}
              </div>
            </div>
          </div>

          {/* Coach Contact & Banking Info */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Phone className="h-4 w-4 text-stone-400" />
              <span>شماره تماس: <strong className="font-mono">{coach.phone}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <CreditCard className="h-4 w-4 text-stone-400" />
              <span>شماره کارت: <strong className="font-mono">{coach.bankCard || 'ثبت نشده'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
              <Building className="h-4 w-4 text-stone-400" />
              <span>شبا: <strong className="font-mono">{coach.bankShaba || coach.bankName || 'ثبت نشده'}</strong></span>
            </div>
          </div>

          {/* Settle / Payout Action Box */}
          <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 no-print">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <span>تسویه حساب و واریز حق‌الزحمه مربی</span>
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                  مانده قابل تسویه: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(stats.remainingBalance)}</strong>
                </p>
              </div>

              {!showSettleForm && (
                <button
                  onClick={() => {
                    setPayoutAmount(stats.remainingBalance);
                    setShowSettleForm(true);
                  }}
                  className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs"
                >
                  ثبت پرداخت و تسویه
                </button>
              )}
            </div>

            {showSettleForm && (
              <form onSubmit={handleSettle} className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      مبلغ واریزی ({t.currency})
                    </label>
                    <input
                      type="number"
                      value={payoutAmount || ''}
                      onChange={(e) => setPayoutAmount(Number(e.target.value))}
                      placeholder="مبلغ به تومان"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      روش پرداخت
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    >
                      <option value="card_transfer">کارت به کارت / پایا</option>
                      <option value="pos">دستگاه کارتخوان (POS)</option>
                      <option value="cash">نقدی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                      توضیحات و بابت
                    </label>
                    <input
                      type="text"
                      value={payoutNotes}
                      onChange={(e) => setPayoutNotes(e.target.value)}
                      placeholder="بابت تسویه حق‌الزحمه ماه جاری"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    />
                  </div>
                </div>

                {settleSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    <span>پرداخت با موفقیت در سیستم ثبت گردید و از مانده مربی کسر شد.</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettleForm(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    تایید و ثبت واریزی
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Assigned Students Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-500" />
                <span>لیست شاگردان تحت پوشش ({formatNum(assignedStudents.length)} نفر)</span>
              </h4>
            </div>

            <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right rtl:text-right">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                  <tr>
                    <th className="p-3">نام شاگرد</th>
                    <th className="p-3">نوع اشتراک</th>
                    <th className="p-3">شهریه کل</th>
                    <th className="p-3">سهم مربی ({coach.commissionRate}%)</th>
                    <th className="p-3">سهم باشگاه ({100 - coach.commissionRate}%)</th>
                    <th className="p-3">وضعیت پرداخت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {assignedStudents.map(st => {
                    const coachShare = Math.round((st.totalFee * coach.commissionRate) / 100);
                    const clubShare = st.totalFee - coachShare;
                    return (
                      <tr key={st.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="p-3 font-medium text-stone-900 dark:text-white">{st.fullName}</td>
                        <td className="p-3 text-stone-600 dark:text-stone-400">{st.packageType}</td>
                        <td className="p-3 font-mono font-semibold">{formatMoney(st.totalFee)}</td>
                        <td className="p-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">{formatMoney(coachShare)}</td>
                        <td className="p-3 font-mono text-stone-500 dark:text-stone-400">{formatMoney(clubShare)}</td>
                        <td className="p-3">
                          {st.remainingDebt === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              تسویه کامل
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              مانده: {formatMoney(st.remainingDebt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Past Settlement Payout History */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>تاریخچه تسویه‌ها و واریزی‌های انجام شده به مربی</span>
            </h4>

            {payoutHistory.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                تاکنون هیچ پرداختی تسویه‌ای برای این مربی ثبت نشده است.
              </div>
            ) : (
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                    <tr>
                      <th className="p-3">تاریخ</th>
                      <th className="p-3">مبلغ واریزی</th>
                      <th className="p-3">روش پرداخت</th>
                      <th className="p-3">شماره فیش / پیگیری</th>
                      <th className="p-3">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {payoutHistory.map(p => (
                      <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="p-3 text-stone-700 dark:text-stone-300">{p.date}</td>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">{formatMoney(p.amount)}</td>
                        <td className="p-3 text-stone-600 dark:text-stone-400">{p.paymentMethod}</td>
                        <td className="p-3 font-mono text-stone-500">{p.receiptNumber}</td>
                        <td className="p-3 text-stone-600 dark:text-stone-400">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center no-print">
          <span className="text-xs text-stone-500">
            شناسه مربی: <span className="font-mono">{coach.id}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold hover:bg-stone-300 transition-colors"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
