/**
 * Normalization utilities for Persian/English Gym migration data
 */
export class MigrationNormalizers {
  /**
   * Convert Persian and Arabic digits to standard ASCII English digits
   */
  static toEnglishDigits(str: string | number | undefined | null): string {
    if (str === undefined || str === null) return '';
    const s = String(str);
    return s
      .replace(/[۰٠]/g, '0')
      .replace(/[۱١]/g, '1')
      .replace(/[۲٢]/g, '2')
      .replace(/[۳٣]/g, '3')
      .replace(/[۴٤]/g, '4')
      .replace(/[۵٥]/g, '5')
      .replace(/[۶٦]/g, '6')
      .replace(/[۷٧]/g, '7')
      .replace(/[۸٨]/g, '8')
      .replace(/[۹٩]/g, '9')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
      .trim();
  }

  /**
   * Normalize Iranian mobile phone number to standard 11-digit 09xxxxxxxxx
   */
  static normalizeMobilePhone(phoneStr: string | number | undefined | null): string {
    if (!phoneStr) return '';
    let digits = this.toEnglishDigits(phoneStr).replace(/\D/g, '');

    // +98912... or 0098912... or 98912...
    if (digits.startsWith('0098')) {
      digits = '0' + digits.slice(4);
    } else if (digits.startsWith('98')) {
      digits = '0' + digits.slice(2);
    } else if (digits.length === 10 && digits.startsWith('9')) {
      digits = '0' + digits;
    }

    return digits;
  }

  /**
   * Validate Iranian National ID (کد ملی ۱۰ رقمی با فرمول الگوریتمی معتبر)
   */
  static isValidNationalId(nationalId: string | number | undefined | null): boolean {
    if (!nationalId) return false;
    const code = this.toEnglishDigits(nationalId).replace(/\D/g, '');
    
    // Check length (allow 8-10 with leading zero padding)
    if (code.length < 8 || code.length > 10) return false;
    const padded = code.padStart(10, '0');

    // Reject known invalid repeating sequences
    if (/^(\d)\1{9}$/.test(padded)) return false;

    const check = parseInt(padded[9], 10);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(padded[i], 10) * (10 - i);
    }
    const remainder = sum % 11;

    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
  }

  /**
   * Normalize National ID to clean 10-digit string
   */
  static normalizeNationalId(nationalId: string | number | undefined | null): string {
    if (!nationalId) return '';
    const digits = this.toEnglishDigits(nationalId).replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 10) {
      return digits.padStart(10, '0');
    }
    return digits;
  }

  /**
   * Parse numeric values (removing commas, currency signs, Persian symbols)
   */
  static parseNumber(val: any): number {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = this.toEnglishDigits(val).replace(/[,،\sریال\sتومان]/g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Intelligent Persian Full Name parsing into (firstName, lastName)
   */
  static splitPersianFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName || !fullName.trim()) {
      return { firstName: '', lastName: '' };
    }

    const clean = fullName.replace(/\s+/g, ' ').trim();
    const parts = clean.split(' ');

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    // Common Persian prefixes that belong to the first name
    const firstNamePrefixes = ['سید', 'سیده', 'میر', 'محمد', 'علی', 'امیر', 'رضا', 'حسین', 'مهدی', 'فاطمه', 'زهرا', 'نازنین', 'مهر'];
    
    // Check if parts[0] + parts[1] is a combined first name (e.g., "محمد رضا", "سید علی", "امیر حسین")
    if (parts.length >= 3 && firstNamePrefixes.includes(parts[0])) {
      return {
        firstName: `${parts[0]} ${parts[1]}`,
        lastName: parts.slice(2).join(' ')
      };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }

  /**
   * Normalize date strings (Jalali or Gregorian separators)
   */
  static normalizeDate(dateStr: any): string {
    if (!dateStr) return '';
    const s = this.toEnglishDigits(dateStr).trim();
    // Replace dots, slashes, or dashes with standard slash
    return s.replace(/[.-]/g, '/');
  }

  /**
   * Clean text string (trim, remove non-printable characters)
   */
  static cleanString(str: any): string {
    if (str === undefined || str === null) return '';
    return this.toEnglishDigits(str)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
  }
}
