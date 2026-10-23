import React from 'react';
import { ArrowDownLeft, ArrowUpRight, PiggyBank } from 'lucide-react';
import { formatCurrencyINR } from '../utils/formatters.js';

export default function SummaryCards({ summary, isLoading }) {
  const {
    totalIncomePaise = 0,
    totalExpensesPaise = 0,
    netSavingsPaise = 0,
    transactionCount = 0,
  } = summary || {};

  const isNetPositive = netSavingsPaise >= 0;

  return (
    <section aria-label="Financial Summary Cards" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Total Income */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Income
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 font-mono tabular-nums">
            {isLoading ? (
              <span className="text-slate-300 animate-pulse">₹—</span>
            ) : (
              formatCurrencyINR(totalIncomePaise)
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Total earnings</span>
            <span aria-hidden="true">·</span>
            <span>All incoming credits</span>
          </div>
        </div>
      </div>

      {/* 2. Total Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Expenses
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-700 font-mono tabular-nums">
            {isLoading ? (
              <span className="text-slate-300 animate-pulse">₹—</span>
            ) : (
              formatCurrencyINR(totalExpensesPaise)
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Total spending</span>
            <span aria-hidden="true">·</span>
            <span>All outgoing debits</span>
          </div>
        </div>
      </div>

      {/* 3. Net Savings */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Net Savings
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isNetPositive ? 'bg-slate-100 text-slate-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-2xl sm:text-3xl font-bold tracking-tight font-mono tabular-nums ${
              isNetPositive ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {isLoading ? (
              <span className="text-slate-300 animate-pulse">₹—</span>
            ) : (
              formatCurrencyINR(netSavingsPaise)
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{isNetPositive ? 'Surplus' : 'Deficit'}</span>
            <span aria-hidden="true">·</span>
            <span>
              {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
