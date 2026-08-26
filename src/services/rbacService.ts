import { UserRole, PermissionKey, StaffUser } from '../types';

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
  static hasPermission(role: UserRole, permission: PermissionKey): boolean {
    const permissions = rolePermissionsMap[role] || [];
    return permissions.includes(permission);
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
