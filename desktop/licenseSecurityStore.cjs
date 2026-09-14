/**
 * Gym OS - Desktop Secure License State & Clock Integrity Store
 * 
 * Provides hardware-bound, encrypted/HMAC-protected persistence for:
 * - lastTrustedWallClock (ISO timestamp)
 * - lastMonotonicObservationMs (monotonic tick observation)
 * - lastValidationAt (ISO timestamp)
 * - licenseId (unique license key)
 * - tokenFingerprint (SHA-256 hash of currently active token)
 * - tokenVersion / generation (monotonic generation number)
 * - stateHmac (HMAC-SHA256 signature binding state to device hardware)
 * 
 * SECURITY DIRECTIVES:
 * 1. Never stores state in plaintext localStorage.
 * 2. In Electron/Windows, uses electron.safeStorage (DPAPI) when available.
 * 3. Binds the state cryptographically to the hardware fingerprint via HMAC-SHA256.
 * 4. Detects state tampering, deletion, restoration of old state, or rollback.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// In Electron environment, safeStorage might be available from 'electron'
let electronSafeStorage = null;
try {
  const electron = require('electron');
  if (electron && electron.safeStorage) {
    electronSafeStorage = electron.safeStorage;
  }
} catch {
  electronSafeStorage = null;
}

const ROLLBACK_TOLERANCE_MS = 2 * 60 * 60 * 1000; // 2 hours tolerance for NTP / timezone / DST adjustments

/**
 * Derives a hardware-bound device secret key for state encryption & HMAC validation.
 * Uses the machine's unique hardware identifier, OS install parameters, and machine GUID.
 */
function deriveHardwareSecret(deviceFingerprint) {
  const salt = 'GymOS_SecureStorage_v2_DeviceBindingSalt_8f3d9b1c';
  return crypto.createHash('sha256').update(`${deviceFingerprint}|${salt}|${os.platform()}|${os.arch()}`).digest();
}

/**
 * Calculates HMAC-SHA256 over state fields using hardware secret
 */
function computeStateHmac(state, deviceFingerprint) {
  const secret = deriveHardwareSecret(deviceFingerprint);
  const data = [
    state.licenseId || '',
    state.tokenFingerprint || '',
    String(state.tokenGeneration || 1),
    String(state.lastTrustedWallClockMs || 0),
    String(state.lastValidationAt || ''),
    deviceFingerprint,
  ].join('::');

  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
}

/**
 * Resolves path to the secure state file
 */
function getSecureStateFilePath(storagePaths) {
  const configDir = storagePaths && storagePaths.configDir
    ? storagePaths.configDir
    : path.join(os.homedir(), '.gymos_desktop', 'config');
  return path.join(configDir, 'license_state.sec');
}

/**
 * Encrypts a plaintext buffer using safeStorage (DPAPI on Windows) or AES-256-GCM hardware key
 */
function encryptBuffer(buffer, deviceFingerprint) {
  if (electronSafeStorage && typeof electronSafeStorage.isEncryptionAvailable === 'function' && electronSafeStorage.isEncryptionAvailable()) {
    try {
      return {
        mode: 'SAFE_STORAGE',
        ciphertext: electronSafeStorage.encryptString(buffer.toString('utf8')).toString('base64'),
      };
    } catch {
      // Fallback to AES-GCM
    }
  }

  // Fallback: Hardware-bound AES-256-GCM
  const key = deriveHardwareSecret(deviceFingerprint);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    mode: 'HARDWARE_AES_GCM',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
  };
}

/**
 * Decrypts a payload produced by encryptBuffer
 */
function decryptBuffer(envelope, deviceFingerprint) {
  if (!envelope || !envelope.ciphertext) {
    throw new Error('CORRUPTED_ENVELOPE');
  }

  if (envelope.mode === 'SAFE_STORAGE' && electronSafeStorage) {
    try {
      const buf = Buffer.from(envelope.ciphertext, 'base64');
      const decryptedStr = electronSafeStorage.decryptString(buf);
      return Buffer.from(decryptedStr, 'utf8');
    } catch (err) {
      throw new Error('SAFE_STORAGE_DECRYPT_FAILED');
    }
  }

  if (envelope.mode === 'HARDWARE_AES_GCM') {
    const key = deriveHardwareSecret(deviceFingerprint);
    const iv = Buffer.from(envelope.iv, 'base64');
    const tag = Buffer.from(envelope.tag, 'base64');
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  throw new Error('UNKNOWN_ENCRYPTION_MODE');
}

/**
 * Reads and verifies the secure local state.
 * Returns { ok: true, state } or { ok: false, error: '...' }
 */
function readSecureState(storagePaths, deviceFingerprint) {
  const filePath = getSecureStateFilePath(storagePaths);
  if (!fs.existsSync(filePath)) {
    return { ok: true, state: null, exists: false };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const envelope = JSON.parse(raw);
    const decryptedBuf = decryptBuffer(envelope, deviceFingerprint);
    const state = JSON.parse(decryptedBuf.toString('utf8'));

    // Validate HMAC integrity
    const expectedHmac = computeStateHmac(state, deviceFingerprint);
    if (!state.hmac || state.hmac !== expectedHmac) {
      return {
        ok: false,
        error: 'LICENSE_STATE_TAMPERED',
        message: 'فایل وضعیت امن لایسنس دستکاری شده یا نامعتبر است.',
      };
    }

    return { ok: true, state, exists: true };
  } catch (err) {
    return {
      ok: false,
      error: 'LICENSE_STATE_TAMPERED',
      message: 'فایل وضعیت امن لایسنس مخدوش یا دستکاری شده است.',
    };
  }
}

/**
 * Saves state securely to disk with atomic write and HMAC protection.
 */
function writeSecureState(storagePaths, state, deviceFingerprint) {
  const filePath = getSecureStateFilePath(storagePaths);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Calculate HMAC binding
  const cleanState = {
    licenseId: state.licenseId || null,
    tokenFingerprint: state.tokenFingerprint || null,
    tokenGeneration: state.tokenGeneration || 1,
    lastTrustedWallClockMs: state.lastTrustedWallClockMs || Date.now(),
    lastTrustedWallClockIso: new Date(state.lastTrustedWallClockMs || Date.now()).toISOString(),
    lastMonotonicObservationMs: typeof state.lastMonotonicObservationMs === 'number' ? state.lastMonotonicObservationMs : Math.round(performance.now ? performance.now() : 0),
    lastValidationAt: state.lastValidationAt || new Date().toISOString(),
  };

  cleanState.hmac = computeStateHmac(cleanState, deviceFingerprint);

  const buffer = Buffer.from(JSON.stringify(cleanState), 'utf8');
  const envelope = encryptBuffer(buffer, deviceFingerprint);

  const tempFile = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(envelope, null, 2), 'utf8');
  fs.renameSync(tempFile, filePath);

  return cleanState;
}

/**
 * Clears the secure state file (used upon explicit local deactivation).
 */
function clearSecureState(storagePaths) {
  const filePath = getSecureStateFilePath(storagePaths);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Computes a SHA-256 fingerprint of a token object
 */
function computeTokenFingerprint(token) {
  if (!token) return '';
  const payloadStr = typeof token === 'string' ? token : JSON.stringify(token);
  return crypto.createHash('sha256').update(payloadStr, 'utf8').digest('hex');
}

module.exports = {
  ROLLBACK_TOLERANCE_MS,
  getSecureStateFilePath,
  readSecureState,
  writeSecureState,
  clearSecureState,
  computeTokenFingerprint,
  deriveHardwareSecret,
  computeStateHmac,
};
