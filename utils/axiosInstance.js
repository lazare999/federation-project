import i18n from '@/lib/i18n/i18n';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

const axiosInstance = axios.create({
  baseURL: API_URL ? `${API_URL}/api/` : 'https://web-production-a673b.up.railway.app/api/',
});

axiosInstance.interceptors.request.use((config) => {
  // Read the current language when the request is sent
  const currentLang = i18n.language || 'en';
  config.headers['Accept-Language'] = currentLang;
  return config;
});

export default axiosInstance;
