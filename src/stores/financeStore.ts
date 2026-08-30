import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { PaymentRecord, ExpenseRecord, PaymentMethod, FinancialKPIs, FinancialCharge, StaffUser } from '../types';
import { PaymentRepository, FinanceSummaryMetrics } from '../services/repositories/paymentRepository';
import { PaginatedResult } from '../services/repositories/memberRepository';
import { FinanceService } from '../services/finance/financeService';
import { generateFinancialId, generateReceiptNumber } from '../utils/idGenerator';
import { DateService } from '../services/dateService';
import { settingsStore } from './settingsStore';

export interface FinanceState {
  version: number;
  summary: FinanceSummaryMetrics;
  kpis: FinancialKPIs;
}

export const financeStore = createStore<FinanceState>({
  version: 1,
  summary: PaymentRepository.getSummary(),
  kpis: FinanceService.getFinancialMetrics(),
});

export function notifyFinanceChange(): void {
  financeStore.setState({
    version: financeStore.getState().version + 1,
    summary: PaymentRepository.getSummary(),
    kpis: FinanceService.getFinancialMetrics(),
  });
}

export const financeActions = {
  addPayment(paymentData: Omit<PaymentRecord, 'id'>): PaymentRecord {
    const payment: PaymentRecord = {
      ...paymentData,
      id: generateFinancialId('pay'),
      receiptNumber: paymentData.receiptNumber || generateReceiptNumber(),
      timestamp: paymentData.timestamp || new Date().toISOString(),
      status: paymentData.status || 'completed',
    };
    PaymentRepository.addPayment(payment);
    notifyFinanceChange();
    return payment;
  },

  deletePayment(id: string): void {
    PaymentRepository.deletePayment(id);
    notifyFinanceChange();
  },

  refundPayment(paymentId: string, amount: number, reason: string, recordedBy?: string): { refundTransaction: PaymentRecord; originalPayment: PaymentRecord } {
    const actor = settingsStore.getState().currentUser;
    const res = FinanceService.refundPayment({
      paymentId,
      refundAmount: amount,
      reason,
      recordedBy: recordedBy || actor.fullName,
      actor,
    });
    notifyFinanceChange();
    return res;
  },

  voidPayment(paymentId: string, reason: string, voidedBy?: string): PaymentRecord {
    const actor = settingsStore.getState().currentUser;
    const res = FinanceService.voidPayment({
      paymentId,
      reason,
      voidedBy: voidedBy || actor.fullName,
      actor,
    });
    notifyFinanceChange();
    return res;
  },

  allocatePayment(params: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    description?: string;
    recordedBy?: string;
    branchId?: string;
  }): { payment: PaymentRecord; updatedCharges: FinancialCharge[] } {
    const res = FinanceService.allocatePayment(params);
    notifyFinanceChange();
    return res;
  },

  recordMembershipSale(params: Parameters<typeof FinanceService.recordMembershipSale>[0]) {
    const res = FinanceService.recordMembershipSale(params);
    notifyFinanceChange();
    return res;
  },

  addExpense(expenseData: Omit<ExpenseRecord, 'id'>): ExpenseRecord {
    const expense: ExpenseRecord = {
      ...expenseData,
      id: generateFinancialId('exp'),
      receiptNumber: expenseData.receiptNumber || generateReceiptNumber('BNK'),
    };
    PaymentRepository.addExpense(expense);
    notifyFinanceChange();
    return expense;
  },

  updateExpense(id: string, partial: Partial<ExpenseRecord>): void {
    PaymentRepository.updateExpense(id, partial);
    notifyFinanceChange();
  },

  deleteExpense(id: string): void {
    PaymentRepository.deleteExpense(id);
    notifyFinanceChange();
  },

  settleCoachPayment(
    coachId: string,
    coachName: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes = ''
  ): void {
    PaymentRepository.addPayment({
      id: generateFinancialId('pay-coach'),
      tenantId: 'gym-org-1',
      branchId: 'branch-tehran-central',
      coachId,
      coachName,
      amount,
      date: DateService.getTodayJalali(),
      timestamp: new Date().toISOString(),
      paymentMethod,
      type: 'coach_settlement',
      description: notes || `تسویه حساب پورسانت مربی (${coachName})`,
      receiptNumber: generateReceiptNumber('CSH'),
      recordedBy: 'مدیریت',
      status: 'completed',
    });
    notifyFinanceChange();
  },

  batchSet(payments: PaymentRecord[], expenses: ExpenseRecord[]): void {
    PaymentRepository.batchSet(payments, expenses);
    notifyFinanceChange();
  }
};

export function useFinanceStore<S = FinanceState>(selector?: (state: FinanceState) => S): S {
  return useStore(financeStore, selector);
}

export function useFinance() {
  const version = useStore(financeStore, s => s.version);
  const summary = useStore(financeStore, s => s.summary);
  const kpis = useStore(financeStore, s => s.kpis);
  const payments = useMemo(() => PaymentRepository.getAllPayments(), [version]);
  const expenses = useMemo(() => PaymentRepository.getAllExpenses(), [version]);

  return {
    version,
    summary,
    kpis,
    totalRevenue: summary.totalRevenue,
    totalExpenses: summary.totalExpensesAll,
    totalExpensesAll: summary.totalExpensesAll,
    netIncome: summary.netProfit,
    netProfit: summary.netProfit,
    totalCoachPayouts: summary.totalCoachPayouts,
    totalOperationalExpenses: summary.totalOperationalExpenses,
    todayRevenue: kpis.collectedToday,
    todaySales: kpis.salesToday,
    payments,
    expenses,
    ...financeActions,
  };
}

export function useFinanceMetrics(options?: { branchId?: string; targetDate?: string }): FinancialKPIs {
  const version = useStore(financeStore, s => s.version);
  return useMemo(() => {
    return FinanceService.getFinancialMetrics(options);
  }, [version, options?.branchId, options?.targetDate]);
}

export function usePaginatedPayments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}): PaginatedResult<PaymentRecord> {
  const version = useStore(financeStore, s => s.version);

  return useMemo(() => {
    return PaymentRepository.queryPaymentsPaginated(params);
  }, [version, params.page, params.pageSize, params.search, params.type]);
}
