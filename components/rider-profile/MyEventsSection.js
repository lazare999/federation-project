'use client';

import Link from 'next/link';
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  deleteMyEventEntry,
  getMyEvents,
  getMyHorses,
  registerForEvent,
  updateMyEventEntry,
} from '@/lib/api/auth';
import classes from '@/styles/rider-profile/myEvents.module.css';
import { toEnglishLevelLabel } from '@/lib/constants/horseLevels';

function formatEntryResult(entry) {
  const parts = [];
  if (entry.place != null && entry.place !== '') {
    parts.push(`Place: ${entry.place}`);
  }
  if (entry.faults != null && entry.faults !== '') {
    parts.push(`Faults: ${entry.faults}`);
  }
  if (entry.time != null && entry.time !== '') {
    parts.push(`Time: ${entry.time}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function formatApiError(err, fallback = 'Request failed') {
  if (!(err instanceof ApiRequestError)) {
    return 'Could not connect to the server';
  }
  const parts = [];
  if (err.data?.detail) parts.push(String(err.data.detail));
  if (Array.isArray(err.data?.errors)) {
    parts.push(...err.data.errors.map(String));
  }
  if (parts.length) return parts.join(' ');
  return err.message || fallback;
}

function formatMoney(amount, currency = 'GEL') {
  if (amount == null || amount === '') return null;
  return `${amount} ${currency}`;
}

function formatHeight(height) {
  if (height == null || height === '') return null;
  const raw = String(height).trim();
  if (!raw) return null;
  if (/cm$/i.test(raw)) return raw;
  return `${raw} cm`;
}

function formatStartTime(startTime) {
  if (!startTime) return null;
  return String(startTime).slice(0, 5);
}

function resolveEntryDetails(entry, competition) {
  const height = formatHeight(entry.height ?? competition?.height);
  const tour =
    toEnglishLevelLabel(
      entry.tour_level_display ||
        competition?.tour_level_display ||
        entry.tour_level ||
        competition?.tour_level ||
        ''
    ) || null;
  const date = entry.competition_date || competition?.competition_date || null;
  const time = formatStartTime(entry.start_time || competition?.start_time);
  const feeLabel = formatMoney(
    entry.entry_fee ?? competition?.entry_fee,
    entry.entry_fee_currency ||
      competition?.entry_fee_currency ||
      'GEL'
  );

  return { height, tour, date, time, feeLabel };
}

function entryHasResults(entry) {
  return (
    (entry.place != null && entry.place !== '') ||
    (entry.faults != null && entry.faults !== '') ||
    (entry.time != null && entry.time !== '')
  );
}

function isEntryUnpaid(entry) {
  if (entry?.payment_status === 'unpaid') return true;
  if (entry?.payment_status === 'paid') return false;
  if (entry?.is_paid === false) return true;
  if (entry?.is_paid === true) return false;
  return false;
}

function isEntryPaid(entry) {
  return entry?.payment_status === 'paid' || entry?.is_paid === true;
}

function findCompetitionForEntry(competitions, entry) {
  const list = competitions ?? [];
  if (entry.competition_id != null) {
    const byId = list.find(
      (c) => Number(c.competition_id) === Number(entry.competition_id)
    );
    if (byId) return byId;
  }
  return (
    list.find((c) => c.competition_name === entry.competition_name) ?? null
  );
}

function resolveHorseImageUrl(source) {
  if (!source) return null;
  if (typeof source === 'string' && source.trim()) return source.trim();
  if (Array.isArray(source)) {
    for (const item of source) {
      const url = resolveHorseImageUrl(item);
      if (url) return url;
    }
    return null;
  }
  if (typeof source === 'object') {
    return (
      resolveHorseImageUrl(source.url) ||
      resolveHorseImageUrl(source.image) ||
      resolveHorseImageUrl(source.cover_image) ||
      resolveHorseImageUrl(source.images)
    );
  }
  return null;
}

function resolveEntryHorseImage(entry, competition, horseImageById) {
  const fromEntry =
    resolveHorseImageUrl(entry?.horse_image) ||
    resolveHorseImageUrl(entry?.horse_photo) ||
    resolveHorseImageUrl(entry?.image) ||
    resolveHorseImageUrl(entry?.horse);

  if (fromEntry) return fromEntry;

  if (entry?.horse_id != null && horseImageById) {
    const fromCatalog = horseImageById[String(entry.horse_id)];
    if (fromCatalog) return fromCatalog;
  }

  const horses = competition?.eligible_horses ?? [];
  const match = horses.find(
    (h) =>
      Number(h.horse_id) === Number(entry?.horse_id) ||
      (entry?.horse_name &&
        String(h.horse_name || '').toLowerCase() ===
          String(entry.horse_name).toLowerCase())
  );

  return (
    resolveHorseImageUrl(match?.horse_image) ||
    resolveHorseImageUrl(match?.image) ||
    resolveHorseImageUrl(match?.images) ||
    resolveHorseImageUrl(match?.cover_image) ||
    null
  );
}

function buildHorseImageMap(horses) {
  const map = {};
  for (const horse of horses || []) {
    const id = horse?.id ?? horse?.horse_id;
    if (id == null) continue;
    const url =
      resolveHorseImageUrl(horse.images) ||
      resolveHorseImageUrl(horse.image) ||
      resolveHorseImageUrl(horse.cover_image);
    if (url) map[String(id)] = url;
  }
  return map;
}

function alternativeHorses(competition, currentHorseId) {
  return (competition?.eligible_horses ?? []).filter(
    (h) =>
      h.can_enter &&
      !h.already_entered &&
      Number(h.horse_id) !== Number(currentHorseId)
  );
}

function formatRegistrationClosesAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tbilisi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${formatted} (Tbilisi)`;
  } catch {
    return date.toLocaleString();
  }
}

function isCompetitionRegistrationOpen(competition) {
  if (typeof competition?.registration_open === 'boolean') {
    return competition.registration_open;
  }
  if (competition?.registration_closes_at) {
    const closes = new Date(competition.registration_closes_at);
    if (!Number.isNaN(closes.getTime())) {
      return closes.getTime() > Date.now();
    }
  }
  return true;
}

function resolveRegisterGate(event, canRegisterForEvents, globalBlockedReason) {
  const competitions = event?.competitions ?? [];
  const anyCompetitionOpen =
    competitions.length === 0
      ? event?.registration_open !== false
      : competitions.some((c) => isCompetitionRegistrationOpen(c));

  const globalBlocked = canRegisterForEvents === false;
  // Membership-style block: can_register false while event registration still marked open.
  const membershipBlocked =
    event?.can_register === false && event?.registration_open === true;
  // Everything closed (deadline): no open competitions left.
  const allCompetitionsClosed =
    event?.can_register === false && !anyCompetitionOpen;

  const blocked = globalBlocked || membershipBlocked || allCompetitionsClosed;

  const reason =
    event?.register_blocked_reason ||
    (allCompetitionsClosed
      ? 'Registration is closed for all competitions on this event. Unpaid fees can still be paid in Entry dues.'
      : null) ||
    globalBlockedReason ||
    'შეჯიბრზე რეგისტრაციისთვის აქტიური საწევრო აუცილებელია. განაახლეთ საწევრო კაბინეტში.';

  return {
    blocked,
    reason,
    anyCompetitionOpen,
  };
}

function MembershipRegisterBlocked({ reason, className }) {
  return (
    <div
      className={`${classes.registerBlockedBanner}${className ? ` ${className}` : ''}`}
    >
      <p className={classes.registerBlockedReason}>{reason}</p>
    </div>
  );
}

function EntryManageActions({ eventId, entry, competition, onUpdated }) {
  const [changing, setChanging] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!entry?.entry_id) return null;
  if (!isEntryUnpaid(entry)) return null;

  const locked = entryHasResults(entry);
  const registrationOpen = isCompetitionRegistrationOpen(competition);
  const alternatives = alternativeHorses(competition, entry.horse_id);
  const closesLabel = formatRegistrationClosesAt(
    competition?.registration_closes_at
  );

  const handleChangeHorse = async () => {
    if (!selectedHorseId) return;
    setError('');
    try {
      setBusy(true);
      await updateMyEventEntry(eventId, entry.entry_id, {
        horse_id: Number(selectedHorseId),
      });
      setChanging(false);
      setSelectedHorseId('');
      await onUpdated();
    } catch (err) {
      setError(formatApiError(err, 'Could not change horse'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Remove ${entry.horse_name || 'this horse'} from ${entry.competition_name || 'this competition'}?`
    );
    if (!confirmed) return;

    setError('');
    try {
      setBusy(true);
      await deleteMyEventEntry(eventId, entry.entry_id);
      await onUpdated();
    } catch (err) {
      setError(formatApiError(err, 'Could not delete registration'));
    } finally {
      setBusy(false);
    }
  };

  if (locked) {
    return (
      <p className={classes.entryLockedHint}>
        Results recorded — changes are locked
      </p>
    );
  }

  if (!registrationOpen) {
    return (
      <p className={classes.entryLockedHint}>
        {closesLabel
          ? `Registration closed on ${closesLabel}`
          : 'Registration closed for this competition'}
      </p>
    );
  }

  return (
    <div className={classes.entryActions}>
      {!changing ? (
        <div className={classes.entryActionBtns}>
          <button
            type="button"
            className={classes.entryActionBtn}
            onClick={() => {
              setChanging(true);
              setError('');
              setSelectedHorseId('');
            }}
            disabled={busy || alternatives.length === 0}
            title={
              alternatives.length === 0
                ? 'No other eligible horse'
                : 'Change horse'
            }
          >
            Change horse
          </button>
          <button
            type="button"
            className={`${classes.entryActionBtn} ${classes.entryActionBtnDanger}`}
            onClick={handleDelete}
            disabled={busy}
          >
            {busy ? 'Removing…' : 'Remove'}
          </button>
        </div>
      ) : (
        <div className={classes.changeHorsePanel}>
          <span className={classes.horsePickLabel}>Select new horse</span>
          {alternatives.length === 0 ? (
            <p className={classes.competitionHint}>
              No other eligible horse for this competition
            </p>
          ) : (
            <div className={classes.horseOptions}>
              {alternatives.map((h) => {
                const horseId = String(h.horse_id);
                const isSelected = selectedHorseId === horseId;
                return (
                  <button
                    key={h.horse_id}
                    type="button"
                    className={`${classes.horseOption} ${isSelected ? classes.horseOptionSelected : ''}`}
                    onClick={() => setSelectedHorseId(horseId)}
                    disabled={busy}
                  >
                    {h.horse_name}
                    {h.horse_level_display || h.horse_level
                      ? ` (${toEnglishLevelLabel(
                          h.horse_level_display || h.horse_level
                        )})`
                      : ''}
                  </button>
                );
              })}
            </div>
          )}
          <div className={classes.entryActionBtns}>
            <button
              type="button"
              className={classes.entryActionBtnPrimary}
              onClick={handleChangeHorse}
              disabled={busy || !selectedHorseId}
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={classes.entryActionBtn}
              onClick={() => {
                setChanging(false);
                setSelectedHorseId('');
                setError('');
              }}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className={classes.error}>{error}</p>}
    </div>
  );
}

function groupEntriesByCompetition(entries, competitions) {
  const list = entries ?? [];
  const comps = competitions ?? [];
  const assigned = new Set();
  const groups = [];

  for (const competition of comps) {
    const groupEntries = [];
    list.forEach((entry, index) => {
      if (assigned.has(index)) return;
      const match = findCompetitionForEntry(comps, entry);
      if (
        match &&
        Number(match.competition_id) === Number(competition.competition_id)
      ) {
        assigned.add(index);
        groupEntries.push(entry);
      }
    });
    if (groupEntries.length > 0) {
      groups.push({ competition, entries: groupEntries });
    }
  }

  const orphanMap = new Map();
  list.forEach((entry, index) => {
    if (assigned.has(index)) return;
    const name = entry.competition_name || 'Competition';
    if (!orphanMap.has(name)) {
      orphanMap.set(name, {
        competition: findCompetitionForEntry(comps, entry),
        entries: [],
        orphanName: name,
      });
    }
    orphanMap.get(name).entries.push(entry);
  });

  for (const group of orphanMap.values()) {
    groups.push(group);
  }

  return groups;
}

function EventEntries({
  entries,
  showResults = false,
  manageable = false,
  eventId,
  competitions,
  onUpdated,
  horseImageById,
}) {
  if (!entries?.length) return null;

  const comps = competitions ?? [];
  const dayLabelsByDate = buildCompetitionDayLabels(comps);
  const groups = groupEntriesByCompetition(entries, comps);

  return (
    <div className={classes.registeredByCompetition}>
      {groups.map((group, groupIndex) => {
        const competition = group.competition;
        const name =
          competition?.competition_name ||
          group.orphanName ||
          group.entries[0]?.competition_name ||
          'Competition';
        const details = resolveEntryDetails(group.entries[0], competition);
        const dateKey = normalizeCompetitionDate(
          competition?.competition_date ||
            competition?.date ||
            group.entries[0]?.competition_date
        );
        const dayLabel = dateKey ? dayLabelsByDate[dateKey] : null;
        const heightLabel =
          details.height || formatHeight(competition?.height);
        const feeLabel =
          details.feeLabel ||
          formatMoney(
            competition?.entry_fee,
            competition?.entry_fee_currency || 'GEL'
          );
        const tourLabel =
          details.tour ||
          toEnglishLevelLabel(
            competition?.tour_level_display || competition?.tour_level
          );

        return (
          <div
            key={
              competition?.competition_id ??
              `${name}-${groupIndex}`
            }
            className={classes.competitionRow}
          >
            <div className={classes.competitionHead}>
              <span className={classes.competitionName}>{name}</span>
              {tourLabel && (
                <span className={classes.tourLevel}>{tourLabel}</span>
              )}
              {dayLabel && (
                <span className={classes.competitionDay}>{dayLabel}</span>
              )}
              {heightLabel && (
                <span className={classes.competitionHeight}>{heightLabel}</span>
              )}
              {feeLabel && (
                <span className={classes.competitionFee}>{feeLabel}</span>
              )}
            </div>

            {(details.date || details.time || competition?.competition_date) && (
              <p className={classes.competitionMeta}>
                {[
                  details.date || competition?.competition_date,
                  details.time || formatStartTime(competition?.start_time),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            <div className={classes.registeredHorseList}>
              {group.entries.map((entry, index) => {
                const unpaid = isEntryUnpaid(entry);
                const paid = isEntryPaid(entry);
                const result = showResults ? formatEntryResult(entry) : null;
                const horseImage = resolveEntryHorseImage(
                  entry,
                  competition,
                  horseImageById
                );

                return (
                  <div
                    key={
                      entry.entry_id ??
                      `${name}-${entry.horse_name}-${index}`
                    }
                    className={classes.registeredHorseBlock}
                  >
                    <div className={classes.enteredHorseChip}>
                      {horseImage ? (
                        <img
                          src={horseImage}
                          alt=""
                          className={classes.horsePickPhoto}
                        />
                      ) : (
                        <div
                          className={classes.horsePickPhotoPlaceholder}
                          aria-hidden
                        >
                          {(entry.horse_name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className={classes.horsePickText}>
                        <span className={classes.horsePickName}>
                          {entry.horse_name || '—'}
                        </span>
                        <div className={classes.entryBadges}>
                          {unpaid && (
                            <span className={classes.unpaidBadge}>Unpaid</span>
                          )}
                          {paid && (
                            <span className={classes.paidBadge}>Paid</span>
                          )}
                          {result && (
                            <span className={classes.entryResult}>{result}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {manageable && unpaid && (
                      <EntryManageActions
                        eventId={eventId}
                        entry={entry}
                        competition={competition}
                        onUpdated={onUpdated}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getSlotsRemaining(competition) {
  if (competition?.slots_remaining != null) {
    return Math.max(0, Number(competition.slots_remaining));
  }
  const max =
    competition?.max_horses_per_rider != null
      ? Number(competition.max_horses_per_rider)
      : 3;
  const used =
    competition?.rider_entries_count != null
      ? Number(competition.rider_entries_count)
      : (competition?.eligible_horses ?? []).filter((h) => h.already_entered)
          .length;
  return Math.max(0, max - used);
}

function toDayRoman(n) {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return romans[n - 1] || String(n);
}

function normalizeCompetitionDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  return raw.slice(0, 10);
}

/** Map YYYY-MM-DD → "Day I" / "Day II" … (only useful when 2+ days). */
function buildCompetitionDayLabels(competitions) {
  const dates = [
    ...new Set(
      (competitions ?? [])
        .map((c) =>
          normalizeCompetitionDate(c.competition_date || c.date)
        )
        .filter(Boolean)
    ),
  ].sort();

  if (dates.length < 2) return {};

  const map = {};
  dates.forEach((date, index) => {
    map[date] = `Day ${toDayRoman(index + 1)}`;
  });
  return map;
}

function CompetitionRegistrationRow({
  competition,
  selectedHorseIds,
  onToggleHorse,
  dayLabel,
  horseImageById,
}) {
  const horses = competition.eligible_horses ?? [];
  const enteredHorses = horses.filter((h) => h.already_entered);
  const slotsRemaining = getSlotsRemaining(competition);
  const selected = selectedHorseIds ?? [];
  const selectedCount = selected.length;
  const atLimit = selectedCount >= slotsRemaining;
  const feeLabel = formatMoney(
    competition.entry_fee,
    competition.entry_fee_currency || 'GEL'
  );
  const heightLabel = formatHeight(competition.height);
  const maxPerRider =
    competition.max_horses_per_rider ??
    competition.max_horses_per_competition ??
    3;

  const noHorsesAtAll = horses.length === 0;
  const registrationOpen = isCompetitionRegistrationOpen(competition);
  const closesLabel = formatRegistrationClosesAt(
    competition.registration_closes_at
  );
  const selectableHorses = horses.filter(
    (h) => h.can_enter && !h.already_entered
  );

  const resolvePickImage = (h) =>
    resolveEntryHorseImage(
      {
        horse_id: h.horse_id,
        horse_name: h.horse_name,
        horse_image: h.horse_image,
        image: h.image,
        images: h.images,
      },
      competition,
      horseImageById
    );

  return (
    <div
      className={`${classes.competitionRow}${
        !registrationOpen ? ` ${classes.competitionRowClosed}` : ''
      }`}
    >
      <div className={classes.competitionHead}>
        <span className={classes.competitionName}>
          {competition.competition_name}
        </span>
        <span className={classes.tourLevel}>
          {toEnglishLevelLabel(
            competition.tour_level_display || competition.tour_level
          )}
        </span>
        {dayLabel && (
          <span className={classes.competitionDay}>{dayLabel}</span>
        )}
        {heightLabel && (
          <span className={classes.competitionHeight}>{heightLabel}</span>
        )}
        {feeLabel && (
          <span className={classes.competitionFee}>{feeLabel}</span>
        )}
      </div>
      {competition.competition_date && (
        <p className={classes.competitionMeta}>
          {competition.competition_date}
          {competition.start_time
            ? ` · ${formatStartTime(competition.start_time)}`
            : ''}
        </p>
      )}

      {closesLabel && (
        <p
          className={
            registrationOpen
              ? classes.competitionDeadline
              : classes.competitionDeadlineClosed
          }
        >
          {registrationOpen
            ? `Registration open until ${closesLabel}`
            : `Registration closed · ${closesLabel}`}
        </p>
      )}
      {!closesLabel && !registrationOpen && (
        <p className={classes.competitionDeadlineClosed}>
          Registration closed for this competition
        </p>
      )}

      <p className={classes.slotsHint}>
        Horses: {competition.rider_entries_count ?? enteredHorses.length}/
        {maxPerRider}
        {slotsRemaining > 0
          ? ` · ${slotsRemaining} slot(s) left`
          : ' · no slots left'}
      </p>

      {enteredHorses.length > 0 && (
        <div className={classes.enteredHorseList}>
          {enteredHorses.map((h) => {
            const photo = resolvePickImage(h);
            return (
              <div key={h.horse_id} className={classes.enteredHorseChip}>
                {photo ? (
                  <img src={photo} alt="" className={classes.horsePickPhoto} />
                ) : (
                  <div className={classes.horsePickPhotoPlaceholder} aria-hidden>
                    {(h.horse_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className={classes.horsePickText}>
                  <span className={classes.horsePickName}>{h.horse_name}</span>
                  <span className={classes.horsePickStatus}>Registered</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!registrationOpen && (
        <p className={classes.competitionHint}>
          New entries and changes are locked for this competition. Payment stays
          available in Entry dues.
        </p>
      )}

      {registrationOpen && noHorsesAtAll && (
        <p className={classes.competitionHint}>
          Add a horse to your profile first
        </p>
      )}

      {registrationOpen && !noHorsesAtAll && slotsRemaining <= 0 && (
        <p className={classes.competitionHint}>
          Maximum {maxPerRider} horses already registered for this competition
        </p>
      )}

      {registrationOpen && !noHorsesAtAll && slotsRemaining > 0 && (
        <div className={classes.horsePick}>
          <span className={classes.horsePickLabel}>
            Select horses (up to {slotsRemaining})
          </span>
          <div className={classes.horsePickGrid}>
            {selectableHorses.map((h) => {
              const horseId = String(h.horse_id);
              const isSelected = selected.includes(horseId);
              const disabledByLimit = !isSelected && atLimit;
              const photo = resolvePickImage(h);
              const blockedReason = h.blocked_reason;

              return (
                <button
                  key={h.horse_id}
                  type="button"
                  className={`${classes.horsePickCard} ${
                    isSelected ? classes.horsePickCardSelected : ''
                  }`}
                  disabled={disabledByLimit}
                  title={
                    blockedReason ||
                    (disabledByLimit
                      ? `Max ${slotsRemaining} horse(s) for this competition`
                      : h.horse_name)
                  }
                  onClick={() =>
                    onToggleHorse(competition.competition_id, horseId)
                  }
                >
                  {photo ? (
                    <img src={photo} alt="" className={classes.horsePickPhoto} />
                  ) : (
                    <div
                      className={classes.horsePickPhotoPlaceholder}
                      aria-hidden
                    >
                      {(h.horse_name || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className={classes.horsePickName}>{h.horse_name}</span>
                </button>
              );
            })}
          </div>
          {selectableHorses.length === 0 && (
            <p className={classes.competitionHint}>
              {horses.some((h) => h.blocked_reason)
                ? horses.find((h) => h.blocked_reason)?.blocked_reason
                : 'No eligible horse found for this competition'}
            </p>
          )}
          {selectedCount > 0 && (
            <p className={classes.selectionHint}>
              Selected {selectedCount}/{slotsRemaining}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function UpcomingEventCard({
  event,
  onRegistered,
  highlightPayment,
  canRegisterForEvents,
  registerBlockedReason,
  horseImageById,
}) {
  const [expanded, setExpanded] = useState(false);
  const [selections, setSelections] = useState({});
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [forbiddenBlockReason, setForbiddenBlockReason] = useState('');

  const hasCover = Boolean(event.cover_image);
  const competitions = event.competitions ?? [];
  const dayLabelsByDate = buildCompetitionDayLabels(competitions);
  const hasUnpaid = Boolean(event.has_unpaid_entries);
  const unpaidTotal = formatMoney(
    event.unpaid_total,
    event.unpaid_currency || 'GEL'
  );
  const gate = resolveRegisterGate(
    event,
    canRegisterForEvents,
    registerBlockedReason
  );
  const registerBlocked = gate.blocked || Boolean(forbiddenBlockReason);
  const blockedReason = forbiddenBlockReason || gate.reason;

  const handleToggleHorse = (competitionId, horseId) => {
    setSelections((prev) => {
      const current = prev[competitionId] ?? [];
      const exists = current.includes(horseId);
      if (exists) {
        return {
          ...prev,
          [competitionId]: current.filter((id) => id !== horseId),
        };
      }

      const competition = competitions.find(
        (c) => Number(c.competition_id) === Number(competitionId)
      );
      const slots = getSlotsRemaining(competition);
      if (current.length >= slots) return prev;

      return {
        ...prev,
        [competitionId]: [...current, horseId],
      };
    });
    setRegisterError('');
    setRegisterSuccess('');
  };

  const buildEntries = () => {
    const entries = [];
    for (const comp of competitions) {
      if (!isCompetitionRegistrationOpen(comp)) continue;

      const horseIds = selections[comp.competition_id] ?? [];
      const slots = getSlotsRemaining(comp);
      const limitedIds = horseIds.slice(0, slots);

      for (const horseId of limitedIds) {
        const horse = (comp.eligible_horses ?? []).find(
          (h) => String(h.horse_id) === String(horseId)
        );
        if (!horse || !horse.can_enter || horse.already_entered) continue;

        entries.push({
          competition_id: comp.competition_id,
          horse_id: Number(horseId),
        });
      }
    }
    return entries;
  };

  const canSubmitRegistration = buildEntries().length > 0;

  const handleRegister = async () => {
    const entries = buildEntries();
    if (!entries.length) return;

    setRegisterError('');
    setRegisterSuccess('');
    try {
      setRegistering(true);
      const result = await registerForEvent(event.id, entries);
      const due = formatMoney(result?.total_due, result?.currency || 'GEL');
      setRegisterSuccess(
        result?.message ||
          (result?.registered
            ? `Registered for ${result.registered} competition(s)${due ? ` · due ${due}` : ''}. You appear on the start list; pay entry dues when ready.`
            : 'Registration created. You appear on the start list.')
      );
      setSelections({});
      await onRegistered();
    } catch (err) {
      const message = formatApiError(err, 'Registration failed');
      setRegisterError(message);
      if (err instanceof ApiRequestError && err.status === 403) {
        setForbiddenBlockReason(message);
        setExpanded(false);
      }
    } finally {
      setRegistering(false);
    }
  };

  return (
    <article
      className={`${classes.eventCard} ${!hasCover ? classes.eventCardNoImage : ''} ${
        highlightPayment ? classes.eventCardHighlight : ''
      }`}
    >
      <div className={classes.eventTop}>
        <div className={classes.eventIntro}>
          <h3 className={classes.eventTitle}>
            <Link href={`/events/${event.id}/`} className={classes.eventTitleLink}>
              {event.title}
            </Link>
          </h3>
          {event.date && <p className={classes.eventMeta}>{event.date}</p>}
          {event.location && <p className={classes.eventMeta}>{event.location}</p>}
          {event.description && (
            <p className={classes.eventDescription}>{event.description}</p>
          )}

          {event.is_registered && (
            <span className={classes.registeredBadge}>Registered</span>
          )}

          {hasUnpaid && unpaidTotal && (
            <div className={classes.unpaidSummary}>
              <span className={classes.unpaidSummaryLabel}>Unpaid total</span>
              <strong className={classes.unpaidSummaryAmount}>{unpaidTotal}</strong>
            </div>
          )}

          {!registerBlocked && gate.anyCompetitionOpen && (
            <p className={classes.registrationDeadline}>
              Each competition closes at 18:00 Tbilisi time the day before it
              runs.
            </p>
          )}
        </div>
        {hasCover ? (
          <img src={event.cover_image} alt="" className={classes.cover} />
        ) : null}
      </div>

      <div className={classes.eventBody}>
        {event.is_registered && (
          <EventEntries
            entries={event.entries}
            showResults={false}
            manageable
            eventId={event.id}
            competitions={competitions}
            onUpdated={onRegistered}
            horseImageById={horseImageById}
          />
        )}

        {registerBlocked && (
          <MembershipRegisterBlocked reason={blockedReason} />
        )}

        {!registerBlocked && competitions.length > 0 && (
          <div className={classes.registrationSection}>
            <button
              type="button"
              className={classes.toggleRegistrationBtn}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Hide registration' : 'Register for competitions'}
            </button>

            {expanded && (
              <div className={classes.registrationPanel}>
                {competitions.map((comp) => {
                  const dateKey = normalizeCompetitionDate(
                    comp.competition_date || comp.date
                  );
                  return (
                    <CompetitionRegistrationRow
                      key={comp.competition_id}
                      competition={comp}
                      selectedHorseIds={selections[comp.competition_id] ?? []}
                      onToggleHorse={handleToggleHorse}
                      dayLabel={dateKey ? dayLabelsByDate[dateKey] : null}
                      horseImageById={horseImageById}
                    />
                  );
                })}

                {registerError && <p className={classes.error}>{registerError}</p>}
                {registerSuccess && (
                  <p className={classes.success}>{registerSuccess}</p>
                )}

                <button
                  type="button"
                  className={classes.registerBtn}
                  onClick={handleRegister}
                  disabled={registering || !canSubmitRegistration}
                >
                  {registering ? 'Registering…' : 'Register'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ParticipatedEventCard({ event, horseImageById }) {
  const hasCover = Boolean(event.cover_image);

  return (
    <article
      className={`${classes.eventCard} ${!hasCover ? classes.eventCardNoImage : ''}`}
    >
      <div className={classes.eventTop}>
        <div className={classes.eventIntro}>
          <h3 className={classes.eventTitle}>
            <Link href={`/events/${event.id}/`} className={classes.eventTitleLink}>
              {event.title}
            </Link>
          </h3>
          {event.date && <p className={classes.eventMeta}>{event.date}</p>}
          {event.location && <p className={classes.eventMeta}>{event.location}</p>}
        </div>
        {hasCover ? (
          <img src={event.cover_image} alt="" className={classes.cover} />
        ) : null}
      </div>

      <div className={classes.eventBody}>
        <EventEntries
          entries={event.entries}
          showResults={true}
          competitions={event.competitions ?? []}
          horseImageById={horseImageById}
        />
      </div>
    </article>
  );
}

function EventSection({
  title,
  events,
  emptyMessage,
  variant,
  count,
  onRegistered,
  highlightEventId,
  canRegisterForEvents,
  registerBlockedReason,
  horseImageById,
  hideHeader = false,
}) {
  return (
    <section className={classes.sectionBlock}>
      {!hideHeader && (
        <div className={classes.sectionHeader}>
          <h2 className={classes.sectionTitle}>{title}</h2>
          {count != null && <span className={classes.sectionCount}>{count}</span>}
        </div>
      )}
      {!events?.length ? (
        <div className={classes.empty}>{emptyMessage}</div>
      ) : (
        <div className={classes.eventList}>
          {events.map((event) =>
            variant === 'upcoming' ? (
              <UpcomingEventCard
                key={event.id}
                event={event}
                onRegistered={onRegistered}
                highlightPayment={
                  highlightEventId != null &&
                  String(event.id) === String(highlightEventId)
                }
                canRegisterForEvents={canRegisterForEvents}
                registerBlockedReason={registerBlockedReason}
                horseImageById={horseImageById}
              />
            ) : (
              <ParticipatedEventCard
                key={event.id}
                event={event}
                horseImageById={horseImageById}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

const MyEventsDataContext = createContext(null);

function useMyEventsData() {
  const ctx = useContext(MyEventsDataContext);
  if (!ctx) {
    throw new Error('useMyEventsData must be used within MyEventsProvider');
  }
  return ctx;
}

function MyEventsProviderContent({ children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnHandled = useRef(false);

  const [upcoming, setUpcoming] = useState([]);
  const [participated, setParticipated] = useState([]);
  const [counts, setCounts] = useState(null);
  const [canRegisterForEvents, setCanRegisterForEvents] = useState(true);
  const [registerBlockedReason, setRegisterBlockedReason] = useState(null);
  const [horseImageById, setHorseImageById] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [highlightEventId, setHighlightEventId] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoadError('');
    const [data, horsesResult] = await Promise.all([
      getMyEvents(),
      getMyHorses().catch(() => null),
    ]);
    setUpcoming(data.upcoming ?? []);
    setParticipated(data.participated ?? []);
    setCounts(data.counts ?? null);
    setCanRegisterForEvents(data.can_register_for_events !== false);
    setRegisterBlockedReason(data.register_blocked_reason ?? null);

    const horses = Array.isArray(horsesResult)
      ? horsesResult
      : horsesResult?.horses ?? horsesResult?.results ?? [];
    setHorseImageById(buildHorseImageMap(horses));

    return data;
  }, []);

  const clearPaymentQuery = useCallback(() => {
    router.replace('/rider-profile/', { scroll: false });
  }, [router]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadEvents();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || 'Failed to load events');
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadEvents]);

  useEffect(() => {
    if (returnHandled.current || loading) return;

    const payment = searchParams.get('payment');
    const eventId = searchParams.get('eventId');
    if (!payment || !eventId) return;

    returnHandled.current = true;
    setHighlightEventId(eventId);

    const refresh = async () => {
      try {
        await loadEvents();
      } catch {
        /* ignore */
      }
    };

    if (payment === 'success') {
      setPaymentMessage('Payment successful. Entry status updated.');
      refresh().finally(() => {
        clearPaymentQuery();
      });
    } else if (payment === 'fail') {
      setPaymentError('Payment failed. Please try again.');
      clearPaymentQuery();
    }
  }, [clearPaymentQuery, loading, loadEvents, searchParams]);

  const value = {
    upcoming,
    participated,
    counts,
    canRegisterForEvents,
    registerBlockedReason,
    horseImageById,
    loading,
    loadError,
    paymentMessage,
    paymentError,
    highlightEventId,
    loadEvents,
  };

  return (
    <MyEventsDataContext.Provider value={value}>
      {children}
    </MyEventsDataContext.Provider>
  );
}

export function MyEventsProvider({ children }) {
  return (
    <Suspense fallback={null}>
      <MyEventsProviderContent>{children}</MyEventsProviderContent>
    </Suspense>
  );
}

export function UpcomingEventsSection() {
  const {
    upcoming,
    counts,
    canRegisterForEvents,
    registerBlockedReason,
    horseImageById,
    loading,
    loadError,
    paymentMessage,
    paymentError,
    highlightEventId,
    loadEvents,
  } = useMyEventsData();

  if (loading) {
    return (
      <section className={classes.eventsSection}>
        <div className={classes.loading}>Loading events...</div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className={classes.eventsSection}>
        <p className={classes.error}>{loadError}</p>
      </section>
    );
  }

  return (
    <section className={classes.eventsSection}>
      {paymentMessage && <p className={classes.success}>{paymentMessage}</p>}
      {paymentError && <p className={classes.error}>{paymentError}</p>}

      <EventSection
        title="Upcoming events"
        events={upcoming}
        emptyMessage="No upcoming events"
        variant="upcoming"
        count={counts?.upcoming ?? upcoming.length}
        onRegistered={loadEvents}
        highlightEventId={highlightEventId}
        canRegisterForEvents={canRegisterForEvents}
        registerBlockedReason={registerBlockedReason}
        horseImageById={horseImageById}
      />
    </section>
  );
}

const HISTORY_PAGE_SIZE = 5;

export function ParticipationHistorySection() {
  const { participated, counts, horseImageById, loading, loadError } =
    useMyEventsData();
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(HISTORY_PAGE_SIZE);

  if (loading || loadError) {
    return null;
  }

  const count = counts?.participated ?? participated.length;
  const visibleEvents = participated.slice(0, visibleCount);
  const hasMore = visibleCount < participated.length;

  const handleToggle = () => {
    setOpen((prev) => {
      if (prev) {
        setVisibleCount(HISTORY_PAGE_SIZE);
        return false;
      }
      setVisibleCount(HISTORY_PAGE_SIZE);
      return true;
    });
  };

  return (
    <section className={classes.eventsSection}>
      <div className={classes.historyToggleRow}>
        <button
          type="button"
          className={classes.historyToggleBtn}
          onClick={handleToggle}
          aria-expanded={open}
        >
          <span>Participation history</span>
          {count != null && (
            <span className={classes.sectionCount}>{count}</span>
          )}
          <span className={classes.historyToggleHint}>
            {open ? 'Hide' : 'Show'}
          </span>
        </button>
      </div>

      {open && (
        <>
          <EventSection
            title="Participation history"
            events={visibleEvents}
            emptyMessage="No past participations yet"
            variant="participated"
            count={count}
            horseImageById={horseImageById}
            hideHeader
          />
          {hasMore && (
            <div className={classes.historyShowMoreRow}>
              <button
                type="button"
                className={classes.historyShowMoreBtn}
                onClick={() =>
                  setVisibleCount((prev) => prev + HISTORY_PAGE_SIZE)
                }
              >
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** @deprecated Prefer MyEventsProvider + UpcomingEventsSection */
export default function MyEventsSection() {
  return (
    <MyEventsProvider>
      <UpcomingEventsSection />
      <ParticipationHistorySection />
    </MyEventsProvider>
  );
}
