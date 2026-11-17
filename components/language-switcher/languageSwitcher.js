'use client';

import { useTranslation } from 'react-i18next';

import classes from '@/styles/language-switcher/languageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');

  // Every API query key includes the language, so switching simply makes the
  // queries for the new language load. Invalidating the old-language queries
  // here used to refetch them in the *new* language and cache that under the
  // old key, which showed wrong / missing names after switching back.
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={classes.languageSwitcher}>
      <h2
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? classes.activeLang : ''}
      >
        {t('header.languageEnglish')}
      </h2>
      <span>&#x2F;</span>
      <h2
        onClick={() => changeLanguage('ka')}
        className={i18n.language === 'ka' ? classes.activeLang : ''}
      >
        {t('header.languageGeorgian')}
      </h2>
    </div>
  );
}
