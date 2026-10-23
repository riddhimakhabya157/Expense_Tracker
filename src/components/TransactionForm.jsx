import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { isValidCalendarDate } from '../utils/formatters.js';

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

export default function TransactionForm({ onSubmit, isSubmitting, titleInputRef }) {
  // Get today's local date formatted as YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: EXPENSE_CATEGORIES[0],
    date: todayStr,
    notes: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const activeCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Real-time client-side field validation
  const validateField = (name, value, currentType = formData.type) => {
    switch (name) {
      case 'title': {
        const val = String(value || '').trim();
        if (!val) return 'Description is required';
        if (val.length > 150) return 'Description cannot exceed 150 characters';
        return '';
      }
      case 'amount': {
        const val = String(value || '').trim();
        if (!val) return 'Amount is required';
        if (!/^\d+(\.\d{1,2})?$/.test(val)) {
          return 'Enter a positive amount with up to 2 decimal places (e.g. 250 or 250.50)';
        }
        const num = Number(val);
        if (isNaN(num) || !Number.isFinite(num) || num <= 0) {
          return 'Amount must be greater than zero';
        }
        return '';
      }
      case 'date': {
        const val = String(value || '').trim();
        if (!val) return 'Date is required';
        if (!isValidCalendarDate(val)) {
          return 'Please select a valid calendar date (e.g. 2026-10-23)';
        }
        return '';
      }
      case 'category': {
        const val = String(value || '').trim();
        const allowed = currentType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (!val || !allowed.includes(val)) {
          return `Please select a valid ${currentType} category`;
        }
        return '';
      }
      case 'notes': {
        const val = String(value || '').trim();
        if (val.length > 500) return 'Notes cannot exceed 500 characters';
        return '';
      }
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      const newCategories = value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const newCategory = newCategories[0];
      setFormData((prev) => ({
        ...prev,
        type: value,
        category: newCategory,
      }));
      setFieldErrors((prev) => ({
        ...prev,
        category: '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const error = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all as touched and validate everything
    const errors = {
      title: validateField('title', formData.title),
      amount: validateField('amount', formData.amount),
      date: validateField('date', formData.date),
      category: validateField('category', formData.category),
      notes: validateField('notes', formData.notes),
    };

    setFieldErrors(errors);
    setTouched({
      title: true,
      amount: true,
      date: true,
      category: true,
      notes: true,
    });

    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      return;
    }

    const payload = {
      title: formData.title.trim(),
      amount: formData.amount.trim(),
      type: formData.type,
      category: formData.category,
      date: formData.date.trim(),
      notes: formData.notes ? formData.notes.trim() : '',
    };

    const success = await onSubmit(payload);

    // Clear form ONLY upon successful backend creation
    if (success) {
      setFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: EXPENSE_CATEGORIES[0],
        date: todayStr,
        notes: '',
      });
      setFieldErrors({});
      setTouched({});
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Record New Transaction</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter transaction details to track your balance
          </p>
        </div>

        {/* Transaction Type Segmented Toggle */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              formData.type === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              formData.type === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
        {/* Row 1: Title & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7">
            <label htmlFor="title" className="block text-xs font-medium text-slate-700 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder={formData.type === 'income' ? 'e.g. Freelance Web Design' : 'e.g. Grocery Supermarket'}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                fieldErrors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          <div className="sm:col-span-5">
            <label htmlFor="amount" className="block text-xs font-medium text-slate-700 mb-1">
              Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                ₹
              </span>
              <input
                type="text"
                id="amount"
                name="amount"
                inputMode="decimal"
                value={formData.amount}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="0.00"
                className={`w-full pl-7 pr-3 py-2 text-sm border rounded-lg bg-white text-slate-900 font-mono tabular-nums placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                  fieldErrors.amount
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
                }`}
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.amount}</p>
            )}
          </div>
        </div>

        {/* Row 2: Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-6">
            <label htmlFor="category" className="block text-xs font-medium text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                fieldErrors.category
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
              }`}
            >
              {activeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.category}</p>
            )}
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="date" className="block text-xs font-medium text-slate-700 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 font-mono focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
                fieldErrors.date
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
              }`}
            />
            {fieldErrors.date && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.date}</p>
            )}
          </div>
        </div>

        {/* Row 3: Notes (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-slate-700 mb-1">
            Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            placeholder="Additional context or transaction reference"
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-slate-50 ${
              fieldErrors.notes
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-slate-800 focus:ring-slate-100'
            }`}
          />
          {fieldErrors.notes && (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.notes}</p>
          )}
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              formData.type === 'income'
                ? 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-700'
                : 'bg-rose-700 hover:bg-rose-800 focus:ring-rose-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Record {formData.type === 'income' ? 'Income' : 'Expense'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
