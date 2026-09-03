import { AuditLog, AuditEntityType, UserRole } from '../../types';
import { PersistenceManager } from './persistenceManager';

type AuditEventListener = (log: AuditLog) => void;

export interface AuditQueryParams {
  limit?: number;
  offset?: number;
  category?: string;
  entityType?: AuditEntityType;
  userId?: string;
  userRole?: UserRole;
  action?: string;
  result?: 'success' | 'failure' | 'denied';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class AuditRepository {
  private static logsList: AuditLog[] = [];
  private static readonly MAX_AUDIT_LOGS = 500;
  private static listeners: Set<AuditEventListener> = new Set();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const stored = PersistenceManager.get<AuditLog[]>('audit_logs', [
      {
        id: 'audit-init-1',
        userId: 'usr-admin-1',
        userName: 'مهندس علیرضا حسینی',
        userRole: 'gym_owner',
        action: 'SYSTEM_BOOTSTRAP',
        category: 'security',
        entityType: 'auth',
        description: 'هسته امنیتی و اعتبارسنجی نشست‌های Gym OS با موفقیت راه‌اندازی شد.',
        timestamp: new Date().toISOString(),
        result: 'success',
        correlationId: 'corr-init-boot',
      },
    ]);

    this.logsList = Array.isArray(stored) ? [...stored].slice(0, this.MAX_AUDIT_LOGS) : [];
    this.isInitialized = true;
  }

  static getAll(limit = 100): AuditLog[] {
    this.initialize();
    return this.logsList.slice(0, limit);
  }

  static getCount(): number {
    this.initialize();
    return this.logsList.length;
  }

  static query(params: AuditQueryParams): { items: AuditLog[]; total: number } {
    this.initialize();
    let filtered = [...this.logsList];

    if (params.category) {
      filtered = filtered.filter(l => l.category?.toLowerCase() === params.category?.toLowerCase());
    }

    if (params.entityType) {
      filtered = filtered.filter(l => l.entityType === params.entityType);
    }

    if (params.userId) {
      filtered = filtered.filter(l => l.userId === params.userId);
    }

    if (params.userRole) {
      filtered = filtered.filter(l => l.userRole === params.userRole);
    }

    if (params.action) {
      filtered = filtered.filter(l => l.action.toLowerCase().includes(params.action!.toLowerCase()));
    }

    if (params.result) {
      filtered = filtered.filter(l => l.result === params.result);
    }

    if (params.startDate) {
      filtered = filtered.filter(l => l.timestamp >= params.startDate!);
    }

    if (params.endDate) {
      filtered = filtered.filter(l => l.timestamp <= params.endDate!);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.description.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        (l.entityId && l.entityId.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const items = filtered.slice(offset, offset + limit);

    return { items, total };
  }

  static append(log: AuditLog): void {
    this.initialize();
    this.logsList = [log, ...this.logsList].slice(0, this.MAX_AUDIT_LOGS);
    PersistenceManager.setBatched('audit_logs', this.logsList);

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (err) {
        console.error('[AuditRepository] Error notifying listener:', err);
      }
    });
  }

  static subscribe(listener: AuditEventListener): () => void {
    this.initialize();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static batchSet(logs: AuditLog[]): void {
    this.logsList = [...logs].slice(0, this.MAX_AUDIT_LOGS);
    PersistenceManager.setBatched('audit_logs', this.logsList);
  }

  static clear(): void {
    this.logsList = [];
    PersistenceManager.setBatched('audit_logs', []);
  }

  static reset(logs: AuditLog[] = []): void {
    this.logsList = [...logs].slice(0, this.MAX_AUDIT_LOGS);
    PersistenceManager.setImmediate('audit_logs', this.logsList);
    this.isInitialized = true;
  }
}
