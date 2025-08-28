'use client';

import classes from '@/styles/horses/horses-list/horsesList.module.css';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function HorseCard({ horse, onClick }) {
  const { t } = useTranslation('horses');

  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Mouse events
  const handleMouseDown = (e) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDragging(false);
  };

  const handleMouseMove = (e) => {
    if (
      Math.abs(e.clientX - dragStart.current.x) > 10 ||
      Math.abs(e.clientY - dragStart.current.y) > 10
    ) {
      setDragging(true);
    }
  };

  const handleMouseUp = () => {
    if (!dragging) {
      onClick(horse.id);
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    dragStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setDragging(false);
  };

  const handleTouchMove = (e) => {
    if (
      Math.abs(e.touches[0].clientX - dragStart.current.x) > 10 ||
      Math.abs(e.touches[0].clientY - dragStart.current.y) > 10
    ) {
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
