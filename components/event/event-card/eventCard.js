'use client';

import classes from '@/styles/events/event-card/eventCard.module.css';
import Image from 'next/image';

export default function EventCard({ events }) {
  return (
    <div className={classes.grid}>
      {events.map((event) => (
        <div key={event.$id} className={classes.card}>
          <div className={classes.imageWrapper}>
            <Image
              src={event.images?.[0] || '/placeholder.jpg'}
              alt={event.title}
              fill
              className={classes.image}
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
            />
          </div>
          <div className={classes.infoCard}>
            <h2 className={classes.title}>{event.title}</h2>
            <p className={classes.date}>{event.formattedDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
