import { UserRole, PermissionKey, StaffUser } from '../types';
import { AuditService } from './auditService';

export class PermissionDeniedError extends Error {
  public permission: PermissionKey;
  public userRole?: UserRole;
  public attemptedAction?: string;

  constructor(
    permission: PermissionKey,
    userRole?: UserRole,
    attemptedAction?: string,
    messageFa?: string
  ) {
    const defaultMsg = messageFa || `دسترسی غیرمجاز: نقش «${userRole || 'نامشخص'}» فاقد مجوز «${permission}» است.`;
    super(defaultMsg);
    this.name = 'PermissionDeniedError';
    this.permission = permission;
    this.userRole = userRole;
    this.attemptedAction = attemptedAction;
  }
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  gym_owner: 90,
  branch_manager: 70,
  accountant: 50,
  hardware_tech: 50,
  receptionist: 30,
  coach: 10,
};

export const rolePermissionsMap: Record<UserRole, PermissionKey[]> = {
  super_admin: [
    'members.view',
    'members.create',
    'members.edit',
    'members.delete',
    'finance.view',
    'finance.create',
    'finance.reverse',
    'hardware.view',
    'hardware.configure',
    'hardware.test',
    'hardware.control',
    'lockers.open',
    'lockers.masterUnlock',
    'reports.view',
    'settings.manage',
    'migration.import',
    'migration.rollback',
    'audit.view',
    'insights.view',
  ],
  gym_owner: [
    'members.view',
    'members.create',
    'members.edit',
    'members.delete',
    'finance.view',
    'finance.create',
    'finance.reverse',
    'hardware.view',
    'hardware.configure',
    'hardware.test',
    'hardware.control',
    'lockers.open',
    'lockers.masterUnlock',
    'reports.view',
    'settings.manage',
    'migration.import',
    'migration.rollback',
    'audit.view',
    'insights.view',
  ],
  branch_manager: [
    'members.view',
    'members.create',
    'members.edit',
    'finance.view',
    'finance.create',
    'hardware.view',
    'hardware.test',
    'lockers.open',
    'lockers.masterUnlock',
    'reports.view',
    'migration.import',
    'audit.view',
    'insights.view',
  ],
  receptionist: [
    'members.view',
    'members.create',
    'members.edit',
    'finance.view',
    'finance.create',
    'hardware.view',
    'hardware.test',
    'lockers.open',
    'insights.view',
  ],
  accountant: [
    'members.view',
    'finance.view',
    'finance.create',
    'finance.reverse',
    'reports.view',
    'audit.view',
  ],
  coach: [
    'members.view',
    'reports.view',
  ],
  hardware_tech: [
    'hardware.view',
    'hardware.configure',
    'hardware.test',
    'hardware.control',
    'lockers.open',
    'audit.view',
  ],
};

export class RBACService {
  /**
   * Check if a role or user has a specific permission
   */
  static hasPermission(
    roleOrUser: UserRole | StaffUser | undefined,
    permission: PermissionKey
  ): boolean {
    if (!roleOrUser) return false;
    const role: UserRole = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
    
    // Inactive staff users have NO permissions
    if (typeof roleOrUser === 'object' && roleOrUser.isActive === false) {
      return false;
    }

    const permissions = rolePermissionsMap[role] || [];
    return permissions.includes(permission);
  }

