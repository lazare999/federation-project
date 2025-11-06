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

import lgAutoplay from 'lightgallery/plugins/autoplay';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgZoom from 'lightgallery/plugins/zoom';
import { useTranslation } from 'react-i18next';
// import lgThumbnail from 'lightgallery/plugins/thumbnail';

export default function EventPhotos({ event }) {
  const { t } = useTranslation('events');

  // ✅ Skip index 0 (cover image)
  const images = event?.images?.slice(1)?.map((url) => ({
    original: url,
    thumb: url,
    alt: event?.title || 'Event photo',
  }));

  // ✅ If no images left after slicing → fallback UI
  if (!images || images.length === 0) {
    return (
      <div className={resultsClasses.resultsContainer}>
        <p className={resultsClasses.noResultsMessage}>
          {t('photos.noPhotosMessage')}
        </p>
      </div>
    );
  }

  const onInit = () => {
    console.log('lightGallery Initialized');
  };

  return (
    <div className={classes.eventGallery}>
      <LightGallery
        onInit={onInit}
        speed={400}
        plugins={[lgZoom, lgFullscreen, lgAutoplay]}
        allowMediaOverlap={true}
        zoomFromOrigin={false}
        zoomMax={1.5}
      >
        {images.map((img, index) => (
          <a key={index} href={img.original} className={classes.galleryItem}>
            <img src={img.thumb} alt={img.alt} loading="lazy" />
          </a>
        ))}
      </LightGallery>
    </div>
  );
}
