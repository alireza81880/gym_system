import { ValidationService } from './validationService';

/**
 * Jalali / Persian & Gregorian Date Service
 * Accurate calendar arithmetic, leap year calculation, and Jalali conversions
 */

export class DateService {
  /**
   * Get today's date formatted in Jalali (YYYY/MM/DD)
   */
  static getTodayJalali(): string {
    const today = new Date();
    return this.gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
  }

  /**
   * Get today's date formatted in Gregorian (YYYY-MM-DD)
   */
  static getTodayGregorian(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Format Jalali with Persian month name (e.g. "۱۵ اردیبهشت ۱۴۰۵")
   */
  static formatJalaliReadable(jalaliDateStr: string): string {
    if (!jalaliDateStr) return '';
    const cleanStr = ValidationService.toEnglishDigits(jalaliDateStr);
    const parts = cleanStr.split(/[/ -]/);
    if (parts.length < 3) return jalaliDateStr;

    const months = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (monthIdx >= 0 && monthIdx < 12) {
      return `${day} ${months[monthIdx]} ${year}`;
    }
    return jalaliDateStr;
  }

  /**
   * Add duration in days to a Jalali date string and return accurate end Jalali date string
   */
  static addDaysToJalali(jalaliDateStr: string, daysToAdd: number): string {
    if (!jalaliDateStr || daysToAdd <= 0) return jalaliDateStr;
    const gDate = this.jalaliToGregorianDate(jalaliDateStr);
    gDate.setDate(gDate.getDate() + daysToAdd);
    return this.gregorianToJalali(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
  }

  /**
   * Calculate remaining days between today and a Jalali expiration date
   */
  static getDaysRemaining(expireJalaliDateStr: string): number {
    if (!expireJalaliDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expireDate = this.jalaliToGregorianDate(expireJalaliDateStr);
    expireDate.setHours(0, 0, 0, 0);

    const diffTime = expireDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Algorithm: Gregorian to Jalali conversion
   */
  static gregorianToJalali(gy: number, gm: number, gd: number): string {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let jm: number;
    let jd: number;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }

    const jmStr = String(jm).padStart(2, '0');
    const jdStr = String(jd).padStart(2, '0');
    return `${jy}/${jmStr}/${jdStr}`;
  }

  /**
   * Algorithm: Jalali to Gregorian Date object
   */
  static jalaliToGregorianDate(jalaliStr: string): Date {
    const cleanStr = ValidationService.toEnglishDigits(jalaliStr);
    const parts = cleanStr.split(/[/ -]/);
    const jy = parseInt(parts[0], 10) || 1403;
    const jm = parseInt(parts[1], 10) || 1;
    const jd = parseInt(parts[2], 10) || 1;

    let jy2 = jy + 1595;
    let days = -355668 + (365 * jy2) + (Math.floor(jy2 / 33) * 8) + Math.floor(((jy2 % 33) + 3) / 4) + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (gm = 0; gm < 13; gm++) {
      const v = sal_a[gm];
      if (gd <= v) break;
      gd -= v;
    }

    return new Date(gy, gm - 1, gd);
  }

  /**
   * Format ISO string or date into localized time
   */
  static formatTime(date: Date | string = new Date()): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  }

  /**
   * Normalize any date representation into standard 'YYYY/MM/DD' Jalali format
   */
  static normalizeJalaliDate(input?: string): string {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Convert Persian/Arabic digits to English
    const en = trimmed
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // If ISO date format like "2026-09-03" or "2026-09-03T10:00:00Z"
    if (en.includes('-') && !en.includes('/')) {
      const parsedG = new Date(en);
      if (!isNaN(parsedG.getTime())) {
        return this.gregorianToJalali(parsedG.getFullYear(), parsedG.getMonth() + 1, parsedG.getDate());
      }
    }

    // Split by slash, dash or space
    const parts = en.split(/[/ -]/).filter(Boolean);
    if (parts.length >= 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}/${m}/${d}`;
    }

    return en;
  }

  /**
   * Compare two dates to check if they belong to the exact same Jalali calendar day
   */
  static isSameJalaliDay(date1?: string, date2?: string): boolean {
    if (!date1 || !date2) return false;
    const norm1 = this.normalizeJalaliDate(date1);
    const norm2 = this.normalizeJalaliDate(date2);
    if (!norm1 || !norm2) return false;
    return norm1 === norm2;
  }
}
