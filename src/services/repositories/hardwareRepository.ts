import { HardwareDevice, HardwareEvent, IntegrationMode } from '../../types';
import { initialHardwareDevices } from '../../data/initialData';
import { PersistenceManager } from './persistenceManager';
import { createNormalizedHardwareEvent } from '../hardwareAdapters';
import { PilotComparisonService } from '../hardware/pilotComparisonService';

type EventListener = (event: HardwareEvent) => void;

export class HardwareRepository {
  private static devicesList: HardwareDevice[] = [];
  private static eventsRingBuffer: HardwareEvent[] = [];
  private static readonly MAX_EVENTS_BUFFER = 100;
  private static listeners: Set<EventListener> = new Set();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;
    const storedDevices = PersistenceManager.get<HardwareDevice[]>('hardware_devices', initialHardwareDevices);
    const storedEvents = PersistenceManager.get<HardwareEvent[]>('hardware_events', [
      createNormalizedHardwareEvent('dev-face-gate', 'ACCESS_GRANTED', {
        memberName: 'نیما کمالی',
        memberId: 'std-2',
        credentialType: 'face',
        accessResult: 'granted',
        accessReason: 'عضویت معتبر • کمد #22 اختصاص یافت',
      }),
      createNormalizedHardwareEvent('dev-rfid-turnstile', 'ACCESS_GRANTED', {
        memberName: 'فرزاد شجاعی',
        memberId: 'std-6',
        credentialType: 'rfid',
        accessResult: 'granted',
        accessReason: 'تردد گیت تایید شد • کمد #18',
      }),
    ]);

    this.devicesList = [...storedDevices];
    this.eventsRingBuffer = [...storedEvents].slice(0, this.MAX_EVENTS_BUFFER);
    this.isInitialized = true;
  }

  static getAll(): HardwareDevice[] {
    this.initialize();
    return [...this.devicesList];
  }

  static getDevices(): HardwareDevice[] {
    return this.getAll();
  }

  static getById(id: string): HardwareDevice | undefined {
    this.initialize();
    return this.devicesList.find(d => d.id === id);
  }

  static getRecentEvents(limit = 50): HardwareEvent[] {
    this.initialize();
    return this.eventsRingBuffer.slice(0, limit);
  }

  static append(event: HardwareEvent): void {
    this.addEvent(event);
  }

  static getRecent(limit = 50): HardwareEvent[] {
    return this.getRecentEvents(limit);
  }

  static getByDevice(deviceId: string): HardwareEvent[] {
    this.initialize();
    return this.eventsRingBuffer.filter(e => e.deviceId === deviceId);
  }

  static getByMember(memberId: string): HardwareEvent[] {
    this.initialize();
    return this.eventsRingBuffer.filter(e => e.memberId === memberId);
  }

  static getByDateRange(startDate: string, endDate: string): HardwareEvent[] {
    this.initialize();
    return this.eventsRingBuffer.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
  }

  static getErrors(): HardwareEvent[] {
    this.initialize();
    return this.eventsRingBuffer.filter(e => e.eventType === 'DEVICE_ERROR' || e.eventType === 'DEVICE_OFFLINE' || e.eventType === 'SYNC_FAILED' || e.accessResult === 'denied');
  }

  static getOnlineCount(): number {
    this.initialize();
    return this.devicesList.filter(d => d.status === 'online').length;
  }

  static addEvent(event: HardwareEvent): void {
    this.initialize();
    this.eventsRingBuffer = [event, ...this.eventsRingBuffer].slice(0, this.MAX_EVENTS_BUFFER);
    PersistenceManager.setBatched('hardware_events', this.eventsRingBuffer);

    // Process in Shadow Mode Pilot Comparison
    try {
      PilotComparisonService.processHardwareEvent(event);
    } catch {
      // safe fallback
    }

    // Notify listeners selectively
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[HardwareRepository] Listener error:', err);
      }
    });
  }

  static add(device: HardwareDevice): HardwareDevice {
    this.initialize();
    this.devicesList = [device, ...this.devicesList.filter(d => d.id !== device.id)];
    PersistenceManager.setBatched('hardware_devices', this.devicesList);
    return device;
  }

  static addDevice(device: HardwareDevice): void {
    this.add(device);
  }

  static update(deviceId: string, updates: Partial<HardwareDevice>): HardwareDevice | null {
    this.initialize();
    let updatedDevice: HardwareDevice | null = null;
    this.devicesList = this.devicesList.map(d => {
      if (d.id === deviceId) {
        updatedDevice = { ...d, ...updates };
        return updatedDevice;
      }
      return d;
    });
    if (updatedDevice) {
      PersistenceManager.setBatched('hardware_devices', this.devicesList);
    }
    return updatedDevice;
  }

  static updateDevice(deviceId: string, updates: Partial<HardwareDevice>): void {
    this.update(deviceId, updates);
  }

  static delete(deviceId: string): boolean {
    this.initialize();
    const initialLen = this.devicesList.length;
    this.devicesList = this.devicesList.filter(d => d.id !== deviceId);
    if (this.devicesList.length !== initialLen) {
      PersistenceManager.setBatched('hardware_devices', this.devicesList);
      return true;
    }
    return false;
  }

  static removeDevice(deviceId: string): void {
    this.delete(deviceId);
  }

  static subscribeToEvents(callback: EventListener): () => void {
    this.initialize();
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  static toggleDeviceOnline(deviceId: string): void {
    this.initialize();
    this.devicesList = this.devicesList.map(dev => {
      if (dev.id === deviceId) {
        const nextStatus = dev.status === 'online' ? 'offline' : 'online';
        return {
          ...dev,
          status: nextStatus,
          lastPing: new Date().toLocaleTimeString('fa-IR'),
        };
      }
      return dev;
    });

    PersistenceManager.setBatched('hardware_devices', this.devicesList);
  }

  static async testRelayPulse(deviceId: string): Promise<{ success: boolean; latency: number }> {
    this.initialize();
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 40));
    const latency = Math.round(performance.now() - start);

    this.devicesList = this.devicesList.map(dev => {
      if (dev.id === deviceId) {
        return {
          ...dev,
          status: 'online',
          latencyMs: latency,
          lastPing: new Date().toLocaleTimeString('fa-IR'),
        };
      }
      return dev;
    });

    PersistenceManager.setBatched('hardware_devices', this.devicesList);
    return { success: true, latency };
  }

  static batchSet(devices: HardwareDevice[], events: HardwareEvent[]): void {
    this.devicesList = [...devices];
    this.eventsRingBuffer = [...events].slice(0, this.MAX_EVENTS_BUFFER);
    PersistenceManager.setBatched('hardware_devices', this.devicesList);
    PersistenceManager.setBatched('hardware_events', this.eventsRingBuffer);
  }

  static reset(devices: HardwareDevice[] = [], events: HardwareEvent[] = []): void {
    this.devicesList = [...devices];
    this.eventsRingBuffer = [...events].slice(0, this.MAX_EVENTS_BUFFER);
    PersistenceManager.setImmediate('hardware_devices', this.devicesList);
    PersistenceManager.setImmediate('hardware_events', this.eventsRingBuffer);
    this.isInitialized = true;
  }
}
