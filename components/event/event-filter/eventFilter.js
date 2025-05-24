import classes from '@/styles/events/event-filter/eventFilter.module.css';

export default function EventFilter({
  selectedCategory,
  onCategoryChange,
  onFilterClick,
}) {
  return (
    <div className={classes.container}>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={classes.select}
      >
        <option value="all">CATEGORY: All</option>
        <option value="upcoming">CATEGORY: Upcoming</option>
        <option value="previous">CATEGORY: Previous</option>
      </select>
      <button className={classes.button} onClick={onFilterClick}>
        FILTER
      </button>
    </div>
  );
}
