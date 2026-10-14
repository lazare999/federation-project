'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  createHorseClaimRequest,
  createNewHorseClaimRequest,
  getMyHorses,
  searchMyHorses,
} from '@/lib/api/auth';
import {
  EQUESTRIAN_CLUBS,
  getEquestrianClubLabel,
} from '@/lib/constants/equestrianClubs';
import {
  getHorseCategoryLabel,
  getHorseColorLabel,
  getHorseGenderLabel,
  HORSE_CATEGORIES,
  HORSE_COLORS,
  HORSE_GENDERS,
} from '@/lib/constants/horseChoices';
import {
  formatAllowedTours,
  getAllowedToursForLevel,
  getHorseLevelDisplay,
  HORSE_LEVELS,
} from '@/lib/constants/horseLevels';
import classes from '@/styles/rider-profile/myHorses.module.css';
import { capitalizeName } from '@/lib/utils/capitalizeName';

const DEFAULT_FORM = {
  name: '',
  passport_number: '',
  birth_year: '',
  horse_level: '',
  color: 'bay',
  gender: 'gelding',
  category: 'show',
  equestrian_club: '',
  club: '',
  studbook: '',
};

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEAR_OPTIONS = Array.from(
  { length: 40 },
  (_, i) => CURRENT_YEAR - i
);

function getFieldError(data, field) {
  const value = data?.[field];
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(String).join(' ');
  return String(value);
}

function isPassportExistsError(err) {
  if (!(err instanceof ApiRequestError) || !err.data) return false;
  if (err.data.passport_number != null) return true;
  const text = [
    err.data.detail,
    err.data.message,
    getFieldError(err.data, 'passport_number'),
    err.message,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes('პასპორტ') || text.includes('passport');
}

function formatApiError(err, t, fallbackKey = 'common.requestFailed') {
  if (!(err instanceof ApiRequestError)) {
    return t('common.connectionError');
  }
  if (isPassportExistsError(err)) {
    return t('horses.passportExists');
  }
  if (err.data?.detail) return String(err.data.detail);
  const fieldError = getFieldError(err.data, 'passport_number');
  if (fieldError) return fieldError;
  return err.message || t(fallbackKey);
}

function extractHorseList(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const candidates = [data.horses, data.results, data.items, data.data];
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      if (Array.isArray(value.horses)) return value.horses;
      if (Array.isArray(value.results)) return value.results;
    }
  }
  if (data.horse && typeof data.horse === 'object') return [data.horse];
  return [];
}

function horsePassport(horse) {
  return (
    horse?.passport_number ||
    horse?.passport ||
    horse?.passport_no ||
    horse?.passportNumber ||
    ''
  );
}

function normalizePassport(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\s-]/g, '')
    .toUpperCase();
}

function horsesMatchingPassport(horses, query, { exact = false } = {}) {
  const needle = normalizePassport(query);
  if (!needle) return [];
  const list = Array.isArray(horses) ? horses : [];
  const exactMatches = list.filter(
    (horse) => normalizePassport(horsePassport(horse)) === needle
  );
  if (exact || exactMatches.length) return exactMatches;
  return list.filter((horse) =>
    normalizePassport(horsePassport(horse)).includes(needle)
  );
}

function mergeHorseLists(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const horse of list || []) {
      const passportKey = normalizePassport(horsePassport(horse));
      const key =
        horse?.id != null
          ? `id:${horse.id}`
          : passportKey
            ? `p:${passportKey}`
            : '';
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(horse);
    }
  }
  return merged;
}

function isOwnedHorse(horse, ownedHorses) {
  if (!horse) return false;
  if (horse.already_on_profile || horse.on_profile) return true;
  const owned = Array.isArray(ownedHorses) ? ownedHorses : [];
  if (horse.id != null && owned.some((item) => item.id === horse.id)) {
    return true;
  }
  const passport = normalizePassport(horsePassport(horse));
  if (!passport) return false;
  return owned.some(
    (item) => normalizePassport(horsePassport(item)) === passport
  );
}

