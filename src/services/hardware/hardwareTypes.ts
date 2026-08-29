import { 
  HardwareDevice, 
  HardwareCapability, 
  HardwareEvent, 
  HardwareEventType, 
  IntegrationMode,
  HardwareVendor
} from '../../types';

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

export interface ActuationResult {
  success: boolean;
  message: string;
  relayPort?: number;
  pulseDurationMs?: number;
  executedAt?: string;
}

export interface DeviceInfoResult {
  firmware: string;
  serial: string;
  capabilities: HardwareCapability[];
  model?: string;
  vendor: HardwareVendor;
}

export interface DiagnosticLogResult {
  passed: boolean;
  latencyMs: number;
  logs: string[];
  timestamp: string;
}

export interface DiscoveryResult {
  success: boolean;
  model: string;
  firmware: string;
  serial: string;
  deviceId?: string;
  macAddress?: string;
  vendor: HardwareVendor;
  detectedCapabilities: HardwareCapability[];
  latencyMs: number;
  protocolUsed: string;
  ipAddress: string;
  port: number;
  message?: string;
  error?: string;
  rawResponse?: Record<string, unknown>;
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
  getDeviceInfo(device: HardwareDevice): Promise<DeviceInfoResult>;
  
  // Phase 9 Real Discovery
  discover(params: {
    ipAddress: string;
    port: number;
    protocol?: string;
    commPassword?: string;
    username?: string;
    familyHint?: 'auto' | 'speedface' | 'c3_controller' | 'inbio' | 'other';
  }): Promise<DiscoveryResult>;

  // Read-only user & log streams
  readUsers?(device: HardwareDevice): Promise<import('../../types').DeviceUser[]>;
  readAccessLogs?(device: HardwareDevice, limit?: number): Promise<HardwareEvent[]>;
  
  // Actuations (Executed based on IntegrationMode: Shadow / Hybrid / Full Control)
  openDoor(device: HardwareDevice, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  
  // Clock Synchronization
  syncClock(device: HardwareDevice): Promise<boolean>;
  
  // Diagnostics
  runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult>;
}
