/**
 * Formats integer paise into Indian Rupee (INR) currency representation.
 * Guarantees en-IN locale grouping and 2 decimal places.
 * Example: 150000 -> "₹1,500.00", -25000 -> "-₹250.00"
 */
export function formatCurrencyINR(amountPaise) {
  if (amountPaise === null || amountPaise === undefined || isNaN(amountPaise)) {
    return '₹0.00';
  }

  const numericPaise = Number(amountPaise);
  const rupees = numericPaise / 100;

  // en-IN locale standard formatting
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(rupees));

  return rupees < 0 ? `-${formatted}` : formatted;
}

/**
 * Formats YYYY-MM-DD into readable calendar display (e.g. "23 Oct 2026")
 */
export function formatDateINR(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Validates date client-side
 */
export function isValidCalendarDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1970 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const lastDayOfMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= lastDayOfMonth;
}
