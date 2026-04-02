import axios from 'axios';

const BASE_URL = 'http://YOUR_SERVER_IP:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  }
);

// Auth
export const registerDriver = (data) => api.post('/auth/driver/register', data);
export const loginDriver = (phone, password) => api.post('/auth/driver/login', { phone, password });
export const loginAdmin = (email, password) => api.post('/auth/admin/login', { email, password });

// Driver
export const updateLocation = (id, lat, lng) => api.patch(`/drivers/${id}/location`, { lat, lng });
export const getDriver = (id) => api.get(`/drivers/${id}`);

// Reports
export const createReport = (formData) =>
  api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getNearbyReports = (lat, lng, radius = 50000) =>
  api.get('/reports', { params: { lat, lng, radius } });
export const getDriverReports = (driverId) => api.get(`/reports/driver/${driverId}`);
export const getAllActiveReports = () => api.get('/reports');
export const upvoteReport = (id) => api.patch(`/reports/${id}/upvote`);
export const resolveReport = (id) => api.patch(`/reports/${id}/resolve`);

// States
export const getStates = () => api.get('/states');

// Trucks
export const updateTruckLocation = (id, lat, lng) => api.patch(`/trucks/${id}/location`, { lat, lng });

// Trips
export const startTrip = (data) => api.post('/trips', data);
export const updateTripLocation = (id, lat, lng) => api.patch(`/trips/${id}/location`, { lat, lng });
export const completeTrip = (id, lat, lng) => api.patch(`/trips/${id}/complete`, { lat, lng });
export const getDriverTrips = (driverId) => api.get(`/trips/driver/${driverId}`);

export default api;
