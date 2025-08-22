'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import classes from '@/styles/language-switcher/languageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const queryClient = useQueryClient();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    queryClient.invalidateQueries(); // refetch queries after lang change
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
