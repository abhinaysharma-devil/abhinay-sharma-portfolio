import type { IncomingMessage, ServerResponse } from 'http';
import { handleVerify } from '../../server/apiHandler';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handleVerify(req, res);
}
