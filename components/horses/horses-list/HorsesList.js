'use client';

import { useTranslation } from 'react-i18next';
import classes from '@/styles/horses/horses-list/horsesList.module.css';

export default function HorsesList({ horses }) {
  const { i18n } = useTranslation('horses');
  const isGeorgian = i18n.language === 'ka';

  // Define labels for both languages in a neat object
  const labels = {
    birthYear: {
      en: 'Birth Year',
      ka: 'დაბადების წელი',
    },
    gender: {
      en: 'Gender',
      ka: 'სქესი',
    },
    color: {
      en: 'Color',
      ka: 'ფერი',
    },
    studbook: {
      en: 'Studbook',
      ka: 'საშობაო წიგნი',
    },
 
    name: {
      en: 'Name',
      ka: 'სახელი',
    },
  };

  // Helper to get the right label by language
  const getLabel = (key) => (isGeorgian ? labels[key].ka : labels[key].en);

  return (
    <div className={classes.gridContainer}>
      {horses.map((horse) => {
        const localized = isGeorgian ? horse.geo : horse;

        return (
          <div
            key={horse.$id}
            className={classes.card}
            style={{
              backgroundImage: `url(${horse.images?.[0] || ''})`,
            }}
          >
            <div className={classes.overlay}></div>
            <div className={classes.name}>
              {/* Name label example (if you want to show label explicitly) */}
              {localized.name || horse.name}
            </div>
            <div className={classes.infoBox}>
              <div className={classes.info}>
                {getLabel('birthYear')}: {horse.birthYear}
              </div>
              <div className={classes.info}>
                {getLabel('gender')}: {localized.gender}
              </div>
              <div className={classes.info}>
                {getLabel('color')}: {localized.color}
              </div>
              <div className={classes.info}>
                {getLabel('studbook')}: {horse.studbook}
              </div>
           
            </div>
          </div>
        );
      })}
    </div>
  );
}
