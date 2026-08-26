import { AuditLog, StaffUser, UserRole } from '../types';

export class AuditService {
  static createLog(
    user: { id: string; fullName: string; role: UserRole },
    action: string,
    entityType: 'member' | 'payment' | 'locker' | 'hardware' | 'setting' | 'attendance' | 'auth',
    description: string,
    details?: {
      entityId?: string;
      beforeState?: Record<string, unknown> | string;
      afterState?: Record<string, unknown> | string;
    }
  ): AuditLog {
    const timestamp = new Date().toISOString();
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      id,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action,
      entityType,
      entityId: details?.entityId,
      description,
      beforeState: details?.beforeState ? (typeof details.beforeState === 'string' ? details.beforeState : JSON.stringify(details.beforeState)) : undefined,
      afterState: details?.afterState ? (typeof details.afterState === 'string' ? details.afterState : JSON.stringify(details.afterState)) : undefined,
      timestamp,
      correlationId: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
  }
}
