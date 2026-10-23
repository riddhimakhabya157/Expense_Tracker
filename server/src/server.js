import { createApp } from './app.js';
import { initDatabase, DB_PATH } from './database.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('='.repeat(60));
console.log('Starting Expense Tracker REST API Server...');
console.log('='.repeat(60));

try {
  // 1. Initialize SQLite database and ensure tables exist
  console.log(`[DB] Connecting to SQLite database at: ${DB_PATH}`);
  initDatabase();
  console.log('[DB] Database and transactions table verified successfully.');

  // 2. Instantiate Express application
  const app = createApp();

  // 3. Start HTTP server
  const server = app.listen(PORT, HOST, () => {
    console.log(`[HTTP] Express server successfully listening on:`);
    console.log(`       -> Local:    http://localhost:${PORT}`);
    console.log(`       -> Network:  http://${HOST}:${PORT}`);
    console.log(`       -> Health:   http://localhost:${PORT}/api/health`);
    console.log(`       -> API:      http://localhost:${PORT}/api/transactions`);
    console.log(`       -> Summary:  http://localhost:${PORT}/api/summary`);
    console.log('='.repeat(60));
  });

  // Strict port conflict handling: do not silently switch ports
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('\n' + '!'.repeat(70));
      console.error(`[PORT CONFLICT ERROR] Port ${PORT} is already in use by another process!`);
      console.error('The Expense Tracker backend cannot start because port 8080 is blocked.');
      console.error('The server will NOT silently switch to an arbitrary port.');
      console.error('\nHow to resolve this on Windows:');
      console.error(`  1. In PowerShell, find and kill the process using port ${PORT}:`);
      console.error(`     Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force`);
      console.error(`  2. Alternatively, run on a different port by setting PORT in your environment:`);
      console.error(`     $env:PORT="8081"; npm run dev:server`);
      console.error('!'.repeat(70) + '\n');
      process.exit(1);
    } else {
      console.error('[FATAL SERVER ERROR]', err);
      process.exit(1);
    }
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n[SERVER] Shutting down gracefully...');
    server.close(() => {
      console.log('[SERVER] Closed remaining connections. Exiting.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (startupErr) {
  console.error('\n[FATAL STARTUP ERROR]', startupErr.message);
  console.error('Please verify your directory permissions and Node.js LTS version.');
  process.exit(1);
}
