import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crewensia.session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error?.message ?? error?.response?.data?.message ?? fallback;
}
