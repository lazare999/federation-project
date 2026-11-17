import { getApiOriginOrFallback } from '@/lib/api/api-base';
import { currentApiLanguage } from '@/lib/i18n/apiLanguage';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${getApiOriginOrFallback()}/api/`,
  timeout: 20000,
});

axiosInstance.interceptors.request.use((config) => {
  // Callers may pin a language (e.g. prefetching the other language);
  // otherwise use the language the UI is showing right now.
  if (!config.headers['Accept-Language']) {
    config.headers['Accept-Language'] = currentApiLanguage();
  }
  return config;
});

export default axiosInstance;
