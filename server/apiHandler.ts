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

// Extended type to remember if request was encrypted
export interface ExtendedIncomingMessage extends IncomingMessage {
  isClientEncrypted?: boolean;
}

// Helper to parse JSON body from incoming stream and decrypt if encrypted
export async function parseJsonBody(req: ExtendedIncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
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
    req.on('error', () => resolve({}));
  });
}

// Send response, optionally encrypting payload if requested by client or configured
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

  const json = JSON.stringify(responseBody);
  res.writeHead(statusCode, headers);
  res.end(json);
}

// Extract admin token from headers or query
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

// Main handler for /api/* routes
export async function handleApiRequest(
  req: ExtendedIncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || '';
  const pathname = url.split('?')[0];
  const method = req.method?.toUpperCase();

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, x-admin-token, x-admin-password, x-encrypted-payload',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    });
    res.end();
    return true;
  }

  // Determine if client expects encrypted response
  const wantsEncryption =
    req.headers['x-encrypted-payload'] === 'true' || Boolean(req.isClientEncrypted);

  // 1. POST /api/visitors (Log a visitor)
  if (pathname === '/api/visitors' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      if (body?.__decryptionError) {
        sendJsonResponse(res, 400, { success: false, error: 'Decryption failed' }, false);
        return true;
      }

      const socketIp = req.socket?.remoteAddress;
      const result = await recordVisitorLog(body, req.headers, socketIp);
      sendJsonResponse(res, 200, result, wantsEncryption || req.isClientEncrypted);
    } catch (err: any) {
      sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
    }
    return true;
  }

  // 2. POST /api/admin/verify (Password verification)
  if (pathname === '/api/admin/verify' && method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      if (body?.__decryptionError) {
        sendJsonResponse(res, 400, { success: false, message: 'Decryption failed' }, false);
        return true;
      }

      const expectedPassword = getAdminPassword();
      const enteredPassword = body.password;

      if (!enteredPassword || enteredPassword !== expectedPassword) {
        sendJsonResponse(
          res,
          401,
          {
            success: false,
            message: 'Invalid password. Please check your credentials.',
          },
          wantsEncryption || req.isClientEncrypted
        );
        return true;
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
        wantsEncryption || req.isClientEncrypted
      );
    } catch (err: any) {
      sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
    }
    return true;
  }

  // 3. GET /api/admin/status (Check auth & Mongo connection status)
  if (pathname === '/api/admin/status' && method === 'GET') {
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
      sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
    }
    return true;
  }

  // 4. GET /api/admin/logs (Protected: Fetch visitor logs & aggregated stats)
  if (pathname === '/api/admin/logs' && method === 'GET') {
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
        return true;
      }

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
      sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
    }
    return true;
  }

  // 5. DELETE /api/admin/logs (Protected: Clear logs)
  if (pathname === '/api/admin/logs' && method === 'DELETE') {
    try {
      const token = extractAuthToken(req);
      if (!verifyAdminToken(token)) {
        sendJsonResponse(res, 401, { success: false, message: 'Unauthorized' }, wantsEncryption);
        return true;
      }

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
    } catch (err: any) {
      sendJsonResponse(res, 500, { success: false, error: err.message }, wantsEncryption);
    }
    return true;
  }

  return false;
}
