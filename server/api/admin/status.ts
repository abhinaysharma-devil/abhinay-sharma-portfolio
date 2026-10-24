import type { IncomingMessage, ServerResponse } from 'http';
import { handleStatus, sendJsonResponse } from '../../apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await handleStatus(req, res);
  } catch (err: any) {
    console.error('[API admin/status unhandled error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
