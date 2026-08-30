/**
 * Membership Entity & Repository
 * Manages separate lifecycle, renewal history, packages, and expiration tracking per member.
 * Backed by the unified LocalDbRepository persistence engine with instant synchronous durability.
 */

import { PackageType, MemberStatus } from '../../types';
import { LocalDbRepository } from '../localDb';
import { LocalDatabase } from '../database/localDatabase';

export interface Membership {
  id: string;
  tenantId: string;
  branchId: string;
  studentId: string;
  packageType: PackageType | string;
  startDate: string;
  expireDate: string;
  status: MemberStatus | 'cancelled';
  totalFee: number;
  paidAmount: number;
  remainingDebt: number;
  sessionsTotal: number;
  sessionsAttended: number;
  coachId?: string;
  coachFee?: number;
  hasWorkoutPlan?: boolean;
  hasDietPlan?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export class MembershipRepository {
  private static membershipsList: Membership[] = [];
  private static byIdMap = new Map<string, Membership>();
  private static byStudentIdMap = new Map<string, Membership[]>();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const stored = LocalDbRepository.get<Membership[]>('memberships', []);
    this.rebuildIndex(stored);
    this.isInitialized = true;
  }

  static rebuildIndex(memberships: Membership[]): void {
    this.membershipsList = [...memberships];
    this.byIdMap.clear();
    this.byStudentIdMap.clear();

    for (const m of this.membershipsList) {
      this.byIdMap.set(m.id, m);
      const studentList = this.byStudentIdMap.get(m.studentId) || [];
      studentList.push(m);
      this.byStudentIdMap.set(m.studentId, studentList);
    }
  }

  static getAll(): Membership[] {
    this.initialize();
    return [...this.membershipsList];
  }

  static getById(id: string): Membership | undefined {
    this.initialize();
    return this.byIdMap.get(id);
  }

  static getActiveByMember(studentId: string): Membership | undefined {
    this.initialize();
    const list = this.byStudentIdMap.get(studentId) || [];
    return list.find(m => m.status === 'active' || m.status === 'pending_renewal');
  }

  static getHistory(studentId: string): Membership[] {
    this.initialize();
    const list = this.byStudentIdMap.get(studentId) || [];
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static create(membership: Membership): Membership {
    this.initialize();
    this.membershipsList.unshift(membership);
    this.byIdMap.set(membership.id, membership);

    const studentList = this.byStudentIdMap.get(membership.studentId) || [];
    studentList.unshift(membership);
    this.byStudentIdMap.set(membership.studentId, studentList);

    LocalDbRepository.setImmediate('memberships', this.membershipsList);

    // Background mirror to database adapter
    try {
      const adapter = LocalDatabase.getAdapter();
      adapter.insert('memberships', membership).catch(() => {});
    } catch {
      // safe fallback
    }

    return membership;
  }

  static update(id: string, partial: Partial<Membership>): Membership | undefined {
    this.initialize();
    const existing = this.byIdMap.get(id);
    if (!existing) return undefined;

    const updated: Membership = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    this.byIdMap.set(id, updated);
    const idx = this.membershipsList.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.membershipsList[idx] = updated;
    }

    LocalDbRepository.setImmediate('memberships', this.membershipsList);

    // Background mirror
    try {
      const adapter = LocalDatabase.getAdapter();
      adapter.update('memberships', id, updated).catch(() => {});
    } catch {
      // safe fallback
    }

    return updated;
  }

  static expire(id: string): Membership | undefined {
    return this.update(id, { status: 'expired' });
  }

  static renew(
    studentId: string,
    params: {
      packageType: string;
      startDate: string;
      expireDate: string;
      totalFee: number;
      paidAmount: number;
      sessionsTotal: number;
      coachId?: string;
      coachFee?: number;
    }
  ): Membership {
    this.initialize();
    // 1. Mark previous active memberships as expired
    const existingActive = this.getActiveByMember(studentId);
    if (existingActive) {
      this.expire(existingActive.id);
    }

    // 2. Create new active membership
    const newMembership: Membership = {
      id: `msh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: existingActive?.tenantId || 'gym-org-1',
      branchId: existingActive?.branchId || 'branch-tehran-central',
      studentId,
      packageType: params.packageType,
      startDate: params.startDate,
      expireDate: params.expireDate,
      status: 'active',
      totalFee: params.totalFee,
      paidAmount: params.paidAmount,
      remainingDebt: Math.max(0, params.totalFee - params.paidAmount),
      sessionsTotal: params.sessionsTotal,
      sessionsAttended: 0,
      coachId: params.coachId,
      coachFee: params.coachFee,
      createdAt: new Date().toISOString(),
    };

    return this.create(newMembership);
  }

  static batchSet(memberships: Membership[]): void {
    this.rebuildIndex(memberships);
    LocalDbRepository.setImmediate('memberships', this.membershipsList);
  }
}
