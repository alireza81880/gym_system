import { createStore, useStore } from './createStore';
import { HardwareDevice, HardwareEvent } from '../types';
import { HardwareRepository } from '../services/repositories/hardwareRepository';

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

function notifyHardwareChange(): void {
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
    HardwareRepository.toggleDeviceOnline(deviceId);
    notifyHardwareChange();
  },

  async testRelayPulse(deviceId: string): Promise<{ success: boolean; latency: number }> {
    const res = await HardwareRepository.testRelayPulse(deviceId);
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
