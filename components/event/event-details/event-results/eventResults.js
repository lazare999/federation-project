'use client';

import classes from '@/styles/events/event-results/eventResults.module.css';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalizeName } from '@/lib/utils/capitalizeName';
import {
  getVisibleResultColumns,
  isClassifiedResult,
  normalizeCompetitionResult,
  resultCell,
  resultGridTemplate,
  sortCompetitionResults,
} from '@/lib/utils/competitionResults';

function ResultTable({ competition, t }) {
  const secondsLabel = t('results.secondsShort');
  const results = sortCompetitionResults(competition.results);
  const columns = getVisibleResultColumns(
    competition.scoring_format,
    competition.results
  );
  const gridTemplate = resultGridTemplate(columns);

  return (
    <div className={classes.tableWrap}>
      <div className={classes.table}>
        <div
          className={`${classes.row} ${classes.header}`}
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div>#</div>
          <div>{t('results.rider')}</div>
          <div>{t('results.horse')}</div>
          <div>{t('results.place')}</div>
          {columns.faults && <div>{t('results.faults')}</div>}
          {columns.time && <div>{t('results.time')}</div>}
          {columns.jumpoff && <div>{t('results.jumpoff')}</div>}
          {columns.points && <div>{t('results.points')}</div>}
        </div>

        {results.map((raw, index) => {
          const result = normalizeCompetitionResult(raw);
          const classified = isClassifiedResult(result);

          return (
            <div
              key={raw.id ?? `${raw.place}-${index}`}
              className={`${classes.row} ${
                classified ? '' : classes.statusRow
              }`}
              style={{ gridTemplateColumns: gridTemplate }}
              title={result.notes || result.statusDisplay || undefined}
            >
              <div>{index + 1}</div>
              <div>
                {capitalizeName(
                  raw.rider_horse_entry?.rider?.name || '—'
                )}
              </div>
              <div>
                {capitalizeName(
                  raw.rider_horse_entry?.horse?.name || '—'
                )}
              </div>
              <div>
                <span className={classified ? '' : classes.statusCode}>
                  {resultCell(result, 'place', secondsLabel)}
                </span>
                {result.notes ? (
                  <span className={classes.notes}>{result.notes}</span>
                ) : null}
              </div>
              {columns.faults && (
                <div>{resultCell(result, 'faults', secondsLabel)}</div>
              )}
              {columns.time && (
                <div>{resultCell(result, 'time', secondsLabel)}</div>
              )}
              {columns.jumpoff && (
                <div>{resultCell(result, 'jumpoff', secondsLabel)}</div>
              )}
              {columns.points && (
                <div>{resultCell(result, 'points', secondsLabel)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EventResults({ event }) {
  const { t } = useTranslation('events');

  const sortedCompetitions = useMemo(() => {
    if (!event?.competitions) return [];

    return [...event.competitions].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.start_time}`);
      const dateB = new Date(`${b.date}T${b.start_time}`);

      return dateA - dateB;
    });
  }, [event?.competitions]);

  const competitionsWithResults = sortedCompetitions.filter(
    (comp) => comp.results?.length > 0
  );
  const noResults = competitionsWithResults.length === 0;

  return (
    <div className={classes.resultsContainer}>
      <h2 className={classes.title}>{(event.title || '').toUpperCase()}</h2>

      {noResults && (
        <p className={classes.noResultsMessage}>
          {t('results.noResultsMessage')}
        </p>
      )}

      {!noResults &&
        competitionsWithResults.map((competition) => (
          <div
            key={competition.id}
            id={`competition-${competition.id}`}
            className={classes.resultSection}
          >
            <p className={classes.classInfo}>{competition.name}</p>
            {competition.scoring_format_display ? (
              <p className={classes.formatInfo}>
                {competition.scoring_format_display}
              </p>
            ) : null}

            <p className={classes.date}>
              {t('results.start')}:{' '}
              {new Date(competition.date).toLocaleDateString()}{' '}
              {competition.start_time?.slice(0, 5)}
            </p>

            <ResultTable competition={competition} t={t} />
          </div>
        ))}
    </div>
  );
}
