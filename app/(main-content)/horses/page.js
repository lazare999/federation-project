'use client';

import { useEffect, useState } from 'react';
import { getHorses } from '@/actions/horse-action/horseAction';
import HorseFilter from '@/components/horses/horse-filter/HorseFilter';
import HorsesList from '@/components/horses/horses-list/HorsesList';

export default function Horses() {
  const [allHorses, setAllHorses] = useState([]);
  const [filteredHorses, setFilteredHorses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const horsesFromDB = await getHorses();
        setAllHorses(horsesFromDB);
        setFilteredHorses(horsesFromDB); // show all by default
      } catch (error) {
        console.error('Failed to fetch horses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorses();
  }, []);

  const handleFilter = ({ category, name }) => {
    const filtered = allHorses.filter((horse) => {
      const matchCategory = category ? horse.category === category : true;
      const matchName = name ? horse.name.toLowerCase().includes(name.toLowerCase()) : true;
      return matchCategory && matchName;
    });
    setFilteredHorses(filtered);
  };

  if (loading) return <p>Loading horses...</p>;

  return (
    <div>
      <HorseFilter onFilter={handleFilter} />
      <HorsesList horses={filteredHorses} />
    </div>
  );
}
