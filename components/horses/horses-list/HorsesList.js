'use client';

import classes from '@/styles/horses/horses-list/horsesList.module.css';
import { useRouter } from 'next/navigation';
import HorseCard from '../horse-card/horseCard';

export default function HorsesList({ horses }) {
  // const { t } = useTranslation('horses');
  const router = useRouter();

  const handleCardClick = (horseId) => {
    router.push(`/horses/${horseId}`);
  };

  return (
    <div className={classes.gridContainer}>
      {horses.map((horse) => (
        <HorseCard key={horse.id} horse={horse} onClick={handleCardClick} />
      ))}
    </div>
  );
}
