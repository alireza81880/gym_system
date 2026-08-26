import { Student } from '../types';

/**
 * Member & Registration Logic Service
 * Atomic sequential member numbering, collision prevention, label management
 */
export class MemberService {
  /**
   * Calculate next sequential member number: MAX(all existing member numbers) + 1
   * If list is empty: 1
   * Preserves historical legacy numbers (e.g. 929, 930 -> next 931)
   */
  static calculateNextMemberNumber(existingMembers: Student[]): string {
    if (!existingMembers || existingMembers.length === 0) {
      return '1';
    }

    let maxNumber = 0;
    for (const member of existingMembers) {
      if (member.memberNumber) {
        // Extract numeric digits safely
        const digitsOnly = member.memberNumber.toString().replace(/[^0-9]/g, '');
        const parsed = parseInt(digitsOnly, 10);
        if (!isNaN(parsed) && parsed > maxNumber) {
          maxNumber = parsed;
        }
      }
    }

    // Next is MAX + 1 (or 1 if none found)
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
   * Check if national ID already exists among active members
   */
  static isNationalIdDuplicate(nationalId: string, existingMembers: Student[], ignoreMemberId?: string): boolean {
    if (!nationalId || nationalId.trim() === '') return false;
    const cleanId = nationalId.trim();
    return existingMembers.some(m => m.id !== ignoreMemberId && m.nationalId && m.nationalId.trim() === cleanId);
  }

  /**
   * Check if phone already exists among active members
   */
  static isPhoneDuplicate(phone: string, existingMembers: Student[], ignoreMemberId?: string): boolean {
    if (!phone || phone.trim() === '') return false;
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    return existingMembers.some(m => {
      if (m.id === ignoreMemberId || !m.phone) return false;
      const existingClean = m.phone.replace(/[^0-9]/g, '');
      return existingClean === cleanPhone;
    });
  }
}
