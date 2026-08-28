/**
 * Membership Entity & Repository (PART 15)
 * Manages separate lifecycle, renewal history, packages, and expiration tracking per member.
 */

import { PackageType, MemberStatus } from '../../types';
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

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    const adapter = LocalDatabase.getAdapter();
    const stored = await adapter.query<Membership>('memberships');
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

  static getById(id: string): Membership | undefined {
    return this.byIdMap.get(id);
  }

  static getActiveByMember(studentId: string): Membership | undefined {
    const list = this.byStudentIdMap.get(studentId) || [];
    return list.find(m => m.status === 'active' || m.status === 'pending_renewal');
  }

  static getHistory(studentId: string): Membership[] {
    const list = this.byStudentIdMap.get(studentId) || [];
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  static async create(membership: Membership): Promise<Membership> {
    this.membershipsList.unshift(membership);
    this.byIdMap.set(membership.id, membership);

    const studentList = this.byStudentIdMap.get(membership.studentId) || [];
    studentList.unshift(membership);
    this.byStudentIdMap.set(membership.studentId, studentList);

    const adapter = LocalDatabase.getAdapter();
    await adapter.insert('memberships', membership);
    return membership;
  }

  static async update(id: string, partial: Partial<Membership>): Promise<Membership | undefined> {
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

    const adapter = LocalDatabase.getAdapter();
    await adapter.update('memberships', id, updated);
    return updated;
  }

  static async expire(id: string): Promise<Membership | undefined> {
    return this.update(id, { status: 'expired' });
  }

  static async renew(
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
  ): Promise<Membership> {
    // 1. Mark previous active memberships as expired
    const existingActive = this.getActiveByMember(studentId);
    if (existingActive) {
      await this.expire(existingActive.id);
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
}
