'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../../locales/en/common.json';
import ka from '../../locales/ka/common.json';
import sidebarEn from '../../locales/en/sidebar.json'
import sidebarKa from '../../locales/ka/sidebar.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { common: en, sidebar: sidebarEn },
      ka: { common: ka, sidebar: sidebarKa },
    },
  });

export default i18n;
