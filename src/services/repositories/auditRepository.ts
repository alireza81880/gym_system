/**
 * Audit Repository
 * Manages persisted audit logs with indexing and paginated querying.
 */

import { AuditLog } from '../../types';
import { PersistenceManager } from './persistenceManager';
import { PaginatedResult } from './memberRepository';

export class AuditRepository {
  private static auditList: AuditLog[] = [];
  private static isInitialized = false;
  private static readonly MAX_AUDIT_LOGS = 1000;

  static initialize(): void {
    if (this.isInitialized) return;
    this.auditList = PersistenceManager.get<AuditLog[]>('audit_logs', []);
    this.isInitialized = true;
  }

  static addLog(log: AuditLog): void {
    this.initialize();
    this.auditList = [log, ...this.auditList].slice(0, this.MAX_AUDIT_LOGS);
    PersistenceManager.setBatched('audit_logs', this.auditList);
  }

  static getAll(): AuditLog[] {
    this.initialize();
    return this.auditList;
  }

  static queryPaginated(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    entityType?: string;
    action?: string;
  } = {}): PaginatedResult<AuditLog> {
    this.initialize();
    const { page = 1, pageSize = 25, search = '', entityType = 'all', action = 'all' } = params;

    let filtered = this.auditList;
    const hasSearch = search && search.trim() !== '';
    const hasType = entityType && entityType !== 'all';
    const hasAction = action && action !== 'all';

    if (hasSearch || hasType || hasAction) {
      const q = hasSearch ? search.trim().toLowerCase() : '';
      filtered = this.auditList.filter(log => {
        if (hasSearch) {
          const matchDesc = log.description?.toLowerCase().includes(q);
          const matchUser = log.userName?.toLowerCase().includes(q);
          if (!matchDesc && !matchUser) return false;
        }
        if (hasType && log.entityType !== entityType) return false;
        if (hasAction && log.action !== action) return false;
        return true;
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return {
      items,
      total,
      totalPages,
      currentPage: safePage,
      pageSize,
    };
  }
}
