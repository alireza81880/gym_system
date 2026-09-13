/**
 * Gym OS - Admin Console & Offline Package Generation Verification Test
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const licenseManager = require('../desktop/licenseManager.cjs');
const licenseServerMock = require('./licenseServerMock.cjs');

const TEST_DIR = path.join(os.tmpdir(), `gymos-admin-test-${Date.now()}`);
const testPaths = { configDir: TEST_DIR };
fs.mkdirSync(TEST_DIR, { recursive: true });

async function run() {
  console.log('Testing Admin Console & Offline Package Generation...');
  licenseServerMock.resetMockDatabase();

  const hw = licenseManager.getDeviceFingerprint();
  console.log('Detected test machine HW fingerprint:', hw.substring(0, 16) + '...');

  // 1. Target existing test license in mock authority
  const licenseKey = 'GYM-2026-001';
  console.log('Target license key:', licenseKey);

  // 2. Generate offline package for this machine
  const pkgRes = await licenseServerMock.generateOfflinePackage({
    licenseId: licenseKey,
    deviceFingerprint: hw,
    durationMonths: 12,
  });
  assert.strictEqual(pkgRes.success, true, 'Offline package generation should succeed');
  assert.ok(pkgRes.package, 'Package object must be returned');
  assert.ok(pkgRes.package.signature, 'Package must be signed with Ed25519');
  assert.ok(pkgRes.packageBase64, 'Package Base64 must be returned');
  console.log('✓ Generated and signed Ed25519 offline package successfully');

  // 3. Apply the offline package to client licenseManager
  licenseManager.clearActivation(testPaths);
  const applyRes = await licenseManager.activateOfflinePackage(pkgRes.packageBase64, testPaths);
  assert.strictEqual(applyRes.success, true, 'Applying offline package should succeed');
  console.log('✓ Client successfully applied the offline package');

  // 4. Verify client status is now ACTIVE with matching hardware
  const status = licenseManager.getLicenseStatus(testPaths);
  assert.strictEqual(status.status, 'ACTIVE', 'Status must be ACTIVE');
  assert.strictEqual(status.isOfflineValid, true, 'isOfflineValid must be true');
  assert.strictEqual(status.deviceBindingStatus, 'BOUND_MATCHED', 'deviceBindingStatus must be BOUND_MATCHED');
  console.log('✓ Offline license token verified locally with valid Ed25519 signature');

  // 5. Test Revoke & Restore
  licenseServerMock.revokeLicense(licenseKey);
  const revokedRecord = licenseServerMock.getLicenseRecord(licenseKey);
  assert.strictEqual(revokedRecord.status, 'REVOKED', 'Status should be REVOKED');

  const restoreRes = licenseServerMock.restoreLicense(licenseKey);
  assert.strictEqual(restoreRes.success, true, 'Restore should succeed');
  const restoredRecord = licenseServerMock.getLicenseRecord(licenseKey);
  assert.strictEqual(restoredRecord.status, 'ACTIVE', 'Status should be restored to ACTIVE');
  console.log('✓ Admin Revoke and Restore validated successfully');

  console.log('\nALL ADMIN CONSOLE & OFFLINE PACKAGE TESTS PASSED! 🎉\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
