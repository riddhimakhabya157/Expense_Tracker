export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Other Income',
];

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills and Utilities',
  'Housing',
  'Healthcare',
  'Education',
  'Entertainment',
  'Travel',
  'Other Expense',
];

/**
 * Validates calendar date string (YYYY-MM-DD), rejecting impossible dates like 2026-02-30.
 */
export function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 1970 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  // Month in JS Date is 0-indexed; passing month and day 0 gives last day of the target month
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDayOfMonth) return false;

  return true;
}

/**
 * Validates and converts an amount (string or number) to integer paise.
 * Rejects negative, zero, non-finite, NaN, and precision > 2 decimal places.
 */
export function validateAndConvertToPaise(amountInput) {
  if (amountInput === undefined || amountInput === null || amountInput === '') {
    return { valid: false, error: 'Amount is required' };
  }

  const rawStr = String(amountInput).trim();

  // Strict regex: positive integer or decimal with 1 or 2 decimal digits only
  if (!/^\d+(\.\d{1,2})?$/.test(rawStr)) {
    return {
      valid: false,
      error: 'Amount must be a positive number with at most two decimal places (e.g. 150 or 150.50)',
    };
  }

  const num = Number(rawStr);
  if (!Number.isFinite(num) || isNaN(num) || num <= 0) {
    return { valid: false, error: 'Amount must be strictly greater than zero' };
  }

  // Exact arithmetic conversion to paise to avoid IEEE-754 binary floating point imprecision
  const parts = rawStr.split('.');
  const wholePart = parseInt(parts[0], 10);
  const decimalPart = parts[1] ? (parts[1] + '0').slice(0, 2) : '00';
  const paise = wholePart * 100 + parseInt(decimalPart, 10);

  if (!Number.isSafeInteger(paise) || paise <= 0) {
    return { valid: false, error: 'Amount exceeds safe maximum monetary range' };
  }

  return { valid: true, paise };
}

/**
 * Validates transaction payload for create / update operations.
 * Returns { isValid, errors, normalized }
 */
export function validateTransactionInput(input = {}) {
  const errors = {};
  const { title, amount, type, category, date, notes } = input;

  // 1. Description / Title validation
  if (title === undefined || title === null || String(title).trim().length === 0) {
    errors.title = 'Description is required and cannot be empty or whitespace only';
  } else if (String(title).trim().length > 150) {
    errors.title = 'Description cannot exceed 150 characters';
  }

  // 2. Type validation
  if (!type || !['income', 'expense'].includes(String(type).toLowerCase())) {
    errors.type = 'Type must be either "income" or "expense"';
  }

  const normalizedType = String(type || '').toLowerCase();

  // 3. Category validation (must depend on selected type)
  if (!category || String(category).trim().length === 0) {
    errors.category = 'Category is required';
  } else {
    const trimmedCategory = String(category).trim();
    if (normalizedType === 'income' && !INCOME_CATEGORIES.includes(trimmedCategory)) {
      errors.category = `Invalid income category. Allowed: ${INCOME_CATEGORIES.join(', ')}`;
    } else if (normalizedType === 'expense' && !EXPENSE_CATEGORIES.includes(trimmedCategory)) {
      errors.category = `Invalid expense category. Allowed: ${EXPENSE_CATEGORIES.join(', ')}`;
    } else if (!['income', 'expense'].includes(normalizedType)) {
      errors.category = 'Select a valid transaction type before selecting a category';
    }
  }

  // 4. Amount validation
  const amountResult = validateAndConvertToPaise(amount);
  if (!amountResult.valid) {
    errors.amount = amountResult.error;
  }

  // 5. Date validation
  if (!date || String(date).trim().length === 0) {
    errors.date = 'Transaction date is required';
  } else if (!isValidCalendarDate(String(date).trim())) {
    errors.date = 'Date must be a valid calendar date in YYYY-MM-DD format (e.g. 2026-10-23)';
  }

  // 6. Notes validation (optional)
  if (notes !== undefined && notes !== null && String(notes).trim().length > 500) {
    errors.notes = 'Notes cannot exceed 500 characters';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    normalized: isValid
      ? {
          title: String(title).trim(),
          amount_paise: amountResult.paise,
          type: normalizedType,
          category: String(category).trim(),
          transaction_date: String(date).trim(),
          notes: notes ? String(notes).trim() : null,
        }
      : null,
  };
}

/**
 * Validates query parameters for transaction listing
 */
export function validateQueryParams(query = {}) {
  const errors = {};
  const { type, category, search, page = '1', limit = '10', sortBy = 'date', order = 'desc' } = query;

  if (type && !['income', 'expense', 'all'].includes(String(type).toLowerCase())) {
    errors.type = 'Type filter must be "income", "expense", or "all"';
  }

  if (category && typeof category !== 'string') {
    errors.category = 'Category filter must be a valid string';
  }

  const parsedPage = parseInt(page, 10);
  if (isNaN(parsedPage) || parsedPage < 1) {
    errors.page = 'Page must be an integer greater than or equal to 1';
  }

  const parsedLimit = parseInt(limit, 10);
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    errors.limit = 'Limit must be an integer between 1 and 100';
  }

  const allowedSortFields = ['date', 'amount', 'created_at', 'id'];
  if (sortBy && !allowedSortFields.includes(String(sortBy))) {
    errors.sortBy = `sortBy must be one of: ${allowedSortFields.join(', ')}`;
  }

  const allowedOrder = ['asc', 'desc'];
  if (order && !allowedOrder.includes(String(order).toLowerCase())) {
    errors.order = 'order must be "asc" or "desc"';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    params: {
      type: type && type !== 'all' ? String(type).toLowerCase() : null,
      category: category && category !== 'all' ? String(category).trim() : null,
      search: search ? String(search).trim() : null,
      page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
      limit: isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit,
      sortBy: sortBy === 'date' ? 'transaction_date' : sortBy === 'amount' ? 'amount_paise' : 'transaction_date',
      order: String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC',
    },
  };
}
