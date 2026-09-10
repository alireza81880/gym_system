/**
 * Gym OS - Supabase Remote Licensing Client
 * Invokes remote Supabase Edge Functions with standard HTTPS POST.
 * NEVER uses or requires the service-role key or private signing key.
 * Strictly uses SUPABASE_URL and SUPABASE_ANON_KEY.
 */

const https = require('https');
const http = require('http');

function postJson(urlStr, headers, body) {
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
        timeout: 10000,
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

/**
 * Executes remote online activation against Supabase Edge Function
 */
async function processActivation(licenseKey, deviceFingerprint, options = {}) {
  const supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL;
  const anonKey = options.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      error: 'SERVER_UNCONFIGURED',
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
        message: 'لایسنس با موفقیت فعال و به این سیستم متصل شد',
        licenseInfo: response.data.licenseInfo,
      };
    }

    return {
      success: false,
      error: response.data.code || 'ACTIVATION_REJECTED',
      message: response.data.error || 'فعالسازی لایسنس توسط سرور پذیرفته نشد',
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'برقراری ارتباط با سرور لایسنس امکان‌پذیر نیست. اتصال اینترنت خود را بررسی کنید یا از فعالسازی اضطراری آفلاین استفاده نمایید.',
    };
  }
}

/**
 * Executes remote authorized recovery against Supabase Edge Function
 */
async function processRecovery(licenseKey, recoveryCode, newHardwareFingerprint, options = {}) {
  const supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL;
  const anonKey = options.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      error: 'SERVER_UNCONFIGURED',
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
    });

    if (response.statusCode === 200 && response.data.success) {
      return {
        success: true,
        token: response.data.token,
        message: 'لایسنس با موفقیت بازیابی و به این سیستم جدید متصل شد',
        licenseInfo: response.data.licenseInfo,
      };
    }

    return {
      success: false,
      error: response.data.code || 'RECOVERY_REJECTED',
      message: response.data.error || 'بازیابی لایسنس توسط سرور تأیید نشد',
    };
  } catch (err) {
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'خطا در ارتباط با سرور بازیابی. لطفاً اینترنت خود را بررسی نمایید.',
    };
  }
}

module.exports = {
  processActivation,
  processRecovery,
};