  /**
   * Enforce permission at service / domain level.
   * If permission check fails, automatically generates an audit security violation and throws PermissionDeniedError.
   */
  static requirePermission(
    permission: PermissionKey,
    actor?: StaffUser | UserRole,
    context?: {
      actionName?: string;
      entityType?: string;
      entityId?: string;
      description?: string;
    }
  ): void {
    let role: UserRole = 'receptionist';
    let actorObj: { id: string; fullName: string; role: UserRole } | StaffUser;

    if (!actor) {
      // Fallback to reading active session user if available
      try {
        const stored = localStorage.getItem('gym_os_auth_session') || localStorage.getItem('gym_os_current_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const user = parsed.user || parsed;
          if (user && user.role) {
            role = user.role;
            actorObj = user;
          } else {
            actorObj = { id: 'usr-unknown', fullName: 'کاربر ناشناس', role: 'receptionist' };
          }
        } else {
          actorObj = { id: 'usr-unknown', fullName: 'کاربر ناشناس', role: 'receptionist' };
        }
      } catch {
        actorObj = { id: 'usr-unknown', fullName: 'کاربر ناشناس', role: 'receptionist' };
      }
    } else if (typeof actor === 'string') {
      role = actor;
      actorObj = { id: 'usr-system', fullName: `نقش ${actor}`, role: actor };
    } else {
      role = actor.role;
      actorObj = actor;
    }

    const isAuthorized = this.hasPermission(actor, permission);
    if (!isAuthorized) {
      const actionName = context?.actionName || permission;
      const resourceDesc = context?.description || permission;

      // Automatically log security violation
      AuditService.logSecurityViolation(
        actorObj,
        actionName,
        resourceDesc,
        `نقش «${this.getRoleTitle(role)}» فاقد مجوز امنیتی «${permission}» است.`,
        {
          requiredPermission: permission,
          actorRole: role,
          entityType: context?.entityType,
          entityId: context?.entityId,
        }
      );

      throw new PermissionDeniedError(
        permission,
        role,
        actionName,
        `خطای دسترسی: عملیات «${actionName}» نیازمند مجوز «${permission}» است که برای نقش شما مجاز نمی‌باشد.`
      );
    }
  }

  /**
   * Privilege Escalation Prevention:
   * Verify if an actor role can assign or switch to a target role.
   * Rules:
   * 1. Cannot assign a role with higher hierarchy than your own.
   * 2. Only super_admin can create or assign super_admin.
   * 3. Lower roles (receptionist, coach, tech, accountant) cannot promote themselves or others to manager/owner.
   */
  static canAssignRole(actorRole: UserRole, targetRole: UserRole): boolean {
    if (actorRole === 'super_admin') return true;
    if (targetRole === 'super_admin') return false; // Only super_admin can assign super_admin

    const actorLevel = ROLE_HIERARCHY[actorRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

    return actorLevel >= targetLevel;
  }

  /**
   * Enforce minimum role requirement
   */
  static requireRoleAtLeast(minRole: UserRole, actorRole: UserRole, context?: string): void {
    const actorLevel = ROLE_HIERARCHY[actorRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole] || 0;

    if (actorLevel < minLevel) {
      AuditService.logSecurityViolation(
        { id: 'usr-current', fullName: 'کاربر جاری', role: actorRole },
        context || 'ROLE_CHECK',
        context || 'عملیات حساس مدیریتی',
        `نقش «${actorRole}» کمتر از سطح موردنیاز «${minRole}» است.`
      );

      throw new Error(`خطای امنیتی: اجرای این عملیات حداقل نیازمند سطح کاربری «${this.getRoleTitle(minRole)}» است.`);
    }
  }

  static getUserPermissions(role: UserRole): PermissionKey[] {
    return rolePermissionsMap[role] || [];
  }

  static getRoleTitle(role: UserRole, lang: 'fa' | 'en' = 'fa'): string {
    const titlesFa: Record<UserRole, string> = {
      super_admin: 'مدیر کل سامانه (Super Admin)',
      gym_owner: 'مالک / مدیر ارشد باشگاه',
      branch_manager: 'مدیر شعبه',
      receptionist: 'مسئول پذیرش و گیت',
      accountant: 'حسابدار و امور مالی',
      coach: 'مربی ورزشی',
      hardware_tech: 'کارشناس شبکه و سخت‌افزار',
    };

    const titlesEn: Record<UserRole, string> = {
      super_admin: 'Super Admin',
      gym_owner: 'Gym Owner',
      branch_manager: 'Branch Manager',
      receptionist: 'Receptionist',
      accountant: 'Accountant',
      coach: 'Coach',
      hardware_tech: 'Hardware Technician',
    };

    return lang === 'fa' ? titlesFa[role] : titlesEn[role];
  }
}

