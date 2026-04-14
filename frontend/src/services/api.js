import axios from 'axios';
import { ENV } from '../config/env';

const createApiClient = (baseURL) => {
  const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' }
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return api;
};

export const authApi = createApiClient(ENV.AUTH_API_URL);
export const accountApi = createApiClient(ENV.ACCOUNT_API_URL);
export const reportApi = createApiClient(ENV.REPORT_API_URL);
export const weatherApi = createApiClient(ENV.WEATHER_API_URL);
