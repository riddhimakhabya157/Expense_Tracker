/**
 * Calculates authoritative financial summary totals directly from persisted database records.
 * Uses exact integer paise arithmetic to guarantee zero floating-point rounding errors.
 */
export function getFinancialSummary(db) {
  const query = `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS total_income_paise,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS total_expenses_paise,
      COUNT(*) AS transaction_count
    FROM transactions;
  `;

  const row = db.prepare(query).get();

  const totalIncomePaise = Number(row.total_income_paise || 0);
  const totalExpensesPaise = Number(row.total_expenses_paise || 0);
  const netSavingsPaise = totalIncomePaise - totalExpensesPaise;
  const transactionCount = Number(row.transaction_count || 0);

  return {
    totalIncomePaise,
    totalExpensesPaise,
    netSavingsPaise,
    totalIncomeRupees: (totalIncomePaise / 100).toFixed(2),
    totalExpensesRupees: (totalExpensesPaise / 100).toFixed(2),
    netSavingsRupees: (netSavingsPaise / 100).toFixed(2),
    transactionCount,
  };
}
