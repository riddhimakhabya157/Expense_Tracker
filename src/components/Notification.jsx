import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div
      role="alert"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-200"
    >
      <div
        className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 bg-white ${
          isSuccess ? 'border-emerald-200' : 'border-rose-200'
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>

        <div className="flex-1 text-xs">
          <p className="font-semibold text-slate-900">{isSuccess ? 'Success' : 'Error'}</p>
          <p className="text-slate-600 mt-0.5">{message}</p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
