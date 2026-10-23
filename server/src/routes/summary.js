import { Router } from 'express';
import { getDb } from '../database.js';
import { getFinancialSummary } from '../services/summaryService.js';

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const summary = getFinancialSummary(db);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
