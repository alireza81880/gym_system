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
import { GlassModal } from '../common/GlassModal';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';

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
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={coach.fullName}
      subtitle={`تخصص: ${coach.specialty} — سهم مربی: %${coach.commissionRate}`}
      icon={<User className="w-5 h-5 text-[var(--gym-brand,#10b981)]" />}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 text-xs">
        
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GlassStatCard
            title={t.totalGenerated}
            value={formatMoney(stats.totalGeneratedRevenue)}
          />

          <GlassStatCard
            title={`${t.coachEarned} (${coach.commissionRate}%)`}
            value={formatMoney(stats.totalCoachShare)}
            badge={{ text: 'سهم ناخالص', variant: 'warning' }}
          />

          <GlassStatCard
            title={t.coachPaidOut}
            value={formatMoney(stats.totalPaidOut)}
            badge={{ text: 'واریز شده', variant: 'info' }}
          />

          <GlassStatCard
            title={t.remainingCoachBalance}
            value={formatMoney(stats.remainingBalance)}
            neonAccent={stats.remainingBalance > 0}
            badge={{ 
              text: stats.remainingBalance > 0 ? 'بستانکار' : 'تسویه کامل', 
              variant: stats.remainingBalance > 0 ? 'success' : 'neutral' 
            }}
          />
        </div>

        {/* Coach Contact & Banking Info */}
        <GlassCard variant="subtle" className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--gym-text-secondary)]">
            <Phone className="h-4 w-4 text-[var(--gym-brand,#10b981)]" />
            <span>شماره تماس: <strong className="font-mono text-[var(--gym-text)]">{coach.phone}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[var(--gym-text-secondary)]">
            <CreditCard className="h-4 w-4 text-amber-400" />
            <span>شماره کارت: <strong className="font-mono text-[var(--gym-text)]">{coach.bankCard || 'ثبت نشده'}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[var(--gym-text-secondary)]">
            <Building className="h-4 w-4 text-blue-400" />
            <span>شبا: <strong className="font-mono text-[var(--gym-text)]">{coach.bankShaba || coach.bankName || 'ثبت نشده'}</strong></span>
          </div>
        </GlassCard>

        {/* Settle / Payout Action Box */}
        <GlassCard variant="regular" className="p-4 md:p-5 border-amber-500/30 bg-amber-500/5 no-print space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <span>تسویه حساب و واریز حق‌الزحمه مربی</span>
              </h4>
              <p className="text-xs text-[var(--gym-text-muted)] mt-0.5">
                مانده قابل تسویه: <strong className="text-emerald-400 font-mono">{formatMoney(stats.remainingBalance)}</strong>
              </p>
            </div>

            {!showSettleForm && (
              <GlassButton
                variant="neon"
                size="sm"
                onClick={() => {
                  setPayoutAmount(stats.remainingBalance);
                  setShowSettleForm(true);
                }}
              >
                ثبت پرداخت و تسویه
              </GlassButton>
            )}
          </div>

          {showSettleForm && (
            <form onSubmit={handleSettle} className="pt-3 border-t border-[var(--gym-border)] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                    مبلغ واریزی ({t.currency}) *
                  </label>
                  <input
                    type="number"
                    value={payoutAmount || ''}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    placeholder="مبلغ به تومان"
                    className="w-full px-3 py-2 text-sm rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] font-mono font-bold text-emerald-400 focus:border-[var(--gym-brand,#10b981)] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                    روش پرداخت
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)]"
                  >
                    <option value="card_transfer" className="bg-stone-900 text-white">کارت به کارت / پایا</option>
                    <option value="pos" className="bg-stone-900 text-white">دستگاه کارتخوان (POS)</option>
                    <option value="cash" className="bg-stone-900 text-white">نقدی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--gym-text-secondary)] mb-1">
                    توضیحات و بابت
                  </label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="بابت تسویه حق‌الزحمه ماه جاری"
                    className="w-full px-3 py-2 text-sm rounded-xl glass-subtle border border-[var(--gym-border)] text-[var(--gym-text)]"
                  />
                </div>
              </div>

              {settleSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>پرداخت با موفقیت در سیستم ثبت گردید و از مانده مربی کسر شد.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettleForm(false)}
                >
                  انصراف
                </GlassButton>
                <GlassButton
                  variant="neon"
                  size="sm"
                  type="submit"
                >
                  تایید و ثبت واریزی
                </GlassButton>
              </div>
            </form>
          )}
        </GlassCard>

        {/* Assigned Students Table */}
        <div className="space-y-2.5">
          <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--gym-brand,#10b981)]" />
            <span>لیست شاگردان تحت پوشش ({formatNum(assignedStudents.length)} نفر)</span>
          </h4>

          <GlassCard variant="regular" className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
                  <tr>
                    <th className="p-3">نام شاگرد</th>
                    <th className="p-3">نوع اشتراک</th>
                    <th className="p-3">شهریه کل</th>
                    <th className="p-3">سهم مربی ({coach.commissionRate}%)</th>
                    <th className="p-3">سهم باشگاه ({100 - coach.commissionRate}%)</th>
                    <th className="p-3">وضعیت پرداخت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gym-border)]">
                  {assignedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[var(--gym-text-muted)]">
                        هیچ شاگردی به این مربی تخصیص نیافته است.
                      </td>
                    </tr>
                  ) : (
                    assignedStudents.map(st => {
                      const coachShare = Math.round((st.totalFee * coach.commissionRate) / 100);
                      const clubShare = st.totalFee - coachShare;
                      return (
                        <tr key={st.id} className="hover:bg-[var(--gym-surface-glass)]">
                          <td className="p-3 font-bold text-[var(--gym-text,#fff)]">{st.fullName}</td>
                          <td className="p-3 text-[var(--gym-text-secondary)]">{st.packageType}</td>
                          <td className="p-3 font-mono font-semibold">{formatMoney(st.totalFee)}</td>
                          <td className="p-3 font-mono text-amber-400 font-semibold">{formatMoney(coachShare)}</td>
                          <td className="p-3 font-mono text-[var(--gym-text-muted)]">{formatMoney(clubShare)}</td>
                          <td className="p-3">
                            {st.remainingDebt === 0 ? (
                              <GlassBadge variant="success" size="sm">تسویه کامل</GlassBadge>
                            ) : (
                              <GlassBadge variant="danger" size="sm">مانده: {formatMoney(st.remainingDebt)}</GlassBadge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Past Settlement Payout History */}
        <div className="space-y-2.5">
          <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>تاریخچه تسویه‌ها و واریزی‌های انجام شده به مربی</span>
          </h4>

          {payoutHistory.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--gym-text-muted)] glass-subtle rounded-2xl border border-[var(--gym-border)]">
              تاکنون هیچ پرداختی تسویه‌ای برای این مربی ثبت نشده است.
            </div>
          ) : (
            <GlassCard variant="regular" className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
                    <tr>
                      <th className="p-3">تاریخ</th>
                      <th className="p-3">مبلغ واریزی</th>
                      <th className="p-3">روش پرداخت</th>
                      <th className="p-3">شماره فیش / پیگیری</th>
                      <th className="p-3">توضیحات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--gym-border)]">
                    {payoutHistory.map(p => (
                      <tr key={p.id} className="hover:bg-[var(--gym-surface-glass)]">
                        <td className="p-3 text-[var(--gym-text-secondary)]">{p.date}</td>
                        <td className="p-3 font-mono font-bold text-blue-400">{formatMoney(p.amount)}</td>
                        <td className="p-3 text-[var(--gym-text-secondary)]">{p.paymentMethod}</td>
                        <td className="p-3 font-mono text-[var(--gym-text-muted)]">{p.receiptNumber}</td>
                        <td className="p-3 text-[var(--gym-text-secondary)]">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 flex justify-between items-center no-print border-t border-[var(--gym-border)]">
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrint}
          >
            چاپ فیش
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            {t.close}
          </GlassButton>
        </div>

      </div>
    </GlassModal>
  );
};