async function lookupHorsesByPassport(query, ownedHorses = []) {
  const ownedMatches = horsesMatchingPassport(ownedHorses, query);
  let catalog = [];
  try {
    const data = await searchMyHorses(query);
    const list = extractHorseList(data);
    const matches = horsesMatchingPassport(list, query);
    catalog = matches.length ? matches : list;
  } catch {
    catalog = [];
  }
  return mergeHorseLists(ownedMatches, catalog);
}

function resolveProfileStatus(horse) {
  if (horse?.profile_status) return horse.profile_status;
  if (horse?.pending_removal) return 'pending_removal';
  return 'active';
}

function horseCardKey(horse, index) {
  if (horse.id != null) return `horse-${horse.id}`;
  if (horse.claim_item_id != null) return `claim-item-${horse.claim_item_id}`;
  if (horse.claim_request_id != null) {
    return `claim-${horse.claim_request_id}-${horse.name ?? index}`;
  }
  return `pending-${horse.name ?? 'horse'}-${index}`;
}

function ProfileStatusBadge({ status }) {
  const { t } = useTranslation('riderProfile');
  if (status === 'pending_add') {
    return (
      <span className={classes.statusBadgePendingAdd}>{t('horses.pending')}</span>
    );
  }
  if (status === 'pending_removal') {
    return (
      <span className={classes.statusBadgePendingRemoval}>
        {t('horses.removalPending')}
      </span>
    );
  }
  return null;
}

function HorseCard({ horse, onRemove, removing, showInfo, onToggleInfo }) {
  const { t } = useTranslation('riderProfile');
  const imageUrl = horse.images?.[0] || horse.image;
  const profileStatus = resolveProfileStatus(horse);
  const canRemove = profileStatus === 'active' && horse.id != null;
  const removeDisabled =
    !canRemove ||
    profileStatus === 'pending_removal' ||
    profileStatus === 'pending_add' ||
    removing;

  return (
    <article
      className={`${classes.horseCard} ${
        profileStatus !== 'active' ? classes.horseCardPending : ''
      }`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={capitalizeName(horse.name)}
          className={classes.horseImage}
        />
      ) : (
        <div className={classes.horseImagePlaceholder}>{t('common.noPhoto')}</div>
      )}
      <div className={classes.horseNameRow}>
        <h3 className={classes.horseName}>{capitalizeName(horse.name) || '—'}</h3>
        <ProfileStatusBadge status={profileStatus} />
      </div>
      {showInfo && (
        <div className={classes.horseMeta}>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.passport')}</span>
            <span className={classes.horseMetaValue}>
              {horse.passport_number || '—'}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.birthYear')}</span>
            <span className={classes.horseMetaValue}>
              {horse.birth_year ?? '—'}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.age')}</span>
            <span className={classes.horseMetaValue}>
              {horse.age != null ? horse.age : '—'}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.horseLevel')}</span>
            <span className={classes.horseMetaValue}>
              {getHorseLevelDisplay(horse, t)}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.allowedTours')}</span>
            <span className={classes.horseMetaValue}>
              {horse.allowed_tours?.length > 0
                ? formatAllowedTours(horse.allowed_tours, t)
                : '—'}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.color')}</span>
            <span className={classes.horseMetaValue}>
              {getHorseColorLabel(horse.color, t)}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.gender')}</span>
            <span className={classes.horseMetaValue}>
              {getHorseGenderLabel(horse.gender, t)}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.category')}</span>
            <span className={classes.horseMetaValue}>
              {getHorseCategoryLabel(horse.category, t)}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.club')}</span>
            <span className={classes.horseMetaValue}>
              {getEquestrianClubLabel(horse.equestrian_club, horse.club, t)}
            </span>
          </div>
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>{t('horses.studbook')}</span>
            <span className={classes.horseMetaValue}>
              {horse.studbook || '—'}
            </span>
          </div>
        </div>
      )}
      <div className={classes.horseCardFooter}>
        {horse.is_active === false && profileStatus === 'active' && (
          <span className={classes.inactiveBadge}>{t('horses.inactive')}</span>
        )}
        <button
          type="button"
          className={classes.showInfoBtn}
          onClick={onToggleInfo}
          aria-expanded={showInfo}
        >
          {showInfo ? t('horses.hideInfo') : t('horses.showInfo')}
        </button>
        {canRemove && (
          <button
            type="button"
            className={classes.removeHorseBtn}
            disabled={removeDisabled}
            onClick={() => onRemove?.(horse)}
            title={t('horses.removeTitle')}
          >
            {removing ? t('horses.sending') : t('common.remove')}
          </button>
        )}
      </div>
    </article>
  );
}

