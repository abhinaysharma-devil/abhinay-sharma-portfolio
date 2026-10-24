import * as esbuild from 'esbuild';

const endpoints = [
  { in: 'server/api/visitors.ts', out: 'api/visitors.js' },
  { in: 'server/api/admin/verify.ts', out: 'api/admin/verify.js' },
  { in: 'server/api/admin/logs.ts', out: 'api/admin/logs.js' },
  { in: 'server/api/admin/status.ts', out: 'api/admin/status.js' },
];

async function buildAll() {
  console.log('[build-api] Bundling Vercel serverless API endpoints...');
  for (const ep of endpoints) {
    await esbuild.build({
      entryPoints: [ep.in],
      outfile: ep.out,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      external: ['mongodb'],
      logLevel: 'info',
    });
    console.log(`[build-api] Bundled ${ep.in} -> ${ep.out}`);
  }
  console.log('[build-api] Done! All API endpoints successfully bundled.');
}

buildAll().catch((err) => {
  console.error('[build-api] Error:', err);
  process.exit(1);
});
