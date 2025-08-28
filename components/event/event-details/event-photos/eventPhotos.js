'use client';

import classes from '@/styles/events/event-results/eventResults.module.css';
import { useTranslation } from 'react-i18next';

export default function EventPhotos() {
  const { t } = useTranslation('events');

  return (
    <div className={classes.resultsContainer}>
      <p className={classes.noResultsMessage}>{t('photos.noPhotosMessage')}</p>
    </div>
  );
}
