import type { IncomingMessage, ServerResponse } from 'http';
import { handleVerify, sendJsonResponse } from '../../apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await handleVerify(req, res);
  } catch (err: any) {
    console.error('[API admin/verify unhandled error]:', err);
    sendJsonResponse(res, 500, { success: false, message: err?.message || 'Server error' });
  }
}
