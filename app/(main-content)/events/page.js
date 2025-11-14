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

export const metadata = {
  title: 'Equestrian Events Georgia | Showjumping & Competitions',
  description:
    'Find upcoming and previous equestrian events in Georgia, including showjumping competitions, tournaments, and federation events.',
  keywords: [
    'equestrian events georgia',
    'horse events georgia',
    'showjumping georgia',
    'georgian equestrian federation events',
    'horse competitions georgia',
  ],
  openGraph: {
    title: 'Equestrian Events in Georgia',
    description:
      'Browse upcoming and past horse events and competitions in Georgia.',
    url: 'https://georgianequestrianfederation.ge/events',
    type: 'website',
  },
};

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
    const eventDate = new Date(event.date);

    if (selectedCategory === 'all') {
      return true;
    } else if (selectedCategory === 'upcoming') {
      return eventDate >= now;
    } else if (selectedCategory === 'previous') {
      return eventDate < now;
    }
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
          {filteredEvents.map((event) => (
            <EventCard key={event.id || event.$id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
