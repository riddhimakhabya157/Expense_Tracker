import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './server/src/app.js';
import { initDatabase, DB_PATH } from './server/src/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('='.repeat(60));
  console.log('Initializing Expense Tracker Full-Stack Application...');
  console.log('='.repeat(60));

  // 1. Initialize persistent SQLite database
  initDatabase();
  console.log(`[DB] Connected to SQLite database at: ${DB_PATH}`);

  const app = express();
  const apiApp = createApp();

  // 2. Mount API routes (/api/health, /api/summary, /api/transactions)
  app.use(apiApp);

  const isProduction = process.env.NODE_ENV === 'production';
  const UI_PORT = 3000;

  // 3. Mount Vite middlewares in development or static dist in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  // 4. Start main server on port 3000
  app.listen(UI_PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Full-Stack App running on http://0.0.0.0:${UI_PORT}`);
    console.log(`         Frontend UI:     http://localhost:${UI_PORT}`);
    console.log(`         API Health:      http://localhost:${UI_PORT}/api/health`);
    console.log(`         Transactions:    http://localhost:${UI_PORT}/api/transactions`);
    console.log(`         Summary:         http://localhost:${UI_PORT}/api/summary`);
  });

  // 5. Also bind dedicated API listener on port 8080 if available (for localhost:8080 requirements)
  try {
    const dedicatedApiServer = apiApp.listen(8080, '0.0.0.0', () => {
      console.log(`[BACKEND] Dedicated REST API listening on: http://localhost:8080`);
      console.log(`          Health Endpoint:                 http://localhost:8080/api/health`);
    });

    dedicatedApiServer.on('error', () => {
      // If port 8080 is blocked by environment container proxy, port 3000 handles all /api traffic seamlessly
    });
  } catch {}
}

startServer().catch((err) => {
  console.error('[FATAL ERROR IN APPLICATION SERVER]', err);
  process.exit(1);
});
