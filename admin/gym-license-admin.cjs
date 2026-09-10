#!/usr/bin/env node
/**
 * Gym OS License Administration & Offline Signer Tool
 * 
 * RUNS ONLY ON GYM OS OWNER'S TRUSTED MACHINE.
 * NEVER DISTRIBUTED WITH THE CLIENT ELECTRON INSTALLER.
 * 
 * Commands:
 * 1. create-license <display_key> [gym_name] [plan] [expires_in_days]
 * 2. generate-offline-package <license_key> <device_fingerprint> [gym_name] [plan] [valid_days]
 * 3. generate-keys (creates ed25519 keypair if needed)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEYS_FILE = path.join(__dirname, 'admin_signing_keys.json');

function ensureKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    fs.writeFileSync(KEYS_FILE, JSON.stringify({ publicKey, privateKey }, null, 2), 'utf8');
    console.log('[Admin] Created new Ed25519 keypair in admin_signing_keys.json');
    return { publicKey, privateKey };
  }
  return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
}

function hashString(str) {
  return crypto.createHash('sha256').update(str.trim().toUpperCase()).digest('hex');
}

function canonicalize(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = payload[key];
  }
  return JSON.stringify(sortedObj);
}

function generateLicenseKey(prefix = 'GYM') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function segment(len) {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
  return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

function calculateExpiry(createdAt, durationMonths) {
  if (durationMonths === null || durationMonths === undefined || durationMonths <= 0) {
    return null;
  }
  const date = new Date(createdAt);
  date.setMonth(date.getMonth() + Number(durationMonths));
  return date.toISOString();
}

function generateRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function segment(len) {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
  return `REC-${segment(4)}-${segment(6)}`;
}

function runCli() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Gym OS License Admin CLI
Usage:
  node admin/gym-license-admin.cjs create-license <customer_name> [duration: 1y|2y|3y|trial|lifetime|<months>] [plan] [max_devices]
  node admin/gym-license-admin.cjs generate-offline-package <license_key> <device_fingerprint> [gym_name]
  node admin/gym-license-admin.cjs print-public-key

Examples:
  node admin/gym-license-admin.cjs create-license "باشگاه اکسیژن" 1y Professional 1
  node admin/gym-license-admin.cjs create-license "مجموعه ورزشی آزادی" 2y Enterprise 3
  node admin/gym-license-admin.cjs create-license "باشگاه البرز" trial Starter 1
  node admin/gym-license-admin.cjs create-license "آکادمی فیتنس" lifetime Enterprise 5
  node admin/gym-license-admin.cjs create-license "باشگاه سپهر" 6 Professional 2
    `);
    process.exit(0);
  }

  const { privateKey, publicKey } = ensureKeys();

  if (command === 'print-public-key') {
    console.log('Ed25519 Public Key:\n');
    console.log(publicKey);
    process.exit(0);
  }

  if (command === 'create-license') {
    const customerName = args[1] || 'باشگاه مرکزی';
    const durationArg = (args[2] || '1y').toLowerCase();
    const plan = args[3] || 'Professional';
    const maxDevices = parseInt(args[4], 10) || 1;

    let durationMonths = 12;
    let licenseType = 'YEARLY';

    if (durationArg === 'lifetime' || durationArg === '0') {
      durationMonths = null;
      licenseType = 'LIFETIME';
    } else if (durationArg === 'trial') {
      durationMonths = 1;
      licenseType = 'TRIAL';
    } else if (durationArg === '1y' || durationArg === '12' || durationArg === '1year') {
      durationMonths = 12;
      licenseType = 'YEARLY';
    } else if (durationArg === '2y' || durationArg === '24' || durationArg === '2years') {
      durationMonths = 24;
      licenseType = 'MULTI_YEAR';
    } else if (durationArg === '3y' || durationArg === '36' || durationArg === '3years') {
      durationMonths = 36;
      licenseType = 'MULTI_YEAR';
    } else {
      const parsed = parseInt(durationArg, 10);
      if (!isNaN(parsed) && parsed > 0) {
        durationMonths = parsed;
        licenseType = 'CUSTOM';
      }
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = calculateExpiry(now, durationMonths);
    const licenseKey = generateLicenseKey();
    const licenseKeyHash = hashString(licenseKey);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = hashString(recoveryCode);
    const status = 'UNUSED';

    console.log('======================================================');
    console.log('GYM OS AUTHORITATIVE LICENSE CREATED');
    console.log('======================================================');
    console.log(`Customer / Gym Name  : ${customerName}`);
    console.log(`License Key          : ${licenseKey}`);
    console.log(`Plan / Edition       : ${plan}`);
    console.log(`License Type         : ${licenseType}`);
    console.log(`Duration (Months)    : ${durationMonths !== null ? durationMonths + ' months' : 'Perpetual / Lifetime'}`);
    console.log(`Created At           : ${createdAt}`);
    console.log(`Expires At           : ${expiresAt || 'Never (Lifetime)'}`);
    console.log(`Max Devices          : ${maxDevices}`);
    console.log(`Recovery Code        : ${recoveryCode}`);
    console.log(`Initial Status       : ${status}`);
    console.log('======================================================');
    console.log(`Key SHA-256 Hash     : ${licenseKeyHash}`);
    console.log(`Recovery SHA-256 Hash: ${recoveryCodeHash}`);
    console.log('======================================================');

    console.log('\n--- SQL Insert for Supabase Database ---');
    const sqlExpires = expiresAt ? `'${expiresAt}'` : 'NULL';
    const sqlDur = durationMonths !== null ? durationMonths : 'NULL';
    console.log(`INSERT INTO public.licenses (
  license_key_hash,
  license_key,
  display_key,
  customer_name,
  gym_name,
  plan,
  duration_months,
  license_type,
  max_devices,
  recovery_code,
  recovery_code_hash,
  status,
  created_at,
  expires_at
) VALUES (
  '${licenseKeyHash}',
  '${licenseKey}',
  '${licenseKey}',
  '${customerName.replace(/'/g, "''")}',
  '${customerName.replace(/'/g, "''")}',
  '${plan}',
  ${sqlDur},
  '${licenseType}',
  ${maxDevices},
  '${recoveryCode}',
  '${recoveryCodeHash}',
  '${status}',
  '${createdAt}',
  ${sqlExpires}
);`);
    console.log('----------------------------------------\n');
    process.exit(0);
  }

  if (command === 'generate-offline-package') {
    const licenseKey = args[1];
    const deviceFingerprint = args[2];
    const gymName = args[3] || 'باشگاه مرکزی';
    const plan = args[4] || 'Enterprise';

    if (!licenseKey || !deviceFingerprint) {
      console.error('Error: license_key and device_fingerprint are required.');
      process.exit(1);
    }

    const now = new Date().toISOString();
    const packageId = 'OFFPKG-' + crypto.randomBytes(8).toString('hex').toUpperCase();

    const payload = {
      licenseId: licenseKey.trim().toUpperCase(),
      gymId: 'gym-offline-' + crypto.randomBytes(4).toString('hex'),
      gymName: gymName,
      product: 'GymOS-Desktop',
      plan: plan,
      deviceFingerprint: deviceFingerprint.trim().toUpperCase(),
      activatedAt: now,
      expiresAt: null,
      tokenVersion: 1,
      activationType: 'OFFLINE_EMERGENCY',
      packageId: packageId,
    };

    const dataToSign = Buffer.from(canonicalize(payload), 'utf8');
    const signature = crypto.sign(null, dataToSign, privateKey).toString('base64');

    const offlinePackage = {
      packageId: packageId,
      type: 'GYMOS_OFFLINE_ACTIVATION_PACKAGE',
      version: 1,
      payload: payload,
      signature: signature,
    };

    console.log('======================================================');
    console.log('EMERGENCY OFFLINE ACTIVATION PACKAGE GENERATED');
    console.log('======================================================');
    console.log(`Target Fingerprint: ${deviceFingerprint}`);
    console.log(`License Key       : ${licenseKey}`);
    console.log(`Package ID        : ${packageId}`);
    console.log('------------------------------------------------------');
    console.log('Base64 Package String (Send this to Gym Operator):');
    const base64Str = Buffer.from(JSON.stringify(offlinePackage)).toString('base64');
    console.log(base64Str);
    console.log('------------------------------------------------------');
    
    // Also write to output file
    const outPath = path.join(__dirname, `offline_pkg_${packageId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(offlinePackage, null, 2), 'utf8');
    console.log(`Saved JSON package to: ${outPath}`);
    process.exit(0);
  }

  console.error('Unknown command:', command);
  process.exit(1);
}

if (require.main === module) {
  runCli();
}

function createOfflinePackage({
  licenseId,
  gymId = 'gym-offline-test',
  gymName = 'باشگاه مرکزی',
  plan = 'Enterprise',
  deviceFingerprint,
  expiresAt = null,
}) {
  const { privateKey } = ensureKeys();
  const packageId = 'OFFPKG-' + crypto.randomBytes(8).toString('hex').toUpperCase();
  const payload = {
    licenseId: licenseId.trim().toUpperCase(),
    gymId,
    gymName,
    product: 'GymOS-Desktop',
    plan,
    deviceFingerprint: deviceFingerprint.trim().toUpperCase(),
    activatedAt: new Date().toISOString(),
    expiresAt,
    tokenVersion: 1,
    activationType: 'OFFLINE_EMERGENCY',
    packageId,
  };

  const dataToSign = Buffer.from(canonicalize(payload), 'utf8');
  const signature = crypto.sign(null, dataToSign, privateKey).toString('base64');
  const pkg = {
    packageId,
    type: 'GYMOS_OFFLINE_ACTIVATION_PACKAGE',
    version: 1,
    payload,
    signature,
  };

  return {
    success: true,
    packageObj: pkg,
    packageJson: JSON.stringify(pkg),
    packageBase64: Buffer.from(JSON.stringify(pkg)).toString('base64'),
  };
}

module.exports = {
  createOfflinePackage,
  generateLicenseKey,
  hashString,
  ensureKeys,
};
