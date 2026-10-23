import React from 'react';
import { Trash2, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Inbox, PlusCircle, Sparkles } from 'lucide-react';
import { formatCurrencyINR, formatDateINR } from '../utils/formatters.js';

export default function TransactionTable({
  transactions = [],
  pagination = {},
  onPageChange,
  onDeleteClick,
  isLoading,
  deletingId,
  hasActiveFilters,
  onResetFilters,
  onAddFirstClick,
  onSeedDemo,
}) {
  const { page = 1, totalPages = 1, totalRecords = 0, limit = 10 } = pagination;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header / Counter */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Transaction History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalRecords === 0
              ? 'No transactions recorded'
              : `Showing ${totalRecords} ${totalRecords === 1 ? 'transaction' : 'transactions'}`}
          </p>
        </div>

        {totalRecords > 0 && (
          <div className="text-xs text-slate-500 font-mono">
            Page {page} of {totalPages}
          </div>
        )}
      </div>

      {/* Loading Skeleton / Empty State / Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-2" />
          <p className="text-xs text-slate-500">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>

          {hasActiveFilters ? (
            <>
              <h3 className="text-sm font-semibold text-slate-900">No matching transactions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                No records matched your search query or filter selection.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-slate-900">No transactions yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                Record your income and expenses to view your live financial summary.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onAddFirstClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add your first transaction</span>
                </button>

                {onSeedDemo && (
                  <button
                    type="button"
                    onClick={onSeedDemo}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-dashed border-slate-300 cursor-pointer"
                    title="Load preconfigured sample dataset for presentation demonstration"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>Load sample presentation data</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Responsive Table for Desktop & Tablet */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 w-16 text-center">ID</th>
                  <th scope="col" className="py-3 px-4">Description</th>
                  <th scope="col" className="py-3 px-4 w-28">Type</th>
                  <th scope="col" className="py-3 px-4 w-36">Category</th>
                  <th scope="col" className="py-3 px-4 w-32">Date</th>
                  <th scope="col" className="py-3 px-4 text-right w-36">Amount</th>
                  <th scope="col" className="py-3 px-4 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isDeleting = deletingId === tx.id;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 text-xs font-mono text-slate-400 text-center">
                        #{tx.id}
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{tx.title}</div>
                        {tx.notes && (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {tx.notes}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-block text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {tx.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap font-mono">
                        {formatDateINR(tx.transaction_date)}
                      </td>

                      {/* Amount: Income (+) in green, Expense (-) in red */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold font-mono tabular-nums text-sm ${
                            isIncome ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrencyINR(tx.amount_paise)}
                        </span>
                      </td>

                      {/* Delete Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteClick(tx)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-30"
                          title={`Delete transaction #${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing records{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(totalRecords, (page - 1) * limit + 1)}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(totalRecords, page * limit)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{totalRecords}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="px-2 font-mono">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
