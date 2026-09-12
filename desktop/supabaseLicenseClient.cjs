/**
 * Gym OS - Supabase Remote Licensing Client
 * Invokes remote Supabase Edge Functions with standard HTTPS POST.
 * 
 * SECURITY DIRECTIVE:
 * NEVER uses, imports, or contains the service-role key or private signing key.
 * Strictly communicates using public SUPABASE_URL and SUPABASE_ANON_KEY only.
 */

const https = require('https');
const http = require('http');

function postJson(urlStr, headers, body, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const postData = JSON.stringify(body);
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...headers,
        },
        timeout: timeoutMs,
      };

      const req = client.request(options, (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: { error: 'Invalid JSON response from server', raw: rawData },
            });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('NETWORK_TIMEOUT'));
      });

      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function getFriendlyErrorMessage(errorCode, serverMessage) {
  switch (errorCode) {
    case 'INVALID_LICENSE':
      return serverMessage || 'کد لایسنس نامعتبر است یا در سامانه یافت نشد.';
    case 'EXPIRED_LICENSE':
    case 'EXPIRED':
      return serverMessage || 'اعتبار لایسنس این نرم‌افزار به پایان رسیده است.';
    case 'REVOKED_LICENSE':
    case 'REVOKED':
      return serverMessage || 'لایسنس این نرم‌افزار توسط مدیریت لغو شده است.';
    case 'DEVICE_LIMIT_REACHED':
      return serverMessage || 'سقف مجاز تعداد دستگاه‌های فعال برای این لایسنس تکمیل شده است. برای انتقال به دستگاه جدید از کد بازیابی استفاده کنید.';
    case 'DEVICE_MISMATCH':
      return serverMessage || 'شناسه سخت‌افزاری با سیستم فعال‌شده مطابقت ندارد.';
    case 'INVALID_RECOVERY_CODE':
      return serverMessage || 'کد بازیابی سخت‌افزار نامعتبر است یا قبلاً استفاده شده است.';
    default:
      return serverMessage || 'عملیات اعتبارسنجی لایسنس توسط سرور پذیرفته نشد.';
  }
}

/**
 * Authoritatively verifies current license status against Supabase Edge Function.
 * Uses a short timeout (e.g. 4000ms) for startup validation to avoid freezing during network degradation.
 * Distinguishes network unavailability (offline fallback) from authoritative REVOKED/EXPIRED status.
 */
