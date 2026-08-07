'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  createHorseClaimRequest,
  getMyHorses,
  searchMyHorses,
} from '@/lib/api/auth';
import { EQUESTRIAN_CLUBS, getEquestrianClubLabel } from '@/lib/constants/equestrianClubs';
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

const DEFAULT_FORM = {
  name: '',
  birth_year: '',
  horse_level: 'bronze',
  color: 'bay',
  gender: 'gelding',
  studbook: '',
  category: 'show',
  equestrian_club: 'other',
  imagesText: '',
};

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - 1900 + 1 },
  (_, i) => CURRENT_YEAR - i
);

function parseImagesText(text) {
  if (!text?.trim()) return [];
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatApiError(err, fallback = 'Request failed') {
  if (!(err instanceof ApiRequestError)) {
    return 'Could not connect to the server';
  }
  if (err.data?.detail) return String(err.data.detail);
  return err.message || fallback;
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
  if (status === 'pending_add') {
    return <span className={classes.statusBadgePendingAdd}>Pending</span>;
  }
  if (status === 'pending_removal') {
    return (
      <span className={classes.statusBadgePendingRemoval}>
        Removal pending
      </span>
    );
  }
  return null;
}

function HorseCard({ horse, onRemove, removing }) {
  const imageUrl = horse.images?.[0];
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
        <img src={imageUrl} alt={horse.name} className={classes.horseImage} />
      ) : (
        <div className={classes.horseImagePlaceholder}>No photo</div>
      )}
      <div className={classes.horseNameRow}>
        <h3 className={classes.horseName}>{horse.name || '—'}</h3>
        <ProfileStatusBadge status={profileStatus} />
      </div>
      <div className={classes.horseMeta}>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Birth year</span>
          <span className={classes.horseMetaValue}>{horse.birth_year ?? '—'}</span>
        </div>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Age</span>
          <span className={classes.horseMetaValue}>
            {horse.age != null ? horse.age : '—'}
          </span>
        </div>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Horse level</span>
          <span className={classes.horseMetaValue}>
            {getHorseLevelDisplay(horse)}
          </span>
        </div>
        {horse.allowed_tours?.length > 0 && (
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>Allowed tours</span>
            <span className={classes.horseMetaValue}>
              {formatAllowedTours(horse.allowed_tours)}
            </span>
          </div>
        )}
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Color</span>
          <span className={classes.horseMetaValue}>
            {getHorseColorLabel(horse.color)}
          </span>
        </div>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Gender</span>
          <span className={classes.horseMetaValue}>
            {getHorseGenderLabel(horse.gender)}
          </span>
        </div>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Category</span>
          <span className={classes.horseMetaValue}>
            {getHorseCategoryLabel(horse.category)}
          </span>
        </div>
        <div className={classes.horseMetaRow}>
          <span className={classes.horseMetaLabel}>Club</span>
          <span className={classes.horseMetaValue}>
            {getEquestrianClubLabel(horse.equestrian_club)}
          </span>
        </div>
        {horse.studbook && (
          <div className={classes.horseMetaRow}>
            <span className={classes.horseMetaLabel}>Studbook</span>
            <span className={classes.horseMetaValue}>{horse.studbook}</span>
          </div>
        )}
      </div>
      <div className={classes.horseCardFooter}>
        {horse.is_active === false && profileStatus === 'active' && (
          <span className={classes.inactiveBadge}>Inactive</span>
        )}
        {canRemove && (
          <button
            type="button"
            className={classes.removeHorseBtn}
            disabled={removeDisabled}
            onClick={() => onRemove?.(horse)}
            title="Request removal from profile"
          >
            {removing ? 'Sending…' : 'Remove'}
          </button>
        )}
      </div>
    </article>
  );
}

