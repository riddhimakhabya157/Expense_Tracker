import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path defaults to server/data/expense_tracker.db
const defaultDbPath = path.resolve(__dirname, '../data/expense_tracker.db');
const DB_FILE_PATH = process.env.DB_PATH || defaultDbPath;

let dbInstance = null;

/**
 * Initializes and returns the SQLite database connection.
 * Creates the persistent data directory and tables if they do not exist.
 */
export function initDatabase(dbFilePath = DB_FILE_PATH) {
  if (dbInstance) {
    return dbInstance;
  }

  const dir = path.dirname(dbFilePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (dirErr) {
    console.error(`[FATAL] Unable to create or access database directory at "${dir}":`, dirErr.message);
    throw new Error(`Database directory creation failed: ${dirErr.message}`);
  }

  try {
    // DatabaseSync is provided out of the box by Node.js 22 LTS with zero compilation or external DLLs!
    dbInstance = new DatabaseSync(dbFilePath);

    // Optimize SQLite with WAL mode and foreign key constraints
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    try {
      dbInstance.exec('PRAGMA journal_mode = WAL;');
    } catch {
      // In some sandbox environments WAL mode might be restricted; standard mode works fine
    }

    // Create transactions table with strict constraints
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL CHECK(length(trim(title)) > 0),
        amount_paise INTEGER NOT NULL CHECK(amount_paise > 0),
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        category TEXT NOT NULL CHECK(length(trim(category)) > 0),
        transaction_date TEXT NOT NULL CHECK(transaction_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    `);

    return dbInstance;
  } catch (err) {
    console.error(`[FATAL] SQLite database initialization failed at "${dbFilePath}":`, err.message);
    throw err;
  }
}

export function getDb() {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDb() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      console.warn('Error closing database:', e.message);
    }
    dbInstance = null;
  }
}

export const DB_PATH = DB_FILE_PATH;
