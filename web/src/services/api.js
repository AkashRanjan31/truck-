import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
export const loginDriver = (phone) => api.post('/drivers/login', { phone });
export const updateLocation = (id, lat, lng) => api.patch(`/drivers/${id}/location`, { lat, lng });

export const createReport = (formData) => api.post('/reports', formData);
export const getNearbyReports = (lat, lng, radius = 50000) =>
  api.get('/reports', { params: { lat, lng, radius } });
export const getTrafficZones = (lat, lng, radius = 50000) =>
  api.get('/traffic/zones', { params: { lat, lng, radius } });
export const getAllReports = () => api.get('/reports');
export const getAllReportsAdmin = () =>
  api.get('/reports/admin', {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || '' },
  });
export const getDriverReports = (driverId) => api.get(`/reports/driver/${driverId}`);
export const upvoteReport = (id) => api.patch(`/reports/${id}/upvote`);
export const userConfirmResolution = (id) => api.patch(`/reports/${id}/user-confirm`);
export const resolveReportWithPhoto = (id, formData) =>
  api.patch(`/reports/${id}/resolve`, formData, {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || '' },
  });
export const deleteReport = (id) =>
  api.delete(`/reports/${id}`, {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || '' },
  });

export const getAllDrivers = () =>
  api.get('/drivers', {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || '' },
  });
export const deleteDriver = (id) =>
  api.delete(`/drivers/${id}`, {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || '' },
  });

export const adminLogin = (password) => api.post('/admin/login', { password });
export const triggerSOS = (data) => api.post('/emergency', data);
export const acknowledgeSOS = (sosId, data) => api.patch(`/emergency/${sosId}/acknowledge`, data);
export const getActiveSOS = () => api.get('/emergency/active');
export const resolveSOS = (sosId) => api.patch(`/emergency/${sosId}/resolve`);
export const changeDriverPassword = (id, currentPassword, newPassword) =>
  api.patch(`/drivers/${id}/password`, { currentPassword, newPassword });
export const adminChangePassword = (currentPassword, newPassword) =>
  api.post('/admin/change-password', { newPassword }, {
    headers: { 'x-admin-password': localStorage.getItem('adminPass') || currentPassword },
  });

export default api;
