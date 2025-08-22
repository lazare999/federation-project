'use client';

import classes from '@/styles/news/news-card/newsCard.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function NewsCard({ item, isCarouselCard = false }) {
  const router = useRouter();
  const { t } = useTranslation('news');

  const handleCardClick = () => {
    router.push(`/news/${item.id}`);
  };
  console.log(item);
  return (
    <div
      className={`${classes.card} ${
        isCarouselCard ? classes.carouselMargin : ''
      }`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={classes.imageWrapper}>
        <Image
          src={item.images?.[0] || '/fallback-image.jpg'}
          alt={item.title || 'News Image'}
          width={400}
          height={250}
          className={classes.img}
        />
      </div>
      {item.title && <div className={classes.title}>{item.title}</div>}
      <div className={classes.readMore}>{t('read_more')}</div>
    </div>
  );
}
