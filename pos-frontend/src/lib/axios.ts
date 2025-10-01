import Axios, { AxiosRequestConfig, AxiosResponse, AxiosError, isAxiosError } from 'axios';
import { setAccessToken, getAccessToken, clearAuth } from '@/stores/userStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh token management
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Request interceptor - optimized
axios.interceptors.request.use((config) => {
  try {
    const url = (config.url || '').toString();

    // Skip auth for auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return config;
    }

    const token = getAccessToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('Token retrieval error:', e);
  }
  return config;
});

// Improved refresh token logic
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const response = await axios.post('/auth/refresh');
    const newToken = response.data?.accessToken;

    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    throw new Error('No access token received');
  } catch (error) {
    clearAuth();
    // Redirect to login only on client side
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw error;
  }
};

// Response interceptor with better error handling
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError & { config?: AxiosRequestConfig }) => {
    const originalConfig = error.config;
    if (!originalConfig) return Promise.reject(error);

    // Handle 401 errors
    if (isAxiosError(error) && error.response?.status === 401 && !originalConfig.url?.includes('/auth/')) {      // Prevent infinite refresh loops
      // @ts-ignore
      if (originalConfig._retry) {
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // @ts-ignore
      originalConfig._retry = true;

      // Use shared refresh promise to prevent multiple refresh requests
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      try {
        const newToken = await refreshPromise;
        if (newToken && originalConfig.headers) {
          originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(originalConfig);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE };
export default axios;