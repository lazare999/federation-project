'use client';

import classes from '@/styles/events/event-results/eventResults.module.css';
import { useTranslation } from 'react-i18next';

export default function EventResults({ event }) {
  const { t } = useTranslation('events');

  const noResults =
    event.competitions.length === 0 ||
    event.competitions.every((comp) => comp.results.length === 0);

  return (
    <div className={classes.resultsContainer}>
      <h2 className={classes.title}>{event.title.toUpperCase()}</h2>

      {noResults && (
        <p className={classes.noResultsMessage}>
          {t('results.noResultsMessage')}
        </p>
      )}

      {!noResults &&
        event.competitions.map((competition) => (
          <div key={competition.id} className={classes.resultSection}>
            <p className={classes.classInfo}>{competition.name}</p>
            <p className={classes.date}>
              {t('results.start')}:{' '}
              {new Date(competition.date).toLocaleDateString()}{' '}
              {competition.start_time}
            </p>

            <div className={classes.table}>
              {/* Header */}
              <div className={`${classes.row} ${classes.header}`}>
                <div>{t('results.rank')}</div>
                <div>{t('results.rider')}</div>
                <div>{t('results.horse')}</div>
                <div>{t('results.faults')}</div>
                <div>{t('results.time')}</div>
              </div>

              {/* Results */}
              {[...competition.results]
                .sort((a, b) => a.place - b.place)
                .map((result) => (
                  <div key={result.id} className={classes.row}>
                    <div>{result.place}</div>
                    <div>{result.rider_horse_entry.rider.name}</div>
                    <div>{result.rider_horse_entry.horse.name}</div>
                    <div>{result.faults}</div>
                    <div>{result.time}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}
