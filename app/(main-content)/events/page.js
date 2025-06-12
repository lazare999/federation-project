'use client';

import { getEvents } from '@/actions/event-actions/eventActions';
import { useEffect, useState } from 'react';

import EventCard from '@/components/event/event-card/eventCard';
import EventFilter from '@/components/event/event-filter/eventFilter';

import Loader from '@/components/loader/loader';
import classes from '@/styles/events/event-page/events.module.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all'); // active filter
  const [pendingCategory, setPendingCategory] = useState('all'); // value in select dropdown

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };

    fetchEvents();
  }, []);

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

  return (
    <div className={classes.wrapper}>
      <EventFilter
        selectedCategory={pendingCategory}
        onCategoryChange={setPendingCategory}
        onFilterClick={() => setSelectedCategory(pendingCategory)}
      />
      {filteredEvents.length === 0 ? (
        <Loader />
      ) : (
        <EventCard events={filteredEvents} />
      )}
    </div>
  );
}
