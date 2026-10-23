import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function BackendStatusBanner({ isOffline, onRetry, isChecking }) {
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-xs text-amber-900"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900">
              Unable to Connect to Transaction Service
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              The service appears to be offline. Live financial statistics and records will update once reconnected.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRetry}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  );
}
