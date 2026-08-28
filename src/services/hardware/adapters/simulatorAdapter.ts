import { 
  HardwareCapability, 
  HardwareDevice, 
  HardwareEvent, 
  HardwareEventType, 
  HardwareVendor, 
  IntegrationMode 
} from '../../../types';
import { BaseHardwareAdapter } from '../hardwareAdapter';
import { 
  ActuationResult, 
  AdapterHealthResult, 
  DeviceInfoResult, 
  DiagnosticLogResult 
} from '../hardwareTypes';

export class SimulatorAdapter extends BaseHardwareAdapter {
  adapterId = 'simulator_virtual_v1';
  name = 'Virtual Hardware Simulator Adapter';
  vendor: HardwareVendor = 'generic_relay';
  supportedProtocols = ['websocket', 'http_webhook', 'modbus_tcp'];
  supportedCapabilities: HardwareCapability[] = [
    'FACE_RECOGNITION',
    'FINGERPRINT',
    'RFID_NFC',
    'QR_CODE',
    'PIN_CODE',
    'DOOR_ACTUATION',
    'LOCKER_RELAY_PULSE',
    'EVENT_STREAM_PUSH',
    'DEVICE_TIME_SYNC',
  ];

  async healthCheck(device: HardwareDevice): Promise<AdapterHealthResult> {
    return {
      isOnline: true,
      latencyMs: Math.floor(5 + Math.random() * 10),
      firmwareVersion: 'v2025.1-SIMULATOR',
      activeConnectionsCount: 1,
    };
  }

  async getDeviceInfo(device: HardwareDevice): Promise<DeviceInfoResult> {
    return {
      vendor: device.vendor || 'generic_relay',
      model: 'Virtual Hardware Emulator v1.0',
      firmware: 'v2025.1-SIMULATOR',
      serial: device.serialNumber || 'SIM-8899-VIRT',
      capabilities: this.supportedCapabilities,
    };
  }

  async openDoor(
    device: HardwareDevice, 
    pulseDurationMs = 1500, 
    mode: IntegrationMode = 'shadow'
  ): Promise<ActuationResult> {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'شبیه‌ساز در حالت شنود (Shadow Mode): هیچ سیگنالی به رله مجازی ارسال نگردید.',
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `[شبیه‌ساز سخت‌افزار] فرمان باز شدن درب با پالس ${pulseDurationMs}ms به گیت مجازی ${device.name} اعمال شد.`,
      pulseDurationMs,
      executedAt: new Date().toISOString(),
    };
  }

  async openLocker(
    device: HardwareDevice, 
    relayPort: number, 
    pulseDurationMs = 800, 
    mode: IntegrationMode = 'shadow'
  ): Promise<ActuationResult> {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'شبیه‌ساز در حالت شنود (Shadow Mode): رله کمد تریگر نشد.',
        relayPort,
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `[شبیه‌ساز کمد] پالس الکترونیکی ${pulseDurationMs}ms به قفل پورت رله #${relayPort} ارسال شد.`,
      relayPort,
      pulseDurationMs,
      executedAt: new Date().toISOString(),
    };
  }

  async runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult> {
    return {
      passed: true,
      latencyMs: 8,
      timestamp: new Date().toISOString(),
      logs: [
        `[Simulator] Virtual Loopback verified for ${device.name}`,
        `[Capabilities] All biometric and relay vectors available`,
        `[Status] Ready for sandbox and test workflows.`,
      ],
    };
  }

  /**
   * Helper to simulate a biometric or RFID scan event from hardware
   */
  generateSimulatedEvent(
    device: HardwareDevice,
    eventType: HardwareEventType,
    options: {
      memberId?: string;
      memberName?: string;
      credentialType?: 'face' | 'rfid' | 'fingerprint' | 'qr' | 'pin';
      direction?: 'entry' | 'exit';
      accessResult?: 'granted' | 'denied' | 'ignored_shadow_mode';
      accessReason?: string;
      externalUserId?: string;
    }
  ): HardwareEvent {
    return {
      id: `sim-evt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      deviceId: device.id,
      deviceName: device.name,
      vendor: device.vendor,
      eventType,
      timestamp: new Date().toISOString(),
      externalUserId: options.externalUserId,
      memberId: options.memberId,
      memberName: options.memberName || 'کاربر شبیه‌سازی شده',
      credentialType: options.credentialType || 'rfid',
      authenticationResult: 'success',
      accessResult: options.accessResult || 'granted',
      accessReason: options.accessReason || 'احراز هویت شبیه‌ساز',
      direction: options.direction || 'entry',
      rawPayload: JSON.stringify(options),
      source: 'simulator',
      processingStatus: 'processed',
      correlationId: `sim-corr-${Date.now()}`,
    };
  }
}
