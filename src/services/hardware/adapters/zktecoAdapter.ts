import { HardwareCapability, HardwareVendor } from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';

export class ZKTecoAdapter extends BaseHardwareAdapter {
  adapterId = 'zkteco_standalone_v1';
  name = 'ZKTeco Push & Standalone Adapter';
  vendor: HardwareVendor = 'zkteco';
  supportedProtocols = ['websocket', 'http_webhook', 'tcp_raw'];
  supportedCapabilities: HardwareCapability[] = [
    'FACE_RECOGNITION',
    'FINGERPRINT',
    'RFID_NFC',
    'DOOR_ACTUATION',
    'EVENT_STREAM_PUSH',
    'USER_ENROLLMENT',
    'DEVICE_TIME_SYNC',
  ];
}
