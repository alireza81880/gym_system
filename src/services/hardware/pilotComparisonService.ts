/**
 * GYM OS — Phase 9 Pilot Comparison Service
 * 
 * Evaluates hardware events in SHADOW mode against Gym OS Access Policy Engine.
 * Compares external hardware / legacy software decisions with Gym OS calculations.
 * Completely non-invasive: NEVER sends physical actuation commands in shadow mode.
 */

import { 
  HardwareEvent, 
  PilotAccessComparison, 
  Student 
} from '../../types';
import { DeviceMappingRepository } from '../repositories/deviceMappingRepository';
import { MemberRepository } from '../repositories/memberRepository';
import { AccessPolicyEngine, AccessPolicyConfig, defaultAccessPolicyConfig } from '../accessPolicyService';
import { initialPackages } from '../../data/initialData';
import { PersistenceManager } from '../repositories/persistenceManager';
import { HardwareRepository } from '../repositories/hardwareRepository';

type PilotEventListener = (comparison: PilotAccessComparison) => void;

export class PilotComparisonService {
  private static comparisonsRingBuffer: PilotAccessComparison[] = [];
  private static readonly MAX_BUFFER_SIZE = 150;
  private static processedEventHashes: Set<string> = new Set();
  private static listeners: Set<PilotEventListener> = new Set();
  private static isInitialized = false;

  static initialize(): void {
    if (this.isInitialized) return;

    const initial: PilotAccessComparison[] = [
      {
        id: 'pilot-cmp-1',
        timestamp: '18:30:12',
        deviceTimestamp: '18:30:11',
        receivedAt: new Date().toISOString(),
        deviceId: 'dev-rfid-turnstile',
        deviceName: 'کارتخوان و مچ‌بندخوان RFID/NFC گیت تردد',
        method: 'RFID',
        externalUserId: '1006',
        memberId: 'std-6',
        memberName: 'فرزاد شجاعی',
        externalResult: 'ALLOW',
        gymOsDecision: 'ALLOW',
        comparison: 'MATCH',
        reason: 'عضو فعال با اشتراک معتبر و بدون بدهی',
        correlationId: 'corr-pilot-101',
      },
      {
        id: 'pilot-cmp-2',
        timestamp: '18:05:44',
        deviceTimestamp: '18:05:44',
        receivedAt: new Date().toISOString(),
        deviceId: 'dev-face-gate',
        deviceName: 'ترمینال هوشمند تشخیص چهره گیت ورود (AI Face Gate 4K)',
        method: 'FACE',
        externalUserId: '1002',
        memberId: 'std-2',
        memberName: 'نیما کمالی',
        externalResult: 'ALLOW',
        gymOsDecision: 'ALLOW_WITH_WARNING',
        comparison: 'MATCH',
        reason: 'تردد مجاز با اخطار بدهی (بدهی: ۲,۸۰۰,۰۰۰ تومان)',
        correlationId: 'corr-pilot-102',
      },
      {
        id: 'pilot-cmp-3',
        timestamp: '17:50:20',
        deviceTimestamp: '17:50:19',
        receivedAt: new Date().toISOString(),
        deviceId: 'dev-face-gate',
        deviceName: 'ترمینال هوشمند تشخیص چهره گیت ورود (AI Face Gate 4K)',
        method: 'FACE',
        externalUserId: '9999',
        externalResult: 'DENY',
        gymOsDecision: 'UNKNOWN',
        comparison: 'UNKNOWN',
        reason: 'شناسه دستگاه به عضو متصل نیست.',
        correlationId: 'corr-pilot-103',
      },
      {
        id: 'pilot-cmp-4',
        timestamp: '17:45:01',
        deviceTimestamp: '17:45:00',
        receivedAt: new Date().toISOString(),
        deviceId: 'dev-face-gate',
        deviceName: 'ترمینال هوشمند تشخیص چهره گیت ورود (AI Face Gate 4K)',
        method: 'FACE',
        externalUserId: '1005',
        memberId: 'std-5',
        memberName: 'احسان محمدی',
        externalResult: 'ALLOW',
        gymOsDecision: 'ALLOW',
        comparison: 'MATCH',
        reason: 'پکیج VIP معتبر • عدم وجود مغایرت',
        correlationId: 'corr-pilot-104',
      },
      {
        id: 'pilot-cmp-5',
        timestamp: '17:15:33',
        deviceTimestamp: '17:15:32',
        receivedAt: new Date().toISOString(),
        deviceId: 'dev-rfid-turnstile',
        deviceName: 'کارتخوان و مچ‌بندخوان RFID/NFC گیت تردد',
        method: 'RFID',
        externalUserId: '1003',
        memberId: 'std-3',
        memberName: 'مریم حسینی',
        externalResult: 'ALLOW',
        gymOsDecision: 'ALLOW',
        comparison: 'MATCH',
        reason: 'تردد موفق • هماهنگ با قوانین دسترسی',
        correlationId: 'corr-pilot-105',
      },
    ];

    this.comparisonsRingBuffer = PersistenceManager.get<PilotAccessComparison[]>('pilot_access_comparisons', initial);
    this.isInitialized = true;
  }

