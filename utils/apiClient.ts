import { encryptClientData, decryptClientData } from './crypto';

export interface SecureApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Transparently encrypts outgoing request payloads and decrypts incoming response payloads.
 */
export async function secureApiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<SecureApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  headers.set('x-encrypted-payload', 'true');

  let body = options.body;

  // If body is present and not already encrypted, encrypt it
  if (body) {
    let rawPayload = body;
    if (typeof body === 'string') {
      try {
        rawPayload = JSON.parse(body);
      } catch {
        rawPayload = body;
      }
    }

    try {
      const encryptedBase64 = await encryptClientData(rawPayload);
      body = JSON.stringify({
        encrypted: true,
        payload: encryptedBase64,
      });
      headers.set('Content-Type', 'application/json');
    } catch (err) {
      console.warn('[SecureClient] Encryption fallback to plain request:', err);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
  });

  let responseData: any = null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = await res.json();
    if (json && json.encrypted === true && typeof json.payload === 'string') {
      try {
        responseData = await decryptClientData<T>(json.payload);
      } catch (err) {
        console.error('[SecureClient] Failed to decrypt response payload:', err);
        responseData = json;
      }
    } else {
      responseData = json;
    }
  } else {
    responseData = await res.text();
  }

  return {
    ok: res.ok,
    status: res.status,
    data: responseData,
  };
}
