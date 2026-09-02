import { StaffUser, UserRole, AuthSession } from '../../types';
import { PersistenceManager } from '../repositories/persistenceManager';
import { AuditService } from '../auditService';
import { RBACService } from '../rbacService';

export const initialStaffUsers: StaffUser[] = [
  {
    id: 'usr-owner-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'admin',
    fullName: 'مهندس علیرضا حسینی (مالک باشگاه)',
    role: 'gym_owner',
    phone: '09121234567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-mgr-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'manager',
    fullName: 'کامران بختیاری (مدیر شعبه)',
    role: 'branch_manager',
    phone: '09127654321',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-rec-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'reception',
    fullName: 'مینا احمدی (پذیرش و گیت)',
    role: 'receptionist',
    phone: '09123334455',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-acc-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'accountant',
    fullName: 'سامان فراهانی (امور مالی و حسابداری)',
    role: 'accountant',
    phone: '09124445566',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-tech-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'tech',
    fullName: 'پوریا دانش (کارشناس سخت‌افزار و شبکه)',
    role: 'hardware_tech',
    phone: '09128889900',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-coach-1',
    tenantId: 'gym-org-1',
    branchId: 'branch-tehran-central',
    username: 'coach_reza',
    fullName: 'رضا مرادی (مربی ارشد)',
    role: 'coach',
    phone: '09121112233',
    isActive: true,
    lastLogin: new Date().toISOString(),
  },
];

type AuthSessionListener = (session: AuthSession | null) => void;

export class AuthService {
  private static staffUsersList: StaffUser[] = [];
  private static currentSession: AuthSession | null = null;
  private static readonly SESSION_KEY = 'auth_session';
  private static readonly USERS_KEY = 'staff_users';
  private static readonly SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours timeout
  private static listeners: Set<AuthSessionListener> = new Set();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;

    // Load staff users
    const storedUsers = PersistenceManager.get<StaffUser[]>(this.USERS_KEY, initialStaffUsers);
    this.staffUsersList = Array.isArray(storedUsers) && storedUsers.length > 0 ? storedUsers : [...initialStaffUsers];

    // Load and validate active session
    const storedSession = PersistenceManager.get<AuthSession | null>(this.SESSION_KEY, null);
    if (storedSession) {
      const validation = this.validateSessionObject(storedSession);
      if (validation.valid && validation.session) {
        this.currentSession = validation.session;
      } else {
        // Expired or corrupted session: reset to default authenticated owner session with audit record
        AuditService.logEvent({
          action: 'SESSION_EXPIRED_OR_INVALID',
          category: 'security',
          details: `نشست قبلی به دلیل (${validation.reason || 'انقضا'}) پاکسازی و نوسازی شد.`,
          entityType: 'auth',
          result: 'denied',
        });
        this.currentSession = this.createSession(this.staffUsersList[0]);
      }
    } else {
      // Default initial session for gym owner
      this.currentSession = this.createSession(this.staffUsersList[0]);
    }

