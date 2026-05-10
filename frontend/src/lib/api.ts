import axios from 'axios';

// --- การตั้งค่าพื้นฐานของ API Client (Axios) ---
const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptor: ขาออก (Request) ---
// หน้าที่: แอบส่ง Token (JWT) ไปกับทุกๆ Request อัตโนมัติ เพื่อยืนยันตัวตนกับ Backend
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // ถ้ามี Token ในเครื่อง ให้ใส่เข้าไปใน Header "Authorization: Bearer <token>"
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Interceptor: ขาเข้า (Response) ---
// หน้าที่: คอยดูว่าถ้า Server ตอบกลับมาว่า 401 (Unauthorized) แสดงว่า Token หมดอายุหรือผิด
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // ถ้า Token ใช้ไม่ได้แล้ว ให้ล้างข้อมูลในเครื่องและเตะกลับไปหน้า Login
      localStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// --- กลุ่มฟังก์ชันเกี่ยวกับ Authentication ---
export const login = (data: { username: string; password: string }) =>
  api.post('/auth/login', data);
export const googleLogin = (idToken: string) =>
  api.post('/auth/google-login', { idToken });
export const getMe = () => api.get('/auth/me');

// --- กลุ่มฟังก์ชันเกี่ยวกับการเดินรถ (Shipments) ---
export const getShipments = () => api.get('/shipments');
export const createShipment = (data: object) => api.post('/shipments', data);
export const updateShipment = (id: number, data: object) => api.put(`/shipments/${id}`, data);
export const deleteShipment = (id: number) => api.delete(`/shipments/${id}`);
export const completeShipment = (id: number, endMileage: number) =>
  api.patch(`/shipments/${id}/complete`, endMileage);

// --- กลุ่มฟังก์ชันเกี่ยวกับการเบิกเงิน (Withdrawals) ---
export const getWithdrawals = (shipmentId?: number) => api.get('/withdrawals', { params: { shipmentId } });
export const createWithdrawal = (data: object) => api.post('/withdrawals', data);
export const managerApproveWithdrawal = (id: number, data: object) =>
  api.patch(`/withdrawals/${id}/approve`, data);
export const financeApproveWithdrawal = (id: number, data: object) =>
  api.patch(`/withdrawals/${id}/finance-approve`, data);
export const deleteWithdrawal = (id: number) => api.delete(`/withdrawals/${id}`);

// --- กลุ่มฟังก์ชันเกี่ยวกับการเคลมน้ำมัน (Fuel Claims) ---
export const getFuelClaims = (shipmentId?: number) => api.get('/claims', { params: { shipmentId } });
export const createFuelClaim = (data: object) => api.post('/claims', data);
export const managerApproveFuelClaim = (id: number, data: object) =>
  api.patch(`/claims/${id}/approve`, data);
export const financeApproveFuelClaim = (id: number, data: object) =>
  api.patch(`/claims/${id}/finance-approve`, data);
export const deleteFuelClaim = (id: number) => api.delete(`/claims/${id}`);

// --- ฟังก์ชันการอัปโหลดไฟล์ ---
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- ฟังก์ชันดึงประวัติการใช้งาน (Audit Logs) ---
export const getAuditLogs = (params?: object) => api.get('/audit-logs', { params });

// --- กลุ่มฟังก์ชันจัดการผู้ใช้งาน (Admin Only) ---
export const getUsers = () => api.get('/users');
export const createUser = (data: object) => api.post('/users', data);
export const updateUser = (id: number, data: object) => api.put(`/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/users/${id}`);

// --- ฟังก์ชันดึงราคาน้ำมันล่าสุดจาก PTT (ผ่าน Backend) ---
export const getOilPrice = () => api.get('/externaldata/oil-price');

export default api;
