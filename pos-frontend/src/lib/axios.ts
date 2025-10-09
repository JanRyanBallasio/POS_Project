import Axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axios = Axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axios;
export { API_BASE };