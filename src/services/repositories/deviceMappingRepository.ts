/**
 * GYM OS — Device User Mapping Repository
 * Maps hardware terminal externalUserIds to Gym OS members.
 * Non-invasive: Never creates synthetic members automatically when unmapped users are detected.
 */

import { DeviceUserMapping } from '../../types';
import { PersistenceManager } from './persistenceManager';

export class DeviceMappingRepository {
  private static mappings: DeviceUserMapping[] = [];
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const initial: DeviceUserMapping[] = [
      {
        id: 'map-1',
        deviceId: 'dev-face-gate',
        externalUserId: '1001',
        memberId: 'std-1',
        memberName: 'آرش علوی',
        credentialTypes: ['FACE', 'RFID'],
        cardUid: 'E2-80-68-9A',
        createdAt: '1403/05/15',
      },
      {
        id: 'map-2',
        deviceId: 'dev-face-gate',
        externalUserId: '1002',
        memberId: 'std-2',
        memberName: 'نیما کمالی',
        credentialTypes: ['FACE', 'CARD'],
        cardUid: 'B4-3F-11-8C',
        createdAt: '1403/04/01',
      },
      {
        id: 'map-3',
        deviceId: 'dev-rfid-turnstile',
        externalUserId: '1003',
        memberId: 'std-3',
        memberName: 'مریم حسینی',
        credentialTypes: ['RFID'],
        cardUid: 'A1-99-44-DF',
        createdAt: '1403/05/20',
      },
      {
        id: 'map-4',
        deviceId: 'dev-face-gate',
        externalUserId: '1005',
        memberId: 'std-5',
        memberName: 'احسان محمدی',
        credentialTypes: ['FACE', 'FINGERPRINT'],
        createdAt: '1403/05/10',
      },
      {
        id: 'map-5',
        deviceId: 'dev-rfid-turnstile',
        externalUserId: '1006',
        memberId: 'std-6',
        memberName: 'فرزاد شجاعی',
        credentialTypes: ['RFID'],
        cardUid: '55-44-33-22',
        createdAt: '1403/03/15',
      },
    ];

    this.mappings = PersistenceManager.get<DeviceUserMapping[]>('device_user_mappings', initial);
    this.isInitialized = true;
  }

  static getAll(): DeviceUserMapping[] {
    this.initialize();
    return [...this.mappings];
  }

  static getByDeviceId(deviceId: string): DeviceUserMapping[] {
    this.initialize();
    return this.mappings.filter(m => m.deviceId === deviceId);
  }

  static findMapping(deviceId: string, externalUserId: string): DeviceUserMapping | undefined {
    this.initialize();
    return this.mappings.find(m => m.deviceId === deviceId && m.externalUserId === externalUserId);
  }

  static findByExternalId(externalUserId: string): DeviceUserMapping | undefined {
    this.initialize();
    return this.mappings.find(m => m.externalUserId === externalUserId);
  }

  static findByMemberId(memberId: string): DeviceUserMapping[] {
    this.initialize();
    return this.mappings.filter(m => m.memberId === memberId);
  }

  static setMapping(mapping: Omit<DeviceUserMapping, 'id' | 'createdAt'>): DeviceUserMapping {
    this.initialize();
    const existingIndex = this.mappings.findIndex(
      m => m.deviceId === mapping.deviceId && m.externalUserId === mapping.externalUserId
    );

    const now = new Date().toISOString();
    let saved: DeviceUserMapping;

    if (existingIndex >= 0) {
      saved = {
        ...this.mappings[existingIndex],
        ...mapping,
        updatedAt: now,
      };
      this.mappings[existingIndex] = saved;
    } else {
      saved = {
        ...mapping,
        id: `map-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: now,
      };
      this.mappings.push(saved);
    }

    PersistenceManager.setBatched('device_user_mappings', this.mappings);
    return saved;
  }

  static removeMapping(id: string): void {
    this.initialize();
    this.mappings = this.mappings.filter(m => m.id !== id);
    PersistenceManager.setBatched('device_user_mappings', this.mappings);
  }
}
