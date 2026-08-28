import { HardwareCapability, HardwareVendor } from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';

export class HikvisionAdapter extends BaseHardwareAdapter {
  adapterId = 'hikvision_isapi_v2';
  name = 'Hikvision ISAPI Terminal Adapter';
  vendor: HardwareVendor = 'hikvision';
  supportedProtocols = ['http_webhook', 'websocket'];
  supportedCapabilities: HardwareCapability[] = [
    'FACE_RECOGNITION',
    'QR_CODE',
    'RFID_NFC',
    'TEMPERATURE_SENSOR',
    'DOOR_ACTUATION',
    'EVENT_STREAM_PUSH',
    'DEVICE_TIME_SYNC',
  ];
}
