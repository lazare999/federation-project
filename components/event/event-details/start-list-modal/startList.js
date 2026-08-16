'use client';

import classes from '@/styles/events/start-list/startList.module.css';

function isEntryUnpaid(entry) {
  if (entry?.payment_status === 'unpaid') return true;
  if (entry?.payment_status === 'paid') return false;
  if (entry?.is_paid === false) return true;
  if (entry?.is_paid === true) return false;
  return false;
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

  const sortedEntries = [...entries].sort(
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
          const unpaid = isEntryUnpaid(entry);
          const riderName =
            entry.rider?.name || entry.rider_name || '—';
          const horseName =
            entry.horse?.name || entry.horse_name || '—';

          return (
            <div key={entry.id ?? `${riderName}-${horseName}-${index}`} className={classes.row}>
              <div>{index + 1}</div>
              <div className={classes.cellWithBadge}>
                <span>{riderName}</span>
                {unpaid && (
                  <span className={classes.unpaidBadge}>Unpaid</span>
                )}
              </div>
              <div>{horseName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
