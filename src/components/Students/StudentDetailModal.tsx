import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  Award, 
  CreditCard, 
  Dumbbell, 
  HeartPulse, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';

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
  const { students, coaches, payments, attendance, customFields, formatMoney, formatNum, t } = useApp();

  const student = students.find(s => s.id === studentId);
  if (!student) return null;

  const coach = coaches.find(c => c.id === student.coachId);
  const studentPayments = payments.filter(p => p.studentId === student.id);
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const studentCustomData = student.customFields || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="h-12 w-12 rounded-xl bg-stone-900 text-amber-400 dark:bg-amber-500 dark:text-stone-950 flex items-center justify-center font-bold text-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                  {student.fullName}
                </h2>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  student.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {student.status === 'active' ? t.active : t.expired}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                مربی اختصاصی: <strong className="text-stone-800 dark:text-stone-200">{coach ? coach.fullName : 'عمومی'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ پرونده</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Membership Card Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white shadow-md relative overflow-hidden border border-stone-700">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">کارت عضویت باشگاه</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 font-mono font-bold text-xs">
                    #{student.memberNumber || student.id}
                  </span>
                </div>
                <h3 className="text-xl font-black mt-1 tracking-tight">{student.fullName}</h3>
                <span className="text-xs text-stone-400 font-mono">
                  کد ملی: {student.nationalId ? student.nationalId : 'ثبت نشده'}
                </span>
              </div>
              <div className="text-left rtl:text-right">
                <span className="text-xs text-stone-400">انقضای دوره</span>
                <div className="text-sm font-bold font-mono text-amber-300">{student.expireDate}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-700 text-xs">
              <div>
                <span className="text-stone-400">نوع پکیج:</span>
                <div className="font-semibold">{student.packageType}</div>
              </div>
              <div>
                <span className="text-stone-400">جلسات مصرفی:</span>
                <div className="font-semibold font-mono">{student.sessionsAttended} از {student.sessionsTotal}</div>
              </div>
              <div>
                <span className="text-stone-400">وضعیت مالی:</span>
                <div className="font-semibold font-mono">
                  {student.remainingDebt === 0 ? 'تسویه کامل ✓' : `بدهکار: ${formatMoney(student.remainingDebt)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions if Debt or Expired */}
          {(student.remainingDebt > 0 || student.status !== 'active') && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div className="text-xs">
                  {student.remainingDebt > 0 && (
                    <div className="font-bold text-stone-900 dark:text-white">
                      بدهی فعلی: <span className="font-mono text-rose-600 dark:text-rose-400">{formatMoney(student.remainingDebt)}</span>
                    </div>
                  )}
                  {student.status !== 'active' && (
                    <div className="text-rose-600 font-bold">عضویت این شاگرد به پایان رسیده است.</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {student.remainingDebt > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPayDebt(student);
                    }}
                    className="px-3.5 py-1.5 bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ثبت دریافت
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenRenew(student);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {t.renewMembership}
                </button>
              </div>
            </div>
          )}

          {/* Biometrics & Medical Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-amber-500" />
                <span>مشخصات بدنی و هدف ورزشی</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">قد:</span>
                <span className="font-semibold font-mono">{student.height || '--'} سانتی‌متر</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">وزن:</span>
                <span className="font-semibold font-mono">{student.weight || '--'} کیلوگرم</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">هدف تمرینی:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{student.goal || 'آمادگی عمومی'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                <HeartPulse className="h-4 w-4 text-rose-500" />
                <span>سوابق پزشکی و اضطراری</span>
              </h4>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">تلفن همراه:</span>
                <span className="font-semibold font-mono">{student.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-700">
                <span className="text-stone-500">تماس اضطراری:</span>
                <span className="font-semibold font-mono">{student.emergencyPhone || 'ثبت نشده'}</span>
              </div>
              <div className="pt-1">
                <span className="text-stone-500 block mb-1">ملاحظات و آسیب‌دیدگی:</span>
                <span className="text-stone-800 dark:text-stone-200 font-medium">
                  {student.medicalNotes || 'فاقد هرگونه آسیب‌دیدگی یا محدودیت پزشکی'}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Dynamic Fields */}
          {(customFields.length > 0 || Object.keys(studentCustomData).length > 0) && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3 text-xs">
              <h4 className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>فیلدهای سفارشی و مشخصات تکمیلی</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {customFields.map((cf) => {
                  const val = studentCustomData[cf.key];
                  return (
                    <div key={cf.id} className="p-2.5 rounded-lg bg-white/80 dark:bg-stone-800/80 border border-indigo-100 dark:border-indigo-900/30">
                      <span className="text-stone-500 text-[11px] block">{cf.label}:</span>
                      <span className="font-semibold text-stone-900 dark:text-white mt-0.5 block">
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
            <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-500" />
              <span>رسیدها و تاریخچه پرداخت‌های شهریه</span>
            </h4>

            {studentPayments.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                هیچ پرداختی ثبت نشده است.
              </div>
            ) : (
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                    <tr>
                      <th className="p-2.5">تاریخ</th>
                      <th className="p-2.5">مبلغ پرداختی</th>
                      <th className="p-2.5">روش پرداخت</th>
                      <th className="p-2.5">شماره پیگیری</th>
                      <th className="p-2.5">شرح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {studentPayments.map(p => (
                      <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="p-2.5">{p.date}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(p.amount)}</td>
                        <td className="p-2.5">{p.paymentMethod}</td>
                        <td className="p-2.5 font-mono text-stone-500">{p.receiptNumber}</td>
                        <td className="p-2.5 text-stone-600 dark:text-stone-400">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attendance History */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>سوابق تردد و ورود به باشگاه ({studentAttendance.length} جلسه اخیر)</span>
            </h4>

            {studentAttendance.length === 0 ? (
              <div className="p-3 text-center text-xs text-stone-500 bg-stone-50 dark:bg-stone-800/40 rounded-xl">
                هیچ سابقه ورودی در سیستم ثبت نشده است.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {studentAttendance.map((a, idx) => (
                  <div key={a.id} className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs flex items-center gap-2">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{a.date}</span>
                    <span className="text-stone-400 font-mono">ساعت {a.checkInTime}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">کمد {a.lockerNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 flex justify-between items-center no-print">
          <span className="text-xs text-stone-500">شناسه شاگرد: {student.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-semibold hover:bg-stone-300"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
