import { Plugin } from 'vite';
import { handleApiRequest } from './apiHandler';

export function visitorApiPlugin(): Plugin {
  return {
    name: 'visitor-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const handled = await handleApiRequest(req, res);
          if (handled) return;
        }
        next();
      });
    },
  };
}
