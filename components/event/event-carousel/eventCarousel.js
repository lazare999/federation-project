'use client';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

import { getEvents } from '@/actions/event-actions/eventActions';
import { useQuery } from '@tanstack/react-query';
import EventCard from '../event-card/eventCard';

export default function EventCarousel() {
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading events</div>;

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
      partialVisibilityGutter: 40,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
      partialVisibilityGutter: 30,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
      partialVisibilityGutter: 30,
    },
  };

  return (
    <Carousel
      additionalTransfrom={0}
      arrows
      autoPlaySpeed={3000}
      centerMode={false}
      containerClass="container"
      draggable
      keyBoardControl
      minimumTouchDrag={80}
      pauseOnHover
      responsive={responsive}
      rewind={false}
      rewindWithAnimation={false}
      rtl={false}
      shouldResetAutoplay
      showDots={false}
      slidesToSlide={1}
      swipeable
    >
      {events.map((event) => (
        <EventCard
          key={event.id || event.$id}
          event={event}
          isCarouselCard={true}
        />
      ))}
    </Carousel>
  );
}
