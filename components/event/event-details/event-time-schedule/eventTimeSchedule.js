'use client';

import styles from '@/styles/events/event-time-schedule/eventTimeSchedule.module.css';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function EventTimeSchedule({ event }) {
  const { t } = useTranslation('events');

  if (!event || !event.competitions?.length) {
    return <div>{t('timeSchedule.noCompetitions')}</div>;
  }

  return (
    <div className={styles.scheduleContainer}>
      {event.competitions.map((comp) => {
        const dateObj = new Date(comp.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj
          .toLocaleString('en-US', { month: 'short' })
          .toUpperCase();

        const hasResults = comp.results?.length > 0;

        return (
          <div key={comp.id} className={styles.scheduleItem}>
            <div className={styles.dateBox}>
              <div className={styles.dateNumber}>{day}</div>
              <div className={styles.dateMonth}>{month}</div>
            </div>

            <div className={styles.detailsBox}>
              <h3 className={styles.eventTitle}>{comp.name}</h3>
              <p className={styles.eventPresenter}>
                {t('timeSchedule.presentedBy')}
              </p>
            </div>

            <div className={styles.linksBox}>
              <Link
                href="#"
                className={!hasResults ? styles.disabledLink : ''}
                aria-disabled={!hasResults}
              >
                <span>{t('timeSchedule.startList')}</span> →
              </Link>
              <Link
                href="#"
                className={!hasResults ? styles.disabledLink : ''}
                aria-disabled={!hasResults}
              >
                <span>{t('timeSchedule.results')}</span> →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
