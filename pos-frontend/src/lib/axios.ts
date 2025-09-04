import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const rawFromEnv =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_backend_api_url ??
  '';

const browserFallback =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`
    : '';

// normalize env: trim and remove surrounding quotes
const normalize = (v: unknown) => (v ? String(v).trim().replace(/^["']|["']$/g, '') : '');
const rawEnv = normalize(rawFromEnv) || browserFallback || 'http://localhost:5000';
const env = rawEnv.replace(/\/+$/g, ''); // remove trailing slash
const API_BASE = env.includes('/api') ? env : `${env}/api`;

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send refresh cookie
});

// log the baseURL in browser console to verify which backend is used
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.debug('[api] axios baseURL =', API_BASE);
}

// ...existing code (interceptors, queue handling)...
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (error: any) => void;
  config: AxiosRequestConfig;
}[] = [];


const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) return reject(error);
    if (token && config && config.headers) config.headers['Authorization'] = `Bearer ${token}`;
    resolve(axios(config));
  });
  failedQueue = [];
};

axios.interceptors.request.use((config) => {
  try {
    // don't attach Authorization header for auth routes (login, register, refresh)
    const url = (config.url || '').toString();
    if (url.includes('/auth/')) return config;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) { }
  return config;
});

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError & { config?: AxiosRequestConfig }) => {
    const originalConfig = error.config;
    if (!originalConfig) return Promise.reject(error);

    // If 401 and not a refresh attempt, try refresh
    // @ts-ignore
    if (error.response && error.response.status === 401 && !originalConfig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalConfig });
        });
      }

      // @ts-ignore
      originalConfig._retry = true;
      isRefreshing = true;

      try {
        const refreshResp = await axios.post('/auth/refresh'); // cookie sent automatically
        const newToken = (refreshResp.data && refreshResp.data.accessToken) || null;
        if (newToken) {
          try {
            localStorage.setItem('accessToken', newToken);
          } catch (e) { }
        }
        processQueue(null, newToken);
        return axios(originalConfig);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // clear stored tokens & user
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
        } catch (e) { }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE }; // <-- export canonical API base for other modules to import
export default axios;
// ...existing code...