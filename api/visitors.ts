import type { IncomingMessage, ServerResponse } from 'http';
import { handleVisitors } from '../server/apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleVisitors(req, res);
}