async function checkLicenseStatus(licenseKey, deviceFingerprint, options = {}) {
  const rawUrl = options.supabaseUrl !== undefined ? options.supabaseUrl : process.env.SUPABASE_URL;
  const rawKey = options.supabaseAnonKey !== undefined ? options.supabaseAnonKey : process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const anonKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 4000;

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      status: 'OFFLINE_FALLBACK',
      isNetworkError: true,
      error: 'SERVER_UNCONFIGURED',
      code: 'SERVER_UNCONFIGURED',
      message: 'آدرس سرور لایسنس Supabase تنظیم نشده است.',
    };
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/activate-license`;
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    const response = await postJson(endpoint, headers, {
      licenseKey,
      hardwareFingerprint: deviceFingerprint,
      action: 'verify',
    }, timeoutMs);

    const resData = response.data || {};
    const errorCode = resData.code || resData.error;

    // 1. Authoritative REVOKED check
    if (
      errorCode === 'REVOKED_LICENSE' ||
      errorCode === 'REVOKED' ||
      resData.status === 'REVOKED' ||
      (typeof resData.error === 'string' && (resData.error.includes('Revoked') || resData.error.includes('لغو')))
    ) {
      return {
        success: false,
        status: 'REVOKED',
        error: 'REVOKED_LICENSE',
        code: 'REVOKED_LICENSE',
        isNetworkError: false,
        message: 'لایسنس این نرم‌افزار توسط مدیریت لغو شده است.',
      };
    }

    // 2. Authoritative EXPIRED check
    if (
      errorCode === 'EXPIRED_LICENSE' ||
      errorCode === 'EXPIRED' ||
      resData.status === 'EXPIRED' ||
      (typeof resData.error === 'string' && (resData.error.includes('منقضی') || resData.error.includes('پایان')))
    ) {
      return {
        success: false,
        status: 'EXPIRED',
        error: 'EXPIRED_LICENSE',
        code: 'EXPIRED_LICENSE',
        isNetworkError: false,
        message: 'اعتبار لایسنس این نرم‌افزار به پایان رسیده است.',
      };
    }

    // 3. Authoritative ACTIVE confirmation
    if (response.statusCode === 200 && (resData.success || resData.status === 'ACTIVE')) {
      return {
        success: true,
        status: 'ACTIVE',
        token: resData.token,
        licenseInfo: resData.licenseInfo,
        message: 'لایسنس معتبر و فعال است',
      };
    }

    // 4. Device Mismatch check
    if (errorCode === 'DEVICE_MISMATCH') {
      return {
        success: false,
        status: 'DEVICE_MISMATCH',
        error: 'DEVICE_MISMATCH',
        code: 'DEVICE_MISMATCH',
        isNetworkError: false,
        message: resData.error || 'این سیستم با دستگاه‌های ثبت‌شده لایسنس مطابقت ندارد.',
      };
    }

    // Other authoritative rejection from server
    return {
      success: false,
      status: 'UNACTIVATED',
      error: errorCode || 'INVALID_LICENSE',
      code: errorCode || 'INVALID_LICENSE',
      isNetworkError: false,
      message: getFriendlyErrorMessage(errorCode, resData.error),
    };
  } catch (err) {
    // Network timeout, connection refused, DNS resolution error, or offline
    return {
      success: false,
      status: 'OFFLINE_FALLBACK',
      isNetworkError: true,
      error: err && err.message === 'NETWORK_TIMEOUT' ? 'NETWORK_TIMEOUT' : 'NETWORK_ERROR',
      code: 'NETWORK_ERROR',
      message: 'عدم دسترسی به سرور لایسنس (حالت آفلاین)',
    };
  }
}

/**
 * Executes remote online activation against Supabase Edge Function
 */
async function processActivation(licenseKey, deviceFingerprint, options = {}) {
  const rawUrl = options.supabaseUrl !== undefined ? options.supabaseUrl : process.env.SUPABASE_URL;
  const rawKey = options.supabaseAnonKey !== undefined ? options.supabaseAnonKey : process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const anonKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      error: 'SERVER_UNCONFIGURED',
      code: 'SERVER_UNCONFIGURED',
      message: 'آدرس سرور لایسنس Supabase تنظیم نشده است.',
    };
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/activate-license`;
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    const response = await postJson(endpoint, headers, {
      licenseKey,
      hardwareFingerprint: deviceFingerprint,
      deviceName: options.deviceName || 'Windows Workstation',
    });

    if (response.statusCode === 200 && response.data.success) {
      return {
        success: true,
        token: response.data.token,
        message: response.data.message || 'لایسنس با موفقیت فعال و به این سیستم متصل شد',
        licenseInfo: response.data.licenseInfo,
      };
    }

    const errorCode = response.data.code || (
      response.statusCode === 404 ? 'INVALID_LICENSE' :
      response.statusCode === 409 ? 'DEVICE_LIMIT_REACHED' : 'ACTIVATION_REJECTED'
    );

    return {
      success: false,
      error: errorCode,
      code: errorCode,
      message: getFriendlyErrorMessage(errorCode, response.data.error),
      maxDevices: response.data.maxDevices,
      activeDevicesCount: response.data.activeDevicesCount,
      boundDeviceMasked: response.data.boundDeviceMasked,
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      code: 'NETWORK_ERROR',
      message: 'برقراری ارتباط با سرور لایسنس امکان‌پذیر نیست. اتصال اینترنت خود را بررسی کنید یا از فعالسازی اضطراری آفلاین استفاده نمایید.',
    };
  }
}

/**
 * Executes remote authorized recovery against Supabase Edge Function
 */
async function processRecovery(licenseKey, recoveryCode, newHardwareFingerprint, options = {}) {
  const rawUrl = options.supabaseUrl !== undefined ? options.supabaseUrl : process.env.SUPABASE_URL;
  const rawKey = options.supabaseAnonKey !== undefined ? options.supabaseAnonKey : process.env.SUPABASE_ANON_KEY;
  const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  const anonKey = typeof rawKey === 'string' ? rawKey.trim() : '';

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      error: 'SERVER_UNCONFIGURED',
      code: 'SERVER_UNCONFIGURED',
      message: 'آدرس سرور لایسنس Supabase تنظیم نشده است.',
    };
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/recover-license`;
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    const response = await postJson(endpoint, headers, {
      licenseKey,
      recoveryCode,
      newHardwareFingerprint,
      oldHardwareFingerprint: options.oldHardwareFingerprint,
      deviceName: options.deviceName || 'Migrated Workstation',
    });

    if (response.statusCode === 200 && response.data.success) {
      return {
        success: true,
        token: response.data.token,
        newRecoveryCode: response.data.newRecoveryCode,
        message: response.data.message || 'لایسنس با موفقیت بازیابی و به این سیستم جدید متصل شد',
        licenseInfo: response.data.licenseInfo,
      };
    }

    const errorCode = response.data.code || (
      response.statusCode === 404 ? 'INVALID_LICENSE' : 'RECOVERY_REJECTED'
    );

    return {
      success: false,
      error: errorCode,
      code: errorCode,
      message: getFriendlyErrorMessage(errorCode, response.data.error),
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      code: 'NETWORK_ERROR',
      message: 'خطا در ارتباط با سرور بازیابی. لطفاً اتصال اینترنت خود را بررسی نمایید.',
    };
  }
}

module.exports = {
  checkLicenseStatus,
  processActivation,
  processRecovery,
  getFriendlyErrorMessage,
};
