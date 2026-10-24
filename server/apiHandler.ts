import { IncomingMessage, ServerResponse } from 'http';
import {
  recordVisitorLog,
  getVisitorLogsAndStats,
  getAdminPassword,
  generateAdminToken,
  verifyAdminToken,
  clearAllLogs,
} from './visitorService';
import { testMongoConnection, isMongoConfigured } from './db';
import { encryptPayload, decryptPayload } from './crypto';

export interface ExtendedIncomingMessage extends IncomingMessage {
  isClientEncrypted?: boolean;
  body?: any;
}

/**
 * Safely parse JSON body from incoming request.
 * Compatible with Vercel serverless (where req.body is already parsed)
 * and Connect/Vite dev server (where req is a stream).
 */
export async function parseJsonBody(req: ExtendedIncomingMessage): Promise<any> {
  // 1. If req.body is already parsed by Vercel or Express
  if (typeof req.body !== 'undefined' && req.body !== null) {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // Keep as string
      }
    }
    if (body && body.encrypted === true && typeof body.payload === 'string') {
      req.isClientEncrypted = true;
      try {
        return decryptPayload(body.payload);
      } catch (err: any) {
        console.error('[API] Decryption failure on pre-parsed body:', err.message);
        return { __decryptionError: true };
      }
    }
    return body;
  }

  // 2. If stream has already ended without req.body
  if ((req as any).readableEnded || (req as any).complete) {
    return {};
  }

  // 3. Read stream with safety timeout (prevents hanging on serverless)
  return new Promise((resolve) => {
    let data = '';
    let isDone = false;

    const timer = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        resolve({});
      }
    }, 2000);

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      try {
        const parsed = data ? JSON.parse(data) : {};
        if (parsed && parsed.encrypted === true && typeof parsed.payload === 'string') {
          req.isClientEncrypted = true;
          try {
            const decrypted = decryptPayload(parsed.payload);
            resolve(decrypted);
          } catch (err: any) {
            console.error('[API] Decryption failure:', err.message);
            resolve({ __decryptionError: true });
          }
        } else {
          resolve(parsed);
        }
      } catch {
        resolve({});
      }
    });

    req.on('error', () => {
      if (isDone) return;
      isDone = true;
      clearTimeout(timer);
      resolve({});
    });
  });
}

/**
 * Send JSON response, supporting both Vercel Serverless (res.status().json())
 * and standard Node.js http.ServerResponse.
 */
export function sendJsonResponse(
  res: ServerResponse,
  statusCode: number,
  data: any,
  encrypt: boolean = false
) {
  let responseBody: any = data;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-admin-token, x-admin-password, x-encrypted-payload',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  if (encrypt) {
    try {
      const encryptedBase64 = encryptPayload(data);
      responseBody = {
        encrypted: true,
        payload: encryptedBase64,
      };
      headers['x-encrypted-payload'] = 'true';
    } catch (err: any) {
      console.error('[API] Response encryption error:', err.message);
    }
  }

  // Set headers
  for (const [k, v] of Object.entries(headers)) {
    try {
      res.setHeader(k, v);
    } catch {
      // Fallback if setHeader not available
    }
  }

  // If Vercel/Express response helper exists
  try {
    if (typeof (res as any).status === 'function' && typeof (res as any).json === 'function') {
      (res as any).status(statusCode).json(responseBody);
      return;
    }
  } catch (err) {
    // Fallback to native http.ServerResponse
  }

  const json = JSON.stringify(responseBody);
  try {
    res.statusCode = statusCode;
  } catch {}
  res.end(json);
}

export function extractAuthToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const tokenHeader = req.headers['x-admin-token'];
  if (tokenHeader && typeof tokenHeader === 'string') {
    return tokenHeader.trim();
  }
  return null;
}

/**
 * Dedicated handler for /api/admin/verify
 */
export async function handleVerify(req: ExtendedIncomingMessage, res: ServerResponse) {
  const method = req.method?.toUpperCase();
  if (method === 'OPTIONS') {
    sendJsonResponse(res, 204, {});
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const wantsEncryption =
      req.headers['x-encrypted-payload'] === 'true' || Boolean(req.isClientEncrypted);

    if (body?.__decryptionError) {
      sendJsonResponse(res, 400, { success: false, message: 'Decryption failed' }, false);
      return;
    }

    const expectedPassword = getAdminPassword();
    const enteredPassword = body?.password;

    if (!enteredPassword || enteredPassword !== expectedPassword) {
      sendJsonResponse(
        res,
        401,
        {
          success: false,
          message: 'Invalid password. Please check your credentials.',
        },
        wantsEncryption
      );
      return;
    }

    const token = generateAdminToken();
    sendJsonResponse(
      res,
      200,
      {
        success: true,
        message: 'Authenticated successfully',
        token,
      },
      wantsEncryption
    );
  } catch (err: any) {
    console.error('[API handleVerify error]:', err);
    sendJsonResponse(res, 500, { success: false, message: err.message || 'Server error' }, false);
  }
}

