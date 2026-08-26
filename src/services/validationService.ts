/**
 * Iranian Regional Validation & Normalization Service
 */

export class ValidationService {
  /**
   * Convert Persian and Arabic digits to ASCII digits
   */
  static toEnglishDigits(str: string | number | null | undefined): string {
    if (str === null || str === undefined) return '';
    const s = String(str);
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = '';
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      const pIndex = persianDigits.indexOf(char);
      if (pIndex !== -1) {
        result += pIndex;
        continue;
      }
      const aIndex = arabicDigits.indexOf(char);
      if (aIndex !== -1) {
        result += aIndex;
        continue;
      }
      result += char;
    }
    return result;
  }

  /**
   * Validate Iranian National ID (کد ملی)
   */
  static isValidNationalId(code: string | number): boolean {
    if (!code) return false;
    let clean = this.toEnglishDigits(code).replace(/\D/g, '');
    
    // Pad with leading zeros if length is 8 or 9 digits
    if (clean.length >= 8 && clean.length < 10) {
      clean = clean.padStart(10, '0');
    }
    if (clean.length !== 10) return false;

    // Check for repetitive digits (e.g. 0000000000, 1111111111)
    if (/^(\d)\1{9}$/.test(clean)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    const remainder = sum % 11;
    const checkDigit = parseInt(clean.charAt(9), 10);

    if (remainder < 2) {
      return checkDigit === remainder;
    } else {
      return checkDigit === 11 - remainder;
    }
  }

  /**
   * Normalize Iranian Mobile Number to standard 09xxxxxxxxx
   */
  static normalizeMobilePhone(phone: string | number): string {
    if (!phone) return '';
    let clean = this.toEnglishDigits(phone).replace(/\D/g, '');
    
    if (clean.startsWith('00989')) {
      clean = '0' + clean.slice(4);
    } else if (clean.startsWith('989')) {
      clean = '0' + clean.slice(2);
    } else if (clean.startsWith('9') && clean.length === 10) {
      clean = '0' + clean;
    }
    return clean;
  }

  /**
   * Validate Iranian Mobile Phone (09xxxxxxxxx)
   */
  static isValidMobilePhone(phone: string | number): boolean {
    const normalized = this.normalizeMobilePhone(phone);
    return /^09\d{9}$/.test(normalized);
  }

  /**
   * Safe numeric parser (handles Persian digits, commas, currency strings)
   */
  static parseNumber(val: any, fallback = 0): number {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (!val) return fallback;
    const clean = this.toEnglishDigits(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? fallback : num;
  }
}
