import { MembershipPackage } from '../../types';
import { initialPackages } from '../../data/initialData';
import { LocalDbRepository } from '../localDb';
import { LocalDatabase } from '../database/localDatabase';
import { MembershipRepository } from './membershipRepository';
import { ChargeRepository } from './chargeRepository';
import { PaymentRepository } from './paymentRepository';

export interface PackageUsageResult {
  inUse: boolean;
  totalReferences: number;
  membershipsCount: number;
  chargesCount: number;
  paymentsCount: number;
  membershipReferences: number;
  chargeReferences: number;
  paymentReferences: number;
  message?: string;
}

export class PackageRepository {
  private static packagesList: MembershipPackage[] = [];
  private static byIdMap = new Map<string, MembershipPackage>();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;

    // Check persistence deterministically
    const hasPersistedPackages = LocalDbRepository.hasKey('packages');

    if (hasPersistedPackages) {
      const stored = LocalDbRepository.get<MembershipPackage[]>('packages', []);
      this.rebuildIndex(stored);
    } else {
      // Only hydrate initial demo packages if database is completely new and uninitialized
      if (!LocalDbRepository.isDatabaseInitialized()) {
        this.rebuildIndex(initialPackages);
        LocalDbRepository.setImmediate('packages', initialPackages);
      } else {
        this.rebuildIndex([]);
      }
    }
    this.isInitialized = true;
  }

  static rebuildIndex(packages: MembershipPackage[]): void {
    this.packagesList = Array.isArray(packages) ? [...packages] : [];
    this.byIdMap.clear();
    for (const pkg of this.packagesList) {
      if (pkg && pkg.id) {
        this.byIdMap.set(pkg.id, pkg);
      }
    }
  }

  static getAll(options?: { includeArchived?: boolean }): MembershipPackage[] {
    this.initialize();
    if (options?.includeArchived) {
      return [...this.packagesList];
    }
    return this.packagesList.filter(p => !p.isArchived);
  }

  static getById(id: string): MembershipPackage | undefined {
    this.initialize();
    return this.byIdMap.get(id);
  }

  static add(pkg: MembershipPackage): MembershipPackage {
    this.initialize();
    const existingIndex = this.packagesList.findIndex(p => p.id === pkg.id);
    if (existingIndex >= 0) {
      this.packagesList[existingIndex] = pkg;
    } else {
      this.packagesList.push(pkg);
    }
    this.byIdMap.set(pkg.id, pkg);

    this.persist();
    return pkg;
  }

  static update(id: string, partial: Partial<MembershipPackage>): MembershipPackage | undefined {
    this.initialize();
    const current = this.byIdMap.get(id);
    if (!current) return undefined;

    const updated: MembershipPackage = { ...current, ...partial };
    const index = this.packagesList.findIndex(p => p.id === id);
    if (index >= 0) {
      this.packagesList[index] = updated;
    }
    this.byIdMap.set(id, updated);

    this.persist();
    return updated;
  }

  static delete(id: string): boolean {
    this.initialize();
    const usage = this.checkUsage(id);
    if (usage.inUse) {
      console.warn(`[PackageRepository] Cannot delete package ${id}: strictly referenced by ${usage.totalReferences} active entity records.`);
      return false;
    }

    const index = this.packagesList.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.packagesList.splice(index, 1);
    this.byIdMap.delete(id);

    this.persist();

    // Also remove from SQLite directly
    try {
      const adapter = LocalDatabase.getAdapter();
      adapter.delete('packages', id).catch(err => {
        console.warn('[PackageRepository] SQLite delete package error:', err);
      });
    } catch {}

    return true;
  }

  static reset(packages: MembershipPackage[]): void {
    this.rebuildIndex(packages);
    this.isInitialized = true;
    this.persist();
  }

  /**
   * Strictly audit package usage.
   * ONLY checks explicit ID references:
   * - membership.packageId === id
   * - membership.packageSnapshot.id === id
   * - charge.packageId === id
   * - payment.packageId === id
   * 
   * Strict Rule: NEVER match by package type, duration, category, or similar names!
   */
  static checkUsage(packageId: string): PackageUsageResult {
    if (!packageId) {
      return { 
        inUse: false, 
        totalReferences: 0, 
        membershipsCount: 0, 
        chargesCount: 0, 
        paymentsCount: 0,
        membershipReferences: 0,
        chargeReferences: 0,
        paymentReferences: 0,
      };
    }

    let membershipsCount = 0;
    try {
      MembershipRepository.initialize();
      const memberships = MembershipRepository.getAll();
      for (const m of memberships) {
        if (m.packageId === packageId || m.packageSnapshot?.id === packageId) {
          membershipsCount++;
        }
      }
    } catch {}

    let chargesCount = 0;
    try {
      ChargeRepository.initialize();
      const charges = ChargeRepository.getAll();
      for (const c of charges) {
        if ((c as any).packageId === packageId) {
          chargesCount++;
        }
      }
    } catch {}

    let paymentsCount = 0;
    try {
      PaymentRepository.initialize();
      const payments = PaymentRepository.getAllPayments();
      for (const p of payments) {
        if ((p as any).packageId === packageId) {
          paymentsCount++;
        }
      }
    } catch {}

    const totalReferences = membershipsCount + chargesCount + paymentsCount;
    const inUse = totalReferences > 0;

    let message: string | undefined = undefined;
    if (inUse) {
      const parts: string[] = [];
      if (membershipsCount > 0) parts.push(`${membershipsCount} سابقه عضویت`);
      if (chargesCount > 0) parts.push(`${chargesCount} صورت‌حساب مالی`);
      if (paymentsCount > 0) parts.push(`${paymentsCount} تراکنش دریافتی`);
      message = `این بسته در ${parts.join(' و ')} ثبت شده است و امکان حذف فیزیکی آن وجود ندارد. در صورت عدم نیاز، آن را غیرفعال (آرشیو) نمایید.`;
    }

    return {
      inUse,
      totalReferences,
      membershipsCount,
      chargesCount,
      paymentsCount,
      membershipReferences: membershipsCount,
      chargeReferences: chargesCount,
      paymentReferences: paymentsCount,
      message,
    };
  }

  private static persist(): void {
    LocalDbRepository.setImmediate('packages', this.packagesList);

    // Sync to SQLite asynchronously
    try {
      const adapter = LocalDatabase.getAdapter();
      adapter.bulkSet('packages', this.packagesList).catch(err => {
        console.warn('[PackageRepository] SQLite bulkSet packages warning:', err);
      });
    } catch {}
  }
}
