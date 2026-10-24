import type { IncomingMessage, ServerResponse } from 'http';
import { handleStatus } from '../../server/apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleStatus(req, res);
}
