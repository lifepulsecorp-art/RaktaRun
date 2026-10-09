import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const localToken = localStorage.getItem('lifepulse_token');
  if (localToken) {
    config.headers.Authorization = `Bearer ${localToken}`;
  } else {
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // continue in local mode
    }
  }
  return config;
});

export { api };
export default api;
