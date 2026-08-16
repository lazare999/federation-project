'use client';

import classes from '@/styles/news/news-card/newsCard.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function NewsCard({
  item,
  isCarouselCard = false,
  priority = false,
}) {
  const router = useRouter();
  const { t } = useTranslation('news');

  const handleCardClick = () => {
    router.push(`/news/${item.id}`);
  };

  const coverImage =
    item.cover_image || item.images?.[0] || '/fallback-image.jpg';

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
          src={coverImage}
          alt={item.title || 'News Image'}
          width={400}
          height={250}
          className={classes.img}
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={priority}
        />
      </div>
      {item.title && <div className={classes.title}>{item.title}</div>}
      <div className={classes.readMore}>{t('read_more')}</div>
    </div>
  );
}
