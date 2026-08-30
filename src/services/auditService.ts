import { AuditLog, AuditEntityType, StaffUser, UserRole } from '../types';
import { AuditRepository, AuditQueryParams } from './repositories/auditRepository';

export interface AuditLogOptions {
  action: string;
  category?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  description?: string;
  details?: string;
  targetId?: string;
  branchId?: string;
  tenantId?: string;
  userId?: string;
  userName?: string;
  userRole?: UserRole;
  actor?: StaffUser | { id: string; fullName: string; role: UserRole };
  result?: 'success' | 'failure' | 'denied';
  beforeState?: Record<string, unknown> | string;
  afterState?: Record<string, unknown> | string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

export class AuditService {
  static createLog(
    user: { id: string; fullName: string; role: UserRole },
    action: string,
    entityType: AuditEntityType,
    description: string,
    details?: {
      entityId?: string;
      category?: string;
      beforeState?: Record<string, unknown> | string;
      afterState?: Record<string, unknown> | string;
      result?: 'success' | 'failure' | 'denied';
      metadata?: Record<string, unknown>;
      branchId?: string;
      tenantId?: string;
      correlationId?: string;
    }
  ): AuditLog {
    const timestamp = new Date().toISOString();
    const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      id,
      tenantId: details?.tenantId || 'gym-org-1',
      branchId: details?.branchId || 'branch-tehran-central',
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action,
      category: details?.category || 'general',
      entityType,
      entityId: details?.entityId,
      description,
      beforeState: details?.beforeState
        ? (typeof details.beforeState === 'string' ? details.beforeState : JSON.stringify(details.beforeState))
        : undefined,
      afterState: details?.afterState
        ? (typeof details.afterState === 'string' ? details.afterState : JSON.stringify(details.afterState))
        : undefined,
      timestamp,
      result: details?.result || 'success',
      metadata: details?.metadata,
      correlationId: details?.correlationId || `corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
  }

  /**
   * Authoritative method to record any audit event to persistent storage
   */
  static logEvent(
    actionOrOptions: string | AuditLogOptions,
    extraDetails?: Partial<AuditLogOptions>
  ): AuditLog {
    let options: AuditLogOptions;

    if (typeof actionOrOptions === 'string') {
      options = { action: actionOrOptions, ...(extraDetails || {}) };
    } else {
      options = { ...actionOrOptions, ...(extraDetails || {}) };
    }

    const actor = options.actor || {
      id: options.userId || 'usr-system',
      fullName: options.userName || 'مدیر سیستم',
      role: (options.userRole || 'gym_owner') as UserRole,
    };

    const entityType: AuditEntityType = options.entityType || 
      (options.category === 'FINANCE' ? 'payment' : 
       options.category === 'locker' ? 'locker' : 
       options.category === 'hardware' ? 'hardware' : 
       options.category === 'security' ? 'security' : 'setting');

    const log = this.createLog(
      actor,
      options.action,
      entityType,
      options.description || options.details || options.action,
      {
        entityId: options.entityId || options.targetId,
        category: options.category || 'general',
        beforeState: options.beforeState,
        afterState: options.afterState,
        result: options.result || 'success',
        metadata: options.metadata,
        branchId: options.branchId,
        tenantId: options.tenantId,
        correlationId: options.correlationId,
      }
    );

    AuditRepository.append(log);
    return log;
  }

  /**
   * Specifically log security violation / unauthorized access attempts
   */
  static logSecurityViolation(
    actor: { id: string; fullName: string; role: UserRole } | StaffUser | undefined,
    action: string,
    attemptedResource: string,
    reason: string,
    metadata?: Record<string, unknown>
  ): AuditLog {
    const user = actor || {
      id: 'usr-unknown',
      fullName: 'کاربر ناشناس',
      role: 'coach' as UserRole,
    };

    const log = this.createLog(
      user,
      `SECURITY_VIOLATION_${action.toUpperCase()}`,
      'security',
      `تلاش غیرمجاز برای ${attemptedResource}: ${reason}`,
      {
        category: 'security',
        result: 'denied',
        metadata: {
          ...metadata,
          attemptedResource,
          reason,
          deniedAt: new Date().toISOString(),
        },
      }
    );

    AuditRepository.append(log);
    return log;
  }

  /**
   * Log sensitive system mutations with before & after state
   */
  static logSensitiveMutation(params: {
    actor: { id: string; fullName: string; role: UserRole } | StaffUser;
    action: string;
    entityType: AuditEntityType;
    entityId?: string;
    description: string;
    beforeState?: unknown;
    afterState?: unknown;
    result?: 'success' | 'failure';
    metadata?: Record<string, unknown>;
  }): AuditLog {
    const log = this.createLog(
      params.actor,
      params.action,
      params.entityType,
      params.description,
      {
        entityId: params.entityId,
        category: 'sensitive_mutation',
        beforeState: params.beforeState ? JSON.stringify(params.beforeState) : undefined,
        afterState: params.afterState ? JSON.stringify(params.afterState) : undefined,
        result: params.result || 'success',
        metadata: params.metadata,
      }
    );

    AuditRepository.append(log);
    return log;
  }

  static getRecentLogs(limit = 50): AuditLog[] {
    return AuditRepository.getAll(limit);
  }

  static queryLogs(params: AuditQueryParams): { items: AuditLog[]; total: number } {
    return AuditRepository.query(params);
  }

  static subscribe(listener: (log: AuditLog) => void): () => void {
    return AuditRepository.subscribe(listener);
  }
}

