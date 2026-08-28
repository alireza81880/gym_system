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
  
  // Actuations (Executed based on IntegrationMode: Shadow / Hybrid / Full Control)
  openDoor(device: HardwareDevice, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  
  // Clock Synchronization
  syncClock(device: HardwareDevice): Promise<boolean>;
  
  // Diagnostics
  runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult>;
}
