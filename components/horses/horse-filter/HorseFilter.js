'use client';

import { useState } from 'react';
import classes from '@/styles/horses/horse-filter/hroseFilter.module.css';

export default function HorseFilter({ onFilter }) {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchName, setSearchName] = useState('');

  const handleFilter = () => {
    onFilter({ category: selectedCategory, name: searchName });
  };

  return (
    <div className={classes.container}>
      {!showFilter && (
        <button className={classes.toggleButton} onClick={() => setShowFilter(true)}>
          Filter Options
        </button>
      )}

      {showFilter && (
        <div className={classes.filterContainer}>
          <button className={classes.closeButton} onClick={() => setShowFilter(false)}>
            &times;
          </button>
          <span className={classes.label}>FILTER HORSES:</span>
          <select
            className={classes.select}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="SHOW HORSES">SHOW HORSES</option>
            <option value="SCHOOL HORSES">SCHOOL HORSES</option>
            <option value="RETIRED HORSES">RETIRED HORSES</option>
          </select>
          <span className={classes.orAnd}>OR/AND</span>
          <input
            className={classes.input}
            type="text"
            placeholder="NAME"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className={classes.button} onClick={handleFilter}>
            FILTER
          </button>
        </div>
      )}
    </div>
  );
}
