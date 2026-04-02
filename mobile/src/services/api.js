import axios from 'axios';

const BASE_URL = 'http://10.116.252.46:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export const setDriverId = (id) => {
  if (id) api.defaults.headers.common['x-driver-id'] = id;
  else delete api.defaults.headers.common['x-driver-id'];
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

export const registerDriver = (data) => api.post('/drivers/register', data);
export const loginDriver = (phone) => api.post('/drivers/login', { phone });
export const updateLocation = (id, lat, lng) => api.patch(`/drivers/${id}/location`, { lat, lng });

export const createReport = (formData) =>
  api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getNearbyReports = (lat, lng, radius = 50000) =>
  api.get('/reports', { params: { lat, lng, radius } });
export const getDriverReports = (driverId) => api.get(`/reports/driver/${driverId}`);
export const getAllActiveReports = () => api.get('/reports');
export const upvoteReport = (id) => api.patch(`/reports/${id}/upvote`);
export const resolveReport = (id) => api.patch(`/reports/${id}/resolve`);
export const changeDriverPassword = (id, currentPassword, newPassword) =>
  api.patch(`/drivers/${id}/password`, { currentPassword, newPassword });

export default api;
