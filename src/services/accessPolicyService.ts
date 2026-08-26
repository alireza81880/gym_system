import { Student, MembershipPackage, AccessDecision } from '../types';

export interface AccessPolicyConfig {
  allowEntryWithDebt: boolean;
  maxAllowedDebtTolerated: number; // e.g. 500,000 Tomans
  enforceHoursWindow: boolean;
  allowSameDayMultipleEntries: boolean;
  enforceSessionLimit: boolean;
}

export const defaultAccessPolicyConfig: AccessPolicyConfig = {
  allowEntryWithDebt: true,
  maxAllowedDebtTolerated: 500000,
  enforceHoursWindow: true,
  allowSameDayMultipleEntries: true,
  enforceSessionLimit: true,
};

/**
 * AccessPolicyEngine
 * The core brain that evaluates access requests.
 * Hardware identifies the person -> AccessPolicyEngine decides Allow/Deny.
 */
export class AccessPolicyEngine {
  /**
   * Evaluate a member's access request based on current memberships, debt, hours, and status
   */
  static evaluate(
    member: Student | undefined,
    packages: MembershipPackage[],
    config: AccessPolicyConfig = defaultAccessPolicyConfig,
    currentDateStr?: string,
    currentTimeStr?: string
  ): AccessDecision {
    const timestamp = new Date().toISOString();

    // 1. Unknown / Unregistered Person
    if (!member) {
      return {
        result: 'DENY',
        reasonCode: 'UNKNOWN_IDENTITY',
        messageFa: 'هویت ناشناخته است یا ثبت‌نام در سامانه یافت نشد.',
        messageEn: 'Unknown identity or member not registered.',
        requiresLocker: false,
        timestamp,
      };
    }

    // 2. Member is Suspended
    if (member.status === 'suspended') {
      return {
        result: 'DENY',
        member,
        reasonCode: 'SUSPENDED_MEMBER',
        messageFa: `عضویت ورزشکار «${member.fullName}» توسط مدیریت به حالت تعلیق درآمده است.`,
        messageEn: `Membership for ${member.fullName} is suspended by management.`,
        requiresLocker: false,
        timestamp,
      };
    }

    // 3. Expiration Check
    const today = currentDateStr || new Date().toISOString().split('T')[0];
    const isExpired = member.status === 'expired' || (member.expireDate && member.expireDate < today);

    if (isExpired) {
      return {
        result: 'DENY',
        member,
        reasonCode: 'EXPIRED_MEMBERSHIP',
        messageFa: `اعتبار عضویت «${member.fullName}» در تاریخ ${member.expireDate || 'نامشخص'} منقضی شده است. لطفاً جهت تمدید اقدام نمایید.`,
        messageEn: `Membership for ${member.fullName} expired on ${member.expireDate || 'unknown'}. Renewal required.`,
        requiresLocker: false,
        timestamp,
      };
    }

    // 4. Session Limit Check (for session-based packages)
    const pkg = packages.find(p => p.type === member.packageType || p.id === member.packageType);
    if (config.enforceSessionLimit && pkg && pkg.sessionsCount > 0) {
      if (member.sessionsAttended >= member.sessionsTotal) {
        return {
          result: 'DENY',
          member,
          reasonCode: 'SESSION_LIMIT_REACHED',
          messageFa: `سقف جلسات پکیج «${member.fullName}» (${member.sessionsTotal} جلسه) به پایان رسیده است.`,
          messageEn: `Session limit reached (${member.sessionsTotal} sessions) for ${member.fullName}.`,
          requiresLocker: false,
          timestamp,
        };
      }
    }

    // 5. Allowed Hours Window Check
    const nowTime = currentTimeStr || new Date().toTimeString().slice(0, 5); // "HH:MM"
    if (config.enforceHoursWindow && pkg) {
      if (pkg.allowedHoursStart && pkg.allowedHoursEnd) {
        if (nowTime < pkg.allowedHoursStart || nowTime > pkg.allowedHoursEnd) {
          return {
            result: 'DENY',
            member,
            reasonCode: 'OUTSIDE_ALLOWED_HOURS',
            messageFa: `ساعت مجاز تردد پکیج این ورزشکار بین ${pkg.allowedHoursStart} الی ${pkg.allowedHoursEnd} می‌باشد (ساعت فعلی: ${nowTime}).`,
            messageEn: `Allowed package entry window is ${pkg.allowedHoursStart} - ${pkg.allowedHoursEnd} (Current: ${nowTime}).`,
            requiresLocker: false,
            timestamp,
          };
        }
      }
    }

    // 6. Outstanding Debt Check
    const warnings: string[] = [];
    if (member.remainingDebt > 0) {
      if (!config.allowEntryWithDebt && member.remainingDebt > config.maxAllowedDebtTolerated) {
        return {
          result: 'DENY',
          member,
          reasonCode: 'DEBT_EXCEEDED',
          messageFa: `ورود غیرمجاز: مانده بدهی شهریه «${member.fullName}» مبلغ ${member.remainingDebt.toLocaleString('fa-IR')} تومان است.`,
          messageEn: `Access denied: Outstanding debt is ${member.remainingDebt.toLocaleString()} Tomans.`,
          requiresLocker: false,
          timestamp,
        };
      } else {
        warnings.push(`هشدار بدهی: مبلغ ${member.remainingDebt.toLocaleString('fa-IR')} تومان تسویه نشده است.`);
      }
    }

    // Check if locker is needed
    const requiresLocker = pkg?.includesLocker !== false;

    // Success Decision
    if (warnings.length > 0) {
      return {
        result: 'ALLOW_WITH_WARNING',
        member,
        reasonCode: 'DEBT_TOLERATED_WARNING',
        messageFa: `تردد مجاز با هشدار - خوش آمدید ${member.fullName}. (${warnings.join(' | ')})`,
        messageEn: `Access granted with warning for ${member.fullName}.`,
        requiresLocker,
        warnings,
        timestamp,
      };
    }

    return {
      result: 'ALLOW',
      member,
      reasonCode: 'ACTIVE_MEMBERSHIP',
      messageFa: `تردد مجاز - خوش آمدید، ورزشکار گرامی ${member.fullName}.`,
      messageEn: `Access granted. Welcome, ${member.fullName}.`,
      requiresLocker,
      timestamp,
    };
  }
}
