const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? 'http://127.0.0.1:5000/api'
  : '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('brightloop_token');
  const validToken = (token && token !== 'undefined') ? token : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(validToken ? { Authorization: `Bearer ${validToken}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  resetPassword: (payload) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getMe: () => apiRequest('/auth/me')
};

export const usersApi = {
  getStaff: () => apiRequest('/users/staff'),
  addStaff: (staffData) => apiRequest('/users/staff', {
    method: 'POST',
    body: JSON.stringify(staffData)
  }),
  getCustomers: () => apiRequest('/users/customers')
};

export const productsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/products/${id}`),
  create: (data) => apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/products/${id}`, {
    method: 'DELETE'
  })
};

export const plansApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/plans${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/plans/${id}`),
  create: (data) => apiRequest('/plans', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const templatesApi = {
  getAll: () => apiRequest('/templates'),
  getById: (id) => apiRequest(`/templates/${id}`),
  create: (data) => apiRequest('/templates', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/templates/${id}`, {
    method: 'DELETE'
  })
};

export const subscriptionsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/subscriptions${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/subscriptions/${id}`),
  create: (data) => apiRequest('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateStatus: (id, data) => apiRequest(`/subscriptions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};

export const taxesApi = {
  getAll: () => apiRequest('/taxes'),
  create: (data) => apiRequest('/taxes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/taxes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

export const discountsApi = {
  getAll: () => apiRequest('/discounts'),
  create: (data) => apiRequest('/discounts', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/discounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/discounts/${id}`, {
    method: 'DELETE'
  })
};

export const invoicesApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/invoices${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/invoices/${id}`),
  runBilling: (data = {}) => apiRequest('/invoices/run-billing', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateStatus: (id, data) => apiRequest(`/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  send: (id) => apiRequest(`/invoices/${id}/send`, {
    method: 'POST'
  })
};

export const paymentsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/payments${query ? `?${query}` : ''}`);
  },
  record: (data) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export const analyticsApi = {
  getDashboard: () => apiRequest('/analytics/dashboard')
};
