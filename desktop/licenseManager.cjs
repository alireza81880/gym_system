/**
 * Gym OS - Desktop License Manager & Anti-Copy Runtime Module
 * 
 * Enforces per-gym hardware-bound activation, offline Ed25519 token verification,
 * tamper detection, and secure local credential storage.
 * 
 * SECURITY DIRECTIVE:
 * ONLY the Public Verification Key is embedded in this client runtime.
 * The Private Signing Key is never shipped with client binaries.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { execSync } = require('child_process');

// Production Public Verification Key (Ed25519)
const LICENSING_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA34ik6iRbgc08x8cvsz+XOK2nxZ9mv+z0y9SWtscTbhU=
-----END PUBLIC KEY-----`;

let cachedDeviceFingerprint = null;

/**
 * Deterministically orders object keys for signature calculation
 */
function canonicalizePayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = payload[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Generates a stable, non-volatile hardware/installation fingerprint.
 * Combines:
 * - Windows MachineGuid or Linux machine-id
 * - Physical NIC MAC address (excluding internal/loopback/virtual)
 * - CPU architecture and model
 * - OS platform and root volume identifiers
 */
function getDeviceFingerprint() {
  if (cachedDeviceFingerprint) {
    return cachedDeviceFingerprint;
  }

  const parts = [];
  parts.push(process.platform);
  parts.push(os.arch());

  // 1. Windows MachineGuid from Registry (High stability)
  if (process.platform === 'win32') {
    try {
      const output = execSync('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', {
        encoding: 'utf8',
        timeout: 3000,
        windowsHide: true,
      });
      const match = output.match(/MachineGuid\s+REG_SZ\s+([a-f0-9-]+)/i);
      if (match && match[1]) {
        parts.push(`WIN_GUID:${match[1].trim()}`);
      }
    } catch {
      // Fallback if reg query fails
    }
  } else if (process.platform === 'linux') {
    // Linux machine-id
    try {
      if (fs.existsSync('/etc/machine-id')) {
        parts.push(`LINUX_ID:${fs.readFileSync('/etc/machine-id', 'utf8').trim()}`);
      } else if (fs.existsSync('/var/lib/dbus/machine-id')) {
        parts.push(`DBUS_ID:${fs.readFileSync('/var/lib/dbus/machine-id', 'utf8').trim()}`);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Hardware MAC address from network interfaces
  try {
    const interfaces = os.networkInterfaces();
    const macs = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
          macs.push(iface.mac.toLowerCase());
        }
      }
    }
    if (macs.length > 0) {
      parts.push(`MACS:${macs.sort().join(',')}`);
    }
  } catch {
    // ignore
  }

  // 3. CPU Core Model
  try {
    const cpus = os.cpus();
    if (cpus && cpus.length > 0) {
      parts.push(`CPU:${cpus[0].model}:${cpus.length}`);
    }
  } catch {
    // ignore
  }

  // Combine into SHA-256 Hash
  const rawString = parts.join('|');
  const hash = crypto.createHash('sha256').update(rawString, 'utf8').digest('hex').toUpperCase();
  cachedDeviceFingerprint = `FP-${hash.slice(0, 32)}`;
  return cachedDeviceFingerprint;
}

/**
 * Returns a masked representation of the fingerprint for safe UI display
 */
function getMaskedFingerprint(fp) {
  const target = fp || getDeviceFingerprint();
  if (target.length <= 10) return target;
  return target.slice(0, 6) + '...' + target.slice(-4);
}

/**
 * Path to license storage file
 */
function getLicenseFilePath(storagePaths) {
  const configDir = storagePaths && storagePaths.configDir
    ? storagePaths.configDir
    : path.join(os.homedir(), '.gymos_desktop', 'config');
  return path.join(configDir, 'license_activation.json');
}

/**
 * Cryptographically verifies token signature using the embedded public key
 */
function verifyTokenSignature(token) {
  if (!token || !token.payload || !token.signature) {
    return false;
  }
  try {
    const canonical = canonicalizePayload(token.payload);
    const signatureBuffer = Buffer.from(token.signature, 'base64');
    return crypto.verify(null, Buffer.from(canonical, 'utf8'), LICENSING_PUBLIC_KEY, signatureBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Evaluates license token against current device state and policy
 */
function evaluateToken(token) {
  if (!token || !token.payload) {
    return { status: 'UNACTIVATED', reason: 'NO_TOKEN' };
  }

  // 1. Verify cryptographic signature
  const isSignatureValid = verifyTokenSignature(token);
  if (!isSignatureValid) {
    return {
      status: 'RECOVERY_REQUIRED',
      reason: 'TAMPERED_SIGNATURE',
      message: 'امضای دیجیتال لایسنس معتبر نیست یا فایل دستکاری شده است',
      deviceBindingStatus: 'TAMPERED',
    };
  }

  const payload = token.payload;
  const currentDeviceFp = getDeviceFingerprint();

  // 2. Verify hardware device binding
  if (payload.deviceFingerprint !== currentDeviceFp) {
    return {
      status: 'DEVICE_MISMATCH',
      error: 'DEVICE_MISMATCH',
      code: 'DEVICE_MISMATCH',
      reason: 'HARDWARE_MISMATCH',
      message: 'این نسخه از نرم‌افزار برای این رایانه ثبت نشده است',
      payload,
      deviceBindingStatus: 'MISMATCH',
    };
  }

  // 3. Verify expiration date if non-perpetual
  if (payload.expiresAt) {
    const expiryTime = Date.parse(payload.expiresAt);
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return {
        status: 'EXPIRED',
        error: 'EXPIRED_LICENSE',
        code: 'EXPIRED_LICENSE',
        reason: 'LICENSE_EXPIRED',
        message: 'مدت اعتبار لایسنس شما به پایان رسیده است',
        payload,
        deviceBindingStatus: 'BOUND_MATCHED',
      };
    }
  }

  // 4. Token passes all verification checks
  return {
    status: 'ACTIVE',
    payload,
    deviceBindingStatus: 'BOUND_MATCHED',
  };
}

/**
 * Reads and validates current installation license status
 */
function getLicenseStatus(storagePaths) {
  const licenseFile = getLicenseFilePath(storagePaths);
  const currentFp = getDeviceFingerprint();

  if (!fs.existsSync(licenseFile)) {
    return {
      status: 'UNACTIVATED',
      licenseId: null,
      gymId: null,
      gymName: null,
      plan: null,
      activatedAt: null,
      expiresAt: null,
      deviceBindingStatus: 'UNBOUND',
      tokenVersion: 1,
      deviceFingerprintMasked: getMaskedFingerprint(currentFp),
      isOfflineValid: false,
    };
  }

  try {
    const rawContent = fs.readFileSync(licenseFile, 'utf8');
    const token = JSON.parse(rawContent);
    const evaluation = evaluateToken(token);

    const payload = evaluation.payload || (token && token.payload) || {};

    return {
      status: evaluation.status,
      licenseId: payload.licenseId || null,
      gymId: payload.gymId || null,
      gymName: payload.gymName || null,
      customerName: payload.customerName || payload.gymName || null,
      plan: payload.plan || null,
      licenseType: payload.licenseType || (payload.expiresAt ? 'YEARLY' : 'LIFETIME'),
      durationMonths: payload.durationMonths !== undefined ? payload.durationMonths : null,
      maxDevices: payload.maxDevices || 1,
      activatedAt: payload.activatedAt || null,
      expiresAt: payload.expiresAt || null,
      deviceBindingStatus: evaluation.deviceBindingStatus || 'UNBOUND',
      tokenVersion: payload.tokenVersion || 1,
      deviceFingerprintMasked: getMaskedFingerprint(currentFp),
      isOfflineValid: evaluation.status === 'ACTIVE',
      reason: evaluation.reason,
      message: evaluation.message,
    };
  } catch (err) {
    return {
      status: 'RECOVERY_REQUIRED',
      licenseId: null,
      gymId: null,
      deviceBindingStatus: 'TAMPERED',
      deviceFingerprintMasked: getMaskedFingerprint(currentFp),
      isOfflineValid: false,
      reason: 'FILE_CORRUPT',
      message: 'فایل لایسنس مخدوش یا غیرقابل خواندن است',
    };
  }
}

/**
 * Saves a signed activation token atomically to local disk
 */
function saveTokenAtomically(storagePaths, token) {
  const licenseFile = getLicenseFilePath(storagePaths);
  const dir = path.dirname(licenseFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempFile = `${licenseFile}.tmp.${Date.now()}`;
  
  const content = JSON.stringify(token, null, 2);
  fs.writeFileSync(tempFile, content, 'utf8');
  fs.renameSync(tempFile, licenseFile);
}

/**
 * Activates license via server authority and stores signed token locally.
 * If Supabase configuration is present in environment, connects to Supabase Edge Functions.
 * Falls back to local/mock transport if customServer is passed or in testing mode.
 */
async function activateLicense(licenseKey, storagePaths, customServer) {
  const cleanKey = (licenseKey || '').trim().toUpperCase();
  if (!cleanKey) {
    return { success: false, status: 'UNACTIVATED', message: 'لطفاً کد لایسنس را وارد کنید' };
  }

  const deviceFingerprint = getDeviceFingerprint();

  let server = customServer;
  if (!server) {
    server = require('./supabaseLicenseClient.cjs');
  }

  const result = await server.processActivation(cleanKey, deviceFingerprint);

  if (!result.success) {
    const error = result.error || 'ACTIVATION_REJECTED';
    let status = 'UNACTIVATED';
    if (error === 'DEVICE_LIMIT_REACHED') {
      status = 'DEVICE_LIMIT_REACHED';
    } else if (error === 'DEVICE_MISMATCH') {
      status = 'DEVICE_MISMATCH';
    } else if (error === 'EXPIRED_LICENSE' || error === 'EXPIRED') {
      status = 'EXPIRED';
    } else if (error === 'REVOKED_LICENSE' || error === 'REVOKED') {
      status = 'REVOKED';
    } else if (error === 'INVALID_LICENSE') {
      status = 'UNACTIVATED';
    }

    return {
      success: false,
      status,
      error,
      code: error,
      message: result.message,
      boundDeviceMasked: result.boundDeviceMasked,
      maxDevices: result.maxDevices,
      activeDevicesCount: result.activeDevicesCount,
    };
  }

  // Strictly verify the token with the client's public key before accepting it
  const isSignatureValid = verifyTokenSignature(result.token);
  if (!isSignatureValid) {
    return {
      success: false,
      status: 'RECOVERY_REQUIRED',
      message: 'پاسخ دریافتی از سرور معتبر نیست (خطای تأیید امضا)',
    };
  }

  // Save token atomically
  saveTokenAtomically(storagePaths, result.token);

  const finalStatus = getLicenseStatus(storagePaths);
  return {
    success: true,
    status: finalStatus.status,
    message: result.message,
    licenseInfo: finalStatus,
  };
}

/**
 * Activates license using an Administrator-signed Offline Activation Package.
 * Enables activation during total internet outages or air-gapped gym environments.
 * Strictly verifies Ed25519 signature, expiration, and hardware fingerprint binding.
 */
function activateOfflinePackage(rawPackageData, storagePaths) {
  if (!rawPackageData) {
    return { success: false, error: 'EMPTY_PACKAGE', message: 'پکیج فعالسازی آفلاین خالی است' };
  }

  let pkgObj;
  try {
    let str = typeof rawPackageData === 'string' ? rawPackageData.trim() : JSON.stringify(rawPackageData);
    if (!str.startsWith('{') && !str.startsWith('[')) {
      // Decode Base64 package string
      str = Buffer.from(str, 'base64').toString('utf8');
    }
    pkgObj = JSON.parse(str);
  } catch (err) {
    return {
      success: false,
      error: 'INVALID_ACTIVATION_PACKAGE',
      message: 'فرمت پکیج فعالسازی آفلاین نامعتبر است',
    };
  }

  // Validate package structure
  if (!pkgObj || typeof pkgObj !== 'object' || !pkgObj.payload || !pkgObj.signature) {
    return {
      success: false,
      error: 'INVALID_ACTIVATION_PACKAGE',
      message: 'ساختار پکیج فعالسازی ناقص است',
    };
  }

  const token = {
    payload: pkgObj.payload,
    signature: pkgObj.signature,
  };

  // 1. Verify Ed25519 signature against embedded client public key
  if (!verifyTokenSignature(token)) {
    return {
      success: false,
      error: 'INVALID_ACTIVATION_PACKAGE',
      message: 'امضای دیجیتال پکیج آفلاین نامعتبر است',
    };
  }

  const payload = token.payload;
  const currentFp = getDeviceFingerprint();

  // 2. Hardware Binding: Package MUST match this machine
  if (payload.deviceFingerprint !== currentFp) {
    return {
      success: false,
      error: 'DEVICE_MISMATCH',
      message: 'این پکیج فعالسازی برای شناسه سخت‌افزاری دستگاه دیگری صادر شده است',
      boundDeviceMasked: getMaskedFingerprint(payload.deviceFingerprint),
    };
  }

  // 3. Expiration Check
  if (payload.expiresAt) {
    const expiryTime = Date.parse(payload.expiresAt);
    if (!isNaN(expiryTime) && Date.now() > expiryTime) {
      return {
        success: false,
        error: 'EXPIRED',
        message: 'تاریخ اعتبار پکیج فعالسازی آفلاین منقضی شده است',
      };
    }
  }

  // 4. Save token atomically to local disk
  saveTokenAtomically(storagePaths, token);

  const finalStatus = getLicenseStatus(storagePaths);
  return {
    success: true,
    status: finalStatus.status,
    message: 'فعالسازی اضطراری آفلاین با موفقیت انجام شد و لایسنس به این سیستم متصل گردید',
    licenseInfo: finalStatus,
  };
}

/**
 * Performs authorized recovery and rebinds license to this machine
 */
async function recoverLicense(licenseKey, recoveryCode, storagePaths, customServer) {
  const cleanKey = (licenseKey || '').trim().toUpperCase();
  const cleanCode = (recoveryCode || '').trim();

  if (!cleanKey || !cleanCode) {
    return { success: false, message: 'شناسه لایسنس و کد بازیابی الزامی هستند' };
  }

  const deviceFingerprint = getDeviceFingerprint();

  let server = customServer;
  if (!server) {
    server = require('./supabaseLicenseClient.cjs');
  }

  const result = await server.processRecovery(cleanKey, cleanCode, deviceFingerprint);

  if (!result.success) {
    const error = result.error || 'RECOVERY_REJECTED';
    let status = 'RECOVERY_REQUIRED';
    if (error === 'DEVICE_MISMATCH') {
      status = 'DEVICE_MISMATCH';
    } else if (error === 'EXPIRED_LICENSE' || error === 'EXPIRED') {
      status = 'EXPIRED';
    } else if (error === 'REVOKED_LICENSE' || error === 'REVOKED') {
      status = 'REVOKED';
    } else if (error === 'INVALID_LICENSE') {
      status = 'UNACTIVATED';
    }

    return {
      success: false,
      status,
      error,
      code: error,
      message: result.message,
    };
  }

  // Verify received token
  if (!verifyTokenSignature(result.token)) {
    return {
      success: false,
      message: 'توکن بازیابی شده دارای امضای نامعتبر است',
    };
  }

  // Save token atomically
  saveTokenAtomically(storagePaths, result.token);

  const finalStatus = getLicenseStatus(storagePaths);
  return {
    success: true,
    status: finalStatus.status,
    newRecoveryCode: result.newRecoveryCode,
    message: result.message,
    licenseInfo: finalStatus,
  };
}

/**
 * Removes local activation token (e.g. for re-activation or uninstallation)
 */
function clearActivation(storagePaths) {
  const licenseFile = getLicenseFilePath(storagePaths);
  try {
    if (fs.existsSync(licenseFile)) {
      fs.unlinkSync(licenseFile);
    }
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  LICENSING_PUBLIC_KEY,
  getDeviceFingerprint,
  getMaskedFingerprint,
  getLicenseStatus,
  verifyTokenSignature,
  evaluateToken,
  activateLicense,
  activateOfflinePackage,
  recoverLicense,
  clearActivation,
  saveTokenAtomically,
};

