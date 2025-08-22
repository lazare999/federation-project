'use client';

import classes from '@/styles/events/event-results/eventResults.module.css';
import { useTranslation } from 'react-i18next';

export default function EventPhotos({ event }) {
  const { t } = useTranslation('events');

  const noPhotos = !event.photos || event.photos.length === 0;

  return (
    <div className={classes.resultsContainer}>
      <h2 className={classes.title}>{event.title.toUpperCase()}</h2>

      {noPhotos ? (
        <p className={classes.noResultsMessage}>
          {t('photos.noPhotosMessage')}
        </p>
      ) : (
        <div className={classes.grid}>
          {event.photos.map((photo, index) => (
            <img
              key={index}
              src={photo.url}
              alt={event.title}
              className={classes.photo}
            />
          ))}
        </div>
      )}
    </div>
  );
}
