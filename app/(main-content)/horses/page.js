'use client';

import { getHorses } from '@/actions/horse-action/horseAction';
import HorseFilter from '@/components/horses/horse-filter/HorseFilter';
import HorsesList from '@/components/horses/horses-list/HorsesList';
import Loader from '@/components/loader/loader';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Horses() {
  const { i18n } = useTranslation('horses');

  const {
    data: horses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['horses', i18n.language],
    queryFn: getHorses,
  });

  console.log(horses);

  const [filteredHorses, setFilteredHorses] = useState([]);

  const handleFilter = ({ category, name }) => {
    const filtered = horses.filter((horse) => {
      const matchCategory = category
        ? horse.category.toLowerCase() === category.toLowerCase()
        : true;
      const matchName = name
        ? horse.name.toLowerCase().includes(name.toLowerCase())
        : true;
      return matchCategory && matchName;
    });

    setFilteredHorses(filtered);
  };

  const horsesToShow = filteredHorses.length > 0 ? filteredHorses : horses;

  if (isLoading) return <Loader />;
  if (error) return <div>Failed to load horses</div>;

  return (
    <div>
      <HorseFilter onFilter={handleFilter} />
      {horsesToShow.length > 0 ? (
        <HorsesList horses={horsesToShow} />
      ) : (
        <div>No horses found</div>
      )}
    </div>
  );
}
