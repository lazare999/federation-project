import classes from '@/styles/events/event-filter/eventFilter.module.css';

const filters = ['All', 'Upcoming', 'Previous'];

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
        {filters.map((category) => {
          return (
            <option value={category.toLowerCase()} key={category}>
              CATEGORY: {category}
            </option>
          );
        })}
      </select>
      <button className={classes.button} onClick={onFilterClick}>
        FILTER
      </button>
    </div>
  );
}
