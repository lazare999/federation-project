'use client';

import { getEvents } from '@/actions/event-actions/eventActions';
import i18n from '@/lib/i18n/i18n';
import { useQuery } from '@tanstack/react-query';

import EventCard from '@/components/event/event-card/eventCard';
import EventFilter from '@/components/event/event-filter/eventFilter';

import Loader from '@/components/loader/loader';
import classes from '@/styles/events/event-page/events.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Events() {
  const { t } = useTranslation('events');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pendingCategory, setPendingCategory] = useState('all');

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['events', i18n.language],
    queryFn: getEvents,
  });

  const now = new Date();

  const filteredEvents = events.filter((event) => {
    if (selectedCategory === 'all') return true;

    if (typeof event.is_upcoming === 'boolean') {
      if (selectedCategory === 'upcoming') return event.is_upcoming;
      if (selectedCategory === 'previous') return !event.is_upcoming;
    }

    const eventDate = new Date(event.date);
    if (selectedCategory === 'upcoming') return eventDate >= now;
    if (selectedCategory === 'previous') return eventDate < now;
    return false;
  });

  if (isLoading) return <Loader />;
  if (error) return <div>{t('page.error')}</div>;

  return (
    <div className={classes.wrapper}>
      <EventFilter
        selectedCategory={pendingCategory}
        onCategoryChange={setPendingCategory}
        onFilterClick={() => setSelectedCategory(pendingCategory)}
      />
      {filteredEvents.length === 0 ? (
        <div>{t('page.noEvents')}</div>
      ) : (
        <div className={classes.grid}>
          {filteredEvents.map((event, index) => (
            <EventCard
              key={event.id || event.$id}
              event={event}
              priority={index < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
