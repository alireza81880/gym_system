import { HardwareCapability, HardwareVendor } from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';

export class GenericRelayAdapter extends BaseHardwareAdapter {
  adapterId = 'generic_relay_locker_v1';
  name = 'Multi-Channel Locker Relay Controller (Modbus / ESP32)';
  vendor: HardwareVendor = 'generic_relay';
  supportedProtocols = ['modbus_tcp', 'websocket', 'mqtt', 'serial_webusb'];
  supportedCapabilities: HardwareCapability[] = [
    'LOCKER_RELAY_PULSE',
    'EVENT_PULL',
    'DEVICE_TIME_SYNC',
  ];
}
