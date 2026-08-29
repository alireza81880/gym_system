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

  static logEvent(
    actionOrDetails: string | {
      action: string;
      category?: string;
      details?: string;
      targetId?: string;
      branchId?: string;
      userId?: string;
      userName?: string;
      userRole?: UserRole;
      entityType?: 'member' | 'payment' | 'locker' | 'hardware' | 'setting' | 'attendance' | 'auth';
      entityId?: string;
      description?: string;
      beforeState?: Record<string, unknown> | string;
      afterState?: Record<string, unknown> | string;
      [key: string]: unknown;
    },
    detailsArg?: {
      userId?: string;
      userName?: string;
      userRole?: UserRole;
      entityType?: 'member' | 'payment' | 'locker' | 'hardware' | 'setting' | 'attendance' | 'auth';
      entityId?: string;
      description?: string;
      beforeState?: Record<string, unknown> | string;
      afterState?: Record<string, unknown> | string;
      [key: string]: unknown;
    }
  ): AuditLog {
    let action = '';
    let details: Record<string, any> = {};

    if (typeof actionOrDetails === 'string') {
      action = actionOrDetails;
      details = detailsArg || {};
    } else {
      action = actionOrDetails.action;
      details = actionOrDetails;
    }

    const user = {
      id: details.userId || 'system',
      fullName: details.userName || 'مدیر سیستم',
      role: (details.userRole || 'admin') as UserRole,
    };
    return this.createLog(
      user,
      action,
      details.entityType || 'payment',
      details.description || details.details || action,
      {
        entityId: details.entityId || details.targetId,
        beforeState: details.beforeState,
        afterState: details.afterState,
      }
    );
  }
}
