/**
 * API client for Expense Tracker REST backend.
 * Supports configurable VITE_API_URL and fallback proxy to /api.
 */

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    // If running in cloud iframe or remote preview, use proxy /api instead of unreachable localhost
    if (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      if (envUrl.includes('localhost')) {
        return '/api';
      }
    }
    return envUrl.replace(/\/+$/, '');
  }
  return '/api';
};

async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = data?.details;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && String(err.message).toLowerCase().includes('fetch')) {
      const offlineErr = new Error(
        `Backend server unreachable at ${baseUrl}. Ensure Express backend is running on port 8080.`
      );
      offlineErr.isOffline = true;
      offlineErr.status = 0;
      throw offlineErr;
    }
    throw err;
  }
}

export async function checkBackendHealth() {
  return apiRequest('/health');
}

export async function fetchSummary() {
  const response = await apiRequest('/summary');
  return response.data;
}

export async function fetchTransactions({
  type = 'all',
  category = 'all',
  search = '',
  page = 1,
  limit = 10,
  sortBy = 'date',
  order = 'desc',
} = {}) {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.append('type', type);
  if (category && category !== 'all') params.append('category', category);
  if (search && search.trim()) params.append('search', search.trim());
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('order', order);

  const response = await apiRequest(`/transactions?${params.toString()}`);
  return response.data;
}

export async function createTransaction(payload) {
  const response = await apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteTransaction(id) {
  const response = await apiRequest(`/transactions/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

export async function seedDemoTransactions() {
  const response = await apiRequest('/transactions/seed-demo?force=true', {
    method: 'POST',
  });
  return response;
}