function CatalogHorseRow({ horse, selected, alreadyOwned, onAdd, t }) {
  const linked = horse.linked_athlete_count ?? 0;
  const pending = Boolean(horse.pending_claim);
  const disabled = pending || selected || alreadyOwned;

  return (
    <li className={classes.searchResultItem}>
      <div className={classes.searchResultMain}>
        <strong className={classes.searchResultName}>
          {capitalizeName(horse.name)}
        </strong>
        <span className={classes.searchResultMeta}>
          {t('horses.passportValue', {
            number: horsePassport(horse) || '—',
          })}
        </span>
        <span className={classes.searchResultMeta}>
          {[
            horse.birth_year,
            horse.age != null ? t('horses.ageValue', { age: horse.age }) : null,
            getHorseColorLabel(horse.color, t),
            getHorseGenderLabel(horse.gender, t),
            getHorseLevelDisplay(horse, t),
            getEquestrianClubLabel(horse.equestrian_club, horse.club, t),
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <span className={classes.searchResultMeta}>
          {alreadyOwned
            ? t('horses.alreadyOnProfile')
            : t('horses.linkedAthletes', { count: linked })}
          {pending ? ` · ${t('horses.requestPending')}` : ''}
          {selected ? ` · ${t('horses.inThisRequest')}` : ''}
        </span>
      </div>
      <button
        type="button"
        className={classes.secondaryBtn}
        disabled={disabled}
        onClick={() => onAdd(horse)}
      >
        {alreadyOwned
          ? t('horses.alreadyOnProfile')
          : pending
            ? t('horses.pending')
            : selected
              ? t('horses.added')
              : t('horses.addToRequest')}
      </button>
    </li>
  );
}

function HorseRequestComposer({ onSubmitted, onCancel, ownedHorses = [] }) {
  const { t } = useTranslation('riderProfile');
  const formId = useId();
  const composerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState([]);
  const [selectedNew, setSelectedNew] = useState([]);
  const [showNewForm, setShowNewForm] = useState(true);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formError, setFormError] = useState('');
  const [passportTakenHorses, setPassportTakenHorses] = useState([]);
  const [passportChecking, setPassportChecking] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      composerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const runPassportSearch = useCallback(
    async (rawQuery) => {
      const q = String(rawQuery ?? query).trim();
      if (q.length < 2) {
        setResults([]);
        setSearchError(q ? t('horses.enterPassport') : '');
        setHasSearched(false);
        return [];
      }

      const requestId = ++requestIdRef.current;
      setSearching(true);
      setSearchError('');
      setHasSearched(true);
      try {
        const horses = await lookupHorsesByPassport(q, ownedHorses);
        if (requestId !== requestIdRef.current) return horses;
        setResults(horses);
        return horses;
      } catch (err) {
        if (requestId !== requestIdRef.current) return [];
        setResults([]);
        setSearchError(formatApiError(err, t, 'horses.searchFailed'));
        return [];
      } finally {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    },
    [query, t, ownedHorses]
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      requestIdRef.current += 1;
      setSearching(false);
      setResults([]);
      setHasSearched(false);
      setSearchError('');
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void runPassportSearch(q);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query, runPassportSearch]);

  useEffect(() => {
    const q = form.passport_number.trim();
    if (q.length < 2) {
      setPassportTakenHorses([]);
      setPassportChecking(false);
      return undefined;
    }

    let cancelled = false;
    setPassportChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const horses = await lookupHorsesByPassport(q, ownedHorses);
        if (cancelled) return;
        const exact = horsesMatchingPassport(horses, q, { exact: true });
        setPassportTakenHorses(exact.length ? exact : horsesMatchingPassport(ownedHorses, q, { exact: true }));
      } catch {
        if (!cancelled) setPassportTakenHorses([]);
      } finally {
        if (!cancelled) setPassportChecking(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.passport_number, ownedHorses]);

  const selectedCatalogIds = new Set(selectedCatalog.map((h) => h.id));

  const addCatalogHorse = (horse) => {
    if (!horse?.id || horse.pending_claim || selectedCatalogIds.has(horse.id)) {
      return;
    }
    setSelectedCatalog((prev) => [...prev, horse]);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const removeCatalogHorse = (horseId) => {
    setSelectedCatalog((prev) => prev.filter((h) => h.id !== horseId));
  };

  const removeNewHorse = (tempId) => {
    setSelectedNew((prev) => prev.filter((h) => h.tempId !== tempId));
  };

  const handleChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'equestrian_club' && value !== 'other') {
        updated.club = '';
      }
      return updated;
    });
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetNewForm = () => {
    setForm(DEFAULT_FORM);
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setPassportTakenHorses([]);
    setPassportChecking(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddNewHorse = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError(t('horses.nameRequired'));
      return;
    }

    const passport = form.passport_number.trim();
    if (!passport) {
      setFormError(t('horses.passportRequired'));
      return;
    }

    const birthYear = Number(form.birth_year);
    if (!form.birth_year || Number.isNaN(birthYear)) {
      setFormError(t('horses.birthYearRequired'));
      return;
    }

    if (!form.horse_level) {
      setFormError(t('horses.levelRequired'));
      return;
    }

    if (imageFile && !(imageFile instanceof File)) {
      setFormError(t('horses.photoMustBeFile'));
      return;
    }

    const alreadyQueued = selectedNew.some(
      (horse) =>
        normalizePassport(horse.passport_number) === normalizePassport(passport)
    );
    if (alreadyQueued) {
      setFormError(t('horses.passportExists'));
      return;
    }

    setPassportChecking(true);
    try {
      const found = await lookupHorsesByPassport(passport, ownedHorses);
      const matches = horsesMatchingPassport(found, passport, { exact: true });
      if (matches.length) {
        setPassportTakenHorses(matches);
        setQuery(passport);
        setResults(matches);
        setHasSearched(true);
        setFormError(
          matches.some((horse) => isOwnedHorse(horse, ownedHorses))
            ? t('horses.passportOnProfile')
            : t('horses.passportExists')
        );
        return;
      }
    } catch {
      /* Backend will reject on send if the passport is taken. */
    } finally {
      setPassportChecking(false);
    }

    const payload = {
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: form.name.trim(),
      passport_number: passport,
      birth_year: birthYear,
      horse_level: form.horse_level,
      color: form.color || 'bay',
      gender: form.gender || 'gelding',
      category: form.category || 'show',
      equestrian_club: form.equestrian_club || '',
      club: form.equestrian_club === 'other' ? form.club.trim() : '',
      studbook: form.studbook.trim(),
      image: imageFile || null,
    };

    setSelectedNew((prev) => [...prev, payload]);
    resetNewForm();
    setPassportTakenHorses([]);
    setShowNewForm(false);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const totalSelected = selectedCatalog.length + selectedNew.length;

  const handleSubmitRequest = async () => {
    if (!totalSelected) return;

    setSubmitError('');
    setSubmitSuccess('');
    try {
      setSubmitting(true);

      for (const horse of selectedNew) {
        try {
          const found = await lookupHorsesByPassport(
            horse.passport_number,
            ownedHorses
          );
          const matches = horsesMatchingPassport(found, horse.passport_number, {
            exact: true,
          });
          if (matches.length) {
            setQuery(horse.passport_number);
            setResults(matches);
            setHasSearched(true);
            setShowNewForm(true);
            setForm((prev) => ({
              ...prev,
              passport_number: horse.passport_number,
            }));
            setPassportTakenHorses(matches);
            setSubmitError(
              matches.some((item) => isOwnedHorse(item, ownedHorses))
                ? t('horses.passportOnProfile')
                : t('horses.passportExists')
            );
            return;
          }
        } catch {
          /* POST will still reject a taken passport. */
        }
      }

      if (selectedCatalog.length > 0) {
        await createHorseClaimRequest({
          action: 'add',
          horse_ids: selectedCatalog.map((h) => h.id),
          note,
        });
      }

      for (const horse of selectedNew) {
        try {
          await createNewHorseClaimRequest({
            name: horse.name,
            passport_number: horse.passport_number,
            birth_year: horse.birth_year,
            horse_level: horse.horse_level,
            color: horse.color,
            gender: horse.gender,
            category: horse.category,
            equestrian_club: horse.equestrian_club,
            club: horse.club,
            studbook: horse.studbook,
            image: horse.image,
            note,
          });
        } catch (err) {
          if (isPassportExistsError(err) && horse.passport_number) {
            setQuery(horse.passport_number);
            setShowNewForm(true);
            setForm((prev) => ({
              ...prev,
              passport_number: horse.passport_number,
            }));
            void runPassportSearch(horse.passport_number);
          }
          throw err;
        }
      }

      setSubmitSuccess(
        t('horses.requestSent', { count: totalSelected })
      );
      setSelectedCatalog([]);
      setSelectedNew([]);
      setNote('');
      setQuery('');
      setResults([]);
      setHasSearched(false);
      await onSubmitted?.();
    } catch (err) {
      setSubmitError(formatApiError(err, t, 'horses.couldNotSend'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={composerRef} className={classes.addFormCard} tabIndex={-1}>
      <h3 className={classes.addFormTitle}>{t('horses.composerTitle')}</h3>
      <p className={classes.panelHint}>{t('horses.composerHint')}</p>

      <div className={classes.composerSection}>
        <div className={classes.composerSectionHeader}>
          <h4 className={classes.composerSubtitle}>{t('horses.newHorse')}</h4>
          {!showNewForm && (
            <button
              type="button"
              className={classes.secondaryBtn}
              onClick={() => {
                setFormError('');
                setShowNewForm(true);
              }}
            >
              {t('horses.addNewHorse')}
            </button>
          )}
        </div>

        {showNewForm && (
          <form className={classes.formGrid} onSubmit={handleAddNewHorse}>
            <div className={classes.formWithPhoto}>
              <div className={classes.formFieldsCol}>
                <div className={classes.formRow}>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-name`}>
                      {t('horses.name')} <span className={classes.required}>*</span>
                    </label>
                    <input
                      id={`${formId}-name`}
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  </div>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-passport`}>
                      {t('horses.passportNumber')}{' '}
                      <span className={classes.required}>*</span>
                    </label>
                    <input
                      id={`${formId}-passport`}
                      value={form.passport_number}
                      onChange={(e) =>
                        handleChange('passport_number', e.target.value)
                      }
                      className={
                        passportTakenHorses.length > 0
                          ? classes.inputInvalid
                          : undefined
                      }
                      autoComplete="off"
                    />
                    {passportChecking && form.passport_number.trim().length >= 2 && (
                      <p className={classes.checkingText}>
                        {t('horses.searching')}
                      </p>
                    )}
                    {passportTakenHorses.length > 0 && (
                      <p className={classes.fieldError}>
                        {passportTakenHorses.some((horse) =>
                          isOwnedHorse(horse, ownedHorses)
                        )
                          ? t('horses.passportOnProfile')
                          : t('horses.passportExists')}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`${classes.formRow} ${classes.formRowThree}`}>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-birth`}>
                      {t('horses.birthYear')} <span className={classes.required}>*</span>
                    </label>
                    <select
                      id={`${formId}-birth`}
                      value={form.birth_year}
                      onChange={(e) => handleChange('birth_year', e.target.value)}
                    >
                      <option value="">{t('horses.selectYear')}</option>
                      {BIRTH_YEAR_OPTIONS.map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-level`}>
                      {t('horses.horseLevel')}{' '}
                      <span className={classes.required}>*</span>
                    </label>
                    <select
                      id={`${formId}-level`}
                      value={form.horse_level}
                      onChange={(e) =>
                        handleChange('horse_level', e.target.value)
                      }
                      required
                    >
                      <option value="">{t('horses.selectLevel')}</option>
                      {HORSE_LEVELS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(`horses.levels.${opt.value}`, {
                            defaultValue: opt.label,
                          })}
                        </option>
                      ))}
                    </select>
                    {form.horse_level && (
                      <p className={classes.fieldHint}>
                        {t('horses.allowedToursHint', {
                          tours: formatAllowedTours(
                            getAllowedToursForLevel(form.horse_level),
                            t
                          ),
                        })}
                      </p>
                    )}
                  </div>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-color`}>{t('horses.color')}</label>
                    <select
                      id={`${formId}-color`}
                      value={form.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                    >
                      {HORSE_COLORS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(`horses.colors.${opt.value}`, {
                            defaultValue: opt.label,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={`${classes.formRow} ${classes.formRowThree}`}>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-gender`}>{t('horses.gender')}</label>
                    <select
                      id={`${formId}-gender`}
                      value={form.gender}
                      onChange={(e) => handleChange('gender', e.target.value)}
                    >
                      {HORSE_GENDERS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(`horses.genders.${opt.value}`, {
                            defaultValue: opt.label,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-category`}>
                      {t('horses.category')}
                    </label>
                    <select
                      id={`${formId}-category`}
                      value={form.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      {HORSE_CATEGORIES.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {t(`horses.categories.${opt.value}`, {
                            defaultValue: opt.label,
                          })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-studbook`}>
                      {t('horses.studbook')}
                    </label>
                    <input
                      id={`${formId}-studbook`}
                      value={form.studbook}
                      onChange={(e) => handleChange('studbook', e.target.value)}
                    />
                  </div>
                </div>

                <div className={classes.formRow}>
                  <div className={classes.formField}>
                    <label htmlFor={`${formId}-club`}>
                      {t('profile.equestrianClub')}
                    </label>
                    <select
                      id={`${formId}-club`}
                      value={form.equestrian_club}
                      onChange={(e) =>
                        handleChange('equestrian_club', e.target.value)
                      }
                    >
                      <option value="">—</option>
                      {EQUESTRIAN_CLUBS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.value === 'other'
                            ? t('profile.otherClub')
                            : opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.equestrian_club === 'other' ? (
                    <div className={classes.formField}>
                      <label htmlFor={`${formId}-club-name`}>
                        {t('profile.clubName')}
                      </label>
                      <input
                        id={`${formId}-club-name`}
                        value={form.club}
                        onChange={(e) => handleChange('club', e.target.value)}
                        placeholder={t('profile.clubNamePlaceholder')}
                        autoComplete="off"
                      />
                    </div>
                  ) : (
                    <div className={classes.formField} aria-hidden />
                  )}
                </div>
                <p className={classes.fieldHint}>{t('horses.passportExistsHint')}</p>
              </div>

              <div className={classes.formPhotoCol}>
                <span className={classes.fileFieldLabel}>
                  {t('horses.photoOptional')}
                </span>
                <input
                  id={`${formId}-image`}
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className={classes.fileInputHidden}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setImageFile(file);
                  }}
                />
                <label
                  htmlFor={`${formId}-image`}
                  className={`${classes.fileDropzone}${
                    imagePreview ? ` ${classes.fileDropzoneFilled}` : ''
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt=""
                        className={classes.filePreview}
                      />
                      <span className={classes.fileDropzoneOverlay}>
                        {t('common.changePhoto')}
                      </span>
                    </>
                  ) : (
                    <span className={classes.fileDropzoneEmpty}>
                      <span className={classes.fileDropzoneTitle}>
                        {t('common.addPhoto')}
                      </span>
                      <span className={classes.fileDropzoneHint}>JPG / PNG</span>
                    </span>
                  )}
                </label>
                {imageFile && (
                  <button
                    type="button"
                    className={classes.fileClearBtn}
                    onClick={() => {
                      setImageFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    {t('common.removePhoto')}
                  </button>
                )}
              </div>
            </div>

            {formError && passportTakenHorses.length === 0 && (
              <p className={classes.error}>{formError}</p>
            )}

            {passportTakenHorses.length > 0 && (
              <div className={classes.passportTakenBox}>
                <p className={classes.fieldError}>
                  {passportTakenHorses.some((horse) =>
                    isOwnedHorse(horse, ownedHorses)
                  )
                    ? t('horses.passportOnProfile')
                    : `${t('horses.passportExists')} ${t('horses.passportExistsAddExisting')}`}
                </p>
                <ul className={classes.searchResults}>
                  {passportTakenHorses.map((horse) => (
                    <CatalogHorseRow
                      key={horse.id ?? horsePassport(horse)}
                      horse={horse}
                      selected={selectedCatalogIds.has(horse.id)}
                      alreadyOwned={isOwnedHorse(horse, ownedHorses)}
                      onAdd={addCatalogHorse}
                      t={t}
                    />
                  ))}
                </ul>
              </div>
            )}

            <div className={classes.formActions}>
              <button
                type="submit"
                className={classes.secondaryBtn}
                disabled={passportChecking || passportTakenHorses.length > 0}
              >
                {t('horses.addToRequest')}
              </button>
              <button
                type="button"
                className={classes.secondaryBtn}
                onClick={() => {
                  setShowNewForm(false);
                  resetNewForm();
                }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className={classes.composerSection}>
        <h4 className={classes.composerSubtitle}>{t('horses.findByPassport')}</h4>
        <div className={classes.formField}>
          <label htmlFor={`${formId}-search`}>{t('horses.passportNumber')}</label>
          <div className={classes.passportSearchRow}>
            <input
              id={`${formId}-search`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void runPassportSearch();
                }
              }}
              placeholder={t('horses.passportPlaceholder')}
              autoComplete="off"
            />
            <button
              type="button"
              className={classes.secondaryBtn}
              onClick={() => void runPassportSearch()}
              disabled={searching || !query.trim()}
            >
              {searching ? t('horses.searching') : t('horses.search')}
            </button>
          </div>
        </div>

        {searchError && <p className={classes.error}>{searchError}</p>}

        {!searching &&
          hasSearched &&
          results.length === 0 &&
          !searchError && (
            <p className={classes.mutedText}>{t('horses.noHorsesFound')}</p>
          )}

        {results.length > 0 && (
          <ul className={classes.searchResults}>
            {results.map((horse) => (
              <CatalogHorseRow
                key={horse.id ?? horsePassport(horse)}
                horse={horse}
                selected={selectedCatalogIds.has(horse.id)}
                alreadyOwned={isOwnedHorse(horse, ownedHorses)}
                onAdd={addCatalogHorse}
                t={t}
              />
            ))}
          </ul>
        )}
      </div>

      <div className={classes.composerSection}>
        <h4 className={classes.composerSubtitle}>
          {t('horses.thisRequest', { count: totalSelected })}
        </h4>

        {totalSelected === 0 ? (
          <p className={classes.mutedText}>{t('horses.noneSelected')}</p>
        ) : (
          <ul className={classes.basketList}>
            {selectedCatalog.map((horse) => (
              <li key={`cat-${horse.id}`} className={classes.basketItem}>
                <div className={classes.basketMain}>
                  <strong>{capitalizeName(horse.name)}</strong>
                  <span className={classes.searchResultMeta}>
                    {t('horses.catalog')} ·{' '}
                    {t('horses.passportValue', {
                      number: horse.passport_number || '—',
                    })}
                    {[
                      horse.birth_year ? ` · ${horse.birth_year}` : '',
                      horse.color
                        ? ` · ${getHorseColorLabel(horse.color, t)}`
                        : '',
                    ].join('')}
                  </span>
                </div>
                <button
                  type="button"
                  className={classes.entryActionBtnDanger}
                  onClick={() => removeCatalogHorse(horse.id)}
                  disabled={submitting}
                >
                  {t('common.remove')}
                </button>
              </li>
            ))}
            {selectedNew.map((horse) => (
              <li key={horse.tempId} className={classes.basketItem}>
                <div className={classes.basketMain}>
                  <strong>{capitalizeName(horse.name)}</strong>
                  <span className={classes.searchResultMeta}>
                    {t('horses.new')} · {t('horses.passportValue', {
                      number: horse.passport_number,
                    })}{' '}
                    · {horse.birth_year}
                    {horse.image ? ` · ${horse.image.name}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className={classes.entryActionBtnDanger}
                  onClick={() => removeNewHorse(horse.tempId)}
                  disabled={submitting}
                >
                  {t('common.remove')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={classes.formField}>
          <label htmlFor={`${formId}-note`}>{t('horses.note')}</label>
          <input
            id={`${formId}-note`}
            name="claim_note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('horses.optional')}
            disabled={submitting}
            required={false}
            aria-required="false"
            autoComplete="off"
          />
        </div>

        {submitError && <p className={classes.error}>{submitError}</p>}
        {submitSuccess && <p className={classes.success}>{submitSuccess}</p>}

        <div className={classes.formActions}>
          <button
            type="button"
            className={classes.primaryBtn}
            disabled={submitting || totalSelected === 0}
            onClick={handleSubmitRequest}
          >
            {submitting
              ? t('horses.sending')
              : t('horses.sendRequest', { count: totalSelected || 0 })}
          </button>
          <button
            type="button"
            className={classes.secondaryBtn}
            disabled={submitting}
            onClick={onCancel}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyHorsesSection() {
  const { t } = useTranslation('riderProfile');
  const [horses, setHorses] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [openHorseKeys, setOpenHorseKeys] = useState(() => new Set());
  const horseKeys = horses.map((horse, index) => horseCardKey(horse, index));
  const allInfoOpen =
    horseKeys.length > 0 && horseKeys.every((key) => openHorseKeys.has(key));

  const loadHorses = useCallback(async () => {
    setLoadError('');
    const data = await getMyHorses();
    const list = extractHorseList(data);
    setHorses(list);
    setCount(data.count ?? list.length);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadHorses();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || t('horses.loadFailed'));
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadHorses]);

  const handleRemoveHorse = async (horse) => {
    const profileStatus = resolveProfileStatus(horse);
    if (!horse?.id || profileStatus !== 'active') return;

    const confirmed = window.confirm(
      t('horses.removeConfirm', {
        name: capitalizeName(horse.name) || t('horses.thisHorse'),
      })
    );
    if (!confirmed) return;

    setRemoveError('');
    try {
      setRemovingId(horse.id);
      await createHorseClaimRequest({
        action: 'remove',
        horse_ids: [horse.id],
        note: '',
      });
      await loadHorses();
    } catch (err) {
      setRemoveError(formatApiError(err, t, 'horses.couldNotRemove'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className={classes.horsesSection}>
      <div className={classes.sectionHeader}>
        <h2 className={classes.sectionTitle}>{t('horses.title')}</h2>
        <div className={classes.headerActions}>
          {horses.length > 0 && (
            <button
              type="button"
              className={classes.secondaryBtn}
              onClick={() =>
                setOpenHorseKeys(allInfoOpen ? new Set() : new Set(horseKeys))
              }
              aria-expanded={allInfoOpen}
            >
              {allInfoOpen
                ? t('horses.hideAllInfo')
                : t('horses.showAllInfo')}
            </button>
          )}
          {!showComposer && (
            <button
              type="button"
              className={classes.primaryBtn}
              onClick={() => setShowComposer(true)}
            >
              {t('horses.requestHorses')}
            </button>
          )}
        </div>
      </div>

      {loading && <div className={classes.loading}>{t('common.loading')}</div>}

      {!loading && loadError && <p className={classes.error}>{loadError}</p>}
      {removeError && <p className={classes.error}>{removeError}</p>}

      {!loading && !loadError && count === 0 && !showComposer && (
        <div className={classes.empty}>
          {t('horses.empty')}
        </div>
      )}

      {!loading && !loadError && horses.length > 0 && (
        <div className={classes.horseGrid}>
          {horses.map((horse, index) => {
            const cardKey = horseCardKey(horse, index);
            return (
              <HorseCard
                key={cardKey}
                horse={horse}
                onRemove={handleRemoveHorse}
                removing={removingId === horse.id}
                showInfo={openHorseKeys.has(cardKey)}
                onToggleInfo={() =>
                  setOpenHorseKeys((prev) => {
                    const next = new Set(prev);
                    if (next.has(cardKey)) next.delete(cardKey);
                    else next.add(cardKey);
                    return next;
                  })
                }
              />
            );
          })}
        </div>
      )}

      {showComposer && (
        <HorseRequestComposer
          ownedHorses={horses}
          onSubmitted={async () => {
            await loadHorses();
          }}
          onCancel={() => setShowComposer(false)}
        />
      )}
    </section>
  );
}
