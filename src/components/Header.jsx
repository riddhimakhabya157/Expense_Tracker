import React from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

export default function Header({ onRefresh, isRefreshing }) {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              Expense Tracker
            </h1>
            <p className="text-xs text-slate-500 leading-tight">
              Manage your money with clarity.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer disabled:opacity-50"
            title="Refresh dashboard records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}
