'use client';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import common translations
import en from '../../locales/en/common.json';
import contactEn from '../../locales/en/contact.json';
import enEvents from '../../locales/en/events.json';
import footerEn from '../../locales/en/footer.json';
import enHorses from '../../locales/en/horses.json';
import newsEn from '../../locales/en/news.json';
import sidebarEn from '../../locales/en/sidebar.json';
import sponsorsEn from '../../locales/en/sponsors.json';
import standingsEn from '../../locales/en/standings.json';

import ka from '../../locales/ka/common.json';
import contactKa from '../../locales/ka/contact.json';
import kaEvents from '../../locales/ka/events.json';
import footerKa from '../../locales/ka/footer.json';
import kaHorses from '../../locales/ka/horses.json';
import newsKa from '../../locales/ka/news.json';
import sidebarKa from '../../locales/ka/sidebar.json';
import sponsorsKa from '../../locales/ka/sponsors.json';
import standingsKa from '../../locales/ka/standings.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    supportedLngs: ['en', 'ka'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: en,
        sidebar: sidebarEn,
        events: enEvents,
        horses: enHorses,
        news: newsEn,
        footer: footerEn,
        contact: contactEn,
        sponsors: sponsorsEn,
        standings: standingsEn,
      },
      ka: {
        common: ka,
        sidebar: sidebarKa,
        events: kaEvents,
        horses: kaHorses,
        news: newsKa,
        footer: footerKa,
        contact: contactKa,
        sponsors: sponsorsKa,
        standings: standingsKa,
      },
    },
  });

export default i18n;
