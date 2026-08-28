import React, { useState, useMemo } from 'react';
import { 
  ReceiptText, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Download, 
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod, TransactionType, PaymentRecord, ExpenseRecord } from '../../types';
import { GlassPageHeader } from '../common/GlassPageHeader';
import { GlassCard } from '../common/GlassCard';
import { GlassStatCard } from '../common/GlassStatCard';
import { GlassButton } from '../common/GlassButton';
import { GlassBadge } from '../common/GlassBadge';
import { GlassModal } from '../common/GlassModal';

interface UnifiedLedgerItem {
  id: string;
  kind: 'income' | 'expense' | 'coach_settlement';
  title: string;
  subtitle?: string;
  amount: number;
  date: string;
  paymentMethod: string;
  receiptNumber: string;
  rawType: string;
}

const PAGE_SIZE = 15;

export const FinancialLedger: React.FC = () => {
  const { 
    payments, 
    expenses, 
    addExpense, 
    deleteExpense, 
    addPayment, 
    deletePayment, 
    formatMoney, 
    formatNum, 
    t, 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'incomes' | 'expenses' | 'coach_payouts'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
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

  // Overall Financial stats with memoization
  const { totalIncomes, totalCoachPayouts, totalExpensesAll, netBalance } = useMemo(() => {
    let inc = 0;
    let coachPay = 0;
    for (const p of payments) {
      if (p.type === 'coach_settlement') {
        coachPay += p.amount;
      } else {
        inc += p.amount;
      }
    }
    let opExp = 0;
    for (const e of expenses) {
      opExp += e.amount;
    }
    const totalExp = opExp + coachPay;
    return {
      totalIncomes: inc,
      totalCoachPayouts: coachPay,
      totalExpensesAll: totalExp,
      netBalance: inc - totalExp,
    };
  }, [payments, expenses]);

  // Unified items list memoized for fast filtering and pagination
  const filteredItems = useMemo(() => {
    const list: UnifiedLedgerItem[] = [];

    if (activeSubTab === 'all' || activeSubTab === 'incomes' || activeSubTab === 'coach_payouts') {
      for (const p of payments) {
        const isPayout = p.type === 'coach_settlement';
        if (activeSubTab === 'incomes' && isPayout) continue;
        if (activeSubTab === 'coach_payouts' && !isPayout) continue;

        list.push({
          id: p.id,
          kind: isPayout ? 'coach_settlement' : 'income',
          title: p.studentName || p.coachName || p.description,
          subtitle: p.description,
          amount: p.amount,
          date: p.date,
          paymentMethod: p.paymentMethod,
          receiptNumber: p.receiptNumber,
          rawType: p.type,
        });
      }
    }

    if (activeSubTab === 'all' || activeSubTab === 'expenses') {
      for (const e of expenses) {
        list.push({
          id: e.id,
          kind: 'expense',
          title: e.title,
          subtitle: `پرداخت به: ${e.paidTo} (${e.category})`,
          amount: e.amount,
          date: e.date,
          paymentMethod: e.paymentMethod,
          receiptNumber: e.receiptNumber || '--',
          rawType: 'expense',
        });
      }
    }

    if (!searchTerm.trim()) return list;

    const term = searchTerm.trim().toLowerCase();
    return list.filter(item => 
      item.title.toLowerCase().includes(term) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(term)) ||
      item.receiptNumber.toLowerCase().includes(term) ||
      item.date.includes(term)
    );
  }, [payments, expenses, activeSubTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage]);

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

  const handleDeleteItem = (item: UnifiedLedgerItem) => {
    if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
      if (item.kind === 'expense') {
        deleteExpense(item.id);
      } else {
        deletePayment(item.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <GlassPageHeader
        title={t.financesTitle}
        subtitle={t.financesDesc}
        icon={<ReceiptText className="w-6 h-6 text-[var(--gym-brand,#10b981)]" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <GlassButton
              variant="secondary"
              size="md"
              icon={<Download className="h-4 w-4" />}
              onClick={handleExportCsv}
            >
              {t.exportCsv}
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="md"
              icon={<Plus className="h-4 w-4 text-rose-400" />}
              onClick={() => setIsExpenseModalOpen(true)}
            >
              {t.addExpense}
            </GlassButton>
            <GlassButton
              variant="neon"
              size="md"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setIsIncomeModalOpen(true)}
            >
              {t.addIncome}
            </GlassButton>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassStatCard
          title={t.totalIncomes}
          value={formatMoney(totalIncomes)}
          icon={<ArrowUpRight className="h-6 w-6 text-emerald-400" />}
          badge={{ text: 'شهریه و بوفه', variant: 'success' }}
        />

        <GlassStatCard
          title={`${t.totalExpenses} (جاری + مربیان)`}
          value={formatMoney(totalExpensesAll)}
          icon={<ArrowDownRight className="h-6 w-6 text-rose-400" />}
          badge={{ text: 'مخارج باشگاه', variant: 'danger' }}
        />

        <GlassStatCard
          title={t.balanceNet}
          value={formatMoney(netBalance)}
          icon={<DollarSign className="h-6 w-6 text-[var(--gym-brand,#10b981)]" />}
          neonAccent={netBalance >= 0}
          badge={{
            text: netBalance >= 0 ? 'سود خالص ✓' : 'کسری تراز',
            variant: netBalance >= 0 ? 'success' : 'danger'
          }}
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <GlassCard variant="subtle" className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setActiveSubTab('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-[var(--gym-brand,#10b981)] text-stone-950 shadow-xs'
                  : 'glass-subtle text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              کلیه تراکنش‌ها ({payments.length + expenses.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('incomes'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'incomes'
                  ? 'bg-emerald-500 text-stone-950 shadow-xs'
                  : 'glass-subtle text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              درآمدها ({payments.filter(p => p.type !== 'coach_settlement').length})
            </button>
            <button
              onClick={() => { setActiveSubTab('expenses'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'expenses'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'glass-subtle text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              هزینه‌های جاری ({expenses.length})
            </button>
            <button
              onClick={() => { setActiveSubTab('coach_payouts'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'coach_payouts'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'glass-subtle text-[var(--gym-text-secondary)] hover:text-[var(--gym-text)]'
              }`}
            >
              تسویه مربیان ({payments.filter(p => p.type === 'coach_settlement').length})
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--gym-text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="جستجو شرح، شماره پیگیری..."
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] focus:border-[var(--gym-brand,#10b981)] focus:ring-1 focus:ring-[var(--gym-brand,#10b981)] outline-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Ledger Table */}
      <GlassCard variant="regular" className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="glass-subtle text-[var(--gym-text-secondary)] font-semibold border-b border-[var(--gym-border)]">
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
            <tbody className="divide-y divide-[var(--gym-border)]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--gym-text-muted)]">
                    هیچ تراکنشی با معیارهای فعلی یافت نشد.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isExpense = item.kind === 'expense';
                  const isPayout = item.kind === 'coach_settlement';
                  return (
                    <tr key={item.id} className="hover:bg-[var(--gym-surface-glass)] transition-colors">
                      <td className="p-3.5">
                        <GlassBadge
                          variant={isExpense ? 'danger' : isPayout ? 'info' : 'success'}
                          size="sm"
                        >
                          {isExpense ? 'هزینه جاری' : isPayout ? 'تسویه مربی' : 'درآمد / شهریه'}
                        </GlassBadge>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[var(--gym-text,#fff)]">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[10px] text-[var(--gym-text-muted)]">{item.subtitle}</div>
                        )}
                      </td>
                      <td className={`p-3.5 font-mono font-bold text-sm ${
                        isExpense || isPayout ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {isExpense || isPayout ? '-' : '+'}{formatMoney(item.amount)}
                      </td>
                      <td className="p-3.5 text-[var(--gym-text-secondary)]">{item.paymentMethod}</td>
                      <td className="p-3.5 text-[var(--gym-text-secondary)]">{item.date}</td>
                      <td className="p-3.5 font-mono text-[var(--gym-text-muted)]">{item.receiptNumber}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 rounded-lg text-[var(--gym-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="حذف تراکنش"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3.5 border-t border-[var(--gym-border)] text-xs text-[var(--gym-text-muted)]">
            <span>صفحه {formatNum(currentPage)} از {formatNum(totalPages)} ({formatNum(filteredItems.length)} تراکنش)</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-[var(--gym-border)] glass-subtle disabled:opacity-40 cursor-pointer text-[var(--gym-text)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-[var(--gym-border)] glass-subtle disabled:opacity-40 cursor-pointer text-[var(--gym-text)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <GlassModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title={t.addExpense}
          subtitle="ثبت هزینه جدید جاری، تعمیرات، اجاره، تجهیزات یا قبوض"
          icon={<ArrowDownRight className="w-5 h-5 text-rose-400" />}
        >
          <form onSubmit={handleAddExpenseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">عنوان هزینه *</label>
              <input
                type="text"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="اجاره، تعمیر دستگاه، قبوض و..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-sm focus:border-[var(--gym-brand,#10b981)] outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">دسته‌بندی</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)] text-sm"
                >
                  <option value="rent" className="bg-stone-900 text-white">{t.catRent}</option>
                  <option value="salary" className="bg-stone-900 text-white">{t.catSalary}</option>
                  <option value="utility" className="bg-stone-900 text-white">{t.catUtility}</option>
                  <option value="equipment" className="bg-stone-900 text-white">{t.catEquipment}</option>
                  <option value="maintenance" className="bg-stone-900 text-white">{t.catMaintenance}</option>
                  <option value="buffet_stock" className="bg-stone-900 text-white">{t.catBuffet}</option>
                  <option value="other" className="bg-stone-900 text-white">{t.catOther}</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">مبلغ ({t.currency}) *</label>
                <input
                  type="number"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm font-bold text-rose-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">پرداخت شده به</label>
                <input
                  type="text"
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  placeholder="مالک، تکنسین، فروشنده..."
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">روش پرداخت</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)] text-sm"
                >
                  <option value="card_transfer" className="bg-stone-900 text-white">کارت به کارت</option>
                  <option value="pos" className="bg-stone-900 text-white">کارتخوان</option>
                  <option value="cash" className="bg-stone-900 text-white">نقدی</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">توضیحات بیشتر</label>
              <input
                type="text"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="بابت فاکتور شماره..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-sm"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpenseModalOpen(false)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                className="!bg-rose-600 hover:!bg-rose-500 !text-white"
                type="submit"
              >
                ثبت هزینه
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

      {/* Add Income Modal */}
      {isIncomeModalOpen && (
        <GlassModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          title={`${t.addIncome} (بوفه / مکمل / سایر)`}
          subtitle="ثبت درآمد آزاد فروشگاه، بوفه یا درآمدهای متفرقه باشگاه"
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-400" />}
        >
          <form onSubmit={handleAddIncomeSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">نوع درآمد</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] bg-[var(--gym-surface)] text-sm"
                >
                  <option value="supplement_sale" className="bg-stone-900 text-white">فروش مکمل ورزشی</option>
                  <option value="buffet" className="bg-stone-900 text-white">درآمد بوفه و نوشیدنی</option>
                  <option value="other_income" className="bg-stone-900 text-white">سایر درآمدهای متفرقه</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">مبلغ ({t.currency}) *</label>
                <input
                  type="number"
                  value={incAmount || ''}
                  onChange={(e) => setIncAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] font-mono text-sm font-bold text-emerald-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[var(--gym-text-secondary)] mb-1">شرح و توضیحات</label>
              <input
                type="text"
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                placeholder="فروش پروتئین وی، آبمیوه طبیعی و..."
                className="w-full px-3 py-2 rounded-xl glass-subtle border-[var(--gym-border)] text-[var(--gym-text)] text-sm"
                required
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsIncomeModalOpen(false)}
              >
                انصراف
              </GlassButton>
              <GlassButton
                variant="neon"
                size="sm"
                type="submit"
              >
                ثبت درآمد
              </GlassButton>
            </div>
          </form>
        </GlassModal>
      )}

    </div>
  );
};
