import axios from 'axios';

const BASE_URL = 'http://192.168.1.41:5000/api';

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
export const updateLocation = (id, lat, lng) =>
  api.patch(`/drivers/${id}/location`, { lat, lng });

export const createReport = (formData) =>
  api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getNearbyReports = (lat, lng, radius = 50000) =>
  api.get('/reports', { params: { lat, lng, radius } });

export const getAllReports = () => api.get('/reports');
export const getDriverReports = (driverId) => api.get(`/reports/driver/${driverId}`);
export const upvoteReport = (id) => api.patch(`/reports/${id}/upvote`);
export const resolveReport = (id) => api.patch(`/reports/${id}/resolve`);
export const getReport = (id) => api.get(`/reports/${id}`);

export default api;
