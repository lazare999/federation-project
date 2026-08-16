'use client';

import classes from '@/styles/events/event-results/eventResults.module.css';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function EventResults({ event }) {
  const { t } = useTranslation('events');

  // SORT competitions by date + start_time
  const sortedCompetitions = useMemo(() => {
    if (!event?.competitions) return [];

    return [...event.competitions].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);

      return dateA - dateB;
    });
  }, [event?.competitions]);

  const noResults =
    sortedCompetitions.length === 0 ||
    sortedCompetitions.every((comp) => !(comp.results?.length > 0));

  // format time like 65.60
  const formatTime = (value) => {
    if (value === null || value === undefined) {
      return '-';
    }

    return Number(value).toFixed(2);
  };

  return (
    <div className={classes.resultsContainer}>
      <h2 className={classes.title}>{(event.title || '').toUpperCase()}</h2>

      {noResults && (
        <p className={classes.noResultsMessage}>
          {t('results.noResultsMessage')}
        </p>
      )}

      {!noResults &&
        sortedCompetitions.map((competition) => (
          <div
            key={competition.id}
            id={`competition-${competition.id}`}
            className={classes.resultSection}
          >
            <p className={classes.classInfo}>{competition.name}</p>

            <p className={classes.date}>
              {t('results.start')}:{' '}
              {new Date(competition.date).toLocaleDateString()}{' '}
              {competition.start_time?.slice(0, 5)}
            </p>

            <div className={classes.table}>
              <div className={`${classes.row} ${classes.header}`}>
                <div>{t('results.rank')}</div>
                <div>{t('results.rider')}</div>
                <div>{t('results.horse')}</div>
                <div>{t('results.faults')}</div>
                <div>{t('results.time')}</div>
              </div>

              {[...(competition.results || [])]
                .sort((a, b) => (a.place ?? 0) - (b.place ?? 0))
                .map((result) => (
                  <div key={result.id} className={classes.row}>
                    <div>{result.place}</div>

                    <div>{result.rider_horse_entry?.rider?.name || '—'}</div>

                    <div>{result.rider_horse_entry?.horse?.name || '—'}</div>

                    <div>{result.faults}</div>

                    <div>{formatTime(result.time)}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
