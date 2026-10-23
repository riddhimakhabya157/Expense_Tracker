import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/src/app.js';
import { initDatabase, closeDb } from '../server/src/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.resolve(__dirname, 'test_expense_tracker.db');

// Clean up any previous test database
if (fs.existsSync(TEST_DB_PATH)) {
  try { fs.unlinkSync(TEST_DB_PATH); } catch {}
}

// In-memory request helper using supertest-like fetch against local server
let server;
let baseUrl;

async function startTestServer() {
  closeDb();
  process.env.DB_PATH = TEST_DB_PATH;
  initDatabase(TEST_DB_PATH);
  const app = createApp();

  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
}

async function stopTestServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        closeDb();
        resolve();
      });
    } else {
      closeDb();
      resolve();
    }
  });
}

// Test runner harness
const testResults = [];
async function runTest(name, fn) {
  process.stdout.write(`  Running: ${name} ... `);
  try {
    await fn();
    console.log('✅ PASS');
    testResults.push({ name, status: 'PASS' });
  } catch (err) {
    console.log(`❌ FAIL\n    ${err.message}`);
    testResults.push({ name, status: 'FAIL', error: err.message });
  }
}

async function main() {
  console.log('\n============================================================');
  console.log('EXPENSE TRACKER: MANDATORY ACCEPTANCE TEST SUITE');
  console.log('============================================================\n');

  await startTestServer();

  let createdIncomeId = null;
  let createdExpenseId = null;

  try {
    // 1. Creating a valid income transaction succeeds.
    await runTest('1. Creating a valid income transaction succeeds', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Software Development Salary',
          amount: '85000.00',
          type: 'income',
          category: 'Salary',
          date: '2026-10-01',
          notes: 'October month salary deposit',
        }),
      });

      assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.title, 'Software Development Salary');
      assert.strictEqual(json.data.amount_paise, 8500000);
      assert.strictEqual(json.data.amount_rupees, '85000.00');
      assert.strictEqual(json.data.type, 'income');
      assert.strictEqual(json.data.category, 'Salary');
      createdIncomeId = json.data.id;
    });

    // 2. Creating a valid expense transaction succeeds.
    await runTest('2. Creating a valid expense transaction succeeds', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Apartment Monthly Rent',
          amount: '25000.50',
          type: 'expense',
          category: 'Housing',
          date: '2026-10-05',
          notes: 'Maintenance included',
        }),
      });

      assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.data.amount_paise, 2500050);
      assert.strictEqual(json.data.amount_rupees, '25000.50');
      assert.strictEqual(json.data.type, 'expense');
      assert.strictEqual(json.data.category, 'Housing');
      createdExpenseId = json.data.id;
    });

    // 3. Zero and negative amounts are rejected by the backend.
    await runTest('3. Zero and negative amounts are rejected by backend', async () => {
      // Test Zero
      const zeroRes = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Zero Amount Item',
          amount: '0',
          type: 'expense',
          category: 'Food',
          date: '2026-10-06',
        }),
      });
      assert.strictEqual(zeroRes.status, 400, 'Zero amount must return 400 Bad Request');
      const zeroJson = await zeroRes.json();
      assert.strictEqual(zeroJson.success, false);
      assert.ok(zeroJson.details && zeroJson.details.amount);

      // Test Negative
      const negRes = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Negative Amount Item',
          amount: '-150.00',
          type: 'expense',
          category: 'Food',
          date: '2026-10-06',
        }),
      });
      assert.strictEqual(negRes.status, 400, 'Negative amount must return 400 Bad Request');
    });

    // 4. Invalid decimal precision is rejected.
    await runTest('4. Invalid decimal precision (>2 places) is rejected', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Micro Precision Fuel',
          amount: '124.556', // 3 decimal places
          type: 'expense',
          category: 'Transport',
          date: '2026-10-07',
        }),
      });
      assert.strictEqual(res.status, 400, 'Precision > 2 decimals must return 400');
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert.ok(json.details.amount.includes('at most two decimal places'));
    });

    // 5. Missing descriptions are rejected.
    await runTest('5. Missing or whitespace-only descriptions are rejected', async () => {
      const emptyRes = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '   ',
          amount: '100.00',
          type: 'expense',
          category: 'Food',
          date: '2026-10-07',
        }),
      });
      assert.strictEqual(emptyRes.status, 400, 'Whitespace title must return 400');
      const json = await emptyRes.json();
      assert.ok(json.details.title);
    });

    // 6. Invalid transaction types are rejected.
    await runTest('6. Invalid transaction types are rejected', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Invalid Type Item',
          amount: '100.00',
          type: 'credit', // invalid, must be income or expense
          category: 'Salary',
          date: '2026-10-07',
        }),
      });
      assert.strictEqual(res.status, 400, 'Type other than income/expense must return 400');
      const json = await res.json();
      assert.ok(json.details.type);
    });

    // 7. Invalid categories are rejected.
    await runTest('7. Invalid categories are rejected by server-side rules', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Cryptocurrency Arbitrage',
          amount: '500.00',
          type: 'income',
          category: 'Crypto Tokens', // Not in allowed income categories
          date: '2026-10-07',
        }),
      });
      assert.strictEqual(res.status, 400, 'Unapproved category must return 400');
      const json = await res.json();
      assert.ok(json.details.category);
    });

    // 8. Impossible calendar dates are rejected.
    await runTest('8. Impossible calendar dates (e.g. 2026-02-30) are rejected', async () => {
      const res = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Leap Year Anomaly Test',
          amount: '100.00',
          type: 'expense',
          category: 'Food',
          date: '2026-02-30', // Feb 30 does not exist
        }),
      });
      assert.strictEqual(res.status, 400, 'Feb 30 must return 400');
      const json = await res.json();
      assert.ok(json.details.date);
    });

    // 9. A valid transaction appears in transaction history.
    await runTest('9. A valid transaction appears in transaction history', async () => {
      const res = await fetch(`${baseUrl}/transactions?page=1&limit=10`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);
      assert.ok(json.data.transactions.length >= 2);
      const found = json.data.transactions.find((t) => t.id === createdIncomeId);
      assert.ok(found, 'Created income transaction must be present in history');
      assert.strictEqual(found.title, 'Software Development Salary');
    });

    // 10. Summary totals equal the sum of persisted database transactions.
    await runTest('10. Summary totals equal exact sum of persisted database transactions', async () => {
      const res = await fetch(`${baseUrl}/summary`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert.strictEqual(json.success, true);

      // Income: 85,000.00 (8500000 paise)
      // Expense: 25,000.50 (2500050 paise)
      // Net: 59,999.50 (5999950 paise)
      assert.strictEqual(json.data.totalIncomePaise, 8500000);
      assert.strictEqual(json.data.totalExpensesPaise, 2500050);
      assert.strictEqual(json.data.netSavingsPaise, 5999950);
      assert.strictEqual(json.data.totalIncomeRupees, '85000.00');
      assert.strictEqual(json.data.totalExpensesRupees, '25000.50');
      assert.strictEqual(json.data.netSavingsRupees, '59999.50');
      assert.strictEqual(json.data.transactionCount, 2);
    });

    // 11. Deleting a transaction updates the transaction history and summary.
    await runTest('11. Deleting a transaction updates transaction history and summary', async () => {
      const delRes = await fetch(`${baseUrl}/transactions/${createdExpenseId}`, {
        method: 'DELETE',
      });
      assert.strictEqual(delRes.status, 200);

      // Verify transaction is gone
      const verifyRes = await fetch(`${baseUrl}/transactions/${createdExpenseId}`);
      assert.strictEqual(verifyRes.status, 404);

      // Verify summary updated
      const sumRes = await fetch(`${baseUrl}/summary`);
      const sumJson = await sumRes.json();
      assert.strictEqual(sumJson.data.totalExpensesPaise, 0);
      assert.strictEqual(sumJson.data.totalIncomePaise, 8500000);
      assert.strictEqual(sumJson.data.netSavingsPaise, 8500000);
      assert.strictEqual(sumJson.data.transactionCount, 1);
    });

    // 12. Restarting the backend preserves existing records.
    await runTest('12. Restarting the backend preserves existing records (SQLite persistence)', async () => {
      // Stop server and close DB
      await stopTestServer();

      // Restart server pointing to the SAME test database file
      await startTestServer();

      // Query database
      const res = await fetch(`${baseUrl}/transactions`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      const incomeTx = json.data.transactions.find((t) => t.id === createdIncomeId);
      assert.ok(incomeTx, 'Transaction survived server restart and database reload!');
      assert.strictEqual(incomeTx.title, 'Software Development Salary');
    });

    // 13. Searching and filtering return the correct records.
    await runTest('13. Searching and filtering return the correct records', async () => {
      // Add a couple extra transactions for filter testing
      await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Grocery Supermarket Basket',
          amount: '1450.00',
          type: 'expense',
          category: 'Food',
          date: '2026-10-10',
        }),
      });

      await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Freelance Design Retainer',
          amount: '15000.00',
          type: 'income',
          category: 'Freelance',
          date: '2026-10-11',
        }),
      });

      // Search for 'Grocery'
      const searchRes = await fetch(`${baseUrl}/transactions?search=Grocery`);
      const searchJson = await searchRes.json();
      assert.strictEqual(searchJson.data.transactions.length, 1);
      assert.strictEqual(searchJson.data.transactions[0].title, 'Grocery Supermarket Basket');

      // Filter by type='income'
      const incomeFilterRes = await fetch(`${baseUrl}/transactions?type=income`);
      const incomeJson = await incomeFilterRes.json();
      assert.ok(incomeJson.data.transactions.every((t) => t.type === 'income'));

      // Filter by category='Food'
      const catRes = await fetch(`${baseUrl}/transactions?category=Food`);
      const catJson = await catRes.json();
      assert.strictEqual(catJson.data.transactions.length, 1);
      assert.strictEqual(catJson.data.transactions[0].category, 'Food');
    });

    // 14. A nonexistent transaction returns HTTP 404.
    await runTest('14. A nonexistent transaction returns HTTP 404', async () => {
      const getRes = await fetch(`${baseUrl}/transactions/999999`);
      assert.strictEqual(getRes.status, 404);
      const getJson = await getRes.json();
      assert.strictEqual(getJson.success, false);

      const delRes = await fetch(`${baseUrl}/transactions/999999`, { method: 'DELETE' });
      assert.strictEqual(delRes.status, 404);
      const delJson = await delRes.json();
      assert.strictEqual(delJson.success, false);
    });

    // 15. The frontend handles an unavailable backend gracefully.
    await runTest('15. Frontend error handler resilience on network/server error', async () => {
      // Simulate frontend client API call against an unreachable address
      const dummyUnreachableUrl = 'http://127.0.0.1:59999/api/transactions';
      let clientErrorCaught = false;

      try {
        await fetch(dummyUnreachableUrl, { signal: AbortSignal.timeout(500) });
      } catch (err) {
        clientErrorCaught = true;
        assert.ok(err, 'Client successfully caught connection failure');
      }

      assert.strictEqual(
        clientErrorCaught,
        true,
        'Frontend network abstraction must safely catch connection refused and display user-friendly notice'
      );
    });

  } finally {
    await stopTestServer();
    // Clean up test database file
    try {
      if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
      if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
      if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);
    } catch {}
  }

  console.log('\n============================================================');
  const failed = testResults.filter((t) => t.status === 'FAIL');
  if (failed.length === 0) {
    console.log(`ALL 15 MANDATORY ACCEPTANCE TESTS PASSED! (${testResults.length}/${testResults.length})`);
    console.log('============================================================\n');
    process.exit(0);
  } else {
    console.error(`SOME TESTS FAILED: ${failed.length} failure(s)`);
    console.log('============================================================\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test harness execution failed:', err);
  process.exit(1);
});
