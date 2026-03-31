import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export const setDriverId = (id) => {
  if (id) api.defaults.headers.common['x-driver-id'] = id;
  else delete api.defaults.headers.common['x-driver-id'];
};

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new Error(err.response?.data?.error || err.message || 'Network error'))
);

export const registerDriver = (data) => api.post('/drivers/register', data);
export const loginDriver = (phone, password) => api.post('/drivers/login', { phone, password });
export const updateLocation = (id, lat, lng) => api.patch(`/drivers/${id}/location`, { lat, lng });

export const createReport = (formData) => api.post('/reports', formData);

export const getNearbyReports = (lat, lng, radius = 50000) =>
  api.get('/reports', { params: { lat, lng, radius } });

export const getAllReports = () => api.get('/reports');
export const getAllReportsAdmin = () => api.get('/reports/admin');
export const getDriverReports = (driverId) => api.get(`/reports/driver/${driverId}`);
export const upvoteReport = (id) => api.patch(`/reports/${id}/upvote`);

// Simple resolve (no photo) — used by drivers
export const resolveReport = (id) => api.patch(`/reports/${id}/resolve`);

// Resolve with optional photo — used by admin
export const resolveReportWithPhoto = (id, formData) =>
  api.patch(`/reports/${id}/resolve`, formData, {
    headers: { 'x-admin-password': sessionStorage.getItem('adminPass') || '' },
  });

export const deleteReport = (id) => api.delete(`/reports/${id}`);
export const driverChangePassword = (id, currentPassword, newPassword) =>
  api.post(`/drivers/${id}/change-password`, { currentPassword, newPassword });

export const adminLogin = (password) => api.post('/admin/login', { password });
export const adminChangePassword = (currentPassword, newPassword) =>
  api.post('/admin/change-password', { currentPassword, newPassword });

export const getAllDrivers = () => api.get('/drivers');
export const deleteDriver = (id) => api.delete(`/drivers/${id}`);

export default api;
