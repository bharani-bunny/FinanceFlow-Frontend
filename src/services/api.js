import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('financeflow-token');
  const isAuthRequest = config.url?.startsWith('/auth/');
  if (token && !isAuthRequest) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) window.dispatchEvent(new Event('financeflow:unauthorized'));
  return Promise.reject(error);
});

export default api;
