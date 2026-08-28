import { HardwareCapability, HardwareVendor } from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';

export class SupremaAdapter extends BaseHardwareAdapter {
  adapterId = 'suprema_biostar_v2';
  name = 'Suprema BioStar Adapter';
  vendor: HardwareVendor = 'suprema';
  supportedProtocols = ['websocket', 'tcp_raw'];
  supportedCapabilities: HardwareCapability[] = [
    'FACE_RECOGNITION',
    'FINGERPRINT',
    'RFID_NFC',
    'DOOR_ACTUATION',
    'USER_ENROLLMENT',
  ];
}
