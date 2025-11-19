'use client';

import LightGallery from 'lightgallery/react';

// Styles
import 'lightgallery/css/lg-autoplay.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lightgallery.css';

import classes from '@/styles/events/event-photos/eventPhotos.module.css';
import resultsClasses from '@/styles/events/event-results/eventResults.module.css';
import Image from 'next/image';

import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgZoom from 'lightgallery/plugins/zoom';
import { useTranslation } from 'react-i18next';

export default function EventPhotos({ images }) {
  const { t } = useTranslation('events');

  // ✅ skip cover image and map to gallery objects
  const photos = images?.slice(1)?.map((url) => ({
    original: url,
    alt: 'Event photo', // no event.title, just generic alt
  }));

  if (!photos || photos.length === 0) {
    return (
      <div className={resultsClasses.resultsContainer}>
        <p className={resultsClasses.noResultsMessage}>
          {t('photos.noPhotosMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className={classes.eventGallery}>
      <LightGallery plugins={[lgZoom, lgFullscreen, lgAutoplay]}>
        {photos.map((img, i) => (
          <a key={i} href={img.original} className={classes.galleryItem}>
            <Image
              src={img.thumb}
              alt={img.alt}
              width={400}
              height={300}
              loading="lazy"
              className={classes.thumbImage}
            />
          </a>
        ))}
      </LightGallery>
    </div>
  );
}
