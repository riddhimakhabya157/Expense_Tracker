import { Router } from 'express';
import { getDb } from '../database.js';
import {
  validateTransactionInput,
  validateQueryParams,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '../validators/transactionValidator.js';

const router = Router();

/**
 * GET /api/transactions/categories
 * Returns allowed categories for client-side forms and filters
 */
router.get('/categories', (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      income: INCOME_CATEGORIES,
      expense: EXPENSE_CATEGORIES,
    },
  });
});

/**
 * GET /api/transactions
 * Returns paginated, searchable, filterable transactions
 */
router.get('/', (req, res, next) => {
  try {
    const queryValidation = validateQueryParams(req.query);
    if (!queryValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: queryValidation.errors,
      });
    }

    const { type, category, search, page, limit, sortBy, order } = queryValidation.params;
    const db = getDb();

    // Build SQL query safely with parameterized values
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(title LIKE ? OR notes LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countSql = `SELECT COUNT(*) AS total FROM transactions ${whereClause}`;
    const countRow = db.prepare(countSql).get(...params);
    const totalRecords = Number(countRow.total || 0);
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const offset = (page - 1) * limit;

    // Retrieve records with deterministic ordering
    const listSql = `
      SELECT id, title, amount_paise, type, category, transaction_date, notes, created_at
      FROM transactions
      ${whereClause}
      ORDER BY ${sortBy} ${order}, id ${order}
      LIMIT ? OFFSET ?
    `;

    const rows = db.prepare(listSql).all(...params, limit, offset);

    // Format output with amount_rupees
    const formattedTransactions = rows.map((row) => ({
      ...row,
      id: Number(row.id),
      amount_paise: Number(row.amount_paise),
      amount_rupees: (Number(row.amount_paise) / 100).toFixed(2),
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          totalRecords,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/transactions/:id
 * Returns a single transaction by ID
 */
router.get('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID format; must be a positive integer',
      });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

    if (!row) {
      return res.status(404).json({
        success: false,
        error: `Transaction with ID ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...row,
        id: Number(row.id),
        amount_paise: Number(row.amount_paise),
        amount_rupees: (Number(row.amount_paise) / 100).toFixed(2),
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/transactions
 * Creates a new transaction after server-side validation
 */
router.post('/', (req, res, next) => {
  try {
    const validation = validateTransactionInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const { title, amount_paise, type, category, transaction_date, notes } = validation.normalized;
    const db = getDb();

    const insertSql = `
      INSERT INTO transactions (title, amount_paise, type, category, transaction_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertSql).run(
      title,
      amount_paise,
      type,
      category,
      transaction_date,
      notes || null
    );

    const newId = Number(result.lastInsertRowid);
    const createdRow = db.prepare('SELECT * FROM transactions WHERE id = ?').get(newId);

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        ...createdRow,
        id: Number(createdRow.id),
        amount_paise: Number(createdRow.amount_paise),
        amount_rupees: (Number(createdRow.amount_paise) / 100).toFixed(2),
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/transactions/:id
 * Deletes an existing transaction
 */
router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction ID format; must be a positive integer',
      });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, title, amount_paise, type FROM transactions WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Transaction with ID ${id} not found`,
      });
    }

    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {
        id,
      },
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/transactions/seed-demo
 * Optional helper to seed realistic starter transactions if requested by the user
 */
router.post('/seed-demo', (req, res, next) => {
  try {
    const db = getDb();
    const countRow = db.prepare('SELECT COUNT(*) AS total FROM transactions').get();
    
    // Only seed if empty or forced
    if (Number(countRow.total) > 0 && !req.query.force) {
      return res.status(200).json({
        success: true,
        message: 'Database already contains transactions; seeding skipped',
        persistedRecords: Number(countRow.total),
      });
    }

    const sampleTransactions = [
      { title: 'Tech Consultancy Stipend', amount_paise: 7500000, type: 'income', category: 'Salary', transaction_date: '2026-10-01', notes: 'Monthly recurring direct deposit' },
      { title: 'Web App Freelance Milestone', amount_paise: 2800000, type: 'income', category: 'Freelance', transaction_date: '2026-10-05', notes: 'Client UI sprint payment' },
      { title: 'Apartment Monthly Rent', amount_paise: 2200000, type: 'expense', category: 'Housing', transaction_date: '2026-10-02', notes: 'Electronic transfer' },
      { title: 'Supermarket Groceries', amount_paise: 540000, type: 'expense', category: 'Food', transaction_date: '2026-10-08', notes: 'Weekly organic produce & supplies' },
      { title: 'High-Speed Fiber Internet', amount_paise: 149900, type: 'expense', category: 'Bills and Utilities', transaction_date: '2026-10-10', notes: 'Broadband bill' },
      { title: 'Metro Transit Monthly Pass', amount_paise: 120000, type: 'expense', category: 'Transport', transaction_date: '2026-10-12', notes: 'Commute smart card recharge' },
      { title: 'Dividend Distribution', amount_paise: 350000, type: 'income', category: 'Investment', transaction_date: '2026-10-15', notes: 'Index fund Q3 payout' },
      { title: 'Ergonomic Desk Chair', amount_paise: 890000, type: 'expense', category: 'Shopping', transaction_date: '2026-10-18', notes: 'Home workspace upgrade' },
      { title: 'Annual Medical Health Screening', amount_paise: 250000, type: 'expense', category: 'Healthcare', transaction_date: '2026-10-20', notes: 'Routine diagnostic checkup' },
    ];

    const insertStmt = db.prepare(`
      INSERT INTO transactions (title, amount_paise, type, category, transaction_date, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of sampleTransactions) {
      insertStmt.run(item.title, item.amount_paise, item.type, item.category, item.transaction_date, item.notes);
    }

    return res.status(201).json({
      success: true,
      message: `Seeded ${sampleTransactions.length} sample transactions`,
      count: sampleTransactions.length,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
