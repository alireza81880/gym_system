import { FinancialCharge } from '../../types';
import { LocalDbRepository } from '../localDb';
import { initialStudents } from '../../data/initialData';
import { generateFinancialId } from '../../utils/idGenerator';

export class ChargeRepository {
  private static chargesList: FinancialCharge[] = [];
  private static byIdMap = new Map<string, FinancialCharge>();
  private static byMemberIdMap = new Map<string, FinancialCharge[]>();
  private static byMembershipIdMap = new Map<string, FinancialCharge>();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    
    // Check persistence deterministically
    const hasPersistedCharges = LocalDbRepository.hasKey('charges');
    
    if (hasPersistedCharges) {
      const stored = LocalDbRepository.get<FinancialCharge[]>('charges', []);
      this.rebuildIndex(stored);
    } else {
      // Only hydrate initial demo charges if database is completely new and uninitialized
      if (!LocalDbRepository.isDatabaseInitialized()) {
        const hydrated = this.hydrateInitialCharges();
        this.rebuildIndex(hydrated);
        LocalDbRepository.setImmediate('charges', hydrated);
      } else {
        this.rebuildIndex([]);
      }
    }
    this.isInitialized = true;
  }

  public static hydrateInitialCharges(): FinancialCharge[] {
    const charges: FinancialCharge[] = [];
    for (const student of initialStudents) {
      const basePrice = student.totalFee || 0;
      const paid = student.paidAmount || 0;
      const outstanding = Math.max(0, basePrice - paid);
      const isFree = basePrice === 0;

      charges.push({
        id: generateFinancialId('chg'),
        tenantId: 'gym-org-1',
        branchId: 'branch-tehran-central',
        memberId: student.id,
        memberName: student.fullName,
        packageType: student.packageType,
        packageName: student.packageType,
        basePrice,
        discountAmount: 0,
        finalPrice: basePrice,
        paidAmount: paid,
        outstandingAmount: outstanding,
        date: student.registrationDate || '1403/05/01',
        timestamp: new Date('2024-07-22T08:00:00.000Z').toISOString(),
        status: isFree ? 'free' : outstanding === 0 ? 'settled' : 'active',
        isFree,
        createdAt: new Date('2024-07-22T08:00:00.000Z').toISOString(),
      });
    }
    return charges;
  }

  static rebuildIndex(charges: FinancialCharge[]): void {
    this.chargesList = [...charges];
    this.byIdMap.clear();
    this.byMemberIdMap.clear();
    this.byMembershipIdMap.clear();

    for (const charge of this.chargesList) {
      this.byIdMap.set(charge.id, charge);

      const memList = this.byMemberIdMap.get(charge.memberId) || [];
      memList.push(charge);
      this.byMemberIdMap.set(charge.memberId, memList);

      if (charge.membershipId) {
        this.byMembershipIdMap.set(charge.membershipId, charge);
      }
    }
  }

  static getAll(): FinancialCharge[] {
    this.initialize();
    return this.chargesList;
  }

  static getById(id: string): FinancialCharge | undefined {
    this.initialize();
    return this.byIdMap.get(id);
  }

  static getByMemberId(memberId: string): FinancialCharge[] {
    this.initialize();
    return this.byMemberIdMap.get(memberId) || [];
  }

  static getByMembershipId(membershipId: string): FinancialCharge | undefined {
    this.initialize();
    if (!membershipId) return undefined;
    return this.byMembershipIdMap.get(membershipId);
  }

  static create(charge: FinancialCharge): FinancialCharge {
    this.initialize();
    this.chargesList = [charge, ...this.chargesList];
    this.rebuildIndex(this.chargesList);
    LocalDbRepository.setImmediate('charges', this.chargesList);
    return charge;
  }

  static update(id: string, partial: Partial<FinancialCharge>): FinancialCharge | undefined {
    this.initialize();
    const idx = this.chargesList.findIndex(c => c.id === id);
    if (idx === -1) return undefined;

    const updated: FinancialCharge = {
      ...this.chargesList[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };

    this.chargesList[idx] = updated;
    this.rebuildIndex(this.chargesList);
    LocalDbRepository.setImmediate('charges', this.chargesList);
    return updated;
  }

  static delete(id: string): void {
    this.initialize();
    this.chargesList = this.chargesList.filter(c => c.id !== id);
    this.rebuildIndex(this.chargesList);
    LocalDbRepository.setImmediate('charges', this.chargesList);
  }

  static getChargesByDate(dateStr: string, branchId?: string, tenantId?: string): FinancialCharge[] {
    this.initialize();
    return this.chargesList.filter(c => {
      if (branchId && c.branchId && c.branchId !== branchId) return false;
      if (tenantId && c.tenantId && c.tenantId !== tenantId) return false;
      return c.date === dateStr;
    });
  }

  static batchSet(charges: FinancialCharge[]): void {
    this.rebuildIndex(charges);
    LocalDbRepository.setImmediate('charges', this.chargesList);
  }
}
