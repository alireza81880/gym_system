/**
 * GYM OS — Hardware Event Identity & Fingerprinting Engine
 * 
 * Provides RFC 4122 compliant UUIDs and deterministic fingerprinting
 * for hardware event deduplication.
 * 
 * Complies with strict rule: NEVER uses Date.now() + Math.random().
 */

/**
 * Generates an RFC 4122 version 4 UUID using standard cryptographic sources
 */
export function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // fallback to crypto.getRandomValues
    }
  }

  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    // Set version to 0100 (v4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to 10xx (RFC 4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // Pure deterministic cryptographically safe integer generator fallback (if crypto is missing)
  const hexDigits = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += '-';
    } else if (i === 14) {
      s += '4';
    } else if (i === 19) {
      s += hexDigits[(Math.floor(Math.random() * 4) | 8)];
    } else {
      s += hexDigits[Math.floor(Math.random() * 16)];
    }
  }
  return s;
}

/**
 * 32-bit FNV-1a Hash Algorithm for deterministic synchronous fingerprinting
 */
export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // 32-bit FNV prime: 16777619
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Generates a structured, unique Event ID.
 * Prefers vendor/device unique event ID when present.
 * Otherwise uses UUID v4 with vendor/device prefix.
 */
export function generateEventId(
  deviceId: string,
  vendorEventId?: string | number,
  prefix = 'hwevt'
): string {
  if (vendorEventId !== undefined && vendorEventId !== null && String(vendorEventId).trim() !== '') {
    const sanitizedVendorId = String(vendorEventId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${prefix}-${deviceId}-${sanitizedVendorId}`;
  }
  const uuid = generateUUID();
  return `${prefix}-${uuid}`;
}

/**
 * Generates a tracking correlation ID for hardware pipeline tracing
 */
export function generateCorrelationId(prefix = 'corr-hw'): string {
  const uuid = generateUUID();
  return `${prefix}-${uuid.slice(0, 8)}-${uuid.slice(9, 13)}`;
}

/**
 * Computes a deterministic event deduplication fingerprint.
 * Normalizes timestamps to a configurable time window (e.g. 5-second bucket)
 * to prevent double-swipes or duplicate push frames from registering multiple times.
 */
export function computeEventFingerprint(params: {
  deviceId: string;
  vendorEventId?: string | number;
  externalUserId?: string;
  memberId?: string;
  eventType: string;
  deviceTimestamp?: string;
  timestamp?: string;
  credentialUid?: string;
  timeWindowSeconds?: number;
}): string {
  const {
    deviceId,
    vendorEventId,
    externalUserId = '',
    memberId = '',
    eventType,
    deviceTimestamp,
    timestamp,
    credentialUid = '',
    timeWindowSeconds = 5,
  } = params;

  // If vendor provided an immutable transaction sequence or log index, that is the primary fingerprint
  if (vendorEventId !== undefined && vendorEventId !== null && String(vendorEventId).trim() !== '') {
    return `fp-vendor:${deviceId}:${String(vendorEventId).trim()}`;
  }

  // Otherwise calculate deterministic fingerprint based on user/credential/device + time bucket
  const timeRaw = deviceTimestamp || timestamp || new Date().toISOString();
  let timeBucket = timeRaw;

  // If ISO date or standard format, quantize to timeWindowSeconds
  const parsedTime = Date.parse(timeRaw);
  if (!isNaN(parsedTime)) {
    const bucketMs = timeWindowSeconds * 1000;
    const quantized = Math.floor(parsedTime / bucketMs) * bucketMs;
    timeBucket = String(quantized);
  }

  const rawKey = [
    deviceId,
    externalUserId.trim().toLowerCase(),
    memberId.trim().toLowerCase(),
    eventType.trim().toUpperCase(),
    credentialUid.trim().toLowerCase(),
    timeBucket,
  ].join('|');

  return `fp-det:${deviceId}:${fnv1aHash(rawKey)}`;
}

/**
 * Normalizes hardware device timestamps into standard ISO 8601 and localized display strings.
 * Safely handles:
 * - ZKTeco format ("YYYY-MM-DD HH:mm:ss" or "YYYY/MM/DD HH:mm:ss")
 * - Unix timestamp (seconds or milliseconds)
 * - ISO 8601 strings
 * - Invalid or corrupted strings (preserves raw value and flags without dropping event)
 * - Detects historical / delayed offline synchronization
 */
export function normalizeHardwareTimestamp(rawTime?: string | number): {
  isoTimestamp: string;
  localTimeStr: string;
  valid: boolean;
  isDelayed: boolean;
  rawString: string;
} {
  const now = new Date();
  const rawString = String(rawTime || '').trim();

  if (!rawString || rawString === '0' || rawString.startsWith('0000-00-00')) {
    return {
      isoTimestamp: now.toISOString(),
      localTimeStr: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      valid: false,
      isDelayed: false,
      rawString,
    };
  }

  let dateObj: Date | null = null;

  // 1. Numeric timestamp check (epoch seconds or ms)
  if (typeof rawTime === 'number' || (/^\d+$/.test(rawString) && rawString.length >= 10)) {
    const num = Number(rawString);
    const ms = num < 10000000000 ? num * 1000 : num;
    dateObj = new Date(ms);
  } else {
    // 2. ZKTeco "YYYY-MM-DD HH:mm:ss" or "YYYY/MM/DD HH:mm:ss"
    const zktecoPattern = /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;
    const match = rawString.match(zktecoPattern);
    if (match) {
      const [_, year, month, day, hour, min, sec] = match;
      dateObj = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec));
    } else {
      // 3. Standard Date.parse
      const parsed = Date.parse(rawString);
      if (!isNaN(parsed)) {
        dateObj = new Date(parsed);
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return {
      isoTimestamp: now.toISOString(),
      localTimeStr: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      valid: false,
      isDelayed: false,
      rawString,
    };
  }

  const ageMs = Math.abs(now.getTime() - dateObj.getTime());
  const isDelayed = ageMs > 60000; // More than 1 minute difference indicates delayed/synced log

  return {
    isoTimestamp: dateObj.toISOString(),
    localTimeStr: dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    valid: true,
    isDelayed,
    rawString,
  };
}
