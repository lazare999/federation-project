// components/event/start-list/StartList.js
'use client';

import classes from '@/styles/events/start-list/startList.module.css';

export default function StartList({ competition }) {
  if (!competition?.rider_horse_entries?.length) {
    return (
      <p className={classes.noEntriesMessage}>
        No riders registered for this competition.
      </p>
    );
  }

  return (
    <div className={classes.startListContainer}>
      <h2 className={classes.title}>{competition.name} – Start List</h2>

      <div className={classes.table}>
        {/* Table Header */}
        <div className={`${classes.row} ${classes.header}`}>
          <div>#</div>
          <div>Rider</div>
          <div>Horse</div>
        </div>

        {/* Table Rows */}
        {competition.rider_horse_entries.map((entry, index) => (
          <div key={entry.id} className={classes.row}>
            <div>{index + 1}</div>
            <div>{entry.rider.name}</div>
            <div>{entry.horse.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