    this.isInitialized = true;
  }

  private static createSession(user: StaffUser): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT_MS).toISOString();
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const token = `tok-${btoa(`${user.id}:${user.role}:${Date.now()}`)}`;

    const session: AuthSession = {
      sessionId,
      user: { ...user, lastLogin: now.toISOString() },
      token,
      loginTime: now.toISOString(),
      lastActive: now.toISOString(),
      expiresAt,
      tenantId: user.tenantId || 'gym-org-1',
      branchId: user.branchId || 'branch-tehran-central',
    };

    PersistenceManager.setBatched(this.SESSION_KEY, session);
    PersistenceManager.setBatched('current_user', session.user);
    return session;
  }

  private static validateSessionObject(session: AuthSession): { valid: boolean; session?: AuthSession; reason?: string } {
    if (!session || !session.user || !session.expiresAt) {
      return { valid: false, reason: 'قالب نشست مخدوش است.' };
    }

    const now = new Date().getTime();
    const expires = new Date(session.expiresAt).getTime();
    if (now > expires) {
      return { valid: false, reason: 'زمان نشست کاربر به پایان رسیده است.' };
    }

    // Verify user is active in staff list
    const foundUser = this.staffUsersList.find(u => u.id === session.user.id);
    if (foundUser && !foundUser.isActive) {
      return { valid: false, reason: 'حساب کاربری توسط مدیریت غیرفعال شده است.' };
    }

    return { valid: true, session };
  }

  static getCurrentSession(): AuthSession {
    this.initialize();
    if (!this.currentSession) {
      this.currentSession = this.createSession(this.staffUsersList[0]);
    }
    return this.currentSession;
  }

  static getCurrentUser(): StaffUser {
    return this.getCurrentSession().user;
  }

  static getStaffUsers(): StaffUser[] {
    this.initialize();
    return [...this.staffUsersList];
  }

  static login(
    identifier: string,
    roleOverride?: UserRole
  ): { success: boolean; session?: AuthSession; error?: string } {
    this.initialize();

    // Find staff user by username, phone, or id
    let user = this.staffUsersList.find(
      u => u.username === identifier || u.phone === identifier || u.id === identifier
    );

    if (!user && roleOverride) {
      user = this.staffUsersList.find(u => u.role === roleOverride);
    }

    if (!user) {
      AuditService.logEvent({
        action: 'AUTH_LOGIN_FAILED',
        category: 'security',
        details: `تلاش ناموفق برای ورود با شناسه «${identifier}». کاربر یافت نشد.`,
        entityType: 'auth',
        result: 'denied',
      });
      return { success: false, error: 'کاربر مورد نظر در سیستم ثبت نشده است.' };
    }

    if (!user.isActive) {
      AuditService.logEvent({
        action: 'AUTH_LOGIN_BLOCKED',
        category: 'security',
        details: `تلاش برای ورود به حساب غیرفعال «${user.fullName}» مسدود شد.`,
        entityType: 'auth',
        result: 'denied',
      });
      return { success: false, error: 'حساب کاربری شما غیرفعال شده است. لطفاً با مدیر تماس بگیرید.' };
    }

    const session = this.createSession(user);
    this.currentSession = session;

    AuditService.logEvent({
      action: 'AUTH_LOGIN_SUCCESS',
      category: 'security',
      details: `ورود موفق کاربر «${user.fullName}» با نقش «${RBACService.getRoleTitle(user.role)}» ثبت گردید.`,
      entityType: 'auth',
      actor: user,
      result: 'success',
    });

    this.notifyListeners(session);
    return { success: true, session };
  }

  static logout(reason = 'خروج توسط کاربر'): void {
    this.initialize();
    const prevUser = this.currentSession?.user;

    AuditService.logEvent({
      action: 'AUTH_LOGOUT',
      category: 'security',
      details: `کاربر «${prevUser?.fullName || 'ناشناس'}» از سیستم خارج شد. علت: ${reason}`,
      entityType: 'auth',
      actor: prevUser,
      result: 'success',
    });

    // Reset to base receptionist or guest state session
    const defaultUser = this.staffUsersList.find(u => u.role === 'receptionist') || this.staffUsersList[0];
    this.currentSession = this.createSession(defaultUser);
    this.notifyListeners(this.currentSession);
  }

  static switchUserRole(
    newRole: UserRole,
    actor?: StaffUser
  ): { success: boolean; user: StaffUser; error?: string } {
    this.initialize();
    const current = this.getCurrentSession();
    const performingActor = actor || current.user;

    // Privilege Escalation Guard: Verify actor has authority to switch to/assign target role
    if (!RBACService.canAssignRole(performingActor.role, newRole)) {
      AuditService.logSecurityViolation(
        performingActor,
        'ROLE_SWITCH_ATTEMPT',
        `تغییر نقش به ${newRole}`,
        `نقش «${performingActor.role}» مجاز به ارتقای خود یا دیگران به «${newRole}» نمی‌باشد.`
      );
      return {
        success: false,
        user: performingActor,
        error: `خطای ارتقای سطح دسترسی: شما مجاز به سوئیچ به نقش «${RBACService.getRoleTitle(newRole)}» نمی‌باشید.`,
      };
    }

    // Update user role in active session
    const oldRole = performingActor.role;
    const updatedUser: StaffUser = {
      ...performingActor,
      role: newRole,
    };

    // Update in staff list if present
    this.staffUsersList = this.staffUsersList.map(u => u.id === updatedUser.id ? updatedUser : u);
    PersistenceManager.setBatched(this.USERS_KEY, this.staffUsersList);

    const updatedSession: AuthSession = {
      ...current,
      user: updatedUser,
      lastActive: new Date().toISOString(),
    };

    this.currentSession = updatedSession;
    PersistenceManager.setBatched(this.SESSION_KEY, updatedSession);
    PersistenceManager.setBatched('current_user', updatedUser);

    AuditService.logSensitiveMutation({
      actor: performingActor,
      action: 'ROLE_CHANGED',
      entityType: 'auth',
      entityId: updatedUser.id,
      description: `نقش امنیتی کاربر «${updatedUser.fullName}» از «${oldRole}» به «${newRole}» تغییر یافت.`,
      beforeState: { role: oldRole },
      afterState: { role: newRole },
      result: 'success',
    });

    this.notifyListeners(updatedSession);
    return { success: true, user: updatedUser };
  }

  static createStaffUser(
    userData: Omit<StaffUser, 'id'>,
    actor?: StaffUser
  ): StaffUser {
    this.initialize();
    const performingActor = actor || this.getCurrentUser();

    // Check RBAC permission & role escalation
    RBACService.requirePermission('settings.manage', performingActor, {
      actionName: 'CREATE_STAFF_USER',
      description: 'ایجاد پرسنل جدید',
    });

    if (!RBACService.canAssignRole(performingActor.role, userData.role)) {
      throw new Error(`خطای امنیتی: شما مجاز به تعریف کاربری با نقش بالاتر از سطح خود (${userData.role}) نیستید.`);
    }

    const newUser: StaffUser = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isActive: true,
      lastLogin: undefined,
    };

    this.staffUsersList = [...this.staffUsersList, newUser];
    PersistenceManager.setBatched(this.USERS_KEY, this.staffUsersList);

    AuditService.logSensitiveMutation({
      actor: performingActor,
      action: 'STAFF_USER_CREATED',
      entityType: 'auth',
      entityId: newUser.id,
      description: `کاربر پرسنل جدید «${newUser.fullName}» با نقش «${newUser.role}» تعریف شد.`,
      afterState: newUser,
      result: 'success',
    });

    return newUser;
  }

  static updateStaffUser(
    id: string,
    updates: Partial<StaffUser>,
    actor?: StaffUser
  ): StaffUser {
    this.initialize();
    const performingActor = actor || this.getCurrentUser();

    RBACService.requirePermission('settings.manage', performingActor, {
      actionName: 'UPDATE_STAFF_USER',
      description: 'ویرایش پرسنل',
    });

    const targetUser = this.staffUsersList.find(u => u.id === id);
    if (!targetUser) {
      throw new Error('کاربر مورد نظر یافت نشد.');
    }

    if (updates.role && updates.role !== targetUser.role) {
      if (!RBACService.canAssignRole(performingActor.role, updates.role)) {
        throw new Error(`خطای امنیتی: شما مجاز به ارتقای کاربر به نقش «${updates.role}» نیستید.`);
      }
    }

    const beforeState = { ...targetUser };
    const updated = { ...targetUser, ...updates };

    this.staffUsersList = this.staffUsersList.map(u => u.id === id ? updated : u);
    PersistenceManager.setBatched(this.USERS_KEY, this.staffUsersList);

    // If current session belongs to this user, update session as well
    if (this.currentSession?.user.id === id) {
      this.currentSession = {
        ...this.currentSession,
        user: updated,
      };
      PersistenceManager.setBatched(this.SESSION_KEY, this.currentSession);
      PersistenceManager.setBatched('current_user', updated);
      this.notifyListeners(this.currentSession);
    }

    AuditService.logSensitiveMutation({
      actor: performingActor,
      action: 'STAFF_USER_UPDATED',
      entityType: 'auth',
      entityId: id,
      description: `اطلاعات کاربر «${updated.fullName}» به‌روزرسانی شد.`,
      beforeState,
      afterState: updated,
      result: 'success',
    });

    return updated;
  }

  static deactivateStaffUser(id: string, actor?: StaffUser): void {
    this.initialize();
    const performingActor = actor || this.getCurrentUser();

    RBACService.requirePermission('settings.manage', performingActor, {
      actionName: 'DEACTIVATE_STAFF_USER',
      description: 'غیرفعال‌سازی کاربر پرسنل',
    });

    this.updateStaffUser(id, { isActive: false }, performingActor);
  }

  static initializeOwnerProfile(ownerData: { fullName: string; phone: string; username?: string }): StaffUser {
    this.initialize();
    let owner = this.staffUsersList.find(u => u.role === 'gym_owner');
    if (!owner) {
      owner = this.staffUsersList[0];
    }
    const updated: StaffUser = {
      ...owner,
      fullName: ownerData.fullName.trim() || owner.fullName,
      phone: ownerData.phone.trim() || owner.phone,
      username: ownerData.username?.trim() || owner.username,
      role: 'gym_owner',
      isActive: true,
    };
    this.staffUsersList = this.staffUsersList.map(u => u.id === updated.id ? updated : u);
    PersistenceManager.setImmediate(this.USERS_KEY, this.staffUsersList);

    // Update active session
    const session = this.createSession(updated);
    this.currentSession = session;
    PersistenceManager.setImmediate(this.SESSION_KEY, session);
    PersistenceManager.setImmediate('current_user', updated);
    this.notifyListeners(session);
    return updated;
  }

  static subscribe(listener: AuthSessionListener): () => void {
    this.initialize();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners(session: AuthSession | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (err) {
        console.error('[AuthService] Listener notification error:', err);
      }
    });
  }
}
