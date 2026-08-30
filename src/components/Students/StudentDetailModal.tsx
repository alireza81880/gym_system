import React from 'react';
import { 
  User, 
  CreditCard, 
  Dumbbell, 
  HeartPulse, 
  Printer, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useMembers, useSettings, useFinance, useAttendance } from '../../stores';
import { Student } from '../../types';
import { FinanceService } from '../../services/finance/financeService';
import { GlassModal } from '../common/GlassModal';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassCard } from '../common/GlassCard';

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
  onOpenRenew: (student: Student) => void;
  onOpenPayDebt: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
  onOpenRenew,
  onOpenPayDebt,
}) => {
  const { formatMoney, formatNum, t } = useApp();
  const { students } = useMembers();
  const { coaches, customFields } = useSettings();
  const { payments } = useFinance();
  const { attendance } = useAttendance();

  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const coach = coaches.find(c => c.id === student.coachId);
  const finSummary = FinanceService.getMemberFinancialSummary(student.id);
  const studentPayments = finSummary?.paymentHistory || payments.filter(p => p.studentId === student.id);
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentCustomData = student.customFields || {};
  const currentDebt = finSummary ? finSummary.totalOutstanding : student.remainingDebt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={student.fullName}
      subtitle={`مربی اختصاصی: ${coach ? coach.fullName : 'عمومی (بدون مربی)'}`}
      icon={<User className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
      maxWidth="max-w-3xl"
      actions={
        <GlassButton
          variant="secondary"
          size="sm"
          icon={<Printer className="h-4 w-4" />}
          onClick={handlePrint}
        >
          چاپ پرونده
        </GlassButton>
      }
    >
      <div className="space-y-6 text-xs">
        
        {/* Membership Card Visual */}
        <div className="p-5 rounded-2xl glass-regular border-[var(--gym-border-neon,#10b981)] relative overflow-hidden bg-gradient-to-br from-[var(--gym-surface)] to-[var(--gym-surface-glass-strong)]">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--gym-brand,#10b981)] text-xs font-bold uppercase tracking-wider">کارت عضویت باشگاه</span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--gym-brand,#10b981)] text-stone-950 font-mono font-bold text-xs">
                  #{student.memberNumber || student.id}
                </span>
              </div>
              <h3 className="text-xl font-black mt-1 text-[var(--gym-text,#fff)] tracking-tight">{student.fullName}</h3>
              <span className="text-xs text-[var(--gym-text-muted)] font-mono">
                کد ملی: {student.nationalId ? student.nationalId : 'ثبت نشده'}
              </span>
            </div>
            <div className="text-left rtl:text-right">
              <span className="text-xs text-[var(--gym-text-muted)]">انقضای دوره</span>
              <div className="text-sm font-bold font-mono text-[var(--gym-brand,#10b981)]">{student.expireDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[var(--gym-border)] text-xs">
            <div>
              <span className="text-[var(--gym-text-muted)]">نوع پکیج:</span>
              <div className="font-semibold text-[var(--gym-text,#fff)]">{student.packageType}</div>
            </div>
            <div>
              <span className="text-[var(--gym-text-muted)]">جلسات مصرفی:</span>
              <div className="font-semibold font-mono text-[var(--gym-text,#fff)]">{student.sessionsAttended} از {student.sessionsTotal}</div>
            </div>
            <div>
              <span className="text-[var(--gym-text-muted)]">وضعیت مالی:</span>
              <div className="font-semibold font-mono text-[var(--gym-text,#fff)]">
                {currentDebt === 0 ? 'تسویه کامل ✓' : `بدهکار: ${formatMoney(currentDebt)}`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions if Debt or Expired */}
        {(currentDebt > 0 || student.status !== 'active') && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                {currentDebt > 0 && (
                  <div className="font-bold text-[var(--gym-text,#fff)]">
                    بدهی فعلی: <span className="font-mono text-rose-400">{formatMoney(currentDebt)}</span>
                  </div>
                )}
                {student.status !== 'active' && (
                  <div className="text-rose-400 font-bold">عضویت این شاگرد به پایان رسیده است.</div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {currentDebt > 0 && (
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPayDebt(student);
                  }}
                >
                  ثبت دریافت
                </GlassButton>
              )}
              <GlassButton
                variant="neon"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenRenew(student);
                }}
              >
                {t.renewMembership}
              </GlassButton>
            </div>
          </div>
        )}

        {/* Biometrics & Medical Dossier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl glass-subtle border-[var(--gym-border)] space-y-2 text-xs">
            <h4 className="font-bold text-[var(--gym-text,#fff)] flex items-center gap-1.5">
              <Dumbbell className="h-4 w-4 text-[var(--gym-brand,#10b981)]" />
              <span>مشخصات بدنی و هدف ورزشی</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">قد:</span>
              <span className="font-semibold font-mono text-[var(--gym-text)]">{student.height || '--'} سانتی‌متر</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">وزن:</span>
              <span className="font-semibold font-mono text-[var(--gym-text)]">{student.weight || '--'} کیلوگرم</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[var(--gym-text-muted)]">هدف تمرینی:</span>
              <span className="font-semibold text-[var(--gym-brand,#10b981)]">{student.goal || 'آمادگی عمومی'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-subtle border-[var(--gym-border)] space-y-2 text-xs">
            <h4 className="font-bold text-[var(--gym-text,#fff)] flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-rose-400" />
              <span>سوابق پزشکی و اضطراری</span>
            </h4>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">تلفن همراه:</span>
              <span className="font-semibold font-mono text-[var(--gym-text)]">{student.phone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--gym-border)]">
              <span className="text-[var(--gym-text-muted)]">تماس اضطراری:</span>
              <span className="font-semibold font-mono text-[var(--gym-text)]">{student.emergencyPhone || 'ثبت نشده'}</span>
            </div>
            <div className="pt-1">
              <span className="text-[var(--gym-text-muted)] block mb-1">ملاحظات و آسیب‌دیدگی:</span>
              <span className="text-[var(--gym-text-secondary)] font-medium">
                {student.medicalNotes || 'فاقد هرگونه آسیب‌دیدگی یا محدودیت پزشکی'}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Dynamic Fields */}
        {(customFields.length > 0 || Object.keys(studentCustomData).length > 0) && (
          <div className="p-4 rounded-2xl glass-subtle border-[var(--gym-border)] space-y-3 text-xs">
            <h4 className="font-bold text-[var(--gym-text,#fff)] flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>فیلدهای سفارشی و مشخصات تکمیلی</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customFields.map((cf) => {
                const val = studentCustomData[cf.key];
                return (
                  <div key={cf.id} className="p-2.5 rounded-xl glass-subtle border-[var(--gym-border)]">
                    <span className="text-[var(--gym-text-muted)] text-[11px] block">{cf.label}:</span>
                    <span className="font-semibold text-[var(--gym-text,#fff)] mt-0.5 block">
                      {val !== undefined && val !== null && val !== '' ? String(val) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Receipts History */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>رسیدها و تاریخچه پرداخت‌های شهریه</span>
          </h4>

          {studentPayments.length === 0 ? (
            <div className="p-3 text-center text-xs text-[var(--gym-text-muted)] glass-subtle rounded-xl border border-[var(--gym-border)]">
              هیچ پرداختی ثبت نشده است.
            </div>
          ) : (
            <div className="border border-[var(--gym-border)] rounded-2xl overflow-hidden text-xs glass-subtle">
              <table className="w-full text-right">
                <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
                  <tr>
                    <th className="p-2.5">تاریخ</th>
                    <th className="p-2.5">مبلغ پرداختی</th>
                    <th className="p-2.5">روش پرداخت</th>
                    <th className="p-2.5">شماره پیگیری</th>
                    <th className="p-2.5">شرح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gym-border)]">
                  {studentPayments.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--gym-surface-glass)]">
                      <td className="p-2.5 text-[var(--gym-text-secondary)]">{p.date}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">{formatMoney(p.amount)}</td>
                      <td className="p-2.5 text-[var(--gym-text)]">{p.paymentMethod}</td>
                      <td className="p-2.5 font-mono text-[var(--gym-text-muted)]">{p.receiptNumber}</td>
                      <td className="p-2.5 text-[var(--gym-text-secondary)]">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[var(--gym-text,#fff)] flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span>سوابق تردد و ورود به باشگاه ({studentAttendance.length} جلسه اخیر)</span>
          </h4>

          {studentAttendance.length === 0 ? (
            <div className="p-3 text-center text-xs text-[var(--gym-text-muted)] glass-subtle rounded-xl border border-[var(--gym-border)]">
              هیچ سابقه ورودی در سیستم ثبت نشده است.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {studentAttendance.map((a) => (
                <div key={a.id} className="px-3 py-1.5 rounded-xl glass-subtle border border-[var(--gym-border)] text-xs flex items-center gap-2">
                  <span className="font-bold text-[var(--gym-text,#fff)]">{a.date}</span>
                  <span className="text-[var(--gym-text-muted)] font-mono">ساعت {a.checkInTime}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-[var(--gym-brand,#10b981)]/15 text-[var(--gym-brand,#10b981)] border border-[var(--gym-brand,#10b981)]/30 font-bold">کمد {a.lockerNumber}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </GlassModal>
  );
};
