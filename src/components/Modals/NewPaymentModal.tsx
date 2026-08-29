import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, TransactionType } from '../../types';
import { MoneyInput } from '../common/MoneyInput';

import { DateService } from '../../services/dateService';
import { generateReceiptNumber } from '../../utils/idGenerator';

interface NewPaymentModalProps {
  onClose: () => void;
}

export const NewPaymentModal: React.FC<NewPaymentModalProps> = ({ onClose }) => {
  const { students, coaches, addPayment, recordStudentPayment, formatMoney, t } = useApp();
  
  const [payTarget, setPayTarget] = useState<'student_tuition' | 'supplement_buffet'>('student_tuition');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);

  const currentSelectedStudent = students.find(s => s.id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (payTarget === 'student_tuition') {
      recordStudentPayment(selectedStudentId, amount, paymentMethod, description || 'دریافت شهریه / قسط');
    } else {
      addPayment({
        amount,
        date: DateService.getTodayJalali(),
        timestamp: new Date().toISOString(),
        paymentMethod,
        type: 'supplement_sale',
        description: description || 'فروش بوفه / مکمل',
        receiptNumber: generateReceiptNumber('BUF'),
        status: 'completed',
      });
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-md max-h-[calc(100vh-32px)] overflow-y-auto bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 space-y-4 text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span>ثبت سریع تراکنش دریافتی جدید</span>
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPayTarget('student_tuition')}
              className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                payTarget === 'student_tuition'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
            >
              شهریه شاگرد
            </button>
            <button
              type="button"
              onClick={() => setPayTarget('supplement_buffet')}
              className={`flex-1 py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                payTarget === 'supplement_buffet'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
              }`}
            >
              بوفه / مکمل
            </button>
          </div>

          {payTarget === 'student_tuition' && (
            <div className="space-y-2">
              <label className="block font-medium mb-1">انتخاب شاگرد</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const st = students.find(s => s.id === e.target.value);
                  if (st && st.remainingDebt > 0) {
                    setAmount(st.remainingDebt);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-semibold"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} (مانده بدهی: {formatMoney(st.remainingDebt)})
                  </option>
                ))}
              </select>

              {currentSelectedStudent && currentSelectedStudent.remainingDebt > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center text-xs">
                  <span className="text-stone-500">بدهی فعلی شاگرد:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatMoney(currentSelectedStudent.remainingDebt)}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">مبلغ دریافتی ({t.currency}) *</label>
            <MoneyInput
              value={amount}
              onChange={(val) => setAmount(val)}
              onFullAmount={
                payTarget === 'student_tuition' && currentSelectedStudent && currentSelectedStudent.remainingDebt > 0
                  ? () => setAmount(currentSelectedStudent.remainingDebt)
                  : undefined
              }
              fullAmountLabel="دریافت کل بدهی"
              placeholder="مبلغ پرداختی"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">روش پرداخت</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
            >
              <option value="pos">کارتخوان (POS)</option>
              <option value="card_transfer">کارت به کارت</option>
              <option value="cash">نقدی (صندوق)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">توضیحات و بابت</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="بابت شهریه، خرید پروتئین وی، بوفه..."
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
            />
          </div>

          {success && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>تراکنش با موفقیت در سیستم ثبت گردید.</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded-lg"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={amount <= 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs"
            >
              ثبت و ذخیره دریافتی
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
