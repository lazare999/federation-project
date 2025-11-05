'use client';

import { fetchNewsById } from '@/actions/news-actions/newsAction';
import Loader from '@/components/loader/loader';
import classes from '@/styles/news/news-details/newsDetails.module.css';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

export default function NewsDetailsClient({ newsId }) {
  const { t } = useTranslation('news');

  const {
    data: news,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['news', newsId],
    queryFn: () => fetchNewsById(newsId),
  });

  if (isLoading) return <Loader message={t('loading', 'Loading...')} />;
  if (error) return <h1>{t('error', 'Error loading news')}</h1>;
  if (!news) return <h1>{t('notFound', 'News not found')}</h1>;

  // 🔹 Format date to DD-MM-YYYY
  const formattedDate = new Date(news.created_at)
    .toLocaleDateString('en-GB') // gives e.g. "28/08/2025"
    .replace(/\//g, '-'); // convert slashes to dashes

  return (
    <div>
      <h1 className={classes.title}>{news.title}</h1>
      <div className={classes.imgAndDescriptionContainer}>
        {news.images?.length > 0 && (
          <Image
            src={news.images[0]}
            alt={news.title}
            width={800}
            height={500}
          />
        )}
        <p>{news.content}</p>
        <p className={classes.date}>{formattedDate}</p>
      </div>
    </div>
  );
}
