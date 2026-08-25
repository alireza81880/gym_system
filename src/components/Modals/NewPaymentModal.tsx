import React, { useState } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, TransactionType } from '../../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    if (payTarget === 'student_tuition') {
      recordStudentPayment(selectedStudentId, amount, paymentMethod, description || 'دریافت شهریه / قسط');
    } else {
      addPayment({
        amount,
        date: new Date().toLocaleDateString('fa-IR'),
        paymentMethod,
        type: 'supplement_sale',
        description: description || 'فروش بوفه / مکمل',
        receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      });
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            <span>ثبت سریع تراکنش دریافتی جدید</span>
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPayTarget('student_tuition')}
              className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                payTarget === 'student_tuition'
                  ? 'bg-amber-500 text-stone-950 border-amber-500'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600'
              }`}
            >
              شهریه شاگرد
            </button>
            <button
              type="button"
              onClick={() => setPayTarget('supplement_buffet')}
              className={`flex-1 py-2 rounded-xl font-bold border transition-all ${
                payTarget === 'supplement_buffet'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600'
              }`}
            >
              بوفه / مکمل
            </button>
          </div>

          {payTarget === 'student_tuition' && (
            <div>
              <label className="block font-medium mb-1">انتخاب شاگرد</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              >
                {students.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} (مانده بدهی: {formatMoney(st.remainingDebt)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1">مبلغ دریافتی ({t.currency}) *</label>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-emerald-600"
                required
              />
            </div>
            <div>
              <label className="block font-medium mb-1">روش پرداخت</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
              >
                <option value="pos">کارتخوان (POS)</option>
                <option value="card_transfer">کارت به کارت</option>
                <option value="cash">نقدی</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">توضیحات و بابت</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="بابت شهریه، خرید پروتئین وی، بوفه..."
              className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
            />
          </div>

          {success && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>تراکنش با موفقیت در سیستم ثبت گردید.</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-600"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
            >
              ثبت و ذخیره دریافتی
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
