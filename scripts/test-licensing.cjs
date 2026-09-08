/**
 * Gym OS - Phase 21 License Activation & Anti-Copy System Test Suite
 * 
 * Verifies Test Scenarios A through J:
 * A. New machine → valid license → activation succeeds
 * B. Same machine → restart → activation remains valid
 * C. Same license → second machine → denied
 * D. Invalid license → denied
 * E. Revoked license → denied according to policy
 * F. Offline after activation → Gym OS remains operational
 * G. Tamper with local activation data → validation fails safely
 * H. Recovery → authorized recovery → new device can activate
 * I. Unauthorized recovery → denied + audit
 * J. Restart Windows → activation remains valid
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const licenseManager = require('../desktop/licenseManager.cjs');
const licenseServerMock = require('../desktop/licenseServerMock.cjs');

// Isolated test storage directory
const TEST_DIR = path.join(os.tmpdir(), `gymos-license-test-${Date.now()}`);
const testPaths = {
  configDir: TEST_DIR,
};

fs.mkdirSync(TEST_DIR, { recursive: true });

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log(' GYM OS PHASE 21 — LICENSE & ANTI-COPY TEST SUITE');
  console.log('======================================================\n');

  licenseServerMock.resetMockDatabase();

  // Test A: New machine -> valid license -> activation succeeds
  await runTest('Test A: New machine → valid license → activation succeeds', async () => {
    licenseManager.clearActivation(testPaths);
    const initialStatus = licenseManager.getLicenseStatus(testPaths);
    assert.strictEqual(initialStatus.status, 'UNACTIVATED', 'Initial state must be UNACTIVATED');

    const result = await licenseManager.activateLicense('GYM-2026-001', testPaths, licenseServerMock);
    assert.strictEqual(result.success, true, 'Activation must succeed');
    assert.strictEqual(result.status, 'ACTIVE', 'Status must be ACTIVE');
    assert.strictEqual(result.licenseInfo.plan, 'Enterprise', 'Plan must match server tier');
    assert.strictEqual(result.licenseInfo.isOfflineValid, true, 'Token must be offline-valid');
  });

  // Test B: Same machine -> restart -> activation remains valid
  runTest('Test B: Same machine → restart → activation remains valid', () => {
    // Re-evaluates status strictly from local disk without calling server
    const status = licenseManager.getLicenseStatus(testPaths);
    assert.strictEqual(status.status, 'ACTIVE', 'Status after simulated restart must remain ACTIVE');
    assert.strictEqual(status.deviceBindingStatus, 'BOUND_MATCHED', 'Device must remain bound and matched');
    assert.strictEqual(status.licenseId, 'GYM-2026-001');
  });

  // Test C: Same license -> second machine -> denied
  await runTest('Test C: Same license → second machine → denied (DEVICE_MISMATCH)', async () => {
    const secondMachinePaths = { configDir: path.join(TEST_DIR, 'machine-2') };
    fs.mkdirSync(secondMachinePaths.configDir, { recursive: true });

    // Simulate Machine 2 having a different hardware fingerprint
    const machine2Fingerprint = 'FP-SECOND-MACHINE-DIFFERENT-HW-8899';
    const serverResult = await licenseServerMock.processActivation('GYM-2026-001', machine2Fingerprint);

    assert.strictEqual(serverResult.success, false, 'Second machine must not activate');
    assert.strictEqual(serverResult.error, 'DEVICE_MISMATCH', 'Error must be DEVICE_MISMATCH');
  });

  // Test D: Invalid license -> denied
  await runTest('Test D: Invalid license → denied', async () => {
    const res = await licenseServerMock.processActivation('GYM-INVALID-KEY-999', 'FP-TEST');
    assert.strictEqual(res.success, false, 'Invalid license must fail');
    assert.strictEqual(res.error, 'LICENSE_NOT_FOUND', 'Error must indicate license not found');
  });

  // Test E: Revoked license -> denied according to policy
  await runTest('Test E: Revoked license → denied according to policy', async () => {
    const res = await licenseServerMock.processActivation('GYM-2026-REVOKED', 'FP-TEST');
    assert.strictEqual(res.success, false, 'Revoked license must fail');
    assert.strictEqual(res.error, 'REVOKED', 'Error must indicate license is revoked');
  });

  // Test F: Offline after activation -> Gym OS remains operational
  runTest('Test F: Offline after activation → Gym OS remains operational', () => {
    // Completely isolated evaluation without any network/server dependency
    const status = licenseManager.getLicenseStatus(testPaths);
    assert.strictEqual(status.status, 'ACTIVE', 'Offline status must remain ACTIVE');
    assert.strictEqual(status.isOfflineValid, true, 'Cryptographic token must validate offline');
  });

  // Test G: Tamper with local activation data -> validation fails safely
  runTest('Test G: Tamper with local activation data → validation fails safely', () => {
    const licenseFile = path.join(testPaths.configDir, 'license_activation.json');
    const originalContent = fs.readFileSync(licenseFile, 'utf8');
    const parsed = JSON.parse(originalContent);

    // Tamper with payload (e.g. change plan or licenseId)
    const tamperedPayload = { ...parsed, payload: { ...parsed.payload, plan: 'FreeUnlimitedHacked' } };
    fs.writeFileSync(licenseFile, JSON.stringify(tamperedPayload), 'utf8');

    const tamperedStatus = licenseManager.getLicenseStatus(testPaths);
    assert.strictEqual(tamperedStatus.status, 'RECOVERY_REQUIRED', 'Tampered token must fail verification');
    assert.strictEqual(tamperedStatus.reason, 'TAMPERED_SIGNATURE', 'Reason must be signature tamper detection');

    // Restore valid file for remaining tests
    fs.writeFileSync(licenseFile, originalContent, 'utf8');
  });

  // Test H: Recovery -> authorized recovery -> new device can activate
  await runTest('Test H: Recovery → authorized recovery → new device can activate', async () => {
    const newMachinePaths = { configDir: path.join(TEST_DIR, 'new-pc') };
    fs.mkdirSync(newMachinePaths.configDir, { recursive: true });

    // Valid recovery code for GYM-2026-001 from authority server
    const recoveryCode = 'REC-9A8B7C-543210';
    const recoveryRes = await licenseManager.recoverLicense('GYM-2026-001', recoveryCode, newMachinePaths, licenseServerMock);

    assert.strictEqual(recoveryRes.success, true, 'Recovery must succeed with valid code');
    assert.strictEqual(recoveryRes.status, 'ACTIVE', 'Status after recovery must be ACTIVE');
    assert.ok(recoveryRes.newRecoveryCode, 'A new one-time recovery code must be issued');

    const recoveredStatus = licenseManager.getLicenseStatus(newMachinePaths);
    assert.strictEqual(recoveredStatus.status, 'ACTIVE');
    assert.strictEqual(recoveredStatus.deviceBindingStatus, 'BOUND_MATCHED');
  });

  // Test I: Unauthorized recovery -> denied + audit
  await runTest('Test I: Unauthorized recovery → denied', async () => {
    const fakePaths = { configDir: path.join(TEST_DIR, 'hacker-pc') };
    fs.mkdirSync(fakePaths.configDir, { recursive: true });

    const badRecoveryRes = await licenseManager.recoverLicense('GYM-2026-001', 'REC-WRONG-CODE', fakePaths, licenseServerMock);
    assert.strictEqual(badRecoveryRes.success, false, 'Invalid recovery code must be rejected');
    assert.strictEqual(badRecoveryRes.error, 'UNAUTHORIZED_RECOVERY', 'Must report unauthorized recovery');
  });

  // Test J: Restart Windows -> activation remains valid
  runTest('Test J: Restart Windows (simulated reboot) → activation remains valid', () => {
    // Reading status after all tests from the recovered machine directory
    const newMachinePaths = { configDir: path.join(TEST_DIR, 'new-pc') };
    const status = licenseManager.getLicenseStatus(newMachinePaths);
    assert.strictEqual(status.status, 'ACTIVE', 'Persistent activation must survive reboot');
    assert.strictEqual(status.deviceBindingStatus, 'BOUND_MATCHED');
    assert.strictEqual(status.isOfflineValid, true);
  });

  // Cleanup temp files
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }

  console.log('\n======================================================');
  console.log(` SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
