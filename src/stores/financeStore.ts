import { useMemo } from 'react';
import { createStore, useStore } from './createStore';
import { PaymentRecord, ExpenseRecord, PaymentMethod } from '../types';
import { PaymentRepository, FinanceSummaryMetrics } from '../services/repositories/paymentRepository';
import { PaginatedResult } from '../services/repositories/memberRepository';

export interface FinanceState {
  version: number;
  summary: FinanceSummaryMetrics;
}

export const financeStore = createStore<FinanceState>({
  version: 1,
  summary: PaymentRepository.getSummary(),
});

function notifyFinanceChange(): void {
  financeStore.setState({
    version: financeStore.getState().version + 1,
    summary: PaymentRepository.getSummary(),
  });
}

export const financeActions = {
  addPayment(paymentData: Omit<PaymentRecord, 'id'>): PaymentRecord {
    const payment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    PaymentRepository.addPayment(payment);
    notifyFinanceChange();
    return payment;
  },

  deletePayment(id: string): void {
    PaymentRepository.deletePayment(id);
    notifyFinanceChange();
  },

  addExpense(expenseData: Omit<ExpenseRecord, 'id'>): ExpenseRecord {
    const expense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      id: `pay-settle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: 'gym-org-1',
      branchId: 'branch-tehran-central',
      coachId,
      coachName,
      amount,
      date: new Date().toLocaleDateString('fa-IR'),
      paymentMethod,
      type: 'coach_settlement',
      description: notes || `تسویه حساب پورسانت مربی (${coachName})`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      recordedBy: 'مدیریت',
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
