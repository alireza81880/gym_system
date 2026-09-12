/**
 * Gym OS - Startup License Validation Test Suite
 * Tests Authoritative Startup Validation, Online Server Revocation/Expiration,
 * Offline Grace Behavior, Local Deactivation Invariants, and Reactivation.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const licenseManager = require('../desktop/licenseManager.cjs');
const mockServer = require('./licenseServerMock.cjs');

console.log('======================================================================');
console.log('GYM OS — STARTUP LICENSE VALIDATION & REVOCATION TEST SUITE');
console.log('======================================================================\n');

let tempDir;
let storagePaths;

function setupCleanEnvironment() {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gymos-startup-test-'));
  const appData = path.join(tempDir, 'AppData', 'Roaming', 'GymOS');
  fs.mkdirSync(path.join(appData, 'config'), { recursive: true });
  fs.mkdirSync(path.join(appData, 'database'), { recursive: true });

  storagePaths = {
    userData: appData,
    configDir: path.join(appData, 'config'),
    databaseDir: path.join(appData, 'database'),
    databaseFile: path.join(appData, 'database', 'gym_os.sqlite'),
    licenseFile: path.join(appData, 'config', 'license_activation.json'),
  };

  // Seed sample database file with member data
  fs.writeFileSync(storagePaths.databaseFile, 'MOCK_SQLITE_MEMBER_AND_PAYMENT_DATA_RECORDS', 'utf8');

  mockServer.resetMockDatabase();
  licenseManager.resetSessionRevocationStatus();
}

function cleanupEnvironment() {
  if (tempDir && fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  }
}

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  function runTest(name, fn) {
    totalCount++;
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(' ', err.message);
    }
  }

  async function runAsyncTest(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`✗ FAIL: ${name}`);
      console.error(' ', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Scenario A: ACTIVE + Internet -> ورود موفق
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario A: ACTIVE + Internet → Successful entry to Gym OS', async () => {
    setupCleanEnvironment();
    // 1. Activate valid license
    const actResult = await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);
    assert.strictEqual(actResult.success, true, 'Activation must succeed');
    assert.strictEqual(actResult.status, 'ACTIVE');

    // 2. Restart and perform Startup Validation with internet online
    const startupResult = await licenseManager.validateStartupLicense(storagePaths, mockServer);
    assert.strictEqual(startupResult.status, 'ACTIVE', 'Startup status must be ACTIVE');
    assert.strictEqual(startupResult.isOfflineValid, true, 'isOfflineValid must be true');

    // 3. Confirm getLicenseStatus reflects ACTIVE
    const currentStatus = licenseManager.getLicenseStatus(storagePaths);
    assert.strictEqual(currentStatus.status, 'ACTIVE');
    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario B: ACTIVE + Offline -> ورود موفق با Offline Token (Offline Grace)
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario B: ACTIVE + Offline → Successful entry via Offline Token Grace', async () => {
    setupCleanEnvironment();
    // 1. Activate while online
    const actResult = await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);
    assert.strictEqual(actResult.success, true);

    // 2. Simulate offline environment (network fails or times out)
    const offlineMockServer = {
      checkLicenseStatus: async () => {
        return {
          success: false,
          status: 'OFFLINE_FALLBACK',
          isNetworkError: true,
          error: 'NETWORK_ERROR',
          message: 'عدم دسترسی به سرور لایسنس (حالت آفلاین)',
        };
      },
    };

    // 3. Restart and validate startup offline
    const startupResult = await licenseManager.validateStartupLicense(storagePaths, offlineMockServer);
    assert.strictEqual(startupResult.status, 'ACTIVE', 'Offline valid token must grant entry');
    assert.strictEqual(startupResult.offlineGraceApplied, true, 'Offline grace must be applied');
    assert.strictEqual(startupResult.isOfflineValid, true, 'Local token must remain valid');

    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario C: REVOKED + Internet -> ورود ممنوع
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario C: REVOKED + Internet → Entry blocked with exact Persian message', async () => {
    setupCleanEnvironment();
    // 1. Activate license
    await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);

    // 2. Admin revokes license on server
    mockServer.revokeLicense('GYM-2026-001');

    // 3. App re-launches: Startup validation connects to server
    const startupResult = await licenseManager.validateStartupLicense(storagePaths, mockServer);
    assert.strictEqual(startupResult.status, 'REVOKED', 'Status must be REVOKED');
    assert.strictEqual(startupResult.isOfflineValid, false, 'isOfflineValid must be false');
    assert.strictEqual(startupResult.message, 'لایسنس این نرم‌افزار توسط مدیریت لغو شده است.');

    // 4. In-memory session status must block access
    const sessionStatus = licenseManager.getLicenseStatus(storagePaths);
    assert.strictEqual(sessionStatus.status, 'REVOKED');
    assert.strictEqual(sessionStatus.message, 'لایسنس این نرم‌افزار توسط مدیریت لغو شده است.');

    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario D: EXPIRED + Internet -> ورود ممنوع
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario D: EXPIRED + Internet → Entry blocked with exact Persian message', async () => {
    setupCleanEnvironment();
    // 1. Activate license
    await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);

    // 2. Server marks license as expired
    mockServer.expireLicense('GYM-2026-001');

    // 3. App re-launches: Startup validation detects expiration
    const startupResult = await licenseManager.validateStartupLicense(storagePaths, mockServer);
    assert.strictEqual(startupResult.status, 'EXPIRED', 'Status must be EXPIRED');
    assert.strictEqual(startupResult.isOfflineValid, false, 'isOfflineValid must be false');
    assert.strictEqual(startupResult.message, 'اعتبار لایسنس این نرم‌افزار به پایان رسیده است.');

    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario E: REVOKED token locally valid + Offline -> ورود طبق سیاست Offline Grace
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario E: REVOKED on server but client is Offline → Offline Grace entry permitted', async () => {
    setupCleanEnvironment();
    // 1. Activate license
    await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);

    // 2. Admin revokes on server, BUT client machine is completely offline / disconnected
    mockServer.revokeLicense('GYM-2026-001');

    const offlineMockServer = {
      checkLicenseStatus: async () => {
        return {
          success: false,
          status: 'OFFLINE_FALLBACK',
          isNetworkError: true,
          error: 'NETWORK_TIMEOUT',
          message: 'عدم دسترسی به سرور لایسنس (تایم‌اوت)',
        };
      },
    };

    // 3. Fresh startup in offline environment
    licenseManager.resetSessionRevocationStatus();
    const startupResult = await licenseManager.validateStartupLicense(storagePaths, offlineMockServer);
    assert.strictEqual(startupResult.status, 'ACTIVE', 'Local offline Ed25519 token allows entry when offline');
    assert.strictEqual(startupResult.offlineGraceApplied, true, 'Offline grace applied flag must be true');

    // 4. Reconnect to internet and restart: Server is now reached, REVOKED is authoritatively enforced
    const onlineStartup = await licenseManager.validateStartupLicense(storagePaths, mockServer);
    assert.strictEqual(onlineStartup.status, 'REVOKED', 'Once internet is restored, revocation must be enforced');
    assert.strictEqual(onlineStartup.message, 'لایسنس این نرم‌افزار توسط مدیریت لغو شده است.');

    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario F: Local Deactivation -> فقط token حذف شود و database دست‌نخورده بماند
  // --------------------------------------------------------------------------
  runTest('Scenario F: Local Deactivation preserves SQLite database & member records', () => {
    setupCleanEnvironment();
    // 1. Create active token file
    fs.writeFileSync(storagePaths.licenseFile, JSON.stringify({ dummy: 'token' }), 'utf8');
    assert.strictEqual(fs.existsSync(storagePaths.licenseFile), true);
    assert.strictEqual(fs.existsSync(storagePaths.databaseFile), true);

    // 2. Execute local deactivation
    const deactSuccess = licenseManager.clearActivation(storagePaths);
    assert.strictEqual(deactSuccess, true, 'Deactivation must succeed');

    // 3. Verify local token file was removed
    assert.strictEqual(fs.existsSync(storagePaths.licenseFile), false, 'Token file must be deleted');

    // 4. CRITICAL INVARIANT: Database file, members, and data MUST be completely preserved
    assert.strictEqual(fs.existsSync(storagePaths.databaseFile), true, 'Database file must remain intact');
    const dbContent = fs.readFileSync(storagePaths.databaseFile, 'utf8');
    assert.strictEqual(dbContent, 'MOCK_SQLITE_MEMBER_AND_PAYMENT_DATA_RECORDS', 'Database content must not be altered');

    // 5. App status is UNACTIVATED
    const status = licenseManager.getLicenseStatus(storagePaths);
    assert.strictEqual(status.status, 'UNACTIVATED');

    cleanupEnvironment();
  });

  // --------------------------------------------------------------------------
  // Scenario G: Reactivation -> دوباره قابل فعالسازی باشد
  // --------------------------------------------------------------------------
  await runAsyncTest('Scenario G: Reactivation → Machine can be reactivated successfully', async () => {
    setupCleanEnvironment();
    // 1. Initial activation
    await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);

    // 2. Local deactivation
    licenseManager.clearActivation(storagePaths);
    assert.strictEqual(licenseManager.getLicenseStatus(storagePaths).status, 'UNACTIVATED');

    // 3. Reactivate with same or new license
    const reactivateResult = await licenseManager.activateLicense('GYM-2026-001', storagePaths, mockServer);
    assert.strictEqual(reactivateResult.success, true, 'Reactivation must succeed');
    assert.strictEqual(reactivateResult.status, 'ACTIVE');

    const finalStatus = licenseManager.getLicenseStatus(storagePaths);
    assert.strictEqual(finalStatus.status, 'ACTIVE');

    cleanupEnvironment();
  });

  console.log('\n======================================================================');
  console.log(`SUMMARY: ${passedCount} of ${totalCount} tests passed.`);
  console.log('======================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
