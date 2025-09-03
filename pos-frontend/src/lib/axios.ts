import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

const rawEnv = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const env = rawEnv.replace(/\/+$/g, ''); // remove trailing slash
const API_BASE = env.includes('/api') ? env : `${env}/api`;

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send refresh cookie
});

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

export default axios;