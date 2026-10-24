import type { IncomingMessage, ServerResponse } from 'http';
import { handleLogs } from '../../server/apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleLogs(req, res);
}
