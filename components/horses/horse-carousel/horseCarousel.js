'use client';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { getHorses } from '@/actions/horse-action/horseAction'; // your fetch function
import classes from '@/styles/horses/horses-list/horsesList.module.css';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import HorseCard from '../horse-card/horseCard';

export default function HorseCarousel() {
  const { t } = useTranslation('horses');
  const router = useRouter();

  const {
    data: horses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['horses'],
    queryFn: getHorses,
  });

  const handleCardClick = (horseId) => {
    router.push(`/horses/${horseId}`);
  };

  if (isLoading) return <div>{t('loading')}</div>;
  if (error) return <div>{t('error_loading_horses')}</div>;

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      partialVisibilityGutter: 40,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      partialVisibilityGutter: 30,
    },
  };

  return (
    <Carousel
      additionalTransfrom={0}
      arrows
      autoPlaySpeed={10}
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
      {horses.map((horse) => (
        <HorseCard
          key={horse.id}
          horse={horse}
          onClick={handleCardClick}
          itemClass={classes.carouselCard}
        />
      ))}
    </Carousel>
  );
}
