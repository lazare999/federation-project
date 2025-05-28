'use client';

import { useState, useEffect } from 'react';
import { getEvents } from '@/actions/event-actions/eventActions';
import EventCard from '@/components/event/event-card/eventCard';
import classes from '@/styles/events/event-page/events.module.css';
import EventFilter from '@/components/event/event-filter/eventFilter';

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
        <p className={classes.empty}>Loading...</p>
      ) : (
        <EventCard events={filteredEvents} />
      )}
    </div>
  );
}
