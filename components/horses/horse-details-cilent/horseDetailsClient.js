'use client';

import styles from '@/styles/horses/horse-details/horseDetails.module.css';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ImageViewer from 'react-simple-image-viewer';

export default function HorseDetailsClient({ horse }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const { t } = useTranslation('horses');

  const openViewer = (index) => {
    setCurrentImage(index);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.name}>{horse.name}</h1>
      <div className={styles.info}>
        <p>
          <strong>{t('labels.birthYear')}:</strong> {horse.birth_year}
        </p>
        <p>
          <strong>{t('labels.gender')}:</strong> {horse.gender}
        </p>
        <p>
          <strong>{t('labels.color')}:</strong> {horse.color}
        </p>
        <p>
          <strong>{t('labels.studbook')}:</strong> {horse.studbook}
        </p>
      </div>

      <div className={styles.gallery}>
        {horse.images?.map((img, idx) => (
          <div
            key={idx}
            className={styles.galleryItem}
            onClick={() => openViewer(idx)}
          >
            <Image
              src={img}
              alt={`${horse.name} ${idx + 1}`}
              width={300}
              height={200}
              className={styles.galleryImage}
            />
          </div>
        ))}
      </div>

      {isViewerOpen && (
        <ImageViewer
          src={horse.images}
          currentIndex={currentImage}
          onClose={closeViewer}
          disableScroll={false}
          backgroundStyle={{
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            fontFamily: 'initial',
          }}
          closeOnClickOutside={true}
        />
      )}
    </div>
  );
}
