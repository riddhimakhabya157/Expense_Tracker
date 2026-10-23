import { Router } from 'express';
import { getDb, DB_PATH } from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    // Test database query
    const row = db.prepare('SELECT 1 AS ok').get();
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM transactions').get();

    return res.status(200).json({
      status: 'healthy',
      service: 'Expense Tracker REST API',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: row && row.ok === 1 ? 'connected' : 'error',
        path: DB_PATH,
        persistedTransactions: Number(countRow.count || 0),
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: 'unhealthy',
      error: 'Database check failed',
      details: err.message,
    });
  }
});

export default router;
