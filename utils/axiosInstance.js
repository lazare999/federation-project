import i18n from '@/lib/i18n/i18n';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://equestrian-app.onrender.com/api/',
});

axiosInstance.interceptors.request.use((config) => {
  // Read the current language when the request is sent
  const currentLang = i18n.language || 'en';
  config.headers['Accept-Language'] = currentLang;
  return config;
});

export default axiosInstance;
