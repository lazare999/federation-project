'use client';

import NewsList from '@/components/news/news-list/newsList';
import classes from '@/styles/news/news-page/newsPage.module.css';
import { useTranslation } from 'react-i18next';

export default function News() {
  const { t } = useTranslation('news');

  return (
    <div className={classes.newsPage}>
      <h1 className={classes.heading}>{t('newsTitle', 'NEWS')}</h1>
      <div className={classes.underline}></div>
      <NewsList />
    </div>
  );
}
