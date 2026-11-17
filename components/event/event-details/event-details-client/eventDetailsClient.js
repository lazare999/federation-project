'use client';

import { fetchEventById } from '@/actions/event-actions/eventActions';
import Loader from '@/components/loader/loader';
import { otherApiLanguage } from '@/lib/i18n/apiLanguage';
import classes from '@/styles/events/event-details/eventDetails.module.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function retryUnlessMissing(failureCount, err) {
  const status = err?.status || err?.response?.status;
  if (status === 404 || status === 400) return false;
  return failureCount < 1;
}

export default function EventDetailsClient({ eventId }) {
  const { t, i18n } = useTranslation('events');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('results');
  const [scrollToCompId, setScrollToCompId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: event,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['event', eventId, lang],
    queryFn: () => fetchEventById(eventId, lang),
    enabled: mounted && Boolean(eventId),
    // While the other language loads, keep showing this event instead of a
    // full-page loader (only for the same event).
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey?.[1] === eventId ? previous : undefined,
    retry: retryUnlessMissing,
  });

  // Load the other language in the background so switching is instant.
  useEffect(() => {
    if (!event || !eventId) return;
    const other = otherApiLanguage(lang);
    queryClient.prefetchQuery({
      queryKey: ['event', eventId, other],
      queryFn: () => fetchEventById(eventId, other),
      retry: retryUnlessMissing,
    });
  }, [event, eventId, lang, queryClient]);

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

      {/* Registration is only available from the rider cabinet. */}

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
