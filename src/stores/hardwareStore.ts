import { createStore, useStore } from './createStore';
import { HardwareDevice, HardwareEvent } from '../types';
import { HardwareRepository } from '../services/repositories/hardwareRepository';
import { RBACService } from '../services/rbacService';
import { AuditService } from '../services/auditService';
import { settingsStore } from './settingsStore';

export interface HardwareState {
  version: number;
  onlineCount: number;
  devices: HardwareDevice[];
  recentEvents: HardwareEvent[];
}

export const hardwareStore = createStore<HardwareState>({
  version: 1,
  onlineCount: HardwareRepository.getOnlineCount(),
  devices: HardwareRepository.getDevices(),
  recentEvents: HardwareRepository.getRecentEvents(50),
});

// Subscribe store to HardwareRepository event stream
HardwareRepository.subscribeToEvents(() => {
  hardwareStore.setState({
    version: hardwareStore.getState().version + 1,
    onlineCount: HardwareRepository.getOnlineCount(),
    devices: HardwareRepository.getDevices(),
    recentEvents: HardwareRepository.getRecentEvents(50),
  });
});

export function notifyHardwareChange(): void {
  hardwareStore.setState({
    version: hardwareStore.getState().version + 1,
    onlineCount: HardwareRepository.getOnlineCount(),
    devices: HardwareRepository.getDevices(),
    recentEvents: HardwareRepository.getRecentEvents(50),
  });
}

export const hardwareActions = {
  addEvent(event: HardwareEvent): void {
    HardwareRepository.addEvent(event);
  },

  toggleDeviceOnline(deviceId: string): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('hardware.control', actor, {
      actionName: 'HARDWARE_TOGGLE_ONLINE',
      entityType: 'hardware',
      entityId: deviceId,
      description: `تغییر وضعیت آنلاین/آفلاین دستگاه سخت‌افزاری ${deviceId}`,
    });

    HardwareRepository.toggleDeviceOnline(deviceId);
    AuditService.logEvent({
      action: 'HARDWARE_TOGGLE_STATUS',
      category: 'hardware',
      entityType: 'hardware',
      entityId: deviceId,
      details: `وضعیت اتصال دستگاه ${deviceId} توسط «${actor.fullName}» تغییر کرد.`,
      actor,
    });
    notifyHardwareChange();
  },

  addDevice(device: HardwareDevice): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('hardware.configure', actor, {
      actionName: 'HARDWARE_ADD_DEVICE',
      entityType: 'hardware',
      entityId: device.id,
      description: `افزودن دستگاه سخت‌افزاری جدید (${device.name})`,
    });

    HardwareRepository.addDevice(device);
    AuditService.logSensitiveMutation({
      actor,
      action: 'HARDWARE_DEVICE_ADDED',
      entityType: 'hardware',
      entityId: device.id,
      description: `دستگاه سخت‌افزاری جدید «${device.name}» (${device.type}) افزوده شد.`,
      afterState: device,
      result: 'success',
    });
    notifyHardwareChange();
  },

  addHardwareDevice(device: HardwareDevice): void {
    hardwareActions.addDevice(device);
  },

  updateDevice(deviceId: string, updates: Partial<HardwareDevice>): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('hardware.configure', actor, {
      actionName: 'HARDWARE_UPDATE_DEVICE',
      entityType: 'hardware',
      entityId: deviceId,
      description: `ویرایش پیکربندی دستگاه سخت‌افزاری ${deviceId}`,
    });

    HardwareRepository.updateDevice(deviceId, updates);
    AuditService.logSensitiveMutation({
      actor,
      action: 'HARDWARE_DEVICE_UPDATED',
      entityType: 'hardware',
      entityId: deviceId,
      description: `پیکربندی دستگاه سخت‌افزاری ${deviceId} ویرایش شد.`,
      afterState: updates,
      result: 'success',
    });
    notifyHardwareChange();
  },

  removeDevice(deviceId: string): void {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('hardware.configure', actor, {
      actionName: 'HARDWARE_REMOVE_DEVICE',
      entityType: 'hardware',
      entityId: deviceId,
      description: `حذف دستگاه سخت‌افزاری ${deviceId}`,
    });

    HardwareRepository.removeDevice(deviceId);
    AuditService.logSensitiveMutation({
      actor,
      action: 'HARDWARE_DEVICE_REMOVED',
      entityType: 'hardware',
      entityId: deviceId,
      description: `دستگاه سخت‌افزاری ${deviceId} از مدار سیستم حذف گردید.`,
      result: 'success',
    });
    notifyHardwareChange();
  },

  async testRelayPulse(deviceId: string): Promise<{ success: boolean; latency: number }> {
    const actor = settingsStore.getState().currentUser;
    RBACService.requirePermission('hardware.test', actor, {
      actionName: 'HARDWARE_TEST_RELAY_PULSE',
      entityType: 'hardware',
      entityId: deviceId,
      description: `تست پالس الکترونیکی رله دستگاه ${deviceId}`,
    });

    const res = await HardwareRepository.testRelayPulse(deviceId);
    AuditService.logEvent({
      action: 'HARDWARE_RELAY_TESTED',
      category: 'hardware',
      entityType: 'hardware',
      entityId: deviceId,
      details: `تست پالس رله با موفقیت در ${res.latency} میلی‌ثانیه اجرا شد.`,
      actor,
    });
    notifyHardwareChange();
    return res;
  },

  batchSet(devices: HardwareDevice[], events: HardwareEvent[]): void {
    HardwareRepository.batchSet(devices, events);
    notifyHardwareChange();
  }
};

export function useHardwareStore<S = HardwareState>(selector?: (state: HardwareState) => S): S {
  return useStore(hardwareStore, selector);
}

export function useHardware() {
  const version = useStore(hardwareStore, s => s.version);
  const onlineCount = useStore(hardwareStore, s => s.onlineCount);
  const devices = useStore(hardwareStore, s => s.devices);
  const recentEvents = useStore(hardwareStore, s => s.recentEvents);

  return {
    version,
    onlineCount,
    devices,
    hardwareDevices: devices,
    recentEvents,
    hardwareEvents: recentEvents,
    ...hardwareActions,
  };
}

