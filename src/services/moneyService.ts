/**
 * Money & Financial Currency Service
 * Clean numeric parsing, Toman/Rial formatting, Persian/English digits, and input sanitization
 */

export class MoneyService {
  /**
   * Format numeric amount with thousands separator and currency unit (e.g. 2800000 -> "2,800,000 تومان")
   */
  static format(amount: number | string | null | undefined, unit: string = 'تومان', usePersianDigits: boolean = false): string {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return `0 ${unit}`.trim();
    }
    const num = Math.round(Number(amount));
    const formatted = num.toLocaleString('en-US');
    const result = usePersianDigits ? this.toPersianDigits(formatted) : formatted;
    return unit ? `${result} ${unit}` : result;
  }

  /**
   * Parse user input text with commas or Persian digits into a clean non-negative integer
   */
  static parse(val: string | number | null | undefined): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, Math.round(val));

    // Convert Persian / Arabic digits to standard ASCII
    let sanitized = this.toEnglishDigits(val.toString());
    // Remove all non-numeric characters except minus if negative allowed
    sanitized = sanitized.replace(/[^0-9]/g, '');

    const parsed = parseInt(sanitized, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Convert Latin digits to Persian digits (0-9 -> ۰-۹)
   */
  static toPersianDigits(str: string | number): string {
    if (str === null || str === undefined) return '';
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, (d) => farsiDigits[parseInt(d, 10)]);
  }

  /**
   * Convert Persian and Arabic digits to standard ASCII digits
   */
  static toEnglishDigits(str: string): string {
    if (!str) return '';
    return str
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
  }

  /**
   * Format input while typing with thousands separator
   */
  static formatInputRaw(raw: string | number): string {
    const num = this.parse(raw);
    if (num === 0 && (raw === '' || raw === 0)) return '';
    return num.toLocaleString('en-US');
  }
}
