import 'dotenv/config';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDatabase } from './server/config/db.ts';
import { createApiApp } from './server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const dbReady = connectDatabase().catch((err) => {
    console.error('[Database] Initialization failed:', err);
    throw err;
  });

  const app = createApiApp(dbReady);
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : NaN;
  const port = Number.isFinite(cliPort) && cliPort > 0 ? cliPort : 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Hospital Ward Alert Dispatcher running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
