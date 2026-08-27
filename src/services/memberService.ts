import { Student } from '../types';
import { ValidationService } from './validationService';

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType?: 'nationalId' | 'phone' | 'memberNumber' | 'name';
  reason?: string;
  matchedMember?: Student;
}

/**
 * Member & Registration Logic Service
 * Atomic sequential member numbering, collision prevention, duplicate detection, and normalization
 */
export class MemberService {
  private static HIGH_WATER_MARK_KEY = 'gym_highest_member_number';

  /**
   * Get highest allocated member sequence number across history and active members
   */
  static getHighestAllocatedSequence(): number {
    try {
      const stored = localStorage.getItem(this.HIGH_WATER_MARK_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage unavailable
    }
    return 0;
  }

  /**
   * Save highest allocated member number to prevent sequence regression upon member deletion
   */
  static recordAllocatedNumber(num: number): void {
    if (!num || isNaN(num) || num <= 0) return;
    try {
      const currentHighest = this.getHighestAllocatedSequence();
      if (num > currentHighest) {
        localStorage.setItem(this.HIGH_WATER_MARK_KEY, String(num));
      }
    } catch {
      // LocalStorage unavailable
    }
  }

  /**
   * Calculate next sequential member number: MAX(all existing member numbers, stored highest watermark) + 1
   * If list is empty and no history: 1
   * Preserves historical legacy numbers (e.g. 929, 930 -> next 931)
   */
  static calculateNextMemberNumber(existingMembers: Student[]): string {
    let maxNumber = this.getHighestAllocatedSequence();

    if (existingMembers && existingMembers.length > 0) {
      for (const member of existingMembers) {
        if (member.memberNumber) {
          const digitsOnly = member.memberNumber.toString().replace(/[^0-9]/g, '');
          const parsed = parseInt(digitsOnly, 10);
          if (!isNaN(parsed) && parsed > maxNumber) {
            maxNumber = parsed;
          }
        }
      }
    }

    const nextNum = maxNumber > 0 ? maxNumber + 1 : 1;
    return String(nextNum);
  }

  /**
   * Split full name into first and last name if needed
   */
  static parseFullName(fullName: string): { firstName: string; lastName: string } {
    const trimmed = fullName.trim();
    if (!trimmed) return { firstName: '', lastName: '' };

    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }

  /**
   * Comprehensive Duplicate Detection
   * Checks nationalId, phone, memberNumber, and exact name match
   */
  static detectDuplicate(
    input: {
      nationalId?: string;
      phone?: string;
      memberNumber?: string;
      fullName?: string;
    },
    existingMembers: Student[],
    ignoreMemberId?: string
  ): DuplicateDetectionResult {
    if (!existingMembers || existingMembers.length === 0) {
      return { isDuplicate: false };
    }

    const cleanNationalId = input.nationalId ? input.nationalId.trim().replace(/[^0-9]/g, '') : '';
    const cleanPhone = input.phone ? ValidationService.normalizeMobilePhone(input.phone) : '';
    const cleanMemberNum = input.memberNumber ? input.memberNumber.toString().trim() : '';
    const cleanFullName = input.fullName ? input.fullName.trim().toLowerCase() : '';

    for (const member of existingMembers) {
      if (ignoreMemberId && member.id === ignoreMemberId) continue;

      // 1. National ID Check (high confidence)
      if (cleanNationalId && member.nationalId) {
        const memberCleanNationalId = member.nationalId.trim().replace(/[^0-9]/g, '');
        if (memberCleanNationalId && memberCleanNationalId === cleanNationalId) {
          return {
            isDuplicate: true,
            matchType: 'nationalId',
            reason: `کد ملی وارد شده (${input.nationalId}) با عضو موجود مطابقت دارد.`,
            matchedMember: member,
          };
        }
      }

      // 2. Phone Check (high confidence)
      if (cleanPhone && member.phone) {
        const memberCleanPhone = ValidationService.normalizeMobilePhone(member.phone);
        if (memberCleanPhone && memberCleanPhone === cleanPhone) {
          return {
            isDuplicate: true,
            matchType: 'phone',
            reason: `شماره تلفن (${input.phone}) قبلاً برای این عضو ثبت شده است.`,
            matchedMember: member,
          };
        }
      }

      // 3. Member Number Check (if provided)
      if (cleanMemberNum && member.memberNumber && member.memberNumber.trim() === cleanMemberNum) {
        return {
          isDuplicate: true,
          matchType: 'memberNumber',
          reason: `شماره عضویت (${cleanMemberNum}) قبلاً اختصاص یافته است.`,
          matchedMember: member,
        };
      }

      // 4. Exact Full Name Check (secondary signal)
      if (cleanFullName && member.fullName && member.fullName.trim().toLowerCase() === cleanFullName) {
        return {
          isDuplicate: true,
          matchType: 'name',
          reason: `عضوی با نام دقیق «${member.fullName}» در سیستم موجود است.`,
          matchedMember: member,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Check if national ID already exists among active members
   */
  static isNationalIdDuplicate(nationalId: string, existingMembers: Student[], ignoreMemberId?: string): boolean {
    if (!nationalId || nationalId.trim() === '') return false;
    const cleanId = nationalId.trim().replace(/[^0-9]/g, '');
    return existingMembers.some(m => {
      if (m.id === ignoreMemberId || !m.nationalId) return false;
      return m.nationalId.trim().replace(/[^0-9]/g, '') === cleanId;
    });
  }

  /**
   * Check if phone already exists among active members
   */
  static isPhoneDuplicate(phone: string, existingMembers: Student[], ignoreMemberId?: string): boolean {
    if (!phone || phone.trim() === '') return false;
    const cleanPhone = ValidationService.normalizeMobilePhone(phone);
    return existingMembers.some(m => {
      if (m.id === ignoreMemberId || !m.phone) return false;
      const existingClean = ValidationService.normalizeMobilePhone(m.phone);
      return existingClean === cleanPhone;
    });
  }
}
