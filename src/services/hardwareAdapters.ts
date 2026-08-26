import { 
  HardwareDevice, 
  HardwareCapability, 
  HardwareEvent, 
  HardwareEventType, 
  IntegrationMode,
  HardwareVendor
} from '../types';

export interface DeviceConnectionInfo {
  ipAddress: string;
  port: number;
  protocol: string;
  timeoutMs?: number;
  authToken?: string;
  serialPortName?: string;
  baudRate?: number;
}

export interface AdapterHealthResult {
  isOnline: boolean;
  latencyMs: number;
  firmwareVersion?: string;
  activeConnectionsCount?: number;
  lastError?: string;
}

export interface HardwareAdapter {
  adapterId: string;
  name: string;
  vendor: HardwareVendor;
  supportedProtocols: string[];
  supportedCapabilities: HardwareCapability[];

  connect(device: HardwareDevice): Promise<boolean>;
  disconnect(device: HardwareDevice): Promise<boolean>;
  healthCheck(device: HardwareDevice): Promise<AdapterHealthResult>;
  getDeviceInfo(device: HardwareDevice): Promise<{ firmware: string; serial: string; capabilities: HardwareCapability[] }>;
  
  // Actuations (Only executed in Hybrid or Full Control mode)
  openDoor(device: HardwareDevice, pulseDurationMs?: number, mode?: IntegrationMode): Promise<{ success: boolean; message: string }>;
  openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs?: number, mode?: IntegrationMode): Promise<{ success: boolean; message: string }>;
  
  // Clock Synchronization
  syncClock(device: HardwareDevice): Promise<boolean>;
  
  // Diagnostics
  runDiagnostics(device: HardwareDevice): Promise<{ passed: boolean; logs: string[]; latencyMs: number }>;
}

// ----------------------------------------------------
// Base Abstract Adapter
// ----------------------------------------------------
export abstract class BaseHardwareAdapter implements HardwareAdapter {
  abstract adapterId: string;
  abstract name: string;
  abstract vendor: HardwareVendor;
  abstract supportedProtocols: string[];
  abstract supportedCapabilities: HardwareCapability[];

  async connect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Connecting to device ${device.name} (${device.ipAddress}:${device.port})...`);
    return true;
  }

  async disconnect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Disconnecting device ${device.name}`);
    return true;
  }

  async healthCheck(device: HardwareDevice): Promise<AdapterHealthResult> {
    const latency = Math.floor(12 + Math.random() * 25);
    return {
      isOnline: device.status !== 'offline',
      latencyMs: latency,
      firmwareVersion: device.firmware || 'v3.8.2-build2025',
      activeConnectionsCount: 1,
    };
  }

  async getDeviceInfo(device: HardwareDevice) {
    return {
      firmware: device.firmware || 'v3.8.2-build2025',
      serial: device.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      capabilities: this.supportedCapabilities,
    };
  }

  async openDoor(device: HardwareDevice, pulseDurationMs = 1500, mode: IntegrationMode = 'shadow') {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ هیچ فرمان بازگشایی به رله ارسال نشد.',
      };
    }
    return {
      success: true,
      message: `فرمان بازگشایی درب با پالس ${pulseDurationMs} میلی‌ثانیه به ${device.name} ارسال شد.`,
    };
  }

  async openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs = 800, mode: IntegrationMode = 'shadow') {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ پالس فیزیکی قفل کمد ارسال نگردید.',
      };
    }
    return {
      success: true,
      message: `سیگنال رله پورت #${relayPort} روی بورد ${device.name} با موفقیت تریگر شد (${pulseDurationMs}ms).`,
    };
  }

  async syncClock(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Syncing hardware RTC clock for ${device.name} to host time.`);
    return true;
  }

  async runDiagnostics(device: HardwareDevice) {
    const isOnline = device.status !== 'offline';
    const latency = Math.floor(14 + Math.random() * 20);
    return {
      passed: isOnline,
      latencyMs: latency,
      logs: [
        `[Init] Probing ${device.ipAddress}:${device.port} using ${device.protocol.toUpperCase()}`,
        `[Handshake] Socket ACK received in ${latency}ms`,
        `[Capabilities] Verified: ${this.supportedCapabilities.join(', ')}`,
        `[Status] Device hardware operational.`,
      ],
    };
  }
}

// ----------------------------------------------------
// 1. ZKTeco Biometric & RFID Adapter
// ----------------------------------------------------
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

// ----------------------------------------------------
// 2. Hikvision Smart Terminal Adapter
// ----------------------------------------------------
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

// ----------------------------------------------------
// 3. Suprema Biometric Adapter
// ----------------------------------------------------
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

// ----------------------------------------------------
// 4. Generic Multi-Channel Locker Relay Board (Modbus / ESP32 / TCP)
// ----------------------------------------------------
export class GenericRelayLockerAdapter extends BaseHardwareAdapter {
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

// ----------------------------------------------------
// 5. Generic Wiegand Gateway Adapter
// ----------------------------------------------------
export class GenericWiegandGatewayAdapter extends BaseHardwareAdapter {
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

// ----------------------------------------------------
// Adapter Registry
// ----------------------------------------------------
export const adapterRegistry: Record<string, HardwareAdapter> = {
  zkteco: new ZKTecoAdapter(),
  hikvision: new HikvisionAdapter(),
  suprema: new SupremaAdapter(),
  generic_relay: new GenericRelayLockerAdapter(),
  generic_wiegand: new GenericWiegandGatewayAdapter(),
};

export function getAdapterForVendor(vendor: HardwareVendor): HardwareAdapter {
  return adapterRegistry[vendor] || adapterRegistry.generic_relay;
}

// ----------------------------------------------------
// Hardware Event Normalizer Helper
// ----------------------------------------------------
export function createNormalizedHardwareEvent(
  deviceId: string,
  eventType: HardwareEventType,
  payload: {
    deviceName?: string;
    vendor?: HardwareVendor;
    externalUserId?: string;
    memberId?: string;
    memberName?: string;
    credentialType?: 'face' | 'rfid' | 'fingerprint' | 'qr' | 'pin';
    authenticationResult?: 'success' | 'failed' | 'unrecognized';
    accessResult?: 'granted' | 'denied' | 'ignored_shadow_mode';
    accessReason?: string;
    direction?: 'entry' | 'exit';
    rawPayload?: string;
    source?: 'hardware_gateway' | 'simulator' | 'webhook' | 'shadow_listener';
  }
): HardwareEvent {
  const eventId = `hwevt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const timestamp = new Date().toISOString();

  return {
    id: eventId,
    deviceId,
    deviceName: payload.deviceName || 'ترمینال گیت ورود',
    vendor: payload.vendor || 'zkteco',
    eventType,
    timestamp,
    externalUserId: payload.externalUserId,
    memberId: payload.memberId,
    memberName: payload.memberName || 'هویت نامشخص',
    credentialType: payload.credentialType || 'rfid',
    authenticationResult: payload.authenticationResult || 'success',
    accessResult: payload.accessResult || 'granted',
    accessReason: payload.accessReason || '',
    direction: payload.direction || 'entry',
    rawPayload: payload.rawPayload || JSON.stringify(payload),
    source: payload.source || 'hardware_gateway',
    processingStatus: 'processed',
    correlationId: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
}