  /**
   * Ingest and evaluate an incoming hardware event in Shadow mode
   */
  static processHardwareEvent(
    event: HardwareEvent, 
    policyConfig?: AccessPolicyConfig
  ): PilotAccessComparison | null {
    this.initialize();

    // 1. Deduplication / Idempotency check
    const eventTime = event.deviceTimestamp || event.timestamp || '';
    const dedupHash = `${event.deviceId}_${event.externalUserId || ''}_${eventTime}_${event.eventType}`;
    if (this.processedEventHashes.has(dedupHash)) {
      console.log(`[PilotComparison] Duplicate event detected and ignored: ${dedupHash}`);
      return null;
    }
    this.processedEventHashes.add(dedupHash);
    if (this.processedEventHashes.size > 500) {
      this.processedEventHashes.clear();
    }

    // 2. Resolve external user ID mapping
    const extUserId = event.externalUserId;
    let mappedMemberId = event.memberId;
    let memberName = event.memberName;

    if (extUserId && !mappedMemberId) {
      const mapping = DeviceMappingRepository.findMapping(event.deviceId, extUserId) 
        || DeviceMappingRepository.findByExternalId(extUserId);
      if (mapping) {
        mappedMemberId = mapping.memberId;
        memberName = mapping.memberName;
      }
    }

    // Determine External Result from event
    const externalResult: 'ALLOW' | 'DENY' | 'UNKNOWN' = 
      event.accessResult === 'granted' || event.eventType === 'ACCESS_GRANTED' 
        ? 'ALLOW' 
        : event.accessResult === 'denied' || event.eventType === 'ACCESS_DENIED' 
        ? 'DENY' 
        : 'UNKNOWN';

    // Map method token
    const methodToken: PilotAccessComparison['method'] = 
      event.credentialType === 'face' ? 'FACE' :
      event.credentialType === 'fingerprint' ? 'FINGERPRINT' :
      event.credentialType === 'rfid' ? 'RFID' :
      event.credentialType === 'qr' ? 'QR' :
      event.credentialType === 'pin' ? 'PIN' : 'FACE';

    let gymDecision: 'ALLOW' | 'DENY' | 'ALLOW_WITH_WARNING' | 'UNKNOWN' = 'UNKNOWN';
    let comparisonStatus: 'MATCH' | 'MISMATCH' | 'UNKNOWN' | 'ERROR' = 'UNKNOWN';
    let reasonText = '';

    // 3. Evaluate Gym OS Access Policy if member mapped
    if (!mappedMemberId) {
      gymDecision = 'UNKNOWN';
      comparisonStatus = 'UNKNOWN';
      reasonText = 'شناسه دستگاه به عضو متصل نیست.';
    } else {
      const member = MemberRepository.getById(mappedMemberId);
      if (!member) {
        gymDecision = 'UNKNOWN';
        comparisonStatus = 'UNKNOWN';
        reasonText = 'شناسه دستگاه به عضو متصل نیست.';
      } else {
        memberName = member.fullName;
        const config: AccessPolicyConfig = policyConfig || defaultAccessPolicyConfig;

        const evalResult = AccessPolicyEngine.evaluate(member, initialPackages, config);
        gymDecision = evalResult.result;
        reasonText = evalResult.messageFa;

        // 4. Comparison logic
        if (externalResult === 'ALLOW') {
          if (gymDecision === 'ALLOW' || gymDecision === 'ALLOW_WITH_WARNING') {
            comparisonStatus = 'MATCH';
          } else {
            comparisonStatus = 'MISMATCH';
            reasonText = `مغایرت: سیستم خارجی مجاز دانست، اما Gym OS دسترسی را رد کرد (${evalResult.messageFa})`;
          }
        } else if (externalResult === 'DENY') {
          if (gymDecision === 'DENY') {
            comparisonStatus = 'MATCH';
          } else {
            comparisonStatus = 'MISMATCH';
            reasonText = `مغایرت: سیستم خارجی ورود را مسدود کرد در حالی که وضعیت در Gym OS مجاز بود.`;
          }
        } else {
          comparisonStatus = 'UNKNOWN';
        }
      }
    }

    const timeStr = event.timestamp.includes('T') 
      ? event.timestamp.split('T')[1].slice(0, 8) 
      : event.timestamp || new Date().toLocaleTimeString('fa-IR');

    const pilotRecord: PilotAccessComparison = {
      id: `pilot-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: timeStr,
      deviceTimestamp: event.deviceTimestamp || timeStr,
      receivedAt: new Date().toISOString(),
      deviceId: event.deviceId,
      deviceName: event.deviceName || 'ترمینال سخت‌افزاری',
      method: methodToken,
      externalUserId: extUserId,
      memberId: mappedMemberId,
      memberName: memberName || (mappedMemberId ? 'عضو باشگاه' : 'شناسه نامشخص'),
      externalResult,
      gymOsDecision: gymDecision,
      comparison: comparisonStatus,
      reason: reasonText,
      rawEvent: event.rawPayload || JSON.stringify(event),
      correlationId: event.correlationId || `corr-${Date.now()}`,
    };

    // Store in ring buffer
    this.comparisonsRingBuffer = [pilotRecord, ...this.comparisonsRingBuffer].slice(0, this.MAX_BUFFER_SIZE);
    PersistenceManager.setBatched('pilot_access_comparisons', this.comparisonsRingBuffer);

    // Notify listeners
    this.listeners.forEach(fn => {
      try {
        fn(pilotRecord);
      } catch (err) {
        console.error('[PilotComparisonService] Listener error:', err);
      }
    });

    return pilotRecord;
  }

  static getComparisons(filter?: 'ALL' | 'MATCH' | 'MISMATCH' | 'UNKNOWN' | 'ERROR'): PilotAccessComparison[] {
    this.initialize();
    if (!filter || filter === 'ALL') {
      return [...this.comparisonsRingBuffer];
    }
    return this.comparisonsRingBuffer.filter(c => c.comparison === filter);
  }

  static subscribe(listener: PilotEventListener): () => void {
    this.initialize();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static clear(): void {
    this.initialize();
    this.comparisonsRingBuffer = [];
    PersistenceManager.setBatched('pilot_access_comparisons', []);
  }
}
