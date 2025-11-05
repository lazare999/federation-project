'use client';

import { fetchEventById } from '@/actions/event-actions/eventActions';
import EventPhotos from '@/components/event/event-details/event-photos/eventPhotos';
import EventResults from '@/components/event/event-details/event-results/eventResults';
import EventTimeSchedule from '@/components/event/event-details/event-time-schedule/eventTimeSchedule';
import Loader from '@/components/loader/loader';
import classes from '@/styles/events/event-details/eventDetails.module.css';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EventTimer from '../event-timer/eventTimer';

export default function EventDetailsClient({ eventId }) {
  const { t } = useTranslation('events');
  const [activeTab, setActiveTab] = useState('results');
  const [scrollToCompId, setScrollToCompId] = useState(null);

  const {
    data: event,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventById(eventId),
  });
  console.log(event);
  useEffect(() => {
    // Wait for tab to switch to "results" and then scroll
    if (activeTab === 'results' && scrollToCompId) {
      const el = document.getElementById(`competition-${scrollToCompId}`);
      if (el) {
        const header = document.querySelector('header');
        const yOffset = header ? -header.offsetHeight : -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setScrollToCompId(null); // reset after scroll
    }
  }, [activeTab, scrollToCompId]);

  if (isLoading) return <Loader />;
  if (error) return <div>{t('details.error')}</div>;
  if (!event) return <div>{t('details.notFound')}</div>;

  //  Determine if event is upcoming
  const isUpcoming = new Date(event.date) > new Date();
  console.log(event.date);
  return (
    <div>
      {/* Time Schedule */}
      <div className={classes.container}>
        <h2 className={classes.heading}>{t('details.timeSchedule')}</h2>
        <div className={classes.underline}></div>
        <div className={classes.TimeScheduleContainer}>
          <EventTimeSchedule
            event={event}
            onShowResultsTab={(compId) => {
              setActiveTab('results');
              setScrollToCompId(compId);
            }}
          />
        </div>
      </div>

      {/* Only show timer if event is upcoming */}
      {isUpcoming && <EventTimer event={event} />}

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
        <div id="results-section">
          <EventResults event={event} />
        </div>
      ) : (
        <EventPhotos event={event} />
      )}
    </div>
  );
}
