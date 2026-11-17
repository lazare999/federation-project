import i18n from '@/lib/i18n/i18n';

const SUPPORTED = ['en', 'ka'];

/**
 * Language to request translated API content in (Accept-Language).
 * Reads the live i18next language, so it is correct the moment the user
 * switches — unlike localStorage, which the detector updates separately.
 */
export function currentApiLanguage() {
  const lang = String(i18n.resolvedLanguage || i18n.language || 'en')
    .slice(0, 2)
    .toLowerCase();
  return SUPPORTED.includes(lang) ? lang : 'en';
}

export function otherApiLanguage(lang) {
  return lang === 'ka' ? 'en' : 'ka';
}
