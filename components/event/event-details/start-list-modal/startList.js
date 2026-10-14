'use client';

import classes from '@/styles/events/start-list/startList.module.css';
import { capitalizeName } from '@/lib/utils/capitalizeName';

function isEntryPaid(entry) {
  const status = String(entry?.payment_status || '').toLowerCase();
  if (status === 'paid' || status === 'completed' || status === 'success') {
    return true;
  }
  return entry?.is_paid === true || entry?.paid === true;
}

export default function StartList({ competition }) {
  const entries = competition?.rider_horse_entries;

  if (!entries?.length) {
    return (
      <p className={classes.noEntriesMessage}>
        No riders registered for this competition.
      </p>
    );
  }

  const paidEntries = entries.filter(isEntryPaid);

  if (!paidEntries.length) {
    return (
      <p className={classes.noEntriesMessage}>
        No riders registered for this competition.
      </p>
    );
  }

  const sortedEntries = [...paidEntries].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className={classes.startListContainer}>
      <h2 className={classes.title}>{competition.name} – Start List</h2>

      <div className={classes.table}>
        <div className={`${classes.row} ${classes.header}`}>
          <div>#</div>
          <div>Rider</div>
          <div>Horse</div>
        </div>

        {sortedEntries.map((entry, index) => {
          const riderName = capitalizeName(
            entry.rider?.name || entry.rider_name || '—'
          );
          const horseName = capitalizeName(
            entry.horse?.name || entry.horse_name || '—'
          );

          return (
            <div key={entry.id ?? `${riderName}-${horseName}-${index}`} className={classes.row}>
              <div>{index + 1}</div>
              <div className={classes.cellWithBadge}>
                <span>{riderName}</span>
              </div>
              <div>{horseName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