/**
 * Dedicated handler for /api/visitors
 */
export async function handleVisitors(req: ExtendedIncomingMessage, res: ServerResponse) {
  const method = req.method?.toUpperCase();
  if (method === 'OPTIONS') {
    sendJsonResponse(res, 204, {});
    return;
  }

  try {
    const body = await parseJsonBody(req);
    const wantsEncryption =
      req.headers['x-encrypted-payload'] === 'true' || Boolean(req.isClientEncrypted);

    if (body?.__decryptionError) {
      sendJsonResponse(res, 400, { success: false, error: 'Decryption failed' }, false);
      return;
    }

    const socketIp = req.socket?.remoteAddress;
    const result = await recordVisitorLog(body || {}, req.headers, socketIp);
    sendJsonResponse(res, 200, result, wantsEncryption);
  } catch (err: any) {
    console.error('[API handleVisitors error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, false);
  }
}

/**
 * Dedicated handler for /api/admin/logs
 */
export async function handleLogs(req: ExtendedIncomingMessage, res: ServerResponse) {
  const method = req.method?.toUpperCase();
  if (method === 'OPTIONS') {
    sendJsonResponse(res, 204, {});
    return;
  }

  const wantsEncryption = req.headers['x-encrypted-payload'] === 'true';

  try {
    const token = extractAuthToken(req);
    if (!verifyAdminToken(token)) {
      sendJsonResponse(
        res,
        401,
        {
          success: false,
          message: 'Unauthorized. Admin session expired or invalid.',
        },
        wantsEncryption
      );
      return;
    }

    if (method === 'DELETE') {
      const result = await clearAllLogs();
      sendJsonResponse(
        res,
        200,
        {
          success: true,
          message: `Cleared ${result.count} visitor records.`,
        },
        wantsEncryption
      );
      return;
    }

    // GET logs
    const url = req.url || '';
    const searchParams = new URL(url, 'http://localhost').searchParams;
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const data = await getVisitorLogsAndStats(limit);
    const mongoStatus = await testMongoConnection();

    sendJsonResponse(
      res,
      200,
      {
        success: true,
        logs: data.logs,
        stats: data.stats,
        dbConnected: mongoStatus.connected,
        dbMessage: mongoStatus.message,
        isMongo: data.isMongo,
      },
      wantsEncryption
    );
  } catch (err: any) {
    console.error('[API handleLogs error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
  }
}

/**
 * Dedicated handler for /api/admin/status
 */
export async function handleStatus(req: ExtendedIncomingMessage, res: ServerResponse) {
  const method = req.method?.toUpperCase();
  if (method === 'OPTIONS') {
    sendJsonResponse(res, 204, {});
    return;
  }

  const wantsEncryption = req.headers['x-encrypted-payload'] === 'true';

  try {
    const token = extractAuthToken(req);
    const isAuthenticated = verifyAdminToken(token);
    const mongoStatus = await testMongoConnection();
    sendJsonResponse(
      res,
      200,
      {
        success: true,
        isAuthenticated,
        isMongoConfigured: isMongoConfigured(),
        dbConnected: mongoStatus.connected,
        dbMessage: mongoStatus.message,
      },
      wantsEncryption
    );
  } catch (err: any) {
    console.error('[API handleStatus error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
  }
}

/**
 * Universal dispatcher (used by Vite dev server plugin)
 */
export async function handleApiRequest(
  req: ExtendedIncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || '';
  const pathname = url.split('?')[0];
  const method = req.method?.toUpperCase();

  if (method === 'OPTIONS') {
    sendJsonResponse(res, 204, {});
    return true;
  }

  if (pathname === '/api/visitors' || pathname.endsWith('/visitors')) {
    await handleVisitors(req, res);
    return true;
  }

  if (pathname === '/api/admin/verify' || pathname.endsWith('/admin/verify')) {
    await handleVerify(req, res);
    return true;
  }

  if (pathname === '/api/admin/status' || pathname.endsWith('/admin/status')) {
    await handleStatus(req, res);
    return true;
  }

  if (pathname === '/api/admin/logs' || pathname.endsWith('/admin/logs')) {
    await handleLogs(req, res);
    return true;
  }

  return false;
}
