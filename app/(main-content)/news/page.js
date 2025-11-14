'use client';

import NewsList from '@/components/news/news-list/newsList';
import classes from '@/styles/news/news-page/newsPage.module.css';
import { useTranslation } from 'react-i18next';

export const metadata = {
  title: 'Equestrian News Georgia | Georgian Equestrian Federation',
  description:
    'Latest equestrian news in Georgia: competitions, events, riders, horses, and updates from the Georgian Equestrian Federation.',
  keywords: [
    'equestrian news georgia',
    'georgia horse news',
    'georgian equestrian federation news',
    'horse competitions georgia',
    'showjumping georgia',
  ],
  openGraph: {
    title: 'Equestrian News Georgia',
    description:
      'Breaking equestrian news and updates from Georgia’s equestrian community.',
    url: 'https://georgianequestrianfederation.ge/news',
    siteName: 'Georgian Equestrian Federation',
    type: 'website',
  },
};

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
