/**
 * GYM OS — Hardware Gateway (Single Central Hub)
 * 
 * Finalized local hardware gateway orchestrating:
 * - Device Registration & Lifecycle
 * - Adapter Selection & Unified Contracts
 * - Connect / Disconnect & Offline Safety
 * - Capability & RBAC-Protected Command Routing
 * - Robust Event Identity & Time-Windowed Deduplication
 * - Event Normalization & Pipeline Execution (Member Resolution, Policy Evaluation, Attendance & Lockers)
 * - Observability & Telemetry (Last Error, Last Event, Connection Latency)
 */

import { 
  HardwareDevice, 
  HardwareCapability, 
  HardwareEvent, 
  HardwareEventType, 
  IntegrationMode, 
  StaffUser, 
  Student, 
  AccessDecision 
} from '../../types';
import { initialPackages } from '../../data/initialData';
import { 
  HardwareAdapter, 
  HardwareCommand, 
  NormalizedHardwareEvent, 
  AdapterHealthResult, 
  ActuationResult, 
  DeviceTelemetry, 
  DiagnosticLogResult 
} from './hardwareTypes';
import { getAdapterForVendor } from './adapterRegistry';
import { HardwareRepository } from '../repositories/hardwareRepository';
import { DeviceMappingRepository } from '../repositories/deviceMappingRepository';
import { MemberRepository } from '../repositories/memberRepository';
import { AttendanceRepository } from '../repositories/attendanceRepository';
import { LockerRepository } from '../repositories/lockerRepository';
import { AccessPolicyEngine } from '../accessPolicyService';
import { PilotComparisonService } from './pilotComparisonService';
import { AuditService } from '../auditService';
import { RBACService } from '../rbacService';
import { 
  generateEventId, 
  generateCorrelationId, 
  computeEventFingerprint 
} from './eventIdentity';

export type GatewayEventListener = (event: NormalizedHardwareEvent) => void;

export class HardwareGateway {
  private static instance: HardwareGateway;
  
  private telemetryMap: Map<string, DeviceTelemetry> = new Map();
  private activeSubscriptions: Map<string, () => void> = new Map();
  private gatewayListeners: Set<GatewayEventListener> = new Set();
  
  // Deduplication cache: Key = Fingerprint, Value = Timestamp (ms)
  private deduplicationCache: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW_MS = 6000; // 6-second deduplication window
  private readonly MAX_DEDUP_CACHE_SIZE = 1000;

  private isInitialized = false;

  private constructor() {}

  public static getInstance(): HardwareGateway {
    if (!HardwareGateway.instance) {
      HardwareGateway.instance = new HardwareGateway();
    }
    return HardwareGateway.instance;
  }

