/**
 * API Service Layer
 * Centralizes all backend API calls with auth headers.
 */
import axios from 'axios';

const API_BASE = `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally (Optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const registerUser = (data) =>
  api.post('/auth/register', data);

// ---- Claims ----
export const predictClaim = (claimData) =>
  api.post('/claims/predict', claimData);

export const getClaims = (params = {}) =>
  api.get('/claims', { params });

export const getClaim = (id) =>
  api.get(`/claims/${id}`);

export const reviewClaim = (id, status) =>
  api.put(`/claims/${id}/review`, { status });

export const deleteClaim = (id) =>
  api.delete(`/claims/${id}`);

export const getClaimExplanation = (id) =>
  api.get(`/claims/${id}/explanation`);



// ---- Dashboard ----
export const getDashboardSummary = () =>
  api.get('/dashboard/summary');

export const getFraudTrends = () =>
  api.get('/dashboard/fraud-trends');

export const getModelMetrics = () =>
  api.get('/dashboard/model-metrics');

export const getRiskDistribution = () =>
  api.get('/dashboard/risk-distribution');

// ---- Admin ----
export const retrainModel = () =>
  api.post('/admin/retrain');

export const exportClaims = (params = {}) =>
  api.get('/admin/export', { params, responseType: 'blob' });

export const getAuditLog = (params = {}) =>
  api.get('/admin/audit-log', { params });

export const getModelVersions = () =>
  api.get('/admin/model-versions');

export const getUsers = () =>
  api.get('/admin/users');

// ---- Health ----
export const healthCheck = () =>
  api.get('/health');

export default api;
