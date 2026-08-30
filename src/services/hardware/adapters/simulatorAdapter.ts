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
import { generateEventId, generateCorrelationId } from '../eventIdentity';

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
      isOnline: device.status !== 'offline',
      latencyMs: device.status === 'offline' ? 0 : Math.floor(5 + Math.random() * 10),
      firmwareVersion: 'v2025.1-SIMULATOR',
      activeConnectionsCount: device.status === 'offline' ? 0 : 1,
      checkedAt: new Date().toISOString(),
      lastError: device.status === 'offline' ? 'دستگاه شبیه‌ساز در وضعیت آفلاین قرار دارد.' : undefined,
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
    const isOnline = device.status !== 'offline';
    return {
      passed: isOnline,
      latencyMs: isOnline ? 8 : 0,
      timestamp: new Date().toISOString(),
      logs: isOnline ? [
        `[Simulator] Virtual Loopback verified for ${device.name}`,
        `[Capabilities] All biometric and relay vectors available`,
        `[Status] Ready for sandbox and test workflows.`,
      ] : [
        `[Simulator] Device ${device.name} is currently offline.`,
        `[Status] OFFLINE`,
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
      vendorEventId?: string;
      cardUid?: string;
    }
  ): HardwareEvent {
    const eventId = generateEventId(device.id, options.vendorEventId, 'evt-sim');
    const correlationId = generateCorrelationId('corr-sim');
    const nowIso = new Date().toISOString();

    const evt: HardwareEvent = {
      id: eventId,
      deviceId: device.id,
      deviceName: device.name,
      vendor: device.vendor,
      eventType,
      timestamp: nowIso,
      deviceTimestamp: nowIso,
      receivedAt: nowIso,
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
      correlationId,
    };

    // Emit event to subscribers
    this.emitDeviceEvent(device.id, evt);

    return evt;
  }
}
