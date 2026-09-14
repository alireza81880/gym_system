/**
 * Gym OS - Clock Rollback & License State Tampering Security Test Suite
 * 
 * Tests strictly against the real production modules:
 * - desktop/licenseManager.cjs (evaluateToken, getLicenseStatus, validateStartupLicense, saveTokenAtomically)
 * - desktop/licenseSecurityStore.cjs (readSecureState, writeSecureState, clearSecureState)
 * 
 * ISOLATION GUARANTEES:
 * - Uses isolated temporary directories in os.tmpdir()
 * - Never modifies user's ~/.gymos_desktop production directory
 * - Never modifies SQLite databases or member records
 * - Never communicates with production Supabase
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const licenseManager = require('../desktop/licenseManager.cjs');
const licenseSecurityStore = require('../desktop/licenseSecurityStore.cjs');
const adminSigningKeys = require('../admin/admin_signing_keys.json');

const testResults = [];

function recordTestResult(testName, expected, actual, pass, productionFunction, notes = '') {
  testResults.push({
    testName,
    expected,
    actual,
    pass: !!pass,
    productionFunction,
    notes,
  });
}

function canonicalizePayload(payload) {
  const sortedKeys = Object.keys(payload).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = payload[key];
  }
  return JSON.stringify(sortedObj);
}

function createSignedTestToken(payloadOverrides = {}) {
  const fp = licenseManager.getDeviceFingerprint();
  const basePayload = {
    licenseId: 'GYM-TEST-' + crypto.randomBytes(4).toString('hex').toUpperCase(),
    gymName: 'باشگاه ورزشی آریا (تستی)',
    customerName: 'آریا رحیمی',
    plan: 'Professional',
    licenseType: 'YEARLY',
    durationMonths: 12,
    maxDevices: 1,
    deviceFingerprint: fp,
    tokenVersion: 1,
    generation: 1,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year future
  };

  const payload = { ...basePayload, ...payloadOverrides };
  const canonical = canonicalizePayload(payload);
  const signature = crypto
    .sign(null, Buffer.from(canonical, 'utf8'), adminSigningKeys.privateKey)
    .toString('base64');

  return { payload, signature };
}

function createIsolatedTestDir(prefix) {
  const dir = path.join(os.tmpdir(), `gymos_test_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  return {
    dir,
    storagePaths: { configDir: dir },
    cleanup: () => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (err) {
        // ignore cleanup error
      }
    },
  };
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🚀 Starting Isolated Clock Rollback & License State Security Tests');
  console.log('='.repeat(70));

  const currentFp = licenseManager.getDeviceFingerprint();
  console.log(`[INIT] Host Fingerprint: ${licenseManager.getMaskedFingerprint(currentFp)} (${currentFp})`);

  // =========================================================================
  // TEST A: Clock Rollback
  // =========================================================================
  console.log('\n--- Running TEST A: Clock Rollback ---');
  {
    const fixture = createIsolatedTestDir('test_a');
    try {
      const token = createSignedTestToken();
      licenseManager.saveTokenAtomically(fixture.storagePaths, token);

      // Verify clean active baseline
      const baseline = licenseManager.getLicenseStatus(fixture.storagePaths);
      if (baseline.status !== 'ACTIVE') {
        throw new Error(`Baseline activation failed: ${baseline.status}`);
      }

      // Step 2 & 3: Set lastTrustedWallClock = T, and evaluate at simulated time < T
      // Case A1: rollback > 2 hours tolerance (e.g. 5 hours backward from T)
      const nowMs = Date.now();
      const T = nowMs + 5 * 60 * 60 * 1000; // T is 5 hours in the future
      licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: licenseSecurityStore.computeTokenFingerprint(token),
          tokenGeneration: 1,
          lastTrustedWallClockMs: T,
        },
        currentFp
      );

      const statusAfterRollback = licenseManager.getLicenseStatus(fixture.storagePaths);
      recordTestResult(
        'TEST A.1: Clock Rollback Detection (> 2h backward)',
        'CLOCK_ROLLBACK_DETECTED',
        statusAfterRollback.status,
        statusAfterRollback.status === 'CLOCK_ROLLBACK_DETECTED',
        'licenseManager.getLicenseStatus & evaluateToken',
        'T was 5h ahead of current system time; rollback properly trapped'
      );

      // Case A2: Timezone / NTP change within tolerance (e.g. 30 minutes backward)
      // Should NOT trigger false positive
      const smallDeltaT = nowMs + 30 * 60 * 1000; // 30 minutes in the future
      licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: licenseSecurityStore.computeTokenFingerprint(token),
          tokenGeneration: 1,
          lastTrustedWallClockMs: smallDeltaT,
        },
        currentFp
      );

      const statusSmallDelta = licenseManager.getLicenseStatus(fixture.storagePaths);
      recordTestResult(
        'TEST A.2: Backward delta within tolerance (30m < 2h)',
        'ACTIVE',
        statusSmallDelta.status,
        statusSmallDelta.status === 'ACTIVE',
        'licenseManager.getLicenseStatus & evaluateToken',
        'No false positive for DST/NTP adjustments within 2-hour window'
      );

      // Case A3: Exact boundary check (1h 59m backward -> ACTIVE, 2h 05m backward -> CLOCK_ROLLBACK_DETECTED)
      const boundarySafeT = nowMs + 119 * 60 * 1000; // 1h 59m
      licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: licenseSecurityStore.computeTokenFingerprint(token),
          tokenGeneration: 1,
          lastTrustedWallClockMs: boundarySafeT,
        },
        currentFp
      );
      const boundarySafeStatus = licenseManager.getLicenseStatus(fixture.storagePaths);

      const boundaryFailT = nowMs + 125 * 60 * 1000; // 2h 05m
      licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: licenseSecurityStore.computeTokenFingerprint(token),
          tokenGeneration: 1,
          lastTrustedWallClockMs: boundaryFailT,
        },
        currentFp
      );
      const boundaryFailStatus = licenseManager.getLicenseStatus(fixture.storagePaths);

      const boundaryPassed =
        boundarySafeStatus.status === 'ACTIVE' &&
        boundaryFailStatus.status === 'CLOCK_ROLLBACK_DETECTED';

      recordTestResult(
        'TEST A.3: Boundary tolerance threshold check (2 hours)',
        '1h59m=ACTIVE && 2h05m=CLOCK_ROLLBACK_DETECTED',
        `1h59m=${boundarySafeStatus.status} && 2h05m=${boundaryFailStatus.status}`,
        boundaryPassed,
        'licenseManager.getLicenseStatus & licenseSecurityStore.ROLLBACK_TOLERANCE_MS',
        'Strict boundary enforcement at ROLLBACK_TOLERANCE_MS (2 hours)'
      );
    } finally {
      fixture.cleanup();
    }
  }

  // =========================================================================
  // TEST B: Forward Clock & Expiration Handling
  // =========================================================================
  console.log('\n--- Running TEST B: Forward Clock ---');
  {
    const fixture = createIsolatedTestDir('test_b');
    try {
      // Token expires in 10 days
      const token = createSignedTestToken({
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
      licenseManager.saveTokenAtomically(fixture.storagePaths, token);

      // 1. Forward within valid period: simulate system clock 3 days forward
      const originalNow = Date.now;
      try {
        const threeDaysForward = originalNow() + 3 * 24 * 60 * 60 * 1000;
        Date.now = () => threeDaysForward;

        const forwardActiveStatus = licenseManager.getLicenseStatus(fixture.storagePaths);
        recordTestResult(
          'TEST B.1: Forward Clock within valid period (+3 days)',
          'ACTIVE',
          forwardActiveStatus.status,
          forwardActiveStatus.status === 'ACTIVE',
          'licenseManager.getLicenseStatus',
          'Clock moved forward into the future without rollback error'
        );

        // Verify lastTrustedWallClock progressed monotonically forward
        const secRes = licenseSecurityStore.readSecureState(fixture.storagePaths, currentFp);
        const trustedProgressed =
          secRes.ok && secRes.state && secRes.state.lastTrustedWallClockMs >= threeDaysForward;
        recordTestResult(
          'TEST B.2: Monotonic Trusted Clock Progression',
          'trustedTime >= forwardTime',
          `trustedTime=${secRes.state ? secRes.state.lastTrustedWallClockMs : 0}`,
          trustedProgressed,
          'licenseManager.getLicenseStatus auto-advancement',
          'Trusted clock advanced to new high-water mark'
        );

        // 2. Forward clock beyond expiration: simulate system clock 15 days forward (expires in 10 days)
        const fifteenDaysForward = originalNow() + 15 * 24 * 60 * 60 * 1000;
        Date.now = () => fifteenDaysForward;

        const forwardExpiredStatus = licenseManager.getLicenseStatus(fixture.storagePaths);
        recordTestResult(
          'TEST B.3: Forward Clock beyond expiresAt (+15 days)',
          'EXPIRED',
          forwardExpiredStatus.status,
          forwardExpiredStatus.status === 'EXPIRED',
          'licenseManager.getLicenseStatus',
          'Forward clock properly triggered expiration according to expiresAt'
        );
      } finally {
        Date.now = originalNow;
      }
    } finally {
      fixture.cleanup();
    }
  }

  // =========================================================================
  // TEST C: State Tampering & Replay / Restoration
  // =========================================================================
  console.log('\n--- Running TEST C: State Tampering ---');
  {
    const fixture = createIsolatedTestDir('test_c');
    try {
      const token = createSignedTestToken();
      licenseManager.saveTokenAtomically(fixture.storagePaths, token);

      const secPath = licenseSecurityStore.getSecureStateFilePath(fixture.storagePaths);
      if (!fs.existsSync(secPath)) {
        throw new Error('Secure state file was not created');
      }

      // Case C.1: Tamper with encrypted ciphertext on disk
      const rawEnvelope = JSON.parse(fs.readFileSync(secPath, 'utf8'));
      const originalCiphertext = rawEnvelope.ciphertext;
      // Mutate one character of base64 ciphertext
      const tamperedCiphertext =
        originalCiphertext.slice(0, -4) + (originalCiphertext.endsWith('A') ? 'B' : 'A') + originalCiphertext.slice(-3);
      fs.writeFileSync(
        secPath,
        JSON.stringify({ ...rawEnvelope, ciphertext: tamperedCiphertext }),
        'utf8'
      );

      const tamperedStatus = licenseManager.getLicenseStatus(fixture.storagePaths);
      recordTestResult(
        'TEST C.1: Ciphertext Tampering on Disk',
        'LICENSE_STATE_TAMPERED',
        tamperedStatus.status,
        tamperedStatus.status === 'LICENSE_STATE_TAMPERED',
        'licenseManager.getLicenseStatus & licenseSecurityStore.readSecureState',
        'Decryption / Auth tag validation detected corrupted ciphertext'
      );

      // Case C.2: Tamper with HMAC inside a decrypted-like state
      // Re-create a valid state, then deliberately write invalid HMAC
      const validState = licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: licenseSecurityStore.computeTokenFingerprint(token),
          tokenGeneration: 1,
          lastTrustedWallClockMs: Date.now(),
        },
        currentFp
      );

      // Now bypass writeSecureState to manually inject modified data without valid HMAC
      const rawBuf = Buffer.from(
        JSON.stringify({
          ...validState,
          lastTrustedWallClockMs: 1000, // Modified field
          hmac: 'tampered_invalid_hmac_deadbeef12345678',
        }),
        'utf8'
      );
      // Derive hardware key directly to produce valid AES but forged payload
      const key = licenseSecurityStore.deriveHardwareSecret(currentFp);
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([cipher.update(rawBuf), cipher.final()]);
      const tag = cipher.getAuthTag();

      fs.writeFileSync(
        secPath,
        JSON.stringify({
          mode: 'HARDWARE_AES_GCM',
          iv: iv.toString('base64'),
          tag: tag.toString('base64'),
          ciphertext: encrypted.toString('base64'),
        }),
        'utf8'
      );

      const hmacTamperedStatus = licenseManager.getLicenseStatus(fixture.storagePaths);
      recordTestResult(
        'TEST C.2: HMAC Integrity Validation (Field Tampering)',
        'LICENSE_STATE_TAMPERED',
        hmacTamperedStatus.status,
        hmacTamperedStatus.status === 'LICENSE_STATE_TAMPERED',
        'licenseSecurityStore.readSecureState HMAC verification',
        'HMAC mismatch trapped forged state payload'
      );

      // Case C.3: Anti-Replay / Old Token Generation Restore
      // Restore valid secure state, but token presented is older generation than recorded in state
      licenseSecurityStore.writeSecureState(
        fixture.storagePaths,
        {
          licenseId: token.payload.licenseId,
          tokenFingerprint: 'future_fingerprint_generation_2',
          tokenGeneration: 2, // State has progressed to generation 2
          lastTrustedWallClockMs: Date.now(),
        },
        currentFp
      );

      // Token in disk is still generation 1 (old token restored by user)
      const replayStatus = licenseManager.getLicenseStatus(fixture.storagePaths);
      recordTestResult(
        'TEST C.3: Anti-Replay / Outdated Token Replaced',
        'EXPIRED',
        replayStatus.status,
        replayStatus.status === 'EXPIRED',
        'licenseManager.evaluateToken generation comparison',
        'Detected older token version presented after newer generation was registered'
      );
    } finally {
      fixture.cleanup();
    }
  }

  // =========================================================================
  // TEST D: State Deletion
  // =========================================================================
  console.log('\n--- Running TEST D: State Deletion ---');
  {
    const fixture = createIsolatedTestDir('test_d');
    try {
      const token = createSignedTestToken();
      licenseManager.saveTokenAtomically(fixture.storagePaths, token);

      const secPath = licenseSecurityStore.getSecureStateFilePath(fixture.storagePaths);
      if (fs.existsSync(secPath)) {
        fs.unlinkSync(secPath);
      }

      // Check behavior when secure state file is deleted
      const readRes = licenseSecurityStore.readSecureState(fixture.storagePaths, currentFp);
      const isMissingRecorded = readRes.ok === true && readRes.exists === false && readRes.state === null;

      // evaluateToken and getLicenseStatus should verify the token cryptographically
      const statusAfterDeletion = licenseManager.getLicenseStatus(fixture.storagePaths);

      // Upon successful validation, it should gracefully self-heal the state and set ACTIVE
      const selfHealed = fs.existsSync(secPath);

      recordTestResult(
        'TEST D.1: Secure State Missing Status on Read',
        'ok=true && exists=false && state=null',
        `ok=${readRes.ok} && exists=${readRes.exists} && state=${readRes.state}`,
        isMissingRecorded,
        'licenseSecurityStore.readSecureState',
        'Read reports clean absence without throwing exception'
      );

      recordTestResult(
        'TEST D.2: Self-Healing & Active Validation on State Deletion',
        'status=ACTIVE && selfHealed=true',
        `status=${statusAfterDeletion.status} && selfHealed=${selfHealed}`,
        statusAfterDeletion.status === 'ACTIVE' && selfHealed,
        'licenseManager.getLicenseStatus auto-healing',
        'Valid cryptographic Ed25519 token was honored and secure state was automatically re-initialized'
      );
    } finally {
      fixture.cleanup();
    }
  }

  // =========================================================================
  // TEST E: Process Termination & Restart Persistence
  // =========================================================================
  console.log('\n--- Running TEST E: Process Termination & Restart Persistence ---');
  {
    const fixture = createIsolatedTestDir('test_e');
    try {
      const token = createSignedTestToken({
        licenseId: 'GYM-RESTART-TEST',
      });
      licenseManager.saveTokenAtomically(fixture.storagePaths, token);

      // Run child process to simulate initial run and process termination
      const scriptCode1 = `
        const lm = require('./desktop/licenseManager.cjs');
        const paths = { configDir: '${fixture.dir}' };
        const status = lm.getLicenseStatus(paths);
        if (status.status !== 'ACTIVE') process.exit(1);
        process.exit(0);
      `;

      const run1 = spawnSync('node', ['-e', scriptCode1], { cwd: path.resolve(__dirname, '..') });
      const process1Ok = run1.status === 0;

      // Spawn a fresh new Node.js process (clean memory heap, completely fresh execution)
      const scriptCode2 = `
        const lm = require('./desktop/licenseManager.cjs');
        const sec = require('./desktop/licenseSecurityStore.cjs');
        const paths = { configDir: '${fixture.dir}' };
        const status = lm.getLicenseStatus(paths);
        const fp = lm.getDeviceFingerprint();
        const secRes = sec.readSecureState(paths, fp);
        const valid = status.status === 'ACTIVE' && secRes.ok && secRes.state?.licenseId === 'GYM-RESTART-TEST';
        process.exit(valid ? 0 : 2);
      `;

      const run2 = spawnSync('node', ['-e', scriptCode2], { cwd: path.resolve(__dirname, '..') });
      const process2Ok = run2.status === 0;

      recordTestResult(
        'TEST E: Process Termination & Cold Restart Persistence',
        'Clean exit 0 on fresh process start',
        `Process1 exit=${run1.status}, Process2 exit=${run2.status}`,
        process1Ok && process2Ok,
        'licenseManager.getLicenseStatus & validateStartupLicense across process boundary',
        'Secure state and activation persisted across independent OS processes'
      );
    } finally {
      fixture.cleanup();
    }
  }

  // =========================================================================
  // TEST F: Real Offline Expiration (Future vs Past)
  // =========================================================================
  console.log('\n--- Running TEST F: Real Offline Expiration ---');
  {
    const fixtureF1 = createIsolatedTestDir('test_f1');
    const fixtureF2 = createIsolatedTestDir('test_f2');
    try {
      // F1: Future expiration (+60 days) -> Startup validation offline must be ACTIVE
      const futureToken = createSignedTestToken({
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      });
      licenseManager.saveTokenAtomically(fixtureF1.storagePaths, futureToken);

      // Offline startup check with skipOnlineCheck: true
      const startupFuture = await licenseManager.validateStartupLicense(
        fixtureF1.storagePaths,
        null,
        { skipOnlineCheck: true }
      );

      recordTestResult(
        'TEST F.1: Offline Startup with Future Expiration (+60d)',
        'ACTIVE (isOfflineValid=true)',
        `${startupFuture.status} (isOfflineValid=${startupFuture.isOfflineValid})`,
        startupFuture.status === 'ACTIVE' && startupFuture.isOfflineValid === true,
        'licenseManager.validateStartupLicense',
        'Offline entry granted for cryptographically valid token'
      );

      // F2: Past expiration (-5 days) -> Startup validation offline must be EXPIRED
      const pastToken = createSignedTestToken({
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      });
      licenseManager.saveTokenAtomically(fixtureF2.storagePaths, pastToken);

      const startupPast = await licenseManager.validateStartupLicense(
        fixtureF2.storagePaths,
        null,
        { skipOnlineCheck: true }
      );

      recordTestResult(
        'TEST F.2: Offline Startup with Past Expiration (-5d)',
        'EXPIRED (isOfflineValid=false)',
        `${startupPast.status} (isOfflineValid=${startupPast.isOfflineValid})`,
        startupPast.status === 'EXPIRED' && startupPast.isOfflineValid === false,
        'licenseManager.validateStartupLicense',
        'Offline entry strictly blocked for expired token'
      );
    } finally {
      fixtureF1.cleanup();
      fixtureF2.cleanup();
    }
  }

  // =========================================================================
  // Final Report Formatting
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST RESULTS REPORT');
  console.log('='.repeat(70));

  let allPassed = true;
  for (const r of testResults) {
    const mark = r.pass ? '✅ PASS' : '❌ FAIL';
    if (!r.pass) allPassed = false;
    console.log(`\n[${mark}] ${r.testName}`);
    console.log(`   Expected:           ${r.expected}`);
    console.log(`   Actual:             ${r.actual}`);
    console.log(`   Production Function: ${r.productionFunction}`);
    if (r.notes) console.log(`   Notes:              ${r.notes}`);
  }

  console.log('\n' + '-'.repeat(70));
  const total = testResults.length;
  const passed = testResults.filter((r) => r.pass).length;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('='.repeat(70));

  if (!allPassed) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
