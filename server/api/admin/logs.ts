import type { IncomingMessage, ServerResponse } from 'http';
import { handleLogs, sendJsonResponse } from '../../apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await handleLogs(req, res);
  } catch (err: any) {
    console.error('[API admin/logs unhandled error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