  /**
   * Initializes the Gateway and binds initial listeners for all registered devices
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    HardwareRepository.initialize();
    const devices = HardwareRepository.getAll();

    for (const device of devices) {
      this.initTelemetry(device);
      if (device.status === 'online') {
        this.bindDeviceListener(device);
      }
    }

    this.isInitialized = true;
  }

  private initTelemetry(device: HardwareDevice): DeviceTelemetry {
    if (!this.telemetryMap.has(device.id)) {
      this.telemetryMap.set(device.id, {
        deviceId: device.id,
        status: device.status,
        latencyMs: device.latencyMs || 0,
        reconnectCount: 0,
        activeListenersCount: 0,
        lastError: device.lastError,
      });
    }
    return this.telemetryMap.get(device.id)!;
  }

  // ==========================================
  // 1. DEVICE REGISTRATION & DISCOVERY
  // ==========================================

  public registerDevice(device: HardwareDevice): HardwareDevice {
    this.initialize();
    const registered = HardwareRepository.add(device);
    this.initTelemetry(registered);

    if (registered.status === 'online') {
      this.bindDeviceListener(registered);
    }

    AuditService.logEvent({
      action: 'DEVICE_REGISTERED',
      details: `دستگاه جدید «${device.name}» (Vendor: ${device.vendor}, IP: ${device.ipAddress}:${device.port}) در گیت‌وی ثبت شد.`,
      module: 'hardware',
    });

    return registered;
  }

  public unregisterDevice(deviceId: string): boolean {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) return false;

    // Detach listeners and clean up adapter subscription
    this.unbindDeviceListener(deviceId);
    this.telemetryMap.delete(deviceId);

    HardwareRepository.delete(deviceId);

    AuditService.logEvent({
      action: 'DEVICE_UNREGISTERED',
      details: `دستگاه «${device.name}» از سامانه گیت‌وی حذف شد.`,
      module: 'hardware',
    });

    return true;
  }

  public updateDevice(deviceId: string, updates: Partial<HardwareDevice>): HardwareDevice | null {
    this.initialize();
    const updated = HardwareRepository.update(deviceId, updates);
    if (updated) {
      const telemetry = this.telemetryMap.get(deviceId);
      if (telemetry) {
        telemetry.status = updated.status;
        telemetry.latencyMs = updated.latencyMs || telemetry.latencyMs;
      }
    }
    return updated;
  }

  public getDevice(deviceId: string): HardwareDevice | undefined {
    this.initialize();
    return HardwareRepository.getById(deviceId);
  }

  public getRegisteredDevices(): HardwareDevice[] {
    this.initialize();
    return HardwareRepository.getAll();
  }

  public getAdapterForDevice(device: HardwareDevice): HardwareAdapter {
    return getAdapterForVendor(device.vendor);
  }

  // ==========================================
  // 2. CONNECT / DISCONNECT & OFFLINE SAFETY
  // ==========================================

  public async connectDevice(deviceId: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) {
      return { success: false, latencyMs: 0, error: `دستگاه با شناسه ${deviceId} یافت نشد.` };
    }

    const telemetry = this.initTelemetry(device);
    telemetry.lastConnectionAttempt = new Date().toISOString();

    const adapter = this.getAdapterForDevice(device);
    try {
      const connTest = await adapter.testConnection(device);
      if (connTest.success) {
        HardwareRepository.update(deviceId, {
          status: 'online',
          latencyMs: connTest.latencyMs,
          lastPing: new Date().toLocaleTimeString('fa-IR'),
          lastError: undefined,
        });

        telemetry.status = 'online';
        telemetry.lastSuccessfulConnection = new Date().toISOString();
        telemetry.latencyMs = connTest.latencyMs;
        telemetry.lastError = undefined;

        this.bindDeviceListener(device);

        return { success: true, latencyMs: connTest.latencyMs };
      } else {
        HardwareRepository.update(deviceId, {
          status: 'offline',
          lastError: connTest.error || 'پاسخی از دستگاه دریافت نشد.',
        });

        telemetry.status = 'offline';
        telemetry.lastError = connTest.error || 'پاسخی از دستگاه دریافت نشد.';
        telemetry.lastErrorAt = new Date().toISOString();

        return { success: false, latencyMs: 0, error: telemetry.lastError };
      }
    } catch (err: any) {
      const errMsg = err?.message || 'خطای سوکت در اتصال به دستگاه.';
      HardwareRepository.update(deviceId, {
        status: 'offline',
        lastError: errMsg,
      });

      telemetry.status = 'offline';
      telemetry.lastError = errMsg;
      telemetry.lastErrorAt = new Date().toISOString();

      return { success: false, latencyMs: 0, error: errMsg };
    }
  }

  public async disconnectDevice(deviceId: string): Promise<boolean> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) return false;

    this.unbindDeviceListener(deviceId);

    HardwareRepository.update(deviceId, {
      status: 'offline',
      lastError: 'قطع ارتباط دستی توسط کاربر یا سیستم.',
    });

    const telemetry = this.initTelemetry(device);
    telemetry.status = 'offline';
    telemetry.lastError = 'قطع ارتباط دستی.';
    telemetry.lastErrorAt = new Date().toISOString();

    const adapter = this.getAdapterForDevice(device);
    await adapter.disconnect(device);
    return true;
  }

  public async reconnectDevice(deviceId: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
    this.initialize();
    const telemetry = this.telemetryMap.get(deviceId);
    if (telemetry) {
      telemetry.reconnectCount += 1;
    }

    await this.disconnectDevice(deviceId);
    return this.connectDevice(deviceId);
  }

  public async checkDeviceHealth(deviceId: string): Promise<AdapterHealthResult> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) {
      return {
        isOnline: false,
        latencyMs: 0,
        lastError: 'دستگاه یافت نشد.',
      };
    }

    const adapter = this.getAdapterForDevice(device);
    const health = await adapter.healthCheck(device);

    const telemetry = this.initTelemetry(device);
    telemetry.status = health.isOnline ? 'online' : 'offline';
    telemetry.latencyMs = health.latencyMs;
    if (!health.isOnline) {
      telemetry.lastError = health.lastError || 'دستگاه آفلاین است.';
      telemetry.lastErrorAt = new Date().toISOString();
    }

    HardwareRepository.update(deviceId, {
      status: health.isOnline ? 'online' : 'offline',
      latencyMs: health.latencyMs,
      lastPing: new Date().toLocaleTimeString('fa-IR'),
      lastError: health.lastError,
    });

    return health;
  }

  public async checkAllDevicesHealth(): Promise<Record<string, AdapterHealthResult>> {
    this.initialize();
    const devices = HardwareRepository.getAll();
    const results: Record<string, AdapterHealthResult> = {};

    await Promise.all(
      devices.map(async device => {
        results[device.id] = await this.checkDeviceHealth(device.id);
      })
    );

    return results;
  }

  private bindDeviceListener(device: HardwareDevice): void {
    // Safely unbind existing listener to prevent duplicate subscriptions
    this.unbindDeviceListener(device.id);

    const adapter = this.getAdapterForDevice(device);
    const unsubscribe = adapter.subscribeEvents(device, (event: HardwareEvent) => {
      this.ingestRawEvent(device.id, event);
    });

    this.activeSubscriptions.set(device.id, unsubscribe);
    const telemetry = this.initTelemetry(device);
    telemetry.activeListenersCount = 1;
  }

  private unbindDeviceListener(deviceId: string): void {
    const unsub = this.activeSubscriptions.get(deviceId);
    if (unsub) {
      try {
        unsub();
      } catch (err) {
        console.error(`[HardwareGateway] Error unbinding listener for ${deviceId}:`, err);
      }
      this.activeSubscriptions.delete(deviceId);
    }
    const telemetry = this.telemetryMap.get(deviceId);
    if (telemetry) {
      telemetry.activeListenersCount = 0;
    }
  }

  // ==========================================
  // 3. EVENT INGESTION, NORMALIZATION & PIPELINE
  // ==========================================

  /**
   * Ingests a raw hardware event from an adapter or external webhook.
   */
  public async ingestRawEvent(deviceId: string, rawEvent: any): Promise<NormalizedHardwareEvent | null> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) {
      console.warn(`[HardwareGateway] Ingest event dropped: Unknown device ${deviceId}`);
      return null;
    }

    const eventType: HardwareEventType = rawEvent.eventType || 'ACCESS_ATTEMPT';
    const externalUserId: string | undefined = rawEvent.externalUserId || rawEvent.pin || rawEvent.userId;
    const vendorEventId = rawEvent.vendorEventId || rawEvent.logId || rawEvent.sequenceNumber || rawEvent.id;
    const cardUid = rawEvent.cardUid || rawEvent.rfidNumber;

    const eventId = generateEventId(device.id, vendorEventId, 'evt');
    const correlationId = rawEvent.correlationId || generateCorrelationId('corr');
    const timestamp = rawEvent.timestamp || new Date().toISOString();
    const deviceTimestamp = rawEvent.deviceTimestamp || timestamp;

    const normalized: NormalizedHardwareEvent = {
      id: eventId,
      eventId,
      correlationId,
      deviceId: device.id,
      deviceName: device.name,
      vendor: device.vendor,
      eventType,
      timestamp,
      deviceTimestamp,
      receivedAt: new Date().toISOString(),
      externalUserId,
      memberId: rawEvent.memberId,
      memberName: rawEvent.memberName,
      credentialType: rawEvent.credentialType || (rawEvent.method === 'face' ? 'face' : 'rfid'),
      authenticationResult: rawEvent.authenticationResult || 'success',
      accessResult: rawEvent.accessResult || 'granted',
      accessReason: rawEvent.accessReason,
      direction: rawEvent.direction || 'entry',
      rawPayload: typeof rawEvent === 'string' ? rawEvent : JSON.stringify(rawEvent),
      source: rawEvent.source || 'hardware_gateway',
      processingStatus: 'processed',
      metadata: rawEvent.metadata || {},
    };

    const pipelineResult = await this.ingestNormalizedEvent(normalized);
    return pipelineResult.event;
  }

  /**
   * Ingests and processes a normalized event through the entire validation,
   * deduplication, member resolution, access policy, and attendance pipeline.
   */
  public async ingestNormalizedEvent(event: NormalizedHardwareEvent): Promise<{
    accepted: boolean;
    duplicate: boolean;
    event: NormalizedHardwareEvent;
    accessDecision?: AccessDecision;
  }> {
    this.initialize();

    // 1. Compute deterministic deduplication fingerprint
    const fingerprint = computeEventFingerprint({
      deviceId: event.deviceId,
      externalUserId: event.externalUserId,
      memberId: event.memberId,
      eventType: event.eventType,
      deviceTimestamp: event.deviceTimestamp,
      timestamp: event.timestamp,
      credentialUid: (event.metadata?.cardUid as string) || undefined,
      timeWindowSeconds: 5,
    });

    const now = Date.now();
    const lastSeen = this.deduplicationCache.get(fingerprint);

    if (lastSeen && (now - lastSeen) < this.DEDUP_WINDOW_MS) {
      console.log(`[HardwareGateway] Deduplicated identical event fingerprint: ${fingerprint}`);
      return {
        accepted: false,
        duplicate: true,
        event: {
          ...event,
          processingStatus: 'ignored',
          accessReason: 'رویداد تکراری در بازه زمانی ۵ ثانیه (Deduplicated)',
        },
      };
    }

    // Register fingerprint in cache and prune if needed
    this.deduplicationCache.set(fingerprint, now);
    if (this.deduplicationCache.size > this.MAX_DEDUP_CACHE_SIZE) {
      const oldestKey = this.deduplicationCache.keys().next().value;
      if (oldestKey) this.deduplicationCache.delete(oldestKey);
    }

    // 2. Member Resolution
    let resolvedMember: Student | undefined;
    let memberName = event.memberName;

    if (event.memberId) {
      resolvedMember = MemberRepository.getById(event.memberId);
    } else if (event.externalUserId) {
      const mapping = DeviceMappingRepository.findMapping(event.deviceId, event.externalUserId) 
                   || DeviceMappingRepository.findByExternalId(event.externalUserId);
      if (mapping) {
        resolvedMember = MemberRepository.getById(mapping.memberId);
        event.memberId = mapping.memberId;
        if (!memberName && mapping.memberName) {
          memberName = mapping.memberName;
        }
      }
    }

    if (resolvedMember && !memberName) {
      memberName = resolvedMember.fullName;
    }
    event.memberName = memberName;

    // 3. Access Policy Engine Evaluation
    const packages = initialPackages;
    const accessDecision = AccessPolicyEngine.evaluate(resolvedMember, packages);

    // Update event access result
    if (accessDecision.result === 'ALLOW' || accessDecision.result === 'ALLOW_WITH_WARNING') {
      event.accessResult = 'granted';
      event.accessReason = accessDecision.messageFa;
    } else {
      event.accessResult = 'denied';
      event.accessReason = accessDecision.messageFa;
    }

    // 4. Attendance & Locker Integration Pipeline
    if (event.accessResult === 'granted' && resolvedMember && event.direction !== 'exit') {
      const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
      const todayStr = new Date().toISOString().slice(0, 10);

      // Check if already checked in today to avoid duplicate attendance records
      const todayRecords = AttendanceRepository.getToday();
      const alreadyCheckedIn = todayRecords.some(r => r.studentId === resolvedMember?.id && r.date === todayStr);

      if (!alreadyCheckedIn) {
        // Smart Locker allocation if required
        let assignedLocker: number | undefined;
        if (accessDecision.requiresLocker) {
          const availLockers = LockerRepository.getAvailable();
          if (availLockers.length > 0) {
            const chosen = availLockers[0];
            LockerRepository.assignLocker(chosen.number, resolvedMember.id, resolvedMember.fullName, chosen.zone);
            assignedLocker = chosen.number;
          }
        }

        AttendanceRepository.recordCheckIn({
          id: `att-${event.id}`,
          studentId: resolvedMember.id,
          studentName: resolvedMember.fullName,
          coachName: resolvedMember.coachId ? `مربی #${resolvedMember.coachId}` : 'بدون مربی',
          date: todayStr,
          checkInTime: timeStr,
          method: event.credentialType === 'face' ? 'face_scan' : 'rfid_wristband',
          lockerNumber: assignedLocker,
          isCurrentlyInside: true,
        });
      }
    }

    // 5. Shadow / Pilot Comparison Ingestion
    PilotComparisonService.processHardwareEvent(event);

    // 6. Record to Hardware Event Log Buffer
    HardwareRepository.addEvent(event);

    // 7. Update Telemetry
    const telemetry = this.telemetryMap.get(event.deviceId);
    if (telemetry) {
      telemetry.lastEvent = event;
      telemetry.lastEventAt = event.timestamp;
    }

    // 8. Notify Gateway Listeners
    this.gatewayListeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('[HardwareGateway] Listener error:', err);
      }
    });

    return {
      accepted: true,
      duplicate: false,
      event,
      accessDecision,
    };
  }

  /**
   * Read-only log sync from device memory (Pull Mode)
   * Fetches latest attendance records from device memory and safely routes through
   * normalization, deduplication, member mapping, and access policy pipeline.
   */
  public async syncDeviceLogs(deviceId: string, limit = 20): Promise<{
    count: number;
    newEvents: number;
    duplicates: number;
    events: NormalizedHardwareEvent[];
  }> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device || device.status === 'offline') {
      return { count: 0, newEvents: 0, duplicates: 0, events: [] };
    }

    const adapter = this.getAdapterForDevice(device);
    const rawLogs = await adapter.readAccessLogs(device, limit);
    let newEvents = 0;
    let duplicates = 0;
    const processedEvents: NormalizedHardwareEvent[] = [];

    for (const rawLog of rawLogs) {
      const normalized = await this.ingestRawEvent(deviceId, rawLog);
      if (normalized) {
        if (normalized.processingStatus === 'ignored') {
          duplicates++;
        } else {
          newEvents++;
        }
        processedEvents.push(normalized);
      }
    }

    AuditService.logEvent({
      action: 'DEVICE_LOGS_SYNCED',
      details: `همگام‌سازی لاگ‌های فقط-خواندنی از دستگاه «${device.name}» انجام شد (${newEvents} رویداد جدید، ${duplicates} تکراری).`,
      category: 'hardware',
      entityType: 'hardware',
      entityId: device.id,
    });

    return {
      count: rawLogs.length,
      newEvents,
      duplicates,
      events: processedEvents,
    };
  }

  // ==========================================
  // 4. COMMAND ROUTING & SAFETY
  // ==========================================

  public async executeCommand(
    deviceId: string, 
    command: HardwareCommand, 
    actor?: StaffUser
  ): Promise<ActuationResult> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    const executedAt = new Date().toISOString();

    if (!device) {
      return {
        success: false,
        message: `دستگاه سخت‌افزاری با شناسه ${deviceId} یافت نشد.`,
        command: command.type,
        executedAt,
        error: 'DEVICE_NOT_FOUND',
      };
    }

    if (device.status === 'offline') {
      return {
        success: false,
        message: `دستگاه «${device.name}» آفلاین است و امکان دریافت فرمان ندارد.`,
        command: command.type,
        executedAt,
        error: 'DEVICE_OFFLINE',
      };
    }

    const adapter = this.getAdapterForDevice(device);

    // 1. Capability Check
    const capabilityRequired = this.getRequiredCapabilityForCommand(command.type);
    if (capabilityRequired && !device.capabilities.includes(capabilityRequired) && !adapter.supportedCapabilities.includes(capabilityRequired)) {
      return {
        success: false,
        message: `قابلیت ${capabilityRequired} توسط مشخصات سخت‌افزاری دستگاه «${device.name}» پشتیبانی نمی‌شود.`,
        command: command.type,
        executedAt,
        error: 'CAPABILITY_NOT_SUPPORTED',
      };
    }

    // 2. Sensitive Command Authorization & Auditing
    const isSensitive = ['OPEN_DOOR', 'UNLOCK', 'OPEN_LOCKER', 'RELAY_PULSE', 'REBOOT'].includes(command.type);
    if (isSensitive) {
      if (actor && !RBACService.hasPermission(actor.role, 'hardware.control')) {
        AuditService.logSecurityViolation(
          actor,
          'UNAUTHORIZED_HARDWARE_ACTUATION',
          `دستگاه ${device.name}`,
          `تلاش غیرمجاز توسط کاربر ${actor.fullName} (${actor.role}) برای اجرای فرمان سخت‌افزاری حساس ${command.type}`
        );
        return {
          success: false,
          message: 'سطح دسترسی شما برای ارسال فرمان‌های کنترلی مستقیم سخت‌افزار کافی نیست.',
          command: command.type,
          executedAt,
          error: 'UNAUTHORIZED',
        };
      }

      AuditService.logEvent({
        action: `HARDWARE_COMMAND_${command.type}`,
        details: `فرمان ${command.type} به دستگاه «${device.name}» (${device.ipAddress}) ارسال شد.`,
        category: 'hardware',
        entityType: 'hardware',
        entityId: device.id,
        actor,
      });
    }

    // 3. Route to Adapter
    try {
      const result = await adapter.sendCommand(device, command);
      return result;
    } catch (err: any) {
      const errMsg = err?.message || 'خطا در ارسال پکت فرمان به سخت‌افزار.';
      return {
        success: false,
        message: errMsg,
        command: command.type,
        executedAt,
        error: 'DISPATCH_ERROR',
      };
    }
  }

  private getRequiredCapabilityForCommand(type: string): HardwareCapability | null {
    switch (type) {
      case 'OPEN_DOOR':
      case 'UNLOCK':
        return 'DOOR_CONTROL';
      case 'OPEN_LOCKER':
      case 'RELAY_PULSE':
        return 'LOCKER_RELAY_PULSE';
      case 'SYNC_CLOCK':
        return 'DEVICE_TIME_SYNC';
      case 'READ_USERS':
        return 'USER_READ';
      case 'READ_LOGS':
        return 'ACCESS_LOG';
      default:
        return null;
    }
  }

  // ==========================================
  // 5. OBSERVABILITY & DIAGNOSTICS
  // ==========================================

  public getDeviceTelemetry(deviceId: string): DeviceTelemetry {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) {
      return {
        deviceId,
        status: 'offline',
        latencyMs: 0,
        reconnectCount: 0,
        activeListenersCount: 0,
        lastError: 'Device not found',
      };
    }
    return this.initTelemetry(device);
  }

  public getGatewayStatus(): {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    activeListeners: number;
    dedupCacheSize: number;
  } {
    this.initialize();
    const devices = HardwareRepository.getAll();
    const online = devices.filter(d => d.status === 'online').length;
    const activeListeners = this.activeSubscriptions.size;

    return {
      totalDevices: devices.length,
      onlineDevices: online,
      offlineDevices: devices.length - online,
      activeListeners,
      dedupCacheSize: this.deduplicationCache.size,
    };
  }

  public async runDiagnostics(deviceId: string): Promise<DiagnosticLogResult> {
    this.initialize();
    const device = HardwareRepository.getById(deviceId);
    if (!device) {
      return {
        passed: false,
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        logs: [`[Gateway] Device ${deviceId} not found.`],
      };
    }

    const adapter = this.getAdapterForDevice(device);
    return adapter.runDiagnostics(device);
  }

  public subscribeEvents(listener: GatewayEventListener): () => void {
    this.gatewayListeners.add(listener);
    return () => {
      this.gatewayListeners.delete(listener);
    };
  }
}

export const hardwareGateway = HardwareGateway.getInstance();
