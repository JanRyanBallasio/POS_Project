import Axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: false, // No cookies needed
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple request interceptor (no auth)
axios.interceptors.request.use((config) => {
  return config;
});

// Simple response interceptor (no auth handling)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default axios;
export { API_BASE };