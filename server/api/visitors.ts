import type { IncomingMessage, ServerResponse } from 'http';
import { handleVisitors, sendJsonResponse } from '../apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await handleVisitors(req, res);
  } catch (err: any) {
    console.error('[API visitors unhandled error]:', err);
    sendJsonResponse(res, 500, { success: false, error: err?.message || 'Server error' });
  }
}
