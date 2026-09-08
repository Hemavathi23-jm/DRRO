import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => config);

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;

// Auth
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
};

// Users (Admin)
export const userApi = {
  list: () => api.get('/users').then(r => r.data),
  get: (id) => api.get(`/users/${id}`).then(r => r.data),
  create: (data) => api.post('/users', data).then(r => r.data),
  updateRole: (id, role) => api.put(`/users/${id}/role`, { role }).then(r => r.data),
  deactivate: (id) => api.delete(`/users/${id}/deactivate`).then(r => r.data),
  activate: (id) => api.put(`/users/${id}/activate`).then(r => r.data),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard').then(r => r.data),
  map: () => api.get('/dashboard/map').then(r => r.data),
  safePlaces: (locationId, maxKm = 50) =>
    api.get(`/dashboard/safe-places/${locationId}`, { params: { maxKm } }).then(r => r.data),
  exportPdf: () => api.get('/reports/export/pdf', { responseType: 'blob' }),
};

// Disasters
export const disasterApi = {
  list: (status) => api.get('/disasters', { params: status ? { status } : {} }).then(r => r.data),
  get: (id) => api.get(`/disasters/${id}`).then(r => r.data),
  create: (data) => api.post('/disasters', data).then(r => r.data),
  update: (id, data) => api.put(`/disasters/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/disasters/${id}`).then(r => r.data),
};

// Locations
export const locationApi = {
  list: (disasterId) => api.get('/locations', { params: { disasterId } }).then(r => r.data),
  get: (id) => api.get(`/locations/${id}`).then(r => r.data),
  create: (data) => api.post('/locations', data).then(r => r.data),
  update: (id, data) => api.put(`/locations/${id}`, data).then(r => r.data),
};

// Resources
export const resourceTypeApi = {
  list: () => api.get('/resource-types').then(r => r.data),
  create: (data) => api.post('/resource-types', data).then(r => r.data),
};

export const resourceCenterApi = {
  list: () => api.get('/resource-centers').then(r => r.data),
  get: (id) => api.get(`/resource-centers/${id}`).then(r => r.data),
  create: (data) => api.post('/resource-centers', data).then(r => r.data),
};

export const inventoryApi = {
  listByCenter: (centerId) => api.get(`/inventory/center/${centerId}`).then(r => r.data),
  create: (data) => api.post('/inventory', data).then(r => r.data),
  adjust: (id, delta) => api.patch(`/inventory/${id}/adjust`, null, { params: { delta } }).then(r => r.data),
};

// Requests
export const requestApi = {
  list: () => api.get('/relief-requests').then(r => r.data),
  open: () => api.get('/relief-requests/open').then(r => r.data),
  get: (id) => api.get(`/relief-requests/${id}`).then(r => r.data),
  create: (data) => api.post('/relief-requests', data).then(r => r.data),
  verify: (id) => api.patch(`/relief-requests/${id}/verify`).then(r => r.data),
};

// Allocation
export const allocationApi = {
  list: () => api.get('/allocations/recommendations').then(r => r.data),
  get: (id) => api.get(`/allocations/${id}`).then(r => r.data),
  run: (strategy, disasterId) =>
    api.post('/allocations/run', { strategy: strategy || 'GREEDY_PRIORITY', disasterId }).then(r => r.data),
  decide: (id, data) => api.put(`/allocations/${id}/decide`, data).then(r => r.data),
  approve: (id, notes) => api.post(`/allocations/${id}/approve`, notes ? { notes } : {}).then(r => r.data),
  reject: (id, notes) => api.post(`/allocations/${id}/reject`, notes ? { notes } : {}).then(r => r.data),
  strategies: () => api.get('/allocations/strategies').then(r => r.data),
};

// Teams
export const teamApi = {
  list: () => api.get('/teams').then(r => r.data),
  available: () => api.get('/teams/available').then(r => r.data),
  create: (data) => api.post('/teams', data).then(r => r.data),
  assign: (data) => api.post('/teams/assignments', data).then(r => r.data),
};

// Dispatch
export const dispatchApi = {
  list: () => api.get('/dispatches').then(r => r.data),
  get: (id) => api.get(`/dispatches/${id}`).then(r => r.data),
  create: (data) => api.post('/dispatches', data).then(r => r.data),
  inTransit: (id) => api.put(`/dispatches/${id}/in-transit`).then(r => r.data),
  deliver: (id, deliveredQty) => api.patch(`/dispatches/${id}/deliver`, { deliveredQty }).then(r => r.data),
};

// Weights
export const weightApi = {
  active: () => api.get('/admin/weights/active').then(r => r.data),
  list: () => api.get('/admin/weights').then(r => r.data),
  create: (data) => api.post('/admin/weights', data).then(r => r.data),
  activate: (id) => api.put(`/admin/weights/${id}/activate`).then(r => r.data),
};

// Notifications
export const notificationApi = {
  list: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then(r => r.data),
};

// External web-scraped data
export const externalDataApi = {
  status: () => api.get('/external-data/status').then(r => r.data),
  fetch: () => api.post('/external-data/fetch').then(r => r.data),
};

// Reports (used from dashboard)
export const reportApi = {
  metrics: () => api.get('/reports/metrics').then(r => r.data),
  unmetDemand: () => api.get('/reports/unmet-demand').then(r => r.data),
  utilization: () => api.get('/reports/utilization').then(r => r.data),
  baselineComparison: () => api.get('/reports/baseline-comparison').then(r => r.data),
};
