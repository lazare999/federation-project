'use client';

import { fetchEventById } from '@/actions/event-actions/eventActions';
import EventPhotos from '@/components/event/event-details/event-photos/eventPhotos';
import EventResults from '@/components/event/event-details/event-results/eventResults';
import EventTimeSchedule from '@/components/event/event-details/event-time-schedule/eventTimeSchedule';
import Loader from '@/components/loader/loader';

import classes from '@/styles/events/event-details/eventDetails.module.css';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EventDetailsClient({ eventId }) {
  const { t } = useTranslation('events');
  const [activeTab, setActiveTab] = useState('results');

  const {
    data: event,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventById(eventId),
  });

  if (isLoading) return <Loader />;

  if (error) {
    return <div>{t('details.error')}</div>;
  }

  if (!event) {
    return <div>{t('details.notFound')}</div>;
  }

  return (
    <div>
      {/* Time Schedule section */}
      <div className={classes.container}>
        <h2 className={classes.heading}>{t('details.timeSchedule')}</h2>
        <div className={classes.underline}></div>
        <div className={classes.TimeScheduleContainer}>
          <EventTimeSchedule event={event} />
        </div>
      </div>

      {/* Tabs */}
      <div className={classes.buttonsContainer}>
        <button
          className={`${classes.button} ${
            activeTab === 'results' ? classes.active : ''
          }`}
          onClick={() => setActiveTab('results')}
        >
          {t('details.results')}
        </button>
        <button
          className={`${classes.button} ${
            activeTab === 'photos' ? classes.active : ''
          }`}
          onClick={() => setActiveTab('photos')}
        >
          {t('details.photos')}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'results' ? (
        <EventResults event={event} />
      ) : (
        <EventPhotos />
      )}
    </div>
  );
}
