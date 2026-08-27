/**
 * Financial Calculation Service
 * Centralized financial formulas for packages, discounts, received amounts, remaining debts, and credit
 */

export interface PaymentCalculationResult {
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  receivedAmount: number;
  remainingDebt: number;
  creditAmount: number;
  isFullPayment: boolean;
  isOverpaid: boolean;
  isPartialPayment: boolean;
}

export class FinancialCalculationService {
  /**
   * Calculate financial breakdown safely with integer precision
   */
  static calculate(
    basePrice: number,
    receivedAmount: number,
    discountAmount: number = 0
  ): PaymentCalculationResult {
    const safeBase = Math.max(0, Math.round(Number(basePrice) || 0));
    const safeDiscount = Math.max(0, Math.min(safeBase, Math.round(Number(discountAmount) || 0)));
    const finalPrice = Math.max(0, safeBase - safeDiscount);
    const safeReceived = Math.max(0, Math.round(Number(receivedAmount) || 0));

    const remainingDebt = Math.max(0, finalPrice - safeReceived);
    const creditAmount = safeReceived > finalPrice ? safeReceived - finalPrice : 0;

    return {
      basePrice: safeBase,
      discountAmount: safeDiscount,
      finalPrice,
      receivedAmount: safeReceived,
      remainingDebt,
      creditAmount,
      isFullPayment: safeReceived >= finalPrice && finalPrice > 0,
      isOverpaid: safeReceived > finalPrice,
      isPartialPayment: safeReceived > 0 && safeReceived < finalPrice,
    };
  }

  /**
   * Calculate debt settlement after receiving partial or full payment
   */
  static calculateDebtSettlement(
    currentDebt: number,
    paymentAmount: number
  ): { newRemainingDebt: number; creditAmount: number } {
    const safeDebt = Math.max(0, Math.round(Number(currentDebt) || 0));
    const safePayment = Math.max(0, Math.round(Number(paymentAmount) || 0));
    const newRemainingDebt = Math.max(0, safeDebt - safePayment);
    const creditAmount = safePayment > safeDebt ? safePayment - safeDebt : 0;

    return {
      newRemainingDebt,
      creditAmount,
    };
  }
}
