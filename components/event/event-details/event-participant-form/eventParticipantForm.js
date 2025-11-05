'use client';

import classes from '@/styles/events/event-participant-form/eventParticipantForm.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function EventParticipantForm({ event }) {
  const { t } = useTranslation('events');
  const [riderName, setRiderName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [horseName, setHorseName] = useState('');
  const [horseClass, setHorseClass] = useState('');
  const [horses, setHorses] = useState([]);
  const [status, setStatus] = useState(null);

  const handleAddHorse = () => {
    if (horseName.trim() && horseClass.trim()) {
      setHorses([...horses, { horseName, horseClass }]);
      setHorseName('');
      setHorseClass('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(t('form.sending'));

    const formData = {
      riderName,
      number,
      email,
      horses,
      eventTitle: event?.title || t('form.unknownEvent'),
    };

    try {
      const res = await fetch('/api/participant-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus(t('form.success'));
        setRiderName('');
        setNumber('');
        setEmail('');
        setHorseName('');
        setHorseClass('');
        setHorses([]);
      } else {
        setStatus(t('form.fail'));
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus(t('form.error'));
    }
  };

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>{t('form.title')}</h2>

      <form onSubmit={handleSubmit} className={classes.form}>
        <div className={classes.field}>
          <label>{t('form.riderName')}</label>
          <input
            type="text"
            value={riderName}
            onChange={(e) => setRiderName(e.target.value)}
            required
          />
        </div>

        <div className={classes.field}>
          <label>{t('form.phone')}</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            required
          />
        </div>

        <div className={classes.field}>
          <label>{t('form.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={classes.field}>
          <label>{t('form.horseName')}</label>
          <input
            type="text"
            value={horseName}
            onChange={(e) => setHorseName(e.target.value)}
          />
        </div>

        <div className={classes.field}>
          <label>{t('form.class')}</label>
          <select
            className={classes.select}
            value={horseClass}
            onChange={(e) => setHorseClass(e.target.value)}
          >
            <option value="">{t('form.selectClass')}</option>
            {event?.competitions?.map((comp) => (
              <option key={comp.id} value={comp.name}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleAddHorse}
          className={classes.addButton}
        >
          {t('form.addHorse')}
        </button>

        {horses.length > 0 && (
          <div className={classes.horseList}>
            <h3>{t('form.horseList')}</h3>
            <ul>
              {horses.map((h, index) => (
                <li key={index}>
                  {h.horseName} ({h.horseClass})
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className={classes.submitButton}>
          {t('form.submit')}
        </button>
      </form>

      {status && <p className={classes.status}>{status}</p>}
    </div>
  );
}
