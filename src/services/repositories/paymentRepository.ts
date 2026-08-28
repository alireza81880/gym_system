import { PaymentRecord, ExpenseRecord } from '../../types';
import { initialPayments, initialExpenses } from '../../data/initialData';
import { PersistenceManager } from './persistenceManager';
import { PaginatedResult } from './memberRepository';

export interface FinanceSummaryMetrics {
  totalRevenue: number;
  totalCoachPayouts: number;
  totalOperationalExpenses: number;
  totalExpensesAll: number;
  netProfit: number;
}

export class PaymentRepository {
  private static paymentsList: PaymentRecord[] = [];
  private static expensesList: ExpenseRecord[] = [];
  private static isInitialized = false;

  // Cached summary
  private static cachedSummary: FinanceSummaryMetrics = {
    totalRevenue: 0,
    totalCoachPayouts: 0,
    totalOperationalExpenses: 0,
    totalExpensesAll: 0,
    netProfit: 0,
  };

  static initialize(): void {
    if (this.isInitialized) return;
    const storedPayments = PersistenceManager.get<PaymentRecord[]>('payments', initialPayments);
    const storedExpenses = PersistenceManager.get<ExpenseRecord[]>('expenses', initialExpenses);
    this.rebuildIndex(storedPayments, storedExpenses);
    this.isInitialized = true;
  }

  static rebuildIndex(payments: PaymentRecord[], expenses: ExpenseRecord[]): void {
    this.paymentsList = [...payments];
    this.expensesList = [...expenses];
    this.recalculateSummary();
  }

  private static recalculateSummary(): void {
    let rev = 0;
    let coachPayouts = 0;

    for (const p of this.paymentsList) {
      if (p.type === 'coach_settlement') {
        coachPayouts += p.amount;
      } else {
        rev += p.amount;
      }
    }

    let operational = 0;
    for (const e of this.expensesList) {
      operational += e.amount;
    }

    const totalExp = operational + coachPayouts;
    const profit = rev - totalExp;

    this.cachedSummary = {
      totalRevenue: rev,
      totalCoachPayouts: coachPayouts,
      totalOperationalExpenses: operational,
      totalExpensesAll: totalExp,
      netProfit: profit,
    };
  }

  static getAllPayments(): PaymentRecord[] {
    this.initialize();
    return this.paymentsList;
  }

  static getAllExpenses(): ExpenseRecord[] {
    this.initialize();
    return this.expensesList;
  }

  static getSummary(): FinanceSummaryMetrics {
    this.initialize();
    return this.cachedSummary;
  }

  static getFinancialMetrics(): { totalRevenue: number; totalCoachPayouts: number; totalExpenses: number; netProfit: number } {
    this.initialize();
    return {
      totalRevenue: this.cachedSummary.totalRevenue,
      totalCoachPayouts: this.cachedSummary.totalCoachPayouts,
      totalExpenses: this.cachedSummary.totalExpensesAll,
      netProfit: this.cachedSummary.netProfit,
    };
  }

  static getMemberPayments(studentId: string): PaymentRecord[] {
    this.initialize();
    return this.paymentsList.filter(p => p.studentId === studentId);
  }

  static addPayment(payment: PaymentRecord): void {
    this.initialize();
    this.paymentsList = [payment, ...this.paymentsList];
    this.recalculateSummary();
    PersistenceManager.setBatched('payments', this.paymentsList);
  }

  static deletePayment(id: string): void {
    this.initialize();
    this.paymentsList = this.paymentsList.filter(p => p.id !== id);
    this.recalculateSummary();
    PersistenceManager.setBatched('payments', this.paymentsList);
  }

  static addExpense(expense: ExpenseRecord): void {
    this.initialize();
    this.expensesList = [expense, ...this.expensesList];
    this.recalculateSummary();
    PersistenceManager.setBatched('expenses', this.expensesList);
  }

  static updateExpense(id: string, partial: Partial<ExpenseRecord>): void {
    this.initialize();
    const idx = this.expensesList.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.expensesList[idx] = { ...this.expensesList[idx], ...partial };
      this.recalculateSummary();
      PersistenceManager.setBatched('expenses', this.expensesList);
    }
  }

  static deleteExpense(id: string): void {
    this.initialize();
    this.expensesList = this.expensesList.filter(e => e.id !== id);
    this.recalculateSummary();
    PersistenceManager.setBatched('expenses', this.expensesList);
  }

  static queryPaymentsPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
  } = {}): PaginatedResult<PaymentRecord> {
    this.initialize();
    const { page = 1, pageSize = 25, search = '', type = 'all' } = params;

    let filtered = this.paymentsList;
    const hasSearch = search && search.trim() !== '';
    const hasType = type && type !== 'all';

    if (hasSearch || hasType) {
      const q = hasSearch ? search.trim().toLowerCase() : '';
      filtered = this.paymentsList.filter(p => {
        if (hasSearch) {
          const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
          const matchStd = p.studentId ? p.studentId.toLowerCase().includes(q) : false;
          if (!matchDesc && !matchStd) return false;
        }
        if (hasType && p.type !== type) return false;
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: safePage,
      pageSize,
    };
  }

  static batchSet(payments: PaymentRecord[], expenses: ExpenseRecord[]): void {
    this.rebuildIndex(payments, expenses);
    PersistenceManager.setBatched('payments', this.paymentsList);
    PersistenceManager.setBatched('expenses', this.expensesList);
  }
}
