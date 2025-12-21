import axios from 'axios';

const API_BASE = '/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors (optional but good practice)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and maybe redirect to login logic could be handled here or in UI
      localStorage.removeItem('access_token');
      // window.location.href = '/login'; // Or rely on AuthContext state update
    }
    return Promise.reject(error);
  }
);

export const api = {
  login: async (username, password) => {
      // OAuth2PasswordRequestForm expects form-encoded data
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      
      const res = await axiosInstance.post('/token', formData, {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          }
      });
      return res.data;
  },
  getMappings: async () => {
    const res = await axiosInstance.get('/mappings');
    return res.data;
  },
  createMapping: async (data: { source_id: number; target_id: number; product_name: string }) => {
    const res = await axiosInstance.post('/mappings', data);
    return res.data;
  },
  deleteMapping: async (id: number) => {
    const res = await axiosInstance.delete(`/mappings/${id}`);
    return res.data;
  },
  getSettings: async () => {
    const res = await axiosInstance.get('/settings');
    return res.data;
  },
  updateSettings: async (settings: { sync_interval: number }) => {
    const res = await axiosInstance.post('/settings', settings);
    return res.data;
  },
  changePassword: async (data: { old_password: string; new_password: string }) => {
    const res = await axiosInstance.post('/change-password', data);
    return res.data;
  },
  runSync: async () => {
    const res = await axiosInstance.post('/sync/run');
    return res.data;
  },
};