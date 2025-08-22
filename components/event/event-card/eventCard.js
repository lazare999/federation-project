'use client';

import classes from '@/styles/events/event-card/eventCard.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function EventCard({ event, onClick, isCarouselCard }) {
  const router = useRouter();

  const handleCardClick = () => {
    if (onClick) {
      onClick(event.id || event.$id);
    } else {
      router.push(`/events/${event.id || event.$id}`);
    }
  };

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
          src={event.image || '/placeholder.jpg'}
          alt={event.title}
          fill
          className={classes.image}
          sizes="(max-width: 768px) 100vw, 33vw"
          priority
        />
      </div>
      <div className={classes.infoCard}>
        <h2 className={classes.title}>{event.title}</h2>
        <p className={classes.date}>{event.date}</p>
      </div>
    </div>
  );
}
