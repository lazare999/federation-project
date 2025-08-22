'use client';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { getAllNews } from '@/actions/news-actions/newsAction';
import Loader from '@/components/loader/loader';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import NewsCard from '../news-card/newsCard';

export default function NewsCarousel() {
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

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      partialVisibilityGutter: 40,
    },
    tablet: {
      breakpoint: { max: 780, min: 464 },
      items: 2,
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 500, min: 0 },
      items: 1,
      partialVisibilityGutter: 30,
    },
  };

  return (
    <Carousel
      additionalTransfrom={0}
      arrows
      autoPlaySpeed={3000}
      centerMode={false}
      containerClass="container"
      draggable
      keyBoardControl
      minimumTouchDrag={80}
      pauseOnHover
      responsive={responsive}
      rewind={false}
      rewindWithAnimation={false}
      rtl={false}
      shouldResetAutoplay
      showDots={false}
      slidesToSlide={1}
      swipeable
    >
      {newsItems.map((item) => (
        <NewsCard key={item.id} item={item} isCarouselCard />
      ))}
    </Carousel>
  );
}
