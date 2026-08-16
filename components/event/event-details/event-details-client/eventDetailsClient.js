'use client';

import { fetchEventById } from '@/actions/event-actions/eventActions';
import Loader from '@/components/loader/loader';
import classes from '@/styles/events/event-details/eventDetails.module.css';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const EventTimeSchedule = dynamic(
  () =>
    import(
      '@/components/event/event-details/event-time-schedule/eventTimeSchedule'
    ),
  { ssr: false, loading: () => <Loader /> }
);

const EventResults = dynamic(
  () => import('@/components/event/event-details/event-results/eventResults'),
  { ssr: false, loading: () => <Loader /> }
);

const EventPhotos = dynamic(
  () => import('@/components/event/event-details/event-photos/eventPhotos'),
  { ssr: false, loading: () => <Loader /> }
);

const EventTimer = dynamic(
  () => import('@/components/event/event-details/event-timer/eventTimer'),
  { ssr: false }
);

export default function EventDetailsClient({ eventId }) {
  const { t, i18n } = useTranslation('events');
  const [activeTab, setActiveTab] = useState('results');
  const [scrollToCompId, setScrollToCompId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: event,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['event', eventId, i18n.language],
    queryFn: () => fetchEventById(eventId),
    enabled: mounted && Boolean(eventId),
    retry: (failureCount, err) => {
      const status = err?.status || err?.response?.status;
      if (status === 404 || status === 400) return false;
      return failureCount < 1;
    },
  });

  useEffect(() => {
    if (activeTab !== 'photos') return;
    if (!event?.images || event.images.length === 0) return;

    event.images.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, [activeTab, event?.images]);

  useEffect(() => {
    if (activeTab === 'results' && scrollToCompId) {
      const el = document.getElementById(`competition-${scrollToCompId}`);
      if (el) {
        const header = document.querySelector('header');
        const yOffset = header ? -header.offsetHeight : -80;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setScrollToCompId(null);
    }
  }, [activeTab, scrollToCompId]);

  if (!mounted || isLoading) return <Loader />;
  if (error) {
    const status = error?.status || error?.response?.status;
    const message =
      status === 404 ? t('details.notFound') : t('details.error');
    return <div>{message}</div>;
  }
  if (!event) return <div>{t('details.notFound')}</div>;

  const isUpcoming =
    typeof event.is_upcoming === 'boolean'
      ? event.is_upcoming
      : new Date(event.date) > new Date();

  return (
    <div>
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

      {isUpcoming && <EventTimer event={event} />}

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

      {activeTab === 'results' ? (
        <div id="results-section">
          <EventResults event={event} />
        </div>
      ) : (
        <EventPhotos images={event.images} />
      )}
    </div>
  );
}
