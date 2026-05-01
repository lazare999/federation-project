'use client';

import classes from '@/styles/events/event-participant-form/eventParticipantForm.module.css';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  createRiderHorseEntry,
  searchHorses,
  searchRiders,
} from '@/actions/participant-actions/participant-actions';

export default function EventParticipantForm({ event }) {
  const { t } = useTranslation('events');

  const [riderName, setRiderName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');

  const [club, setClub] = useState('');
  const [customClub, setCustomClub] = useState('');

  const [horseName, setHorseName] = useState('');
  const [competitionId, setCompetitionId] = useState('');

  const [horses, setHorses] = useState([]);

  const [riderSuggestions, setRiderSuggestions] = useState([]);
  const [horseSuggestions, setHorseSuggestions] = useState([]);

  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ignoreRiderFetch = useRef(false);
  const ignoreHorseFetch = useRef(false);

  const riderRef = useRef(null);
  const horseRef = useRef(null);

  // =========================
  // CLICK OUTSIDE
  // =========================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (riderRef.current && !riderRef.current.contains(e.target)) {
        setRiderSuggestions([]);
      }
      if (horseRef.current && !horseRef.current.contains(e.target)) {
        setHorseSuggestions([]);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // =========================
  // SMART FILTER
  // =========================
  const smartFilter = (list, query) => {
    const q = query.toLowerCase();

    return (list || [])
      .map((item) => {
        const name = item.name.toLowerCase();
        let score = 0;

        if (name.startsWith(q)) score = 2;
        else if (name.includes(q)) score = 1;

        return { ...item, score };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score);
  };

  // =========================
  // RIDER SEARCH
  // =========================
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (ignoreRiderFetch.current) {
        ignoreRiderFetch.current = false;
        return;
      }

      if (riderName.length < 3) {
        setRiderSuggestions([]);
        return;
      }

      try {
        const data = await searchRiders(riderName);
        setRiderSuggestions(smartFilter(data, riderName));
      } catch {
        setRiderSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [riderName]);

  // =========================
  // HORSE SEARCH
  // =========================
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (ignoreHorseFetch.current) {
        ignoreHorseFetch.current = false;
        return;
      }

      if (horseName.length < 3) {
        setHorseSuggestions([]);
        return;
      }

      try {
        const data = await searchHorses(horseName);
        setHorseSuggestions(smartFilter(data, horseName));
      } catch {
        setHorseSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [horseName]);

  const selectRider = (r) => {
    ignoreRiderFetch.current = true;
    setRiderName(r.name);
    setRiderSuggestions([]);
  };

  const selectHorse = (h) => {
    ignoreHorseFetch.current = true;
    setHorseName(h.name);
    setHorseSuggestions([]);
  };

  const handleAddHorse = () => {
    if (horseName.trim() && competitionId) {
      setHorses((prev) => [
        ...prev,
        {
          horseName: horseName.trim(),
          competitionId: Number(competitionId),
        },
      ]);

      setHorseName('');
      setCompetitionId('');
      setHorseSuggestions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus(t('form.sending'));

    const payload = {
      riderName,
      number,
      email,
      club: club === 'other' ? customClub : club,
      horses: horses.map((h) => {
        const comp = event?.competitions?.find((c) => c.id === h.competitionId);

        return {
          horseName: h.horseName,
          competitionId: h.competitionId,
          competitionName: comp?.name, // optional
        };
      }),
    };

    try {
      const start = Date.now();

      await createRiderHorseEntry(payload, event.id);

      const elapsed = Date.now() - start;
      if (elapsed < 800) {
        await new Promise((res) => setTimeout(res, 800 - elapsed));
      }

      setStatus(t('form.success'));

      setRiderName('');
      setNumber('');
      setEmail('');
      setClub('');
      setCustomClub('');
      setHorseName('');
      setCompetitionId('');
      setHorses([]);
      setRiderSuggestions([]);
      setHorseSuggestions([]);
    } catch (error) {
      console.error(error?.response?.data || error);
      setStatus(t('form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={classes.form}>
      {/* RIDER */}
      <div ref={riderRef} className={classes.field}>
        <label>{t('form.riderName')}</label>
        <input
          value={riderName}
          onChange={(e) => setRiderName(e.target.value)}
          onBlur={() => setTimeout(() => setRiderSuggestions([]), 150)}
        />
        {riderSuggestions.length > 0 && (
          <ul className={classes.suggestions}>
            {riderSuggestions.map((r) => (
              <li key={r.id} onClick={() => selectRider(r)}>
                {r.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PHONE */}
      <div className={classes.field}>
        <label>{t('form.phone')}</label>
        <input value={number} onChange={(e) => setNumber(e.target.value)} />
      </div>

      {/* EMAIL */}
      <div className={classes.field}>
        <label>{t('form.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* CLUB */}
      <div className={classes.field}>
        <label>{t('form.equestrianClub')}</label>
        <select
          value={club}
          onChange={(e) => setClub(e.target.value)}
          className={classes.select}
        >
          <option value="">{t('form.equestrianClub')}</option>
          <option value="Lisi Lake">Lisi Lake</option>
          <option value="Ambassadori Equestrian Club">
            Ambassadori Equestrian Club
          </option>
          <option value="MENES Equestrian Club Georgia">
            MENES Equestrian Club Georgia
          </option>
          <option value="Poti equestrian school">Poti equestrian school</option>
          <option value="Horse riding club “Black horse”">Black horse</option>
          <option value="Horse riding club NAVARDI">NAVARDI</option>
          <option value="other">Other</option>
        </select>

        {club === 'other' && (
          <input
            value={customClub}
            onChange={(e) => setCustomClub(e.target.value)}
          />
        )}
      </div>

      {/* HORSE */}
      <div ref={horseRef} className={classes.field}>
        <label>{t('form.horseName')}</label>
        <input
          value={horseName}
          onChange={(e) => setHorseName(e.target.value)}
          onBlur={() => setTimeout(() => setHorseSuggestions([]), 150)}
        />

        {horseSuggestions.length > 0 && (
          <ul className={classes.suggestions}>
            {horseSuggestions.map((h) => (
              <li key={h.id} onClick={() => selectHorse(h)}>
                {h.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CLASS */}
      <div className={classes.field}>
        <label>{t('form.class')}</label>
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className={classes.select}
        >
          <option value="">Select class</option>
          {event?.competitions?.map((comp) => {
            const formattedDate = new Date(comp.date).toLocaleDateString(
              'en-US',
              {
                month: 'short', // "May"
                day: 'numeric', // "9"
              }
            );

            return (
              <option key={comp.id} value={comp.id}>
                {comp.name} ({formattedDate})
              </option>
            );
          })}
        </select>
      </div>

      <button
        type="button"
        onClick={handleAddHorse}
        className={classes.addButton}
      >
        Add Horse
      </button>

      {horses.length > 0 && (
        <div className={classes.horseList}>
          <ul>
            {horses.map((h, i) => {
              const comp = event?.competitions?.find(
                (c) => c.id === h.competitionId
              );

              return (
                <li key={i}>
                  {h.horseName} ({comp?.name})
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={classes.submitButton}
      >
        {isSubmitting ? t('form.sending') : t('form.submit')}
      </button>

      {status && <p className={classes.status}>{status}</p>}
    </form>
  );
}
