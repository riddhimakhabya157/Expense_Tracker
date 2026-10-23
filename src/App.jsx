import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import SummaryCards from './components/SummaryCards.jsx';
import TransactionForm from './components/TransactionForm.jsx';
import Filters from './components/Filters.jsx';
import TransactionTable from './components/TransactionTable.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Notification from './components/Notification.jsx';
import BackendStatusBanner from './components/BackendStatusBanner.jsx';
import {
  fetchSummary,
  fetchTransactions,
  createTransaction,
  deleteTransaction,
  seedDemoTransactions,
  checkBackendHealth,
} from './api/transactions.js';

export default function App() {
  // Authoritative financial summary state from backend SQLite aggregation
  const [summary, setSummary] = useState({
    totalIncomePaise: 0,
    totalExpensesPaise: 0,
    netSavingsPaise: 0,
    transactionCount: 0,
  });

  // Transaction records & pagination state
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  });

  // Search & filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Loading & submission state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  // Network state
  const [isOffline, setIsOffline] = useState(false);
  const [isCheckingOffline, setIsCheckingOffline] = useState(false);

  // Toast notification state
  const [notification, setNotification] = useState(null);

  // Reference for focusing the form's first input
  const titleInputRef = useRef(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load summary and transaction list from server
  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    try {
      // 1. Fetch server-authoritative summary calculated directly from database records
      const summaryData = await fetchSummary();
      setSummary(summaryData);

      // 2. Fetch paginated filtered transactions
      const txData = await fetchTransactions({
        type: typeFilter,
        category: categoryFilter,
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit,
      });

      setTransactions(txData.transactions || []);
      setPagination((prev) => ({
        ...prev,
        ...txData.pagination,
      }));

      setIsOffline(false);
    } catch (err) {
      console.error('Error loading data:', err);
      if (err.isOffline || err.status === 0) {
        setIsOffline(true);
      } else {
        setNotification({
          type: 'error',
          message: err.message || 'Failed to load records from server',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [typeFilter, categoryFilter, debouncedSearch, pagination.page, pagination.limit]);

  // Initial fetch on mount & filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reconnect check
  const handleRetryConnection = async () => {
    setIsCheckingOffline(true);
    try {
      await checkBackendHealth();
      setIsOffline(false);
      await loadData();
      setNotification({
        type: 'success',
        message: 'Successfully reconnected to service.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Transaction service is still unreachable.',
      });
    } finally {
      setIsCheckingOffline(false);
    }
  };

  // Create Transaction Handler
  const handleCreateTransaction = async (formData) => {
    setIsSubmitting(true);
    try {
      const created = await createTransaction(formData);
      setNotification({
        type: 'success',
        message: `Transaction "${created.title}" successfully recorded.`,
      });
      // Refresh server summary and transaction list
      await loadData();
      return true; // Resets form fields
    } catch (err) {
      const detailsMsg = err.details
        ? Object.values(err.details).join('; ')
        : err.message || 'Failed to record transaction';

      setNotification({
        type: 'error',
        message: detailsMsg,
      });
      return false; // Preserves form inputs
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Transaction Handler
  const handleConfirmDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteTransaction(id);
      setNotification({
        type: 'success',
        message: `Transaction #${id} deleted successfully.`,
      });
      setConfirmTarget(null);
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete transaction',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Seed Demo Transactions Handler (explicit presentation data)
  const handleSeedDemo = async () => {
    setIsRefreshing(true);
    try {
      const res = await seedDemoTransactions();
      setNotification({
        type: 'success',
        message: res.message || 'Sample demo transactions loaded for presentation.',
      });
      await loadData();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to seed sample data',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter Reset Handler
  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Scroll to and focus the transaction form
  const handleAddFirstClick = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const hasActiveFilters = Boolean(search || typeFilter !== 'all' || categoryFilter !== 'all');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* 1. Professional Application Header */}
      <Header
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection Notice Banner */}
        <BackendStatusBanner
          isOffline={isOffline}
          onRetry={handleRetryConnection}
          isChecking={isCheckingOffline}
        />

        {/* 2. Summary Cards (Income, Expenses, Net Savings) */}
        <SummaryCards summary={summary} isLoading={isLoading} />

        {/* 3. Transaction Entry Form & History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Transaction Input Form */}
          <div className="lg:col-span-5">
            <TransactionForm
              onSubmit={handleCreateTransaction}
              isSubmitting={isSubmitting}
              titleInputRef={titleInputRef}
            />
          </div>

          {/* Right Column: Search, Filter, & History Table */}
          <div className="lg:col-span-7 space-y-4">
            <Filters
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={(val) => {
                setTypeFilter(val);
                setCategoryFilter('all');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={(val) => {
                setCategoryFilter(val);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            <TransactionTable
              transactions={transactions}
              pagination={pagination}
              onPageChange={(newPage) => {
                setPagination((prev) => ({ ...prev, page: newPage }));
              }}
              onDeleteClick={(tx) => setConfirmTarget(tx)}
              isLoading={isLoading}
              deletingId={deletingId}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              onAddFirstClick={handleAddFirstClick}
              onSeedDemo={summary.transactionCount === 0 ? handleSeedDemo : null}
            />
          </div>
        </div>
      </main>

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        transaction={confirmTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
        isDeleting={Boolean(deletingId)}
      />

      {/* Toast Notification */}
      <Notification
        message={notification?.message}
        type={notification?.type}
        onClose={() => setNotification(null)}
      />

      {/* Clean Professional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>Expense Tracker · Manage your money with clarity.</div>
          <div className="text-slate-400">Personal Finance Dashboard</div>
        </div>
      </footer>
    </div>
  );
}
