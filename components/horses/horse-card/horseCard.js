'use client';

import classes from '@/styles/horses/horses-list/horsesList.module.css';
import { useTranslation } from 'react-i18next';

import { useRef, useState } from 'react';

export default function HorseCard({ horse, onClick }) {
  const { t } = useTranslation('horses');

  // Track if dragging
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);

  const handleMouseDown = (e) => {
    dragStartX.current = e.clientX;
    setDragging(false);
  };

  const handleMouseMove = (e) => {
    if (Math.abs(e.clientX - dragStartX.current) > 5) {
      setDragging(true);
    }
  };

  const handleMouseUp = () => {
    if (!dragging) {
      onClick(horse.id);
    }
  };

  // For touch devices:
  const dragStartTouchX = useRef(0);

  const handleTouchStart = (e) => {
    dragStartTouchX.current = e.touches[0].clientX;
    setDragging(false);
  };

  const handleTouchMove = (e) => {
    if (Math.abs(e.touches[0].clientX - dragStartTouchX.current) > 5) {
      setDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (!dragging) {
      onClick(horse.id);
    }
  };

  return (
    <div
      className={classes.card}
      style={{
        backgroundImage: `url(${horse.images?.[0] || ''})`,
        cursor: 'pointer',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={classes.overlay}></div>
      <div className={classes.name}>{horse.name}</div>
      <div className={classes.infoBox}>
        <div className={classes.info}>
          {t('labels.birthYear')}: {horse.birth_year}
        </div>
        <div className={classes.info}>
          {t('labels.gender')}: {horse.gender}
        </div>
        <div className={classes.info}>
          {t('labels.color')}: {horse.color}
        </div>
        <div className={classes.info}>
          {t('labels.studbook')}: {horse.studbook}
        </div>
      </div>
    </div>
  );
}
