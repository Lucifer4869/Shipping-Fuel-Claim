import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Auto attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data: { username: string; password: string }) =>
  api.post('/auth/login', data);
export const googleLogin = (idToken: string) =>
  api.post('/auth/google-login', { idToken });
export const getMe = () => api.get('/auth/me');

// Shipments
export const getShipments = () => api.get('/shipments');
export const createShipment = (data: object) => api.post('/shipments', data);
export const updateShipment = (id: number, data: object) => api.put(`/shipments/${id}`, data);
export const deleteShipment = (id: number) => api.delete(`/shipments/${id}`);
export const completeShipment = (id: number, endMileage: number) =>
  api.patch(`/shipments/${id}/complete`, endMileage);

// Withdrawals
export const getWithdrawals = (shipmentId?: number) => api.get('/withdrawals', { params: { shipmentId } });
export const createWithdrawal = (data: object) => api.post('/withdrawals', data);
export const managerApproveWithdrawal = (id: number, data: object) =>
  api.patch(`/withdrawals/${id}/approve`, data);
export const financeApproveWithdrawal = (id: number, data: object) =>
  api.patch(`/withdrawals/${id}/finance-approve`, data);
export const deleteWithdrawal = (id: number) => api.delete(`/withdrawals/${id}`);

// Fuel Claims
export const getFuelClaims = (shipmentId?: number) => api.get('/claims', { params: { shipmentId } });
export const createFuelClaim = (data: object) => api.post('/claims', data);
export const managerApproveFuelClaim = (id: number, data: object) =>
  api.patch(`/claims/${id}/approve`, data);
export const financeApproveFuelClaim = (id: number, data: object) =>
  api.patch(`/claims/${id}/finance-approve`, data);
export const deleteFuelClaim = (id: number) => api.delete(`/claims/${id}`);

// Uploads
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Audit Logs
export const getAuditLogs = (params?: object) => api.get('/audit-logs', { params });

// Users (Admin Only)
export const getUsers = () => api.get('/users');
export const createUser = (data: object) => api.post('/users', data);
export const updateUser = (id: number, data: object) => api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);
export const getOilPrice = () => api.get('/externaldata/oil-price');

export default api;
