'use client';

import { getAllNews } from '@/actions/news-actions/newsAction';
import Loader from '@/components/loader/loader';
import classes from '@/styles/news/news-list/newsList.module.css';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import NewsCard from '../news-card/newsCard';

export default function NewsList() {
  const { t } = useTranslation('news');

  const {
    data: newsItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['news'],
    queryFn: getAllNews,
  });

  if (isLoading) return <Loader />;
  if (error) return <div>{t('failed_to_load_news')}</div>;

  return (
    <div className={classes.newsContainer}>
      {newsItems.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
