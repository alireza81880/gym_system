/**
 * Gym OS - Licensing Server Authority (Mock & Protocol Specification)
 * 
 * In production deployment, this authority runs on an isolated HTTPS server.
 * The Private Signing Key NEVER ships to end-user clients.
 * For offline tests and development simulation, this module provides the
 * canonical implementation of the server verification and signing protocol.
 */

const crypto = require('crypto');

// Server Authority Private Signing Key (Ed25519)
// In production, this key is strictly stored in server HSM/secrets manager
const SERVER_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIPXJVX2d7bQd6w7ibMnfq9PqutTUY8XZnTESAGhCo6Mk
-----END PRIVATE KEY-----`;

// Seed database of registered gym licenses
function createDefaultDatabase() {
  return new Map([
    ['GYM-2026-001', {
      licenseId: 'GYM-2026-001',
      gymId: 'gym-tehran-central-01',
      gymName: 'باشگاه مرکزی تهران',
      product: 'GymOS-Desktop',
      plan: 'Enterprise',
      status: 'UNACTIVATED',
      activationLimit: 1,
      activatedAt: null,
      expiresAt: null, // Perpetual license
      deviceBinding: null,
      tokenVersion: 1,
      recoveryCode: 'REC-9A8B7C-543210',
    }],
    ['GYM-2026-002', {
      licenseId: 'GYM-2026-002',
      gymId: 'gym-shiraz-fit-02',
      gymName: 'مجموعه ورزشی شیراز',
      product: 'GymOS-Desktop',
      plan: 'Pro',
      status: 'UNACTIVATED',
      activationLimit: 1,
      activatedAt: null,
      expiresAt: null,
      deviceBinding: null,
      tokenVersion: 1,
      recoveryCode: 'REC-112233-445566',
    }],
    ['GYM-2026-EXPIRED', {
      licenseId: 'GYM-2026-EXPIRED',
      gymId: 'gym-expired-test',
      gymName: 'باشگاه تست منقضی',
      product: 'GymOS-Desktop',
      plan: 'Standard',
      status: 'EXPIRED',
      activationLimit: 1,
      activatedAt: '2025-01-01T00:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      deviceBinding: null,
      tokenVersion: 1,
      recoveryCode: 'REC-EXP-999999',
    }],
    ['GYM-2026-REVOKED', {
      licenseId: 'GYM-2026-REVOKED',
      gymId: 'gym-revoked-test',
      gymName: 'باشگاه تست لغو شده',
      product: 'GymOS-Desktop',
      plan: 'Standard',
      status: 'REVOKED',
      activationLimit: 1,
      activatedAt: null,
      expiresAt: null,
      deviceBinding: null,
      tokenVersion: 1,
      recoveryCode: 'REC-REV-000000',
    }],
  ]);
}

let licenseDatabase = createDefaultDatabase();

/**
 * Produces a canonical string representation with deterministic key ordering
 */
function canonicalizePayload(payload) {
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = payload[key];
  }
  return JSON.stringify(sortedObj);
}

/**
 * Server cryptographic signature generation using Ed25519
 */
function signPayload(payload) {
  const canonicalString = canonicalizePayload(payload);
  const signatureBuffer = crypto.sign(null, Buffer.from(canonicalString, 'utf8'), SERVER_PRIVATE_KEY_PEM);
  return signatureBuffer.toString('base64');
}

/**
 * License Server - Activation Endpoint
 */
async function processActivation(licenseId, deviceFingerprint) {
  if (!licenseId || typeof licenseId !== 'string') {
    return { success: false, error: 'INVALID_LICENSE_ID', message: 'شناسه لایسنس ارسال نشده یا نامعتبر است' };
  }

  const cleanId = licenseId.trim().toUpperCase();
  const record = licenseDatabase.get(cleanId);

  if (!record) {
    return { success: false, error: 'LICENSE_NOT_FOUND', message: 'لایسنس وارد شده در پایگاه داده سرور یافت نشد' };
  }

  if (record.status === 'REVOKED') {
    return { success: false, error: 'REVOKED', message: 'این لایسنس توسط مدیر سامانه باطل شده است' };
  }

  if (record.status === 'EXPIRED' || (record.expiresAt && Date.now() > Date.parse(record.expiresAt))) {
    return { success: false, error: 'EXPIRED', message: 'مدت اعتبار این لایسنس به پایان رسیده است' };
  }

  // Check device binding - Single Installation Guarantee
  if (record.deviceBinding && record.deviceBinding !== deviceFingerprint) {
    return {
      success: false,
      error: 'DEVICE_MISMATCH',
      message: 'این لایسنس قبلاً روی دستگاه دیگری فعال شده است. جهت فعالسازی بر روی رایانه جدید از کد بازیابی استفاده کنید',
      boundDeviceMasked: record.deviceBinding.slice(0, 7) + '...' + record.deviceBinding.slice(-4),
    };
  }

  // Bind device if not bound
  const now = new Date().toISOString();
  record.deviceBinding = deviceFingerprint;
  record.status = 'ACTIVE';
  if (!record.activatedAt) {
    record.activatedAt = now;
  }

  const tokenPayload = {
    licenseId: record.licenseId,
    gymId: record.gymId,
    gymName: record.gymName,
    product: record.product,
    plan: record.plan,
    deviceFingerprint,
    activatedAt: record.activatedAt,
    expiresAt: record.expiresAt,
    tokenVersion: record.tokenVersion,
  };

  const signature = signPayload(tokenPayload);

  return {
    success: true,
    token: {
      payload: tokenPayload,
      signature,
    },
    message: 'لایسنس با موفقیت فعال و به این رایانه متصل شد',
  };
}

/**
 * License Server - Authorized Recovery & Rebind Endpoint
 */
async function processRecovery(licenseId, recoveryCode, newDeviceFingerprint) {
  if (!licenseId || !recoveryCode || !newDeviceFingerprint) {
    return { success: false, error: 'MISSING_PARAMS', message: 'پارامترهای بازیابی ناقص هستند' };
  }

  const cleanId = licenseId.trim().toUpperCase();
  const record = licenseDatabase.get(cleanId);

  if (!record) {
    return { success: false, error: 'LICENSE_NOT_FOUND', message: 'لایسنس یافت نشد' };
  }

  if (record.status === 'REVOKED') {
    return { success: false, error: 'REVOKED', message: 'لایسنس لغو شده و قابل بازیابی نیست' };
  }

  if (record.recoveryCode !== recoveryCode.trim()) {
    return { success: false, error: 'UNAUTHORIZED_RECOVERY', message: 'کد یکبارمصرف بازیابی لایسنس نامعتبر است' };
  }

  // Authorization passed - Unbind old device and rebind to new device
  const oldDevice = record.deviceBinding;
  record.deviceBinding = newDeviceFingerprint;
  record.status = 'ACTIVE';
  record.activatedAt = new Date().toISOString();
  
  // Cycle recovery code to prevent reuse
  const newRecoveryCode = 'REC-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + Math.floor(100000 + Math.random() * 900000);
  record.recoveryCode = newRecoveryCode;

  const tokenPayload = {
    licenseId: record.licenseId,
    gymId: record.gymId,
    gymName: record.gymName,
    product: record.product,
    plan: record.plan,
    deviceFingerprint: newDeviceFingerprint,
    activatedAt: record.activatedAt,
    expiresAt: record.expiresAt,
    tokenVersion: record.tokenVersion,
  };

  const signature = signPayload(tokenPayload);

  return {
    success: true,
    token: {
      payload: tokenPayload,
      signature,
    },
    newRecoveryCode,
    previousDeviceMasked: oldDevice ? (oldDevice.slice(0, 7) + '...' + oldDevice.slice(-4)) : null,
    message: 'لایسنس با موفقیت بازیابی شد و به رایانه جدید متصل گردید',
  };
}

function resetMockDatabase() {
  licenseDatabase = createDefaultDatabase();
}

function getLicenseRecord(licenseId) {
  return licenseDatabase.get(licenseId);
}

module.exports = {
  processActivation,
  processRecovery,
  resetMockDatabase,
  getLicenseRecord,
  canonicalizePayload,
  signPayload,
  SERVER_PRIVATE_KEY_PEM,
};
