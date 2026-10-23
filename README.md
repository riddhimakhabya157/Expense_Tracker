# Expense Tracker: Data Persistence & Financial Summaries
**Task 2 — Full-Stack Web Application (Node.js LTS, Express, SQLite, React, Vite)**

A robust, beginner-friendly full-stack Expense Tracker web application engineered with **genuine SQLite database persistence**, **dual-layer independent input validation**, and **mathematically exact financial summaries** represented in integer paise.

Designed for frictionless setup on **Windows with Visual Studio Code and PowerShell**, requiring zero external database services, zero cloud subscriptions, and zero complex C++ compiler installations.

---

## Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Features & Acceptance Criteria](#2-features--acceptance-criteria)
3. [Technology Stack](#3-technology-stack)
4. [Prerequisites & Installation for Windows](#4-prerequisites--installation-for-windows)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Commands to Install Dependencies](#6-commands-to-install-dependencies)
7. [One-Command Startup (`npm run dev`)](#7-one-command-startup-npm-run-dev)
8. [Starting Frontend & Backend Separately](#8-starting-frontend--backend-separately)
9. [Local URLs & Port Configuration](#9-local-urls--port-configuration)
10. [REST API Documentation](#10-rest-api-documentation)
11. [Database Schema & Integer-Paise Monetary Model](#11-database-schema--integer-paise-monetary-model)
12. [Dual-Layer Validation (Client & Server)](#12-dual-layer-validation-client--server)
13. [How Database Persistence Works](#13-how-database-persistence-works)
14. [How to Inspect the SQLite Database](#14-how-to-inspect-the-sqlite-database)
15. [Troubleshooting Guide (Port Conflicts, CORS, DB)](#15-troubleshooting-guide)
16. [Production Build Instructions](#16-production-build-instructions)
17. [Scope: What Is and Is Not Included](#17-scope-what-is-and-is-not-included)
18. [Mandatory Acceptance Test Suite](#18-mandatory-acceptance-test-suite)

---

## 1. Project Overview & Objectives

In modern web development, financial records must never exist solely in volatile client memory (`useState`, `localStorage`) where a browser refresh or session clearing destroys financial history.

This project delivers:
- **Server-Authoritative Summaries**: The dashboard totals (Total Income, Total Expenses, Net Savings) are computed directly by the database using SQL aggregation.
- **Data Persistence**: Transactions are written to disk in a local SQLite database (`server/data/expense_tracker.db`). Stopping and restarting the server leaves every transaction intact.
- **Zero Floating-Point Drift**: Monetary values are stored as safe **integer paise** (1 Rupee = 100 paise), avoiding IEEE-754 binary floating-point rounding errors (e.g., `0.1 + 0.2 === 0.30000000000000004`).
- **Dual-Layer Validation**: Complete validation runs on both the client (for instant UI feedback) and the Express server (to protect data integrity against direct API attacks or Postman/curl bypasses).

---

## 2. Features & Acceptance Criteria

- **Dynamic Summary Cards**:
  - **Total Income**: Server-aggregated sum of all valid incoming transactions.
  - **Total Expenses**: Server-aggregated sum of all valid outgoing debits.
  - **Net Savings**: `Total Income - Total Expenses`. Displays in green when positive, red when negative.
  - Formatted in Indian Rupees (`₹`) via the standard `en-IN` locale with tabular numerals (`tabular-nums`).
- **Interactive Transaction Form**:
  - Description / Title (required, trimmed, max 150 chars).
  - Amount in INR (required, positive, max 2 decimal places, non-zero).
  - Type: **Income** or **Expense** toggle.
  - Dynamic Category: Dropdown automatically adapts based on chosen type.
  - Calendar Date: Required `YYYY-MM-DD` date picker with leap year and impossible date validation.
  - Notes: Optional contextual details (max 500 chars).
  - Anti-duplicate submission protection (button disabled while request is in flight).
  - Form cleared only upon successful HTTP 201 response.
- **Searchable, Paginated History Table**:
  - Deterministic sort (newest date first, secondary sort by `id DESC`).
  - Search by description or notes with 300ms debounce.
  - Filter by transaction type (All, Income, Expense).
  - Filter by category.
  - Server-calculated pagination (`page`, `limit`, `totalPages`, `totalRecords`).
  - Styled category badges and visual direction indicators.
  - Accessible delete modal confirmation before record removal.
- **Offline & Fault Resilience**:
  - Graceful UI notification and retry prompt if the backend is offline.
  - No fake or fabricated numbers displayed during connection drop.

---

## 3. Technology Stack

### Frontend
- **React 19** with **Vite 8**.
- **JavaScript (JSX)** (modular, clean React hooks: `useState`, `useEffect`, `useCallback`).
- **Tailwind CSS v4** for clean responsive styling without clutter.
- **Lucide React** for accessible, clean iconography.
- **Fetch API** for asynchronous REST backend communication.

### Backend
- **Node.js LTS (v22+)** with **Express.js 4**.
- **RESTful Architecture** with consistent JSON envelope responses.
- **CORS** middleware enabled for local development across ports.
- **Custom Error Handling** middleware shielding internal stack traces.

### Database
- **SQLite 3** using Node.js's native `node:sqlite` (`DatabaseSync`), requiring **zero C++ compilers or python build tools** on Windows!
- Automatic database file and table creation on first server startup.
- Persistent file path: `server/data/expense_tracker.db`.
- WAL (Write-Ahead Logging) mode and Foreign Key enforcement enabled.

---

## 4. Prerequisites & Installation for Windows

1. **Operating System**: Windows 10 or Windows 11.
2. **Terminal**: Windows PowerShell (built into Windows).
3. **Node.js**: Node.js 22 LTS (Download from [nodejs.org](https://nodejs.org/)). Verify with:
   ```powershell
   node -v
   npm -v
   ```
4. **Editor**: Visual Studio Code ([code.visualstudio.com](https://code.visualstudio.com/)).

---

## 5. Project Folder Structure

```
expense-tracker/
├── .env.example                  # Environment configuration template
├── .gitignore                    # Excludes node_modules, dist, and *.db files
├── index.html                    # Single-Page Application HTML entrypoint
├── metadata.json                 # AI Studio & applet metadata
├── package.json                  # Root npm configuration with all dev scripts
├── README.md                     # Comprehensive technical documentation
├── server.ts                     # Full-stack dev runner (Vite middleware + API)
├── tsconfig.json                 # JavaScript/TypeScript build definitions
├── vite.config.ts                # Vite config (strictPort: true, /api proxy)
├── server/
│   ├── package.json              # Sub-package definition for server modularity
│   ├── .env.example              # Server environment template
│   ├── data/
│   │   ├── .gitkeep              # Keeps directory in Git
│   │   └── expense_tracker.db    # Created automatically on first boot
│   └── src/
│       ├── server.js             # Standalone Express server entrypoint (port 8080)
│       ├── app.js                # Express app factory & middleware wiring
│       ├── database.js           # SQLite connection, schema DDL, constraints
│       ├── middleware/
│       │   └── errorHandler.js   # Centralized error formatting & 404 handler
│       ├── routes/
│       │   ├── health.js         # GET /api/health endpoint
│       │   ├── summary.js        # GET /api/summary endpoint
│       │   └── transactions.js   # CRUD /api/transactions endpoints
│       ├── services/
│       │   └── summaryService.js # Authoritative SQL aggregation math
│       └── validators/
│           └── transactionValidator.js # Dual-layer server input validation
├── src/
│   ├── main.jsx                  # React DOM mount point
│   ├── App.jsx                   # Main application state orchestration
│   ├── index.css                 # Global CSS baseline & Tailwind directives
│   ├── api/
│   │   └── transactions.js       # Client HTTP fetch client & error handling
│   ├── components/
│   │   ├── BackendStatusBanner.jsx # Offline connection warning
│   │   ├── ConfirmDialog.jsx     # Accessible modal for deletion
│   │   ├── Filters.jsx           # Search, type, and category filters
│   │   ├── Header.jsx            # Application header and top bar
│   │   ├── Notification.jsx      # Animated toast alerts
│   │   ├── SummaryCards.jsx      # Total Income, Expenses, Net Savings cards
│   │   └── TransactionTable.jsx  # Paginated transaction history table
│   └── utils/
│       └── formatters.js         # INR currency (en-IN) & calendar date utils
└── tests/
    └── acceptance.test.js        # 15 mandatory acceptance tests
```

---

## 6. Commands to Install Dependencies

Open Windows PowerShell, navigate to the folder, and run:

```powershell
npm install
```

All required frontend and backend libraries (`express`, `cors`, `concurrently`, `lucide-react`, `vite`, `tailwindcss`) will be installed automatically.

---

## 7. One-Command Startup (`npm run dev`)

To start the full-stack application with a single command:

```powershell
npm run dev
```

This launches the full application:
- **Frontend Dashboard**: Open your browser to **`http://localhost:3000`**
- **Backend REST API**: Live on **`http://localhost:8080`** (and also accessible via `/api` proxy on port 3000)
- **SQLite Database**: Automatically initialized at `server/data/expense_tracker.db`

---

## 8. Starting Frontend & Backend Separately

If you prefer to run the services in separate PowerShell windows:

### Terminal 1 — Start the Express Backend API (Port 8080)
```powershell
npm run dev:server
```
*Output:*
```
[HTTP] Express server successfully listening on:
       -> Local:    http://localhost:8080
       -> Health:   http://localhost:8080/api/health
       -> API:      http://localhost:8080/api/transactions
       -> Summary:  http://localhost:8080/api/summary
```

### Terminal 2 — Start the Vite Frontend (Port 3000)
```powershell
npm run dev:client
```
*Output:*
```
VITE v8.3.0 ready in 150 ms
➜  Local:   http://localhost:3000/
```

### Concurrent Launcher (Alternative)
```powershell
npm run dev:concurrent
```

---

## 9. Local URLs & Port Configuration

| Service | Address | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3000` | React web dashboard |
| **Backend REST API** | `http://localhost:8080/api` | Express API base |
| **Backend Health** | `http://localhost:8080/api/health` | System & DB diagnostics |
| **Transactions API**| `http://localhost:8080/api/transactions` | CRUD operations |
| **Summary API** | `http://localhost:8080/api/summary` | Mathematical financial totals |

Both Vite (`strictPort: true`) and Express enforce strict port binding. If port 3000 or 8080 is already occupied, the application **refuses to silently switch to a random port** and instead prints a diagnostic message with PowerShell commands to release the port.

---

## 10. REST API Documentation

### 1. Health Check
- **Method**: `GET /api/health`
- **Response (200 OK)**:
```json
{
  "status": "healthy",
  "service": "Expense Tracker REST API",
  "uptimeSeconds": 14,
  "timestamp": "2026-10-23T14:00:00.000Z",
  "database": {
    "status": "connected",
    "path": "server/data/expense_tracker.db",
    "persistedTransactions": 10
  }
}
```

### 2. Financial Summary
- **Method**: `GET /api/summary`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalIncomePaise": 18150000,
    "totalExpensesPaise": 4149900,
    "netSavingsPaise": 14000100,
    "totalIncomeRupees": "181500.00",
    "totalExpensesRupees": "41499.00",
    "netSavingsRupees": "140001.00",
    "transactionCount": 10
  }
}
```

### 3. List Transactions
- **Method**: `GET /api/transactions`
- **Query Parameters**:
  - `type` *(optional)*: `income` | `expense` | `all`
  - `category` *(optional)*: e.g. `Food`, `Salary`
  - `search` *(optional)*: Text substring search in description or notes
  - `page` *(optional, default 1)*: Page number ($\ge 1$)
  - `limit` *(optional, default 10)*: Records per page ($1 \le \text{limit} \le 100$)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "title": "Tech Consultancy Stipend",
        "amount_paise": 7500000,
        "amount_rupees": "75000.00",
        "type": "income",
        "category": "Salary",
        "transaction_date": "2026-10-01",
        "notes": "Monthly paycheck",
        "created_at": "2026-10-23 14:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalRecords": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 4. Create Transaction
- **Method**: `POST /api/transactions`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "title": "Apartment Monthly Rent",
  "amount": "22000.00",
  "type": "expense",
  "category": "Housing",
  "date": "2026-10-02",
  "notes": "Maintenance fee included"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": 2,
    "title": "Apartment Monthly Rent",
    "amount_paise": 2200000,
    "amount_rupees": "22000.00",
    "type": "expense",
    "category": "Housing",
    "transaction_date": "2026-10-02",
    "notes": "Maintenance fee included",
    "created_at": "2026-10-23 14:02:00"
  }
}
```
- **Validation Failure Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "amount": "Amount must be a positive number with at most two decimal places",
    "date": "Date must be a valid calendar date in YYYY-MM-DD format"
  }
}
```

### 5. Delete Transaction
- **Method**: `DELETE /api/transactions/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "data": { "id": 2 }
}
```
- **Nonexistent Record (404 Not Found)**:
```json
{
  "success": false,
  "error": "Transaction with ID 99999 not found"
}
```

---

## 11. Database Schema & Integer-Paise Monetary Model

### SQLite Schema (`transactions` Table)

```sql
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
```

### Why Integer Paise?
In standard IEEE-754 floating-point arithmetic (used by JavaScript `Number`), binary fractions cannot accurately represent decimal fractions like `0.1` or `0.2`:
```javascript
0.1 + 0.2 === 0.30000000000000004 // true in JavaScript!
```
In accounting software, floating-point math causes cumulative balance drifts over time.
To eliminate this problem:
1. Input amounts (e.g. `250.75`) are parsed into integer **paise** ($250 \times 100 + 75 = 25075$).
2. All database aggregations run using native integer addition in SQLite (`SUM(amount_paise)`).
3. Amounts are formatted for display using `amount_paise / 100` wrapped with `Intl.NumberFormat('en-IN')`.
4. Rounding errors are mathematically impossible.

---

## 12. Dual-Layer Validation (Client & Server)

Validation is enforced independently at two levels:

| Input Field | Client-Side Rule (Immediate Feedback) | Server-Side Rule (Express `transactionValidator.js`) |
| :--- | :--- | :--- |
| **Title** | Non-empty string, $\le 150$ characters | Trimmed length $> 0$ and $\le 150$, rejects whitespace-only |
| **Amount** | Positive number, regex `/^\d+(\.\d{1,2})?$/` | Rejects zero, negatives, NaN, Infinity, $>2$ decimal places. Enforces `Number.isSafeInteger(paise)` |
| **Type** | Radio button restricted to `income` or `expense` | String check: must strictly be `'income'` or `'expense'` |
| **Category** | Dynamic dropdown restricted to selected type | Validated against server whitelist array for the matching type |
| **Date** | HTML5 date input | Strict `YYYY-MM-DD` regex + calendar validity (e.g. rejects `2026-02-30`) |
| **Notes** | Optional, $\le 500$ chars | Optional, max 500 chars |

Bypassing the client (via Postman, curl, or dev tools) triggers HTTP 400 with a structured JSON response describing all validation errors.

---

## 13. How Database Persistence Works

1. On server startup, `initDatabase()` in `server/src/database.js` ensures `server/data/` exists.
2. If `expense_tracker.db` is missing, SQLite creates it and runs `CREATE TABLE IF NOT EXISTS`.
3. If `expense_tracker.db` already exists, existing data is preserved untouched.
4. WAL mode (`PRAGMA journal_mode = WAL;`) ensures write-ahead durability.
5. Even if you press `Ctrl + C` and kill the server, the data remains safely on disk.

---

## 14. How to Inspect the SQLite Database

You can inspect the database file at any time using free tools:

### Method A: DB Browser for SQLite (GUI)
1. Download **DB Browser for SQLite** from [sqlitebrowser.org](https://sqlitebrowser.org/).
2. Open the file `server/data/expense_tracker.db`.
3. Click the **Browse Data** tab to view rows, or run custom queries in the **Execute SQL** tab:
   ```sql
   SELECT id, title, amount_paise / 100.0 AS amount_inr, type, category, transaction_date 
   FROM transactions 
   ORDER BY id DESC;
   ```

### Method B: SQLite Command-Line
If you have the SQLite CLI installed:
```powershell
sqlite3 server/data/expense_tracker.db "SELECT id, title, amount_paise, type FROM transactions;"
```

---

## 15. Troubleshooting Guide

### 1. Port 8080 Conflict
- **Symptom**: `[PORT CONFLICT ERROR] Port 8080 is already in use by another process!`
- **Resolution in PowerShell**:
  ```powershell
  # Find and terminate the process holding port 8080:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
  ```
  Or change the port in `.env`:
  ```
  PORT=8081
  ```

### 2. Port 3000 Conflict
- **Symptom**: `Port 3000 is already in use`
- **Resolution in PowerShell**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```

### 3. Backend Offline Warning in UI
- Check that `npm run dev` or `npm run dev:server` is running in your terminal.
- Click the **Retry Connection** button in the dashboard banner.

### 4. Resetting the Database
To clear all data and start from a completely clean slate:
```powershell
npm run clean
```
(Removes `server/data/*.db*`). The server will recreate an empty database on the next start.

---

## 16. Production Build Instructions

To compile the React client into optimized static assets:

```powershell
npm run build
```

This compiles optimized bundles into the `dist/` directory.

To preview the production build locally:
```powershell
npm run preview
```

---

## 17. Scope: What Is and Is Not Included

### Included
- Complete full-stack React frontend and Node.js Express backend.
- SQLite disk persistence with integer paise accuracy.
- Indian Rupee (`₹`) formatting using `en-IN` standards.
- Three server-calculated dynamic summary cards.
- Dual-layer independent validation.
- Deterministic search, filtering, and pagination.
- 15 automated acceptance tests verifying all project specifications.

### Not Included (Academic Local Scope)
- Multi-user authentication / passwords (unnecessary for a local single-user machine).
- External cloud database subscriptions (runs 100% locally with zero cloud dependencies).
- External image CDNs or unverified third-party libraries.

---

## 18. Mandatory Acceptance Test Suite

To run all 15 automated acceptance tests verifying persistence, validation, and calculations:

```powershell
npm test
```

### Test Suite Output:
```
============================================================
EXPENSE TRACKER: MANDATORY ACCEPTANCE TEST SUITE
============================================================

  Running: 1. Creating a valid income transaction succeeds ... ✅ PASS
  Running: 2. Creating a valid expense transaction succeeds ... ✅ PASS
  Running: 3. Zero and negative amounts are rejected by backend ... ✅ PASS
  Running: 4. Invalid decimal precision (>2 places) is rejected ... ✅ PASS
  Running: 5. Missing or whitespace-only descriptions are rejected ... ✅ PASS
  Running: 6. Invalid transaction types are rejected ... ✅ PASS
  Running: 7. Invalid categories are rejected by server-side rules ... ✅ PASS
  Running: 8. Impossible calendar dates (e.g. 2026-02-30) are rejected ... ✅ PASS
  Running: 9. A valid transaction appears in transaction history ... ✅ PASS
  Running: 10. Summary totals equal exact sum of persisted database transactions ... ✅ PASS
  Running: 11. Deleting a transaction updates transaction history and summary ... ✅ PASS
  Running: 12. Restarting the backend preserves existing records (SQLite persistence) ... ✅ PASS
  Running: 13. Searching and filtering return the correct records ... ✅ PASS
  Running: 14. A nonexistent transaction returns HTTP 404 ... ✅ PASS
  Running: 15. Frontend error handler resilience on network/server error ... ✅ PASS

============================================================
ALL 15 MANDATORY ACCEPTANCE TESTS PASSED! (15/15)
============================================================
```
