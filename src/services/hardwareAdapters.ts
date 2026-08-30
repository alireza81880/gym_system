export * from './hardware';

import { 
  HardwareEvent, 
  HardwareEventType, 
  HardwareVendor
} from '../types';

// Backward-compatible export of the legacy adapterRegistry dictionary
import { adapterRegistryInstance } from './hardware';
import { generateEventId, generateCorrelationId } from './hardware/eventIdentity';

export const adapterRegistry = {
  zkteco: adapterRegistryInstance.getAdapter('zkteco'),
  hikvision: adapterRegistryInstance.getAdapter('hikvision'),
  suprema: adapterRegistryInstance.getAdapter('suprema'),
  generic_relay: adapterRegistryInstance.getAdapter('generic_relay'),
  generic_wiegand: adapterRegistryInstance.getAdapter('generic_wiegand'),
  simulator: adapterRegistryInstance.getAdapter('simulator'),
};

// Hardware Event Normalizer Helper (Deterministic Identity, No Date.now() + Math.random())
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
    vendorEventId?: string;
  }
): HardwareEvent {
  const eventId = generateEventId(deviceId, payload.vendorEventId, 'hwevt');
  const correlationId = generateCorrelationId('corr-hw');
  const timestamp = new Date().toISOString();

  return {
    id: eventId,
    deviceId,
    deviceName: payload.deviceName || 'ترمینال گیت ورود',
    vendor: payload.vendor || 'zkteco',
    eventType,
    timestamp,
    deviceTimestamp: timestamp,
    receivedAt: timestamp,
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
    correlationId,
  };
}
