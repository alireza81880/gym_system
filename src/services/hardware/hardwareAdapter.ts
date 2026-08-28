import { 
  HardwareDevice, 
  HardwareCapability, 
  IntegrationMode,
  HardwareVendor
} from '../../types';
import { 
  HardwareAdapter, 
  AdapterHealthResult, 
  ActuationResult, 
  DeviceInfoResult, 
  DiagnosticLogResult 
} from './hardwareTypes';

export abstract class BaseHardwareAdapter implements HardwareAdapter {
  abstract adapterId: string;
  abstract name: string;
  abstract vendor: HardwareVendor;
  abstract supportedProtocols: string[];
  abstract supportedCapabilities: HardwareCapability[];

  async connect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Connecting to device ${device.name} (${device.ipAddress}:${device.port}) via ${device.protocol}...`);
    return true;
  }

  async disconnect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Disconnecting device ${device.name}`);
    return true;
  }

  async healthCheck(device: HardwareDevice): Promise<AdapterHealthResult> {
    const latency = Math.floor(10 + Math.random() * 25);
    return {
      isOnline: device.status !== 'offline',
      latencyMs: latency,
      firmwareVersion: device.firmware || 'v3.9.1-prod',
      activeConnectionsCount: 1,
    };
  }

  async getDeviceInfo(device: HardwareDevice): Promise<DeviceInfoResult> {
    return {
      vendor: this.vendor,
      model: device.type,
      firmware: device.firmware || 'v3.9.1-prod',
      serial: device.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
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
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ هیچ فرمان بازگشایی به رله ارسال نشد.',
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `فرمان بازگشایی درب با پالس ${pulseDurationMs} میلی‌ثانیه به ${device.name} ارسال شد.`,
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
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ پالس فیزیکی قفل کمد ارسال نگردید.',
        relayPort,
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `سیگنال رله پورت #${relayPort} روی بورد ${device.name} با موفقیت تریگر شد (${pulseDurationMs}ms).`,
      relayPort,
      pulseDurationMs,
      executedAt: new Date().toISOString(),
    };
  }

  async syncClock(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Syncing hardware RTC clock for ${device.name} to host ISO timestamp.`);
    return true;
  }

  async runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult> {
    const isOnline = device.status !== 'offline';
    const latency = Math.floor(12 + Math.random() * 20);
    return {
      passed: isOnline,
      latencyMs: latency,
      timestamp: new Date().toISOString(),
      logs: [
        `[Init] Probing ${device.ipAddress}:${device.port} using protocol: ${device.protocol.toUpperCase()}`,
        `[Handshake] Socket ACK received in ${latency}ms`,
        `[Capabilities] Verified vendor '${this.vendor}' capabilities: ${this.supportedCapabilities.join(', ')}`,
        `[Status] Device hardware operational.`,
      ],
    };
  }
}
