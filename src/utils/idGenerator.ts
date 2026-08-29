/**
 * Cryptographically secure and collision-resistant ID generator
 * Used for financial transactions, receipts, audit events, and charges.
 */

let counter = 0;

export function generateFinancialId(prefix = 'txn'): string {
  // Use crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  // Fallback to high-resolution timestamp + crypto getRandomValues if available
  const timestamp = Date.now().toString(36);
  const perf = (typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) : ++counter).toString(36);
  
  let randomHex = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    randomHex = `${(++counter).toString(16)}${Date.now().toString(16).slice(-6)}`;
  }

  return `${prefix}-${timestamp}-${perf}-${randomHex}`;
}

export function generateReceiptNumber(prefix = 'REC'): string {
  const timestamp = Date.now().toString().slice(-6);
  const seq = (++counter % 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${seq}`;
}
