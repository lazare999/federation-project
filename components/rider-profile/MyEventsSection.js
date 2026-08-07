'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  deleteMyEventEntry,
  getMyEvents,
  payForEvent,
  registerForEvent,
  updateMyEventEntry,
} from '@/lib/api/auth';
import classes from '@/styles/rider-profile/myEvents.module.css';

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
    entry.tour_level_display ||
    competition?.tour_level_display ||
    entry.tour_level ||
    competition?.tour_level ||
    null;
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

function alternativeHorses(competition, currentHorseId) {
  return (competition?.eligible_horses ?? []).filter(
    (h) =>
      h.can_enter &&
      !h.already_entered &&
      Number(h.horse_id) !== Number(currentHorseId)
  );
}

function getPaymentRedirectUrl(response) {
  return response?.redirect_url || response?.payment?.redirect_url || null;
}

function resolveRegisterGate(event, canRegisterForEvents, globalBlockedReason) {
  const eventBlocked = event?.can_register === false;
  const globalBlocked = canRegisterForEvents === false;
  const blocked = eventBlocked || globalBlocked;
  const reason =
    event?.register_blocked_reason ||
    globalBlockedReason ||
    'შეჯიბრზე რეგისტრაციისთვის აქტიური საწევრო აუცილებელია. განაახლეთ საწევრო კაბინეტში.';

  return { blocked, reason };
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
  const alternatives = alternativeHorses(competition, entry.horse_id);

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
                    {h.horse_level_display ? ` (${h.horse_level_display})` : ''}
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

function EventEntries({
  entries,
  showResults = false,
  manageable = false,
  eventId,
  competitions,
  onUpdated,
}) {
  if (!entries?.length) return null;

  return (
    <ul className={classes.entries}>
      {entries.map((entry, index) => {
        const result = showResults ? formatEntryResult(entry) : null;
        const competition = findCompetitionForEntry(competitions, entry);
        const unpaid = isEntryUnpaid(entry);
        const paid = isEntryPaid(entry);
        const details = resolveEntryDetails(entry, competition);

        return (
          <li
            key={
              entry.entry_id ??
              `${entry.competition_name}-${entry.horse_name}-${index}`
            }
            className={classes.entryItem}
          >
            <div className={classes.entryCard}>
              <div className={classes.entryCardHeader}>
                <span className={classes.entryHorse}>
                  {entry.horse_name || '—'}
                </span>
                <div className={classes.entryBadges}>
                  {unpaid && (
                    <span className={classes.unpaidBadge}>Unpaid</span>
                  )}
                  {paid && <span className={classes.paidBadge}>Paid</span>}
                </div>
              </div>

              <p className={classes.entryCompetition}>
                {entry.competition_name || '—'}
              </p>

              <div className={classes.entryDetails}>
                {details.tour && (
                  <div className={classes.entryDetailRow}>
                    <span className={classes.entryDetailLabel}>Tour</span>
                    <span className={classes.entryDetailValue}>
                      {details.tour}
                    </span>
                  </div>
                )}
                {details.height && (
                  <div className={classes.entryDetailRow}>
                    <span className={classes.entryDetailLabel}>Height</span>
                    <span className={classes.entryDetailValue}>
                      {details.height}
                    </span>
                  </div>
                )}
                {(details.date || details.time) && (
                  <div className={classes.entryDetailRow}>
                    <span className={classes.entryDetailLabel}>Schedule</span>
                    <span className={classes.entryDetailValue}>
                      {[details.date, details.time].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
                {details.feeLabel && (
                  <div className={classes.entryDetailRow}>
                    <span className={classes.entryDetailLabel}>Entry fee</span>
                    <span className={classes.entryDetailValue}>
                      {details.feeLabel}
                    </span>
                  </div>
                )}
                {result && (
                  <div className={classes.entryDetailRow}>
                    <span className={classes.entryDetailLabel}>Result</span>
                    <span className={classes.entryDetailValue}>{result}</span>
                  </div>
                )}
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
          </li>
        );
      })}
    </ul>
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

function CompetitionRegistrationRow({
  competition,
  selectedHorseIds,
  onToggleHorse,
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

  return (
    <div className={classes.competitionRow}>
      <div className={classes.competitionHead}>
        <span className={classes.competitionName}>
          {competition.competition_name}
        </span>
        <span className={classes.tourLevel}>
          {competition.tour_level_display}
        </span>
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

      <p className={classes.slotsHint}>
        Horses: {competition.rider_entries_count ?? enteredHorses.length}/
        {maxPerRider}
        {slotsRemaining > 0
          ? ` · ${slotsRemaining} slot(s) left`
          : ' · no slots left'}
      </p>

      {enteredHorses.length > 0 && (
        <div className={classes.enteredList}>
          {enteredHorses.map((h) => (
            <p key={h.horse_id} className={classes.registeredInline}>
              Registered ✓ — {h.horse_name}
            </p>
          ))}
        </div>
      )}

      {noHorsesAtAll && (
        <p className={classes.competitionHint}>
          Add a horse to your profile first
        </p>
      )}

      {!noHorsesAtAll && slotsRemaining <= 0 && (
        <p className={classes.competitionHint}>
          Maximum {maxPerRider} horses already registered for this competition
        </p>
      )}

      {!noHorsesAtAll && slotsRemaining > 0 && (
        <div className={classes.horsePick}>
          <span className={classes.horsePickLabel}>
            Select horses (up to {slotsRemaining})
          </span>
          <div className={classes.horseOptions}>
            {horses
              .filter((h) => h.can_enter && !h.already_entered)
              .map((h) => {
                const horseId = String(h.horse_id);
                const isSelected = selected.includes(horseId);
                const disabledByLimit = !isSelected && atLimit;

                return (
                  <button
                    key={h.horse_id}
                    type="button"
                    className={`${classes.horseOption} ${isSelected ? classes.horseOptionSelected : ''}`}
                    disabled={disabledByLimit}
                    title={
                      disabledByLimit
                        ? `Max ${slotsRemaining} horse(s) for this competition`
                        : undefined
                    }
                    onClick={() =>
                      onToggleHorse(competition.competition_id, horseId)
                    }
                  >
                    {h.horse_name}
                    {h.horse_level_display ? ` (${h.horse_level_display})` : ''}
                  </button>
                );
              })}
          </div>
          {horses.filter((h) => h.can_enter && !h.already_entered).length ===
            0 && (
            <p className={classes.competitionHint}>
              No eligible horse found for this competition
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
}) {
  const [expanded, setExpanded] = useState(false);
  const [selections, setSelections] = useState({});
  const [registering, setRegistering] = useState(false);
  const [paying, setPaying] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [payError, setPayError] = useState('');
  const [forbiddenBlockReason, setForbiddenBlockReason] = useState('');

  const hasCover = Boolean(event.cover_image);
  const competitions = event.competitions ?? [];
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
    setPayError('');
    try {
      setRegistering(true);
      const result = await registerForEvent(event.id, entries);
      const due = formatMoney(result?.total_due, result?.currency || 'GEL');
      setRegisterSuccess(
        result?.message ||
          (result?.registered
            ? `Registered for ${result.registered} competition(s)${due ? ` · due ${due}` : ''}.`
            : 'Registration created (unpaid).')
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

  const handlePay = async () => {
    setPayError('');
    setRegisterSuccess('');
    try {
      setPaying(true);
      const result = await payForEvent(event.id);
      const redirectUrl = getPaymentRedirectUrl(result);
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      if (result?.status === 'paid') {
        setRegisterSuccess(result?.message || 'Payment confirmed.');
        await onRegistered();
        return;
      }
      setPayError(result?.message || 'Payment could not be started (no redirect URL).');
    } catch (err) {
      setPayError(formatApiError(err, 'Payment request failed'));
    } finally {
      setPaying(false);
    }
  };

  return (
    <article
      className={`${classes.eventCard} ${!hasCover ? classes.eventCardNoImage : ''} ${
        highlightPayment ? classes.eventCardHighlight : ''
      }`}
    >
      {hasCover ? (
        <img src={event.cover_image} alt="" className={classes.cover} />
      ) : null}
      <div className={classes.eventBody}>
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

        {event.is_registered && (
          <EventEntries
            entries={event.entries}
            showResults={false}
            manageable
            eventId={event.id}
            competitions={competitions}
            onUpdated={onRegistered}
          />
        )}

        {hasUnpaid && (
          <div className={classes.paySection}>
            {payError && <p className={classes.error}>{payError}</p>}
            <button
              type="button"
              className={classes.payBtn}
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? 'Redirecting to bank…' : 'Pay'}
            </button>
          </div>
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
                {competitions.map((comp) => (
                  <CompetitionRegistrationRow
                    key={comp.competition_id}
                    competition={comp}
                    selectedHorseIds={selections[comp.competition_id] ?? []}
                    onToggleHorse={handleToggleHorse}
                  />
                ))}

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

function ParticipatedEventCard({ event }) {
  const hasCover = Boolean(event.cover_image);

  return (
    <article
      className={`${classes.eventCard} ${!hasCover ? classes.eventCardNoImage : ''}`}
    >
      {hasCover ? (
        <img src={event.cover_image} alt="" className={classes.cover} />
      ) : null}
      <div className={classes.eventBody}>
        <h3 className={classes.eventTitle}>
          <Link href={`/events/${event.id}/`} className={classes.eventTitleLink}>
            {event.title}
          </Link>
        </h3>
        {event.date && <p className={classes.eventMeta}>{event.date}</p>}
        {event.location && <p className={classes.eventMeta}>{event.location}</p>}
        <EventEntries
          entries={event.entries}
          showResults={true}
          competitions={event.competitions ?? []}
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
}) {
  return (
    <section className={classes.sectionBlock}>
      <div className={classes.sectionHeader}>
        <h2 className={classes.sectionTitle}>{title}</h2>
        {count != null && <span className={classes.sectionCount}>{count}</span>}
      </div>
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
              />
            ) : (
              <ParticipatedEventCard key={event.id} event={event} />
            )
          )}
        </div>
      )}
    </section>
  );
}

function MyEventsSectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnHandled = useRef(false);

  const [upcoming, setUpcoming] = useState([]);
  const [participated, setParticipated] = useState([]);
  const [counts, setCounts] = useState(null);
  const [canRegisterForEvents, setCanRegisterForEvents] = useState(true);
  const [registerBlockedReason, setRegisterBlockedReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [highlightEventId, setHighlightEventId] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoadError('');
    const data = await getMyEvents();
    setUpcoming(data.upcoming ?? []);
    setParticipated(data.participated ?? []);
    setCounts(data.counts ?? null);
    setCanRegisterForEvents(data.can_register_for_events !== false);
    setRegisterBlockedReason(data.register_blocked_reason ?? null);
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
      />
      <EventSection
        title="Participation history"
        events={participated}
        emptyMessage="No past participations yet"
        variant="participated"
        count={counts?.participated ?? participated.length}
        onRegistered={loadEvents}
      />
    </section>
  );
}

export default function MyEventsSection() {
  return (
    <Suspense
      fallback={
        <section className={classes.eventsSection}>
          <div className={classes.loading}>Loading events...</div>
        </section>
      }
    >
      <MyEventsSectionContent />
    </Suspense>
  );
}
