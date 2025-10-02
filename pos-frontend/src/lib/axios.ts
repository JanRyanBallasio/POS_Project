import Axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 10000, // Reduced timeout for faster fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axios.interceptors.request.use((config) => {
  return config;
});

// Enhanced response interceptor with graceful error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different types of errors gracefully
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend server not available:', API_BASE);
      // Return empty data instead of throwing error
      return Promise.resolve({
        data: { data: [], success: false, message: 'Server not available' },
        status: 200
      });
    }
    
    if (error.response?.status === 500) {
      console.warn('⚠️ Server error, returning empty data');
      return Promise.resolve({
        data: { data: [], success: false, message: 'Server error' },
        status: 200
      });
    }

    // For other errors, log but don't crash
    console.error('API Error:', error.message);
    return Promise.resolve({
      data: { data: [], success: false, message: error.message },
      status: error.response?.status || 500
    });
  }
);

export default axios;
export { API_BASE };