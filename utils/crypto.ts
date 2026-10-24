// Web Crypto API implementation of AES-256-GCM

const DEFAULT_SECRET = 'abhinay-portfolio-secure-e2e-encryption-key-2026';

let cachedCryptoKey: CryptoKey | null = null;

async function getBrowserKey(): Promise<CryptoKey> {
  if (cachedCryptoKey) return cachedCryptoKey;

  const secret =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_SECRET_KEY) ||
    DEFAULT_SECRET;

  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(secret);
  const hash = await window.crypto.subtle.digest('SHA-256', secretBytes);

  cachedCryptoKey = await window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedCryptoKey;
}

/**
 * Encrypts an object or string using AES-256-GCM in the browser.
 * Format: [12 bytes IV][16 bytes Auth Tag][Ciphertext] -> Base64
 */
export async function encryptClientData(data: any): Promise<string> {
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  const key = await getBrowserKey();

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(plainText);

  // Web Crypto encrypt produces [ciphertext][16-byte tag]
  const encryptedAb = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    dataBytes
  );

  const encBytes = new Uint8Array(encryptedAb);
  const ciphertext = encBytes.subarray(0, encBytes.length - 16);
  const tag = encBytes.subarray(encBytes.length - 16);

  // Pack: [12 bytes IV][16 bytes Tag][Ciphertext]
  const combined = new Uint8Array(12 + 16 + ciphertext.length);
  combined.set(iv, 0);
  combined.set(tag, 12);
  combined.set(ciphertext, 28);

  // Convert to Base64
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return window.btoa(binary);
}

/**
 * Decrypts an AES-256-GCM Base64 payload in the browser.
 */
export async function decryptClientData<T = any>(base64Str: string): Promise<T> {
  const key = await getBrowserKey();

  // Decode Base64 to Uint8Array
  const binary = window.atob(base64Str);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  if (combined.length < 28) {
    throw new Error('Encrypted payload too short');
  }

  const iv = combined.subarray(0, 12);
  const tag = combined.subarray(12, 28);
  const ciphertext = combined.subarray(28);

  // Web Crypto decrypt expects [ciphertext][tag]
  const cipherAndTag = new Uint8Array(ciphertext.length + 16);
  cipherAndTag.set(ciphertext, 0);
  cipherAndTag.set(tag, ciphertext.length);

  const decryptedAb = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    cipherAndTag
  );

  const decoder = new TextDecoder();
  const decryptedStr = decoder.decode(decryptedAb);

  try {
    return JSON.parse(decryptedStr);
  } catch {
    return decryptedStr as unknown as T;
  }
}
