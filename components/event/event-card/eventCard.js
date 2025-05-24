// components/EventGrid.js
'use client';

import classes from '@/styles/events/event-card/eventCard.module.css';

export default function EventCard({ events }) {
  return (
    <div className={classes.grid}>
      {events.map((event) => (
        <div key={event.$id} className={classes.card}>
          <div
            className={classes.image}
            style={{ backgroundImage: `url(${event.images?.[0] || '/placeholder.jpg'})` }}
          />
          <div className={classes.infoCard}>
            <h2 className={classes.title}>{event.title}</h2>
            <p className={classes.date}>{event.formattedDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
