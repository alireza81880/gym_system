import { 
  HardwareDevice, 
  HardwareCapability, 
  HardwareEvent, 
  HardwareEventType, 
  IntegrationMode,
  HardwareVendor,
  StaffUser,
  DeviceUser
} from '../../types';

export interface DeviceConnectionInfo {
  ipAddress: string;
  port: number;
  protocol: string;
  timeoutMs?: number;
  authToken?: string;
  serialPortName?: string;
  baudRate?: number;
  commPassword?: string;
}

export interface AdapterHealthResult {
  isOnline: boolean;
  latencyMs: number;
  firmwareVersion?: string;
  activeConnectionsCount?: number;
  lastError?: string;
  checkedAt?: string;
}

export interface ActuationResult {
  success: boolean;
  message: string;
  command?: string;
  relayPort?: number;
  pulseDurationMs?: number;
  executedAt?: string;
  latencyMs?: number;
  error?: string;
}

export interface DeviceInfoResult {
  firmware: string;
  serial: string;
  capabilities: HardwareCapability[];
  model?: string;
  vendor: HardwareVendor;
  macAddress?: string;
  rawResponse?: Record<string, any>;
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

export type HardwareCommandType =
  | 'OPEN_DOOR'
  | 'UNLOCK'
  | 'LOCK'
  | 'OPEN_LOCKER'
  | 'RELAY_PULSE'
  | 'SYNC_CLOCK'
  | 'RUN_DIAGNOSTICS'
  | 'READ_USERS'
  | 'READ_LOGS'
  | 'TEST_CONNECTION'
  | 'REBOOT'
  | 'CUSTOM';

export interface HardwareCommand {
  type: HardwareCommandType;
  pulseDurationMs?: number;
  relayPort?: number;
  mode?: IntegrationMode;
  parameters?: Record<string, any>;
  correlationId?: string;
  initiatedBy?: string;
}

export interface NormalizedHardwareEvent extends HardwareEvent {
  eventId?: string;
  correlationId?: string;
  deviceId: string;
  externalUserId?: string;
  memberId?: string;
  memberName?: string;
  eventType: HardwareEventType;
  timestamp: string;
  deviceTimestamp?: string;
  result?: 'granted' | 'denied' | 'ignored_shadow_mode';
  metadata?: Record<string, any>;
}

export interface DeviceTelemetry {
  deviceId: string;
  status: 'online' | 'offline' | 'warning' | 'error' | 'degraded' | 'simulated';
  lastConnectionAttempt?: string;
  lastSuccessfulConnection?: string;
  lastEventAt?: string;
  lastEvent?: HardwareEvent;
  lastError?: string;
  lastErrorAt?: string;
  reconnectCount: number;
  latencyMs: number;
  activeListenersCount: number;
}

export interface DiscoveryParams {
  ipAddress: string;
  port: number;
  protocol?: string;
  commPassword?: string;
  username?: string;
  familyHint?: 'auto' | 'speedface' | 'c3_controller' | 'inbio' | 'other';
}

export interface HardwareAdapter {
  adapterId: string;
  name: string;
  vendor: HardwareVendor;
  supportedProtocols: string[];
  supportedCapabilities: HardwareCapability[];

  connect(device: HardwareDevice): Promise<boolean>;
  disconnect(device: HardwareDevice): Promise<boolean>;
  getStatus(device: HardwareDevice): Promise<AdapterHealthResult>;
  healthCheck(device: HardwareDevice): Promise<AdapterHealthResult>;
  testConnection(device: HardwareDevice): Promise<{ success: boolean; latencyMs: number; message?: string; error?: string }>;
  getDeviceInfo(device: HardwareDevice): Promise<DeviceInfoResult>;
  
  // Real Discovery probe
  discover(params: DiscoveryParams): Promise<DiscoveryResult>;

  // Unified Command Pipeline
  sendCommand(device: HardwareDevice, command: HardwareCommand): Promise<ActuationResult>;

  // Unified Event Subscription with cleanup callback
  subscribeEvents(device: HardwareDevice, listener: (event: HardwareEvent) => void): () => void;

  // Read-only user & log streams
  readUsers?(device: HardwareDevice): Promise<DeviceUser[]>;
  readAccessLogs?(device: HardwareDevice, limit?: number): Promise<HardwareEvent[]>;
  
  // Actuations (Executed based on IntegrationMode: Shadow / Hybrid / Full Control)
  openDoor(device: HardwareDevice, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  openLocker(device: HardwareDevice, relayPort: number, pulseDurationMs?: number, mode?: IntegrationMode): Promise<ActuationResult>;
  
  // Clock Synchronization
  syncClock(device: HardwareDevice): Promise<boolean>;
  
  // Diagnostics
  runDiagnostics(device: HardwareDevice): Promise<DiagnosticLogResult>;
}