function HorseRequestComposer({ onSubmitted, onCancel }) {
  const formId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState([]);
  const [selectedNew, setSelectedNew] = useState([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const requestIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError('');
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    const delay = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const data = await searchMyHorses(q);
        if (requestId !== requestIdRef.current) return;
        setResults(data.horses ?? []);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
        setSearchError(formatApiError(err, 'Search failed'));
      } finally {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [query]);

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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNewHorse = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }

    const birthYear = Number(form.birth_year);
    if (!form.birth_year || Number.isNaN(birthYear)) {
      setFormError('Birth year is required');
      return;
    }

    const payload = {
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: form.name.trim(),
      birth_year: birthYear,
      horse_level: form.horse_level || 'bronze',
      color: form.color || 'bay',
      gender: form.gender || 'gelding',
      studbook: form.studbook.trim(),
      category: form.category || 'show',
      equestrian_club: form.equestrian_club || 'other',
      images: parseImagesText(form.imagesText),
    };

    setSelectedNew((prev) => [...prev, payload]);
    setForm(DEFAULT_FORM);
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
      await createHorseClaimRequest({
        action: 'add',
        horse_ids: selectedCatalog.map((h) => h.id),
        new_horses: selectedNew.map(({ tempId: _tempId, ...horse }) => horse),
        note,
      });
      setSubmitSuccess(
        `Request sent for ${totalSelected} horse(s). Waiting for admin approval.`
      );
      setSelectedCatalog([]);
      setSelectedNew([]);
      setNote('');
      setQuery('');
      setResults([]);
      await onSubmitted?.();
    } catch (err) {
      setSubmitError(formatApiError(err, 'Could not send request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={classes.addFormCard}>
      <h3 className={classes.addFormTitle}>Request horses</h3>
      <p className={classes.panelHint}>
        Add existing catalog horses and/or new horses to one request. Nothing is
        added to your profile until an admin approves.
      </p>

      <div className={classes.composerSection}>
        <h4 className={classes.composerSubtitle}>Find in catalog</h4>
        <div className={classes.formField}>
          <label htmlFor={`${formId}-search`}>Search (min. 2 characters)</label>
          <input
            id={`${formId}-search`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Rex"
            autoComplete="off"
          />
        </div>

        {searching && <p className={classes.mutedText}>Searching…</p>}
        {searchError && <p className={classes.error}>{searchError}</p>}

        {!searching &&
          query.trim().length >= 2 &&
          results.length === 0 &&
          !searchError && (
            <p className={classes.mutedText}>No horses found</p>
          )}

        {results.length > 0 && (
          <ul className={classes.searchResults}>
            {results.map((horse) => {
              const linked = horse.linked_athlete_count ?? 0;
              const pending = Boolean(horse.pending_claim);
              const alreadySelected = selectedCatalogIds.has(horse.id);
              const disabled = pending || alreadySelected;

              return (
                <li key={horse.id} className={classes.searchResultItem}>
                  <div className={classes.searchResultMain}>
                    <strong className={classes.searchResultName}>
                      {horse.name}
                    </strong>
                    <span className={classes.searchResultMeta}>
                      {[
                        horse.birth_year,
                        horse.age != null ? `age ${horse.age}` : null,
                        getHorseColorLabel(horse.color),
                        getHorseGenderLabel(horse.gender),
                        horse.horse_level_display || getHorseLevelDisplay(horse),
                        getEquestrianClubLabel(horse.equestrian_club),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    <span className={classes.searchResultMeta}>
                      Linked athletes: {linked}
                      {pending ? ' · Request pending' : ''}
                      {alreadySelected ? ' · In this request' : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={classes.secondaryBtn}
                    disabled={disabled}
                    onClick={() => addCatalogHorse(horse)}
                  >
                    {pending
                      ? 'Pending'
                      : alreadySelected
                        ? 'Added'
                        : 'Add to request'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={classes.composerSection}>
        <div className={classes.composerSectionHeader}>
          <h4 className={classes.composerSubtitle}>New horse</h4>
          {!showNewForm && (
            <button
              type="button"
              className={classes.secondaryBtn}
              onClick={() => {
                setFormError('');
                setShowNewForm(true);
              }}
            >
              Add new horse
            </button>
          )}
        </div>

        {showNewForm && (
          <form className={classes.formGrid} onSubmit={handleAddNewHorse}>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-name`}>
                Name <span className={classes.required}>*</span>
              </label>
              <input
                id={`${formId}-name`}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-birth`}>
                Birth year <span className={classes.required}>*</span>
              </label>
              <select
                id={`${formId}-birth`}
                value={form.birth_year}
                onChange={(e) => handleChange('birth_year', e.target.value)}
              >
                <option value="">Select year</option>
                {BIRTH_YEAR_OPTIONS.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-level`}>Horse level</label>
              <select
                id={`${formId}-level`}
                value={form.horse_level}
                onChange={(e) => handleChange('horse_level', e.target.value)}
              >
                {HORSE_LEVELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className={classes.fieldHint}>
                Allowed tours:{' '}
                {formatAllowedTours(getAllowedToursForLevel(form.horse_level))}
              </p>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-color`}>Color</label>
              <select
                id={`${formId}-color`}
                value={form.color}
                onChange={(e) => handleChange('color', e.target.value)}
              >
                {HORSE_COLORS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-gender`}>Gender</label>
              <select
                id={`${formId}-gender`}
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
              >
                {HORSE_GENDERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-category`}>Category</label>
              <select
                id={`${formId}-category`}
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {HORSE_CATEGORIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-club`}>Club</label>
              <select
                id={`${formId}-club`}
                value={form.equestrian_club}
                onChange={(e) => handleChange('equestrian_club', e.target.value)}
              >
                {EQUESTRIAN_CLUBS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-studbook`}>Studbook</label>
              <input
                id={`${formId}-studbook`}
                value={form.studbook}
                onChange={(e) => handleChange('studbook', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor={`${formId}-images`}>
                Photo URLs (one per line or comma-separated)
              </label>
              <textarea
                id={`${formId}-images`}
                value={form.imagesText}
                onChange={(e) => handleChange('imagesText', e.target.value)}
                placeholder="e.g. https://example.com/photo.jpg"
              />
            </div>

            {formError && <p className={classes.error}>{formError}</p>}

            <div className={classes.formActions}>
              <button type="submit" className={classes.secondaryBtn}>
                Add to request
              </button>
              <button
                type="button"
                className={classes.secondaryBtn}
                onClick={() => {
                  setShowNewForm(false);
                  setFormError('');
                  setForm(DEFAULT_FORM);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className={classes.composerSection}>
        <h4 className={classes.composerSubtitle}>
          This request ({totalSelected})
        </h4>

        {totalSelected === 0 ? (
          <p className={classes.mutedText}>
            No horses selected yet. Add from catalog and/or create new ones.
          </p>
        ) : (
          <ul className={classes.basketList}>
            {selectedCatalog.map((horse) => (
              <li key={`cat-${horse.id}`} className={classes.basketItem}>
                <div className={classes.basketMain}>
                  <strong>{horse.name}</strong>
                  <span className={classes.searchResultMeta}>
                    Catalog ·{' '}
                    {[
                      horse.birth_year,
                      getHorseColorLabel(horse.color),
                      getHorseGenderLabel(horse.gender),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <button
                  type="button"
                  className={classes.entryActionBtnDanger}
                  onClick={() => removeCatalogHorse(horse.id)}
                  disabled={submitting}
                >
                  Remove
                </button>
              </li>
            ))}
            {selectedNew.map((horse) => (
              <li key={horse.tempId} className={classes.basketItem}>
                <div className={classes.basketMain}>
                  <strong>{horse.name}</strong>
                  <span className={classes.searchResultMeta}>
                    New · {horse.birth_year} · {getHorseColorLabel(horse.color)}{' '}
                    · {getHorseGenderLabel(horse.gender)}
                  </span>
                </div>
                <button
                  type="button"
                  className={classes.entryActionBtnDanger}
                  onClick={() => removeNewHorse(horse.tempId)}
                  disabled={submitting}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={classes.formField}>
          <label htmlFor={`${formId}-note`}>Note</label>
          <input
            id={`${formId}-note`}
            name="claim_note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
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
              ? 'Sending…'
              : `Send request (${totalSelected || 0})`}
          </button>
          <button
            type="button"
            className={classes.secondaryBtn}
            disabled={submitting}
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyHorsesSection() {
  const [horses, setHorses] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  const loadHorses = useCallback(async () => {
    setLoadError('');
    const data = await getMyHorses();
    setHorses(data.horses ?? []);
    setCount(data.count ?? data.horses?.length ?? 0);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await loadHorses();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || 'Failed to load horses');
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
      `Request removal of ${horse.name || 'this horse'} from your profile? An admin must approve.`
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
      setRemoveError(formatApiError(err, 'Could not send removal request'));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className={classes.horsesSection}>
      <div className={classes.sectionHeader}>
        <h2 className={classes.sectionTitle}>My horses</h2>
        {!showComposer && (
          <button
            type="button"
            className={classes.primaryBtn}
            onClick={() => setShowComposer(true)}
          >
            Request horses
          </button>
        )}
      </div>

      {loading && <div className={classes.loading}>Loading...</div>}

      {!loading && loadError && <p className={classes.error}>{loadError}</p>}
      {removeError && <p className={classes.error}>{removeError}</p>}

      {!loading && !loadError && count === 0 && !showComposer && (
        <div className={classes.empty}>
          You have no horses on your profile yet
        </div>
      )}

      {!loading && !loadError && horses.length > 0 && (
        <div className={classes.horseGrid}>
          {horses.map((horse, index) => (
            <HorseCard
              key={horseCardKey(horse, index)}
              horse={horse}
              onRemove={handleRemoveHorse}
              removing={removingId === horse.id}
            />
          ))}
        </div>
      )}

      {showComposer && (
        <HorseRequestComposer
          onSubmitted={async () => {
            await loadHorses();
          }}
          onCancel={() => setShowComposer(false)}
        />
      )}
    </section>
  );
}
