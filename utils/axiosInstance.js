import { getApiOriginOrFallback } from '@/lib/api/api-base';
import axios from 'axios';

function getAcceptLanguage() {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage?.getItem('i18nextLng');
    if (stored) return stored.slice(0, 2);
  } catch {
    /* ignore */
  }
  return 'en';
}

const axiosInstance = axios.create({
  baseURL: `${getApiOriginOrFallback()}/api/`,
  timeout: 20000,
});

axiosInstance.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = getAcceptLanguage();
  return config;
});

export default axiosInstance;
