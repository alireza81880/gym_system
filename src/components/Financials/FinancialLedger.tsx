import React, { useState } from 'react';
import { 
  ReceiptText, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Printer, 
  Download, 
  Filter, 
  Trash2,
  Building,
  CreditCard,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod, TransactionType } from '../../types';

export const FinancialLedger: React.FC = () => {
  const { 
    payments, 
    expenses, 
    addExpense, 
    deleteExpense, 
    addPayment, 
    deletePayment, 
    coaches, 
    students, 
    formatMoney, 
    formatNum, 
    t, 
    lang 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'incomes' | 'expenses' | 'coach_payouts'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  // Expense Form
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('rent');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('card_transfer');
  const [expDesc, setExpDesc] = useState('');

  // Income Form
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incType, setIncType] = useState<TransactionType>('supplement_sale');
  const [incDesc, setIncDesc] = useState('');
  const [incMethod, setIncMethod] = useState<PaymentMethod>('pos');

  // Overall Financial stats
  const totalIncomes = payments
    .filter(p => p.type !== 'coach_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCoachPayouts = payments
    .filter(p => p.type === 'coach_settlement')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOperationalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesAll = totalOperationalExpenses + totalCoachPayouts;
  const netBalance = totalIncomes - totalExpensesAll;

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || expAmount <= 0) return;

    addExpense({
      title: expTitle,
      category: expCategory,
      amount: expAmount,
      date: new Date().toLocaleDateString('fa-IR'),
      paidTo: expPaidTo || 'طرف حساب',
      paymentMethod: expMethod,
      description: expDesc,
    });

    setIsExpenseModalOpen(false);
    setExpTitle('');
    setExpAmount(0);
    setExpDesc('');
  };

  const handleAddIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (incAmount <= 0) return;

    addPayment({
      amount: incAmount,
      date: new Date().toLocaleDateString('fa-IR'),
      paymentMethod: incMethod,
      type: incType,
      description: incDesc || 'درآمد جانبی بوفه یا مکمل',
      receiptNumber: `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      recordedBy: 'مدیر مالی',
    });

    setIsIncomeModalOpen(false);
    setIncAmount(0);
    setIncDesc('');
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "نوع,عنوان/شرح,مبلغ (تومان),تاریخ,روش پرداخت,شماره پیگیری\n";
    
    payments.forEach(p => {
      csvContent += `${p.type},${p.description || p.studentName || ''},${p.amount},${p.date},${p.paymentMethod},${p.receiptNumber}\n`;
    });

    expenses.forEach(e => {
      csvContent += `هزینه جاری,${e.title},${e.amount},${e.date},${e.paymentMethod},${e.receiptNumber || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `gym-financial-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-amber-500" />
            <span>{t.financesTitle}</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {t.financesDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>{t.exportCsv}</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addExpense}</span>
          </button>
          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addIncome}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase">{t.totalIncomes}</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatMoney(totalIncomes)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase">{t.totalExpenses} (جاری + مربیان)</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {formatMoney(totalExpensesAll)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <ArrowDownRight className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase">{t.balanceNet}</span>
            <div className={`text-xl font-black font-mono mt-1 ${netBalance >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'}`}>
              {formatMoney(netBalance)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'all'
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          کلیه تراکنش‌ها ({payments.length + expenses.length})
        </button>
        <button
          onClick={() => setActiveSubTab('incomes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'incomes'
              ? 'bg-emerald-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          درآمدها و شهریه‌ها ({payments.filter(p => p.type !== 'coach_settlement').length})
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'expenses'
              ? 'bg-rose-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          هزینه‌های جاری باشگاه ({expenses.length})
        </button>
        <button
          onClick={() => setActiveSubTab('coach_payouts')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'coach_payouts'
              ? 'bg-blue-600 text-white'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          تسویه مربیان ({payments.filter(p => p.type === 'coach_settlement').length})
        </button>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
              <tr>
                <th className="p-3.5">نوع</th>
                <th className="p-3.5">شرح / طرف حساب</th>
                <th className="p-3.5">مبلغ</th>
                <th className="p-3.5">روش پرداخت</th>
                <th className="p-3.5">تاریخ</th>
                <th className="p-3.5">شماره پیگیری</th>
                <th className="p-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              
              {/* Render Payments */}
              {(activeSubTab === 'all' || activeSubTab === 'incomes' || activeSubTab === 'coach_payouts') &&
                payments
                  .filter(p => {
                    if (activeSubTab === 'incomes') return p.type !== 'coach_settlement';
                    if (activeSubTab === 'coach_payouts') return p.type === 'coach_settlement';
                    return true;
                  })
                  .map((p) => {
                    const isPayout = p.type === 'coach_settlement';
                    return (
                      <tr key={p.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPayout 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {isPayout ? 'تسویه مربی' : 'درآمد / شهریه'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900 dark:text-white">
                            {p.studentName || p.coachName || p.description}
                          </div>
                          <div className="text-[10px] text-stone-400">{p.description}</div>
                        </td>
                        <td className={`p-3.5 font-mono font-bold text-sm ${
                          isPayout ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isPayout ? '-' : '+'}{formatMoney(p.amount)}
                        </td>
                        <td className="p-3.5 text-stone-600 dark:text-stone-400">{p.paymentMethod}</td>
                        <td className="p-3.5 text-stone-600 dark:text-stone-400">{p.date}</td>
                        <td className="p-3.5 font-mono text-stone-500">{p.receiptNumber}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
                                deletePayment(p.id);
                              }
                            }}
                            className="p-1 rounded text-stone-400 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

              {/* Render Expenses */}
              {(activeSubTab === 'all' || activeSubTab === 'expenses') &&
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        هزینه جاری
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-stone-900 dark:text-white">{e.title}</div>
                      <div className="text-[10px] text-stone-400">پرداخت به: {e.paidTo} ({e.category})</div>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                      -{formatMoney(e.amount)}
                    </td>
                    <td className="p-3.5 text-stone-600 dark:text-stone-400">{e.paymentMethod}</td>
                    <td className="p-3.5 text-stone-600 dark:text-stone-400">{e.date}</td>
                    <td className="p-3.5 font-mono text-stone-500">{e.receiptNumber || '--'}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
                            deleteExpense(e.id);
                          }
                        }}
                        className="p-1 rounded text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 p-6">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-4">
              {t.addExpense}
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium mb-1">عنوان هزینه *</label>
                <input
                  type="text"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="اجاره، تعمیر دستگاه، قبوض و..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">دسته‌بندی</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="rent">{t.catRent}</option>
                    <option value="salary">{t.catSalary}</option>
                    <option value="utility">{t.catUtility}</option>
                    <option value="equipment">{t.catEquipment}</option>
                    <option value="maintenance">{t.catMaintenance}</option>
                    <option value="buffet_stock">{t.catBuffet}</option>
                    <option value="other">{t.catOther}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">مبلغ ({t.currency}) *</label>
                  <input
                    type="number"
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-rose-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">پرداخت شده به</label>
                  <input
                    type="text"
                    value={expPaidTo}
                    onChange={(e) => setExpPaidTo(e.target.value)}
                    placeholder="مالک، تکنسین، فروشنده..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">روش پرداخت</label>
                  <select
                    value={expMethod}
                    onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="card_transfer">کارت به کارت</option>
                    <option value="pos">کارتخوان</option>
                    <option value="cash">نقدی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">توضیحات بیشتر</label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="بابت فاکتور شماره..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg"
                >
                  ثبت هزینه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {isIncomeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 p-6">
            <h3 className="text-base font-bold text-stone-900 dark:text-white mb-4">
              {t.addIncome} (بوفه / مکمل / سایر)
            </h3>

            <form onSubmit={handleAddIncomeSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">نوع درآمد</label>
                  <select
                    value={incType}
                    onChange={(e) => setIncType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  >
                    <option value="supplement_sale">فروش مکمل ورزشی</option>
                    <option value="buffet">درآمد بوفه و نوشیدنی</option>
                    <option value="other_income">سایر درآمدهای متفرقه</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">مبلغ ({t.currency}) *</label>
                  <input
                    type="number"
                    value={incAmount || ''}
                    onChange={(e) => setIncAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono text-sm font-bold text-emerald-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">شرح و توضیحات</label>
                <input
                  type="text"
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  placeholder="فروش پروتئین وی، آبمیوه طبیعی و..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsIncomeModalOpen(false)}
                  className="px-3 py-1.5 text-stone-600"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                >
                  ثبت درآمد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
