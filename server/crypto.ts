import crypto from 'crypto';

const DEFAULT_SECRET = 'abhinay-portfolio-secure-e2e-encryption-key-2026';

export function getEncryptionKey(): Buffer {
  const secret =
    process.env.API_SECRET_KEY ||
    process.env.VITE_API_SECRET_KEY ||
    process.env.ENCRYPTION_SECRET ||
    DEFAULT_SECRET;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts an arbitrary object or string using AES-256-GCM.
 * Packed format: [12 bytes IV][16 bytes Auth Tag][Ciphertext] -> Base64
 */
export function encryptPayload(data: any): string {
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const enc = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, tag, enc]);
  return combined.toString('base64');
}

/**
 * Decrypts an AES-256-GCM packed Base64 payload.
 */
export function decryptPayload<T = any>(base64Str: string): T {
  const key = getEncryptionKey();
  const buf = Buffer.from(base64Str, 'base64');

  if (buf.length < 28) {
    throw new Error('Invalid encrypted payload: too short');
  }

  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted as unknown as T;
  }
}
