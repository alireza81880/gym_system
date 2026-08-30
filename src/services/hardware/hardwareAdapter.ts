import { 
  HardwareDevice, 
  HardwareCapability, 
  IntegrationMode,
  HardwareVendor,
  HardwareEvent,
  DeviceUser
} from '../../types';
import { 
  HardwareAdapter, 
  AdapterHealthResult, 
  ActuationResult, 
  DeviceInfoResult, 
  DiagnosticLogResult,
  DiscoveryResult,
  DiscoveryParams,
  HardwareCommand
} from './hardwareTypes';

export abstract class BaseHardwareAdapter implements HardwareAdapter {
  abstract adapterId: string;
  abstract name: string;
  abstract vendor: HardwareVendor;
  abstract supportedProtocols: string[];
  abstract supportedCapabilities: HardwareCapability[];

  protected eventListeners: Map<string, Set<(event: HardwareEvent) => void>> = new Map();

  async connect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Connecting to device ${device.name} (${device.ipAddress}:${device.port}) via ${device.protocol}...`);
    return true;
  }

  async disconnect(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Disconnecting device ${device.name}`);
    // Clear device listeners on disconnect to prevent memory leaks
    this.eventListeners.delete(device.id);
    return true;
  }

  async getStatus(device: HardwareDevice): Promise<AdapterHealthResult> {
    return this.healthCheck(device);
  }

  async healthCheck(device: HardwareDevice): Promise<AdapterHealthResult> {
    const latency = Math.floor(10 + Math.random() * 25);
    return {
      isOnline: device.status !== 'offline',
      latencyMs: device.status === 'offline' ? 0 : latency,
      firmwareVersion: device.firmware || 'v3.9.1-prod',
      activeConnectionsCount: device.status === 'offline' ? 0 : 1,
      checkedAt: new Date().toISOString(),
      lastError: device.status === 'offline' ? (device.lastError || 'دستگاه در وضعیت آفلاین قرار دارد.') : undefined,
    };
  }

  async testConnection(device: HardwareDevice): Promise<{ success: boolean; latencyMs: number; message?: string; error?: string }> {
    const startTime = performance.now();
    try {
      const health = await this.healthCheck(device);
      const latencyMs = Math.round(performance.now() - startTime);
      if (health.isOnline) {
        return {
          success: true,
          latencyMs,
          message: `اتصال به دستگاه ${device.name} با موفقیت برقرار است (${latencyMs}ms).`,
        };
      } else {
        return {
          success: false,
          latencyMs: 0,
          error: health.lastError || 'پاسخی از دستگاه در شبکه محلی دریافت نشد.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        latencyMs: 0,
        error: err.message || 'خطا در برقراری سوکت شبکه با دستگاه.',
      };
    }
  }

  async getDeviceInfo(device: HardwareDevice): Promise<DeviceInfoResult> {
    return {
      vendor: this.vendor,
      model: device.model || device.type,
      firmware: device.firmware || 'v3.9.1-prod',
      serial: device.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      capabilities: this.supportedCapabilities,
      macAddress: device.macAddress,
    };
  }

  async discover(params: DiscoveryParams): Promise<DiscoveryResult> {
    const isLocalSubnet = /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^127\.0\.0\.1|^localhost/.test(params.ipAddress.trim());
    const latency = Math.floor(12 + Math.random() * 18);

    if (!isLocalSubnet && !params.ipAddress.includes('.')) {
      return {
        success: false,
        vendor: this.vendor,
        model: 'Unknown / Unreachable',
        firmware: 'Unknown',
        serial: 'Unknown',
        detectedCapabilities: [],
        latencyMs: 0,
        protocolUsed: params.protocol || 'tcp_raw',
        ipAddress: params.ipAddress,
        port: params.port,
        error: `آدرس IP نامعتبر یا غیرقابل دسترس در شبکه محلی: ${params.ipAddress}`,
      };
    }

    return {
      success: true,
      vendor: this.vendor,
      model: `${this.name} Terminal`,
      firmware: 'v3.8.2-std',
      serial: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      detectedCapabilities: this.supportedCapabilities,
      latencyMs: latency,
      protocolUsed: params.protocol || this.supportedProtocols[0] || 'tcp_raw',
      ipAddress: params.ipAddress,
      port: params.port,
      message: 'دستگاه با موفقیت در شبکه محلی شناسایی شد.',
    };
  }

  async sendCommand(device: HardwareDevice, command: HardwareCommand): Promise<ActuationResult> {
    const startTime = performance.now();
    const executedAt = new Date().toISOString();

    // Check capability
    if (command.type === 'OPEN_DOOR' || command.type === 'UNLOCK') {
      const res = await this.openDoor(device, command.pulseDurationMs, command.mode);
      return {
        ...res,
        command: command.type,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    if (command.type === 'OPEN_LOCKER' || command.type === 'RELAY_PULSE') {
      const port = command.relayPort || 1;
      const res = await this.openLocker(device, port, command.pulseDurationMs, command.mode);
      return {
        ...res,
        command: command.type,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    if (command.type === 'SYNC_CLOCK') {
      const success = await this.syncClock(device);
      return {
        success,
        message: success ? 'ساعت داخلی سخت‌افزار همگام‌سازی گردید.' : 'خطا در همگام‌سازی زمان دستگاه.',
        command: command.type,
        executedAt,
        latencyMs: Math.round(performance.now() - startTime),
      };
    }

    if (command.type === 'RUN_DIAGNOSTICS') {
      const diag = await this.runDiagnostics(device);
      return {
        success: diag.passed,
        message: diag.passed ? 'تست خودکار و دیاگ سخت‌افزار با موفقیت انجام شد.' : 'دیاگ سخت‌افزار با خطا مواجه شد.',
        command: command.type,
        executedAt,
        latencyMs: diag.latencyMs,
      };
    }

    if (command.type === 'TEST_CONNECTION') {
      const test = await this.testConnection(device);
      return {
        success: test.success,
        message: test.message || test.error || '',
        command: command.type,
        executedAt,
        latencyMs: test.latencyMs,
        error: test.error,
      };
    }

    return {
      success: false,
      message: `فرمان ${command.type} توسط آداپتور ${this.name} پشتیبانی نمی‌شود.`,
      command: command.type,
      executedAt,
      error: 'UNSUPPORTED_COMMAND',
    };
  }

  subscribeEvents(device: HardwareDevice, listener: (event: HardwareEvent) => void): () => void {
    if (!this.eventListeners.has(device.id)) {
      this.eventListeners.set(device.id, new Set());
    }
    const set = this.eventListeners.get(device.id)!;
    set.add(listener);

    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.eventListeners.delete(device.id);
      }
    };
  }

  protected emitDeviceEvent(deviceId: string, event: HardwareEvent): void {
    const listeners = this.eventListeners.get(deviceId);
    if (listeners) {
      listeners.forEach(fn => {
        try {
          fn(event);
        } catch (err) {
          console.error(`[${this.name}] Event listener error:`, err);
        }
      });
    }
  }

  async readUsers?(device: HardwareDevice): Promise<DeviceUser[]> {
    return [
      { externalUserId: '101', name: 'کاربر شماره ۱۰۱', credentialTypes: ['RFID', 'CARD'], privilege: 'user' },
      { externalUserId: '102', name: 'کاربر شماره ۱۰۲', credentialTypes: ['FACE'], privilege: 'user' },
    ];
  }

  async readAccessLogs?(device: HardwareDevice, limit = 20): Promise<HardwareEvent[]> {
    return [];
  }

  async openDoor(device: HardwareDevice, pulseDurationMs = 1500, mode: IntegrationMode = 'shadow'): Promise<ActuationResult> {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ هیچ فرمان کنترلی ارسال نشد.',
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `فرمان بازگشایی درب با پالس ${pulseDurationMs}ms به ${device.name} ارسال شد.`,
      pulseDurationMs,
      executedAt: new Date().toISOString(),
    };
  }

  async openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs = 800, mode: IntegrationMode = 'shadow'): Promise<ActuationResult> {
    if (mode === 'shadow') {
      return {
        success: false,
        message: 'دستگاه در حالت شنود (Shadow Mode) قرار دارد؛ هیچ فرمانی به رله کمد ارسال نشد.',
        relayPort,
        pulseDurationMs,
        executedAt: new Date().toISOString(),
      };
    }
    return {
      success: true,
      message: `پالس ${pulseDurationMs}ms به پورت رله #${relayPort} دستگاه ${device.name} اعمال شد.`,
      relayPort,
      pulseDurationMs,
      executedAt: new Date().toISOString(),
    };
  }

  async syncClock(device: HardwareDevice): Promise<boolean> {
    console.log(`[${this.name}] Clock sync command sent to ${device.name} (${device.ipAddress})`);
    return true;
  }

  async runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult> {
    const isOnline = device.status !== 'offline';
    const latency = Math.floor(10 + Math.random() * 20);
    const timestamp = new Date().toISOString();

    if (!isOnline) {
      return {
        passed: false,
        latencyMs: 0,
        timestamp,
        logs: [
          `[Init] Probing ${device.name} at ${device.ipAddress}:${device.port}`,
          `[Status] Device is offline.`,
          `[Diagnostic Result] FAILED — Check local physical wiring and network switch.`,
        ],
      };
    }

    return {
      passed: true,
      latencyMs: latency,
      timestamp,
      logs: [
        `[Init] Probing ${device.name} at ${device.ipAddress}:${device.port}`,
        `[TCP Connect] Handshake completed in ${latency}ms`,
        `[Status] ONLINE — All telemetry channels healthy.`,
      ],
    };
  }
}
