'use client';

import styles from '@/styles/events/event-timer/eventTimer.module.css';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import EventParticipantForm from '../event-participant-form/eventParticipantForm';

export default function EventTimer({ event }) {
  const { t } = useTranslation('events');
  const [daysLeft, setDaysLeft] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!event?.date) return;

    const eventDate = new Date(event.date);
    const today = new Date();

    // Clear time for accurate day difference
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysLeft(diffDays);
  }, [event]);

  if (daysLeft === null) return null;

  return (
    <div className={styles.timerContainer}>
      <div className={styles.topRow}>
        <div className={styles.dateBox}>
          <div className={styles.number}>{daysLeft}</div>
        </div>

        <div className={styles.text}>
          {daysLeft > 0
            ? t('timer.daysToGo', { count: daysLeft })
            : t('timer.eventDay')}
        </div>
      </div>

      <button
        className={styles.button}
        onClick={() => setShowForm((prev) => !prev)}
      >
        {showForm ? t('timer.closeForm') : t('timer.participantForm')}
      </button>

      {showForm && (
        <div className={styles.formWrapper}>
          <EventParticipantForm event={event} />
        </div>
      )}
    </div>
  );
}
