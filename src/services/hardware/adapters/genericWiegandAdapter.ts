import { HardwareCapability, HardwareVendor } from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';

export class GenericWiegandAdapter extends BaseHardwareAdapter {
  adapterId = 'generic_wiegand_v1';
  name = 'Generic Wiegand-to-IP Gateway';
  vendor: HardwareVendor = 'generic_wiegand';
  supportedProtocols = ['tcp_raw', 'udp', 'http_webhook'];
  supportedCapabilities: HardwareCapability[] = [
    'RFID_NFC',
    'PIN_CODE',
    'DOOR_ACTUATION',
    'EVENT_STREAM_PUSH',
  ];
}
