/**
 * Gym OS - License Calculation & Formatting Utilities
 * Authoritative client-side calculation helpers for license duration, expiration,
 * and presentation formats.
 */

import { LicenseType, LicenseRecord } from '../types/license';

/**
 * Calculates authoritative ISO expires_at timestamp from created_at + duration_months.
 * Returns null for lifetime licenses (perpetual).
 */
export function calculateLicenseExpiry(
  createdAt: Date | string,
  durationMonths: number | null | undefined
): string | null {
  if (durationMonths === null || durationMonths === undefined || durationMonths <= 0) {
    return null;
  }
  const date = new Date(createdAt);
  date.setMonth(date.getMonth() + Number(durationMonths));
  return date.toISOString();
}

/**
 * Human-readable Persian duration label
 */
export function getDurationLabel(licenseType: LicenseType, durationMonths: number | null | undefined): string {
  if (licenseType === 'LIFETIME' || durationMonths === null || durationMonths === undefined || durationMonths <= 0) {
    return 'مادام‌العمر (بدون انقضا)';
  }
  if (licenseType === 'TRIAL') {
    return `آزمایشی (${durationMonths} ماهه)`;
  }
  if (durationMonths === 12) {
    return '۱ ساله (۱۲ ماه)';
  }
  if (durationMonths === 24) {
    return '۲ ساله (۲۴ ماه)';
  }
  if (durationMonths === 36) {
    return '۳ ساله (۳۶ ماه)';
  }
  return `${durationMonths} ماهه`;
}

/**
 * Formats ISO date to Persian Shamsi date string
 */
export function formatPersianDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'نامشخص / دائمی';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return 'نامشخص';
    return d.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Generates formatted plain-text license receipt for sharing with customer
 */
export function generateLicenseReceipt(lic: LicenseRecord): string {
  const expiryStr = lic.expires_at ? formatPersianDate(lic.expires_at) : 'مادام‌العمر (نامحدود)';
  const createdStr = formatPersianDate(lic.created_at);
  const durLabel = getDurationLabel(lic.license_type, lic.duration_months);

  return `========================================
شناسنامه رسمی لایسنس نرم‌افزار Gym OS
========================================
خریدار / باشگاه : ${lic.customer_name}
شناسه لایسنس    : ${lic.license_key}
طرح و ویرایش    : ${lic.plan}
نوع لایسنس      : ${durLabel}
تعداد مجاز رایانه : ${lic.max_devices} دستگاه
کد بازیابی سخت‌افزار : ${lic.recovery_code}
تاریخ صدور      : ${createdStr}
تاریخ انقضا     : ${expiryStr}
وضعیت اولیه     : ${lic.status}
========================================
نکته امنیتی: کد بازیابی را فقط در اختیار مدیریت مجموعه قرار دهید.`;
}
