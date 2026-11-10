'use client';

import Link from 'next/link';
import {
  Fragment,
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  deleteMyEventEntry,
  getMyEvents,
  getMyHorses,
  payForEvent,
  registerForEvent,
  updateMyEventEntry,
} from '@/lib/api/auth';
import classes from '@/styles/rider-profile/myEvents.module.css';
import { getHorseLevelLabel } from '@/lib/constants/horseLevels';
import { capitalizeName } from '@/lib/utils/capitalizeName';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { rewriteAgeBlockedReason } from '@/lib/utils/rewriteAgeBlockedReason';
import {
  formatFaults,
  formatJumpoff,
  formatPlaceOrStatus,
  formatPoints,
  formatResultTime,
  getVisibleResultColumns,
  hasRecordedResult,
  isClassifiedResult,
  normalizeCompetitionResult,
} from '@/lib/utils/competitionResults';

function translateBillingReason(reason, t, language) {
  if (!reason) return '';
  const isKa = String(language || '').toLowerCase().startsWith('ka');
  if (isKa) return String(reason);

  const fragments = [
    ['შეჯიბრის entry', t('events.billingCompetitionEntry')],
    ['უმაღლესი ტურის საფასური', t('events.billingHighestTourFee')],
  ];

  let text = String(reason);
  for (const [source, translated] of fragments) {
    if (text.includes(source)) {
      text = text.split(source).join(translated);
    }
  }
  return text;
}

function formatEntryResult(entry, competition, t) {
  const result = normalizeCompetitionResult(entry);
  if (!hasRecordedResult(entry)) return null;

  const placeOrStatus = formatPlaceOrStatus(result);
  if (!isClassifiedResult(result)) {
    return result.notes
      ? `${placeOrStatus} · ${result.notes}`
      : placeOrStatus;
  }

  const secondsLabel = t('events.secondsShort');
  const columns = getVisibleResultColumns(competition?.scoring_format, [
    result,
  ]);
  const parts = [t('events.place', { value: placeOrStatus })];

  if (columns.faults && result.faults != null) {
    parts.push(t('events.faults', { value: formatFaults(result.faults) }));
  }
  if (columns.time && result.time != null) {
    parts.push(
      t('events.time', {
        value: formatResultTime(result.time, secondsLabel),
      })
    );
  }
  if (
    columns.jumpoff &&
    (result.jumpoffFaults != null || result.jumpoffTime != null)
  ) {
    parts.push(
      t('events.jumpoff', {
        value: formatJumpoff(result, secondsLabel),
      })
    );
  }
  if (columns.points) {
    const points = formatPoints(result);
    if (points !== '—') {
      parts.push(t('events.points', { value: points }));
    }
  }
  if (result.notes) parts.push(result.notes);

  return parts.join(' · ');
}

function formatApiError(err, t, fallbackKey = 'common.requestFailed') {
  if (!(err instanceof ApiRequestError)) {
    return t('common.connectionError');
  }
  const parts = [];
  if (err.data?.detail) parts.push(String(err.data.detail));
  if (Array.isArray(err.data?.errors)) {
    parts.push(...err.data.errors.map(String));
  }
  if (parts.length) return parts.join(' ');
  return err.message || t(fallbackKey);
}

function formatMoney(amount, currency = 'GEL') {
  if (amount == null || amount === '') return null;
  return `${amount} ${currency}`;
}

function getPaymentRedirectUrl(response) {
  return (
    response?.redirect_url ||
    response?.payment?.redirect_url ||
    response?.pending_payment?.redirect_url ||
    null
  );
}

function getEventPendingRedirect(event) {
  return event?.pending_payment?.redirect_url || null;
}

function getCompetitionLabel(value, t) {
  const fallback = t ? t('events.competition') : 'Competition';
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') return value;
  return (
    value.name ||
    value.competition_name ||
    value.title ||
    value.tour_level_display ||
    fallback
  );
}

function firstAmount(...values) {
  for (const value of values) {
    if (value != null && value !== '') return value;
  }
  return null;
}

function getCompetitionFee(comp, horseRow) {
  if (comp && typeof comp === 'object') {
    const fee = firstAmount(
      comp.payable,
      comp.charge_due,
      comp.due,
      comp.amount,
      comp.payable_amount,
      comp.charge
    );
    if (fee != null) return fee;
  }
  const comps = horseRow?.competitions;
  if (Array.isArray(comps) && comps.length === 1) {
    return firstAmount(horseRow.charge_due, horseRow.due);
  }
  return firstAmount(horseRow?.charge_due, horseRow?.due);
}

function getHorseBillingAmount(row) {
  return firstAmount(row?.charge_due, row?.due);
}

function billingCompetitionIsUnpaid(comp) {
  if (!comp || typeof comp !== 'object') return false;
  const status = String(comp.payment_status || '').toLowerCase();
  if (status === 'paid' || status === 'completed' || status === 'success') {
    return false;
  }
  if (status === 'unpaid') return true;
  if (comp.is_paid === true || comp.paid === true) return false;
  if (comp.is_paid === false || comp.paid === false) return true;
  const payable = firstAmount(comp.payable, comp.charge_due, comp.due);
  return payable != null && Number(payable) > 0;
}

function findBillingCompetitionForEntry(billing, entry, competition) {
  const entryId = entry?.entry_id ?? entry?.id;
  const entryCompId = entry?.competition_id ?? competition?.competition_id;
  const entryCompName =
    entry?.competition_name || competition?.competition_name || '';
  const horseId = entry?.horse_id;

  for (const row of billing || []) {
    if (
      horseId != null &&
      row?.horse_id != null &&
      Number(row.horse_id) !== Number(horseId)
    ) {
      continue;
    }
    const comps = Array.isArray(row.competitions) ? row.competitions : [];
    for (const comp of comps) {
      if (!comp || typeof comp !== 'object') continue;
      if (
        entryId != null &&
        comp.entry_id != null &&
        Number(comp.entry_id) === Number(entryId)
      ) {
        return { row, comp };
      }
      const compId = comp.competition_id ?? comp.id;
      const sameComp =
        (entryCompId != null &&
          compId != null &&
          Number(compId) === Number(entryCompId)) ||
        (entryCompName &&
          getCompetitionLabel(comp).toLowerCase() ===
            String(entryCompName).toLowerCase());
      if (sameComp) return { row, comp };
    }
  }
  return null;
}

function resolveCompetitionPayTarget(billing, entry, competition) {
  const matched = findBillingCompetitionForEntry(billing, entry, competition);
  const billed = matched?.comp;
  const rawEntryId =
    billed?.entry_id ?? entry?.entry_id ?? entry?.id ?? null;
  const rawHorseId = matched?.row?.horse_id ?? entry?.horse_id ?? null;
  const entryId =
    rawEntryId != null && rawEntryId !== '' && Number.isFinite(Number(rawEntryId))
      ? Number(rawEntryId)
      : null;
  const horseId =
    rawHorseId != null && rawHorseId !== '' && Number.isFinite(Number(rawHorseId))
      ? Number(rawHorseId)
      : null;
  if (entryId == null && horseId == null) return null;
  if (billed && !billingCompetitionIsUnpaid(billed) && !isEntryUnpaid(entry)) {
    return null;
  }
  if (!billed && !isEntryUnpaid(entry)) return null;
  // Prefer horse charge_due so Pay matches horse_ids (one horse, not pay-all).
  const horseAmount = getHorseBillingAmount(matched?.row);
  return {
    entryId,
    horseId,
    amount: firstAmount(
      horseAmount,
      billed?.payable,
      billed?.charge_due,
      billed?.due,
      entry?.payable,
      entry?.charge_due,
      entry?.due
    ),
  };
}

function getCompetitionPaidAmount(comp, horseRow) {
  if (comp && typeof comp === 'object') {
    const fee = firstAmount(
      comp.already_paid,
      comp.paid_amount,
      comp.amount_paid,
      comp.paid,
      comp.due,
      comp.amount
    );
    if (fee != null) return fee;
  }
  return firstAmount(
    horseRow?.already_paid,
    horseRow?.paid_amount,
    horseRow?.amount_paid,
    horseRow?.paid,
    horseRow?.due
  );
}

function findCompetitionByBillingComp(competitions, comp) {
  if (!comp) return null;
  const list = competitions ?? [];
  if (typeof comp !== 'object') {
    const name = String(comp);
    return (
      list.find((c) => c.competition_name === name) ?? null
    );
  }
  const id = comp.id ?? comp.competition_id;
  if (id != null) {
    const byId = list.find(
      (c) => Number(c.competition_id) === Number(id)
    );
    if (byId) return byId;
  }
  const name = getCompetitionLabel(comp);
  return list.find((c) => c.competition_name === name) ?? null;
}

function getCompetitionListFee(comp, horseRow, fallbackCompetition) {
  if (comp && typeof comp === 'object') {
    const fee = comp.entry_fee ?? comp.list_fee ?? null;
    if (fee != null && fee !== '') return fee;
  }
  return (
    fallbackCompetition?.entry_fee ??
    horseRow?.entry_fee ??
    null
  );
}

/** Invert horse-centric billing into competition → horses + fees. */
function groupBillingByCompetition(
  billing,
  competitions = [],
  t,
  getAmount = getCompetitionFee
) {
  const groups = new Map();
  const horseFallback = t ? t('common.horse') : 'Horse';
  const feeFallback = t ? t('events.entryFee') : 'Entry fee';

  for (const row of billing || []) {
    const comps = Array.isArray(row.competitions) ? row.competitions : [];
    const list = comps.length > 0 ? comps : [null];

    list.forEach((comp, index) => {
      const matchedCompetition = findCompetitionByBillingComp(
        competitions,
        comp
      );
      const competitionName =
        comp == null
          ? row.reason || feeFallback
          : getCompetitionLabel(comp, t);
      const key = `${competitionName}::${
        typeof comp === 'object' && comp
          ? comp.id ?? comp.competition_id ?? index
          : index
      }`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          competitionName,
          lines: [],
        });
      }

      const due = getAmount(comp, row);
      const listFee = getCompetitionListFee(comp, row, matchedCompetition);
      groups.get(key).lines.push({
        horseName: row.horse_name || horseFallback,
        due,
        listFee,
        fallbackDue:
          getAmount(null, row) ??
          getAmount(comp, row) ??
          row.due,
        singleCompetition: list.length === 1,
        reason: row.reason,
        covered: isCompetitionCoveredByHigherTour(row, comp),
      });
    });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    lines: group.lines.map((line) => ({
      horseName: line.horseName,
      listFee: line.listFee,
      due:
        line.due != null && line.due !== ''
          ? line.due
          : line.singleCompetition
            ? line.fallbackDue
            : null,
      reason: line.reason,
      covered: Boolean(line.covered),
    })),
  }));
}

/** Lower unpaid tour covered when same horse still owes a higher tour fee. */
function isCompetitionCoveredByHigherTour(billingRow, comp) {
  if (!comp || typeof comp !== 'object') return false;
  if (!billingCompetitionIsUnpaid(comp)) return false;

  const payable = firstAmount(comp.payable, comp.charge_due, comp.due);
  if (payable != null && Number(payable) === 0) return true;

  const listFee = Number(
    firstAmount(
      comp.entry_fee,
      comp.list_fee,
      comp.fee,
      payable
    ) || 0
  );
  const horseDue = Number(getHorseBillingAmount(billingRow) || 0);
  if (!(listFee > 0 && horseDue > 0)) return false;
  return listFee < horseDue;
}

function resolveEntryListFeeAmount(entry, competition, billing) {
  const matched = findBillingCompetitionForEntry(billing, entry, competition);
  return firstAmount(
    matched?.comp?.entry_fee,
    matched?.comp?.list_fee,
    entry?.entry_fee,
    competition?.entry_fee,
    findBillingListFeeForEntry(billing, entry, competition)
  );
}

function isEntryCoveredByHigherTour(billing, entry, competition) {
  const matched = findBillingCompetitionForEntry(billing, entry, competition);
  if (matched?.row && matched?.comp) {
    return isCompetitionCoveredByHigherTour(matched.row, matched.comp);
  }
  return false;
}

function formatHeight(height) {
  if (height == null || height === '') return null;
  const raw = String(height).trim();
  if (!raw) return null;
  if (/cm$/i.test(raw)) return raw;
  return `${raw} cm`;
}

function findHeightValue(obj) {
  if (obj == null || typeof obj !== 'object') return null;
  const keys = [
    'height',
    'height_cm',
    'height_display',
    'jump_height',
    'class_height',
    'fence_height',
    'obstacle_height',
    'course_height',
    'max_height',
  ];
  for (const key of keys) {
    const value = obj[key];
    if (value != null && value !== '' && typeof value !== 'object') {
      return value;
    }
  }
  return null;
}

function resolveCompetitionHeight(entry, competition) {
  return formatHeight(
    findHeightValue(entry) ??
      findHeightValue(entry?.competition) ??
      findHeightValue(competition)
  );
}

function formatStartTime(startTime) {
  if (!startTime) return null;
  return String(startTime).slice(0, 5);
}

function resolveEntryDetails(entry, competition, t) {
  const height = resolveCompetitionHeight(entry, competition);
  const tourRaw =
    entry.tour_level_display ||
    competition?.tour_level_display ||
    entry.tour_level ||
    competition?.tour_level ||
    '';
  const tour = tourRaw ? getHorseLevelLabel(tourRaw, t) || null : null;
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
  return hasRecordedResult(entry);
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

function formatRegistrationClosesAt(value, t, language) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  try {
    const locale = language?.startsWith('ka') ? 'ka-GE' : 'en-GB';
    const formatted = new Intl.DateTimeFormat(locale, {
      timeZone: 'Asia/Tbilisi',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return t('events.tbilisiTime', { datetime: formatted });
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

function resolveRegisterGate(
  event,
  canRegisterForEvents,
  globalBlockedReason,
  t
) {
  const competitions = event?.competitions ?? [];
  const anyCompetitionOpen =
    competitions.length === 0
      ? event?.registration_open !== false
      : competitions.some((c) => isCompetitionRegistrationOpen(c));

  const globalBlocked = canRegisterForEvents === false;
  const membershipBlocked =
    event?.can_register === false && event?.registration_open === true;
  const allCompetitionsClosed =
    event?.can_register === false && !anyCompetitionOpen;

  const blocked = globalBlocked || membershipBlocked || allCompetitionsClosed;

  const reason = rewriteAgeBlockedReason(
    event?.register_blocked_reason ||
      (allCompetitionsClosed ? t('events.allClosed') : null) ||
      globalBlockedReason ||
      t('events.membershipRequired'),
    t
  );

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

function amountsEqual(a, b) {
  if (a == null || a === '' || b == null || b === '') return false;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na === nb;
  return String(a) === String(b);
}

function resolveEntryListFee(entry, competition) {
  return entry?.entry_fee ?? competition?.entry_fee ?? null;
}

function resolveEntryListCurrency(entry, competition, fallbackCurrency = 'GEL') {
  return (
    entry?.entry_fee_currency ||
    competition?.entry_fee_currency ||
    fallbackCurrency
  );
}

function findBillingListFeeForEntry(billing, entry, competition) {
  const entryCompId = entry?.competition_id ?? competition?.competition_id;
  const entryCompName =
    entry?.competition_name || competition?.competition_name || '';

  for (const row of billing || []) {
    const horseMatch =
      (entry?.horse_id != null &&
        row?.horse_id != null &&
        Number(row.horse_id) === Number(entry.horse_id)) ||
      (entry?.horse_name &&
        row?.horse_name &&
        String(row.horse_name).toLowerCase() ===
          String(entry.horse_name).toLowerCase());
    if (!horseMatch) continue;

    const comps = Array.isArray(row.competitions) ? row.competitions : [];
    const match = comps.find((comp) => {
      if (!comp || typeof comp !== 'object') return false;
      const compId = comp.id ?? comp.competition_id;
      if (
        entryCompId != null &&
        compId != null &&
        Number(compId) === Number(entryCompId)
      ) {
        return true;
      }
      return (
        getCompetitionLabel(comp).toLowerCase() ===
        String(entryCompName).toLowerCase()
      );
    });
    if (match && typeof match === 'object') {
      const list = match.entry_fee ?? match.list_fee ?? match.fee ?? null;
      if (list != null && list !== '') return list;
    }
  }
  return null;
}

function findBillingDueForEntry(billing, entry, competition) {
  const entryCompId = entry?.competition_id ?? competition?.competition_id;
  const entryCompName =
    entry?.competition_name || competition?.competition_name || '';

  for (const row of billing || []) {
    const horseMatch =
      (entry?.horse_id != null &&
        row?.horse_id != null &&
        Number(row.horse_id) === Number(entry.horse_id)) ||
      (entry?.horse_name &&
        row?.horse_name &&
        String(row.horse_name).toLowerCase() ===
          String(entry.horse_name).toLowerCase()) ||
      (entry?.entry_id != null &&
        row?.entry_id != null &&
        Number(row.entry_id) === Number(entry.entry_id));
    if (!horseMatch) continue;

    const comps = Array.isArray(row.competitions) ? row.competitions : [];
    if (comps.length === 0) {
      if (row.due != null && row.due !== '') return row.due;
      continue;
    }

    const match = comps.find((comp) => {
      if (!comp || typeof comp !== 'object') {
        return (
          String(comp || '').toLowerCase() ===
          String(entryCompName).toLowerCase()
        );
      }
      const compId = comp.id ?? comp.competition_id;
      if (
        entryCompId != null &&
        compId != null &&
        Number(compId) === Number(entryCompId)
      ) {
        return true;
      }
      return (
        getCompetitionLabel(comp).toLowerCase() ===
        String(entryCompName).toLowerCase()
      );
    });

    if (match && typeof match === 'object') {
      const due = firstAmount(
        match.payable,
        match.charge_due,
        match.due,
        match.amount,
        match.payable_amount,
        match.charge
      );
      if (due != null) return due;
    }
    const rowDue = firstAmount(row.charge_due, row.due);
    if (rowDue != null) return rowDue;
  }

  return firstAmount(
    entry?.payable,
    entry?.charge_due,
    entry?.due,
    entry?.amount_due,
    entry?.payable_amount,
    entry?.charge
  );
}

function formatFeeWithActualDue(listAmount, dueAmount, currency = 'GEL') {
  const listLabel = formatMoney(listAmount, currency);
  const dueLabel = formatMoney(dueAmount, currency);
  if (!listLabel && !dueLabel) return null;
  if (!listLabel) return dueLabel;
  if (!dueLabel || amountsEqual(listAmount, dueAmount)) return listLabel;
  return `${listLabel} (${dueLabel})`;
}

function resolveEntryFeeLabel(
  entry,
  competition,
  fallbackCurrency = 'GEL',
  billing = null
) {
  const currency = resolveEntryListCurrency(
    entry,
    competition,
    fallbackCurrency
  );
  // Pay labels: only backend payable / charge_due / due — never sum or invent fees.
  const payTarget = resolveCompetitionPayTarget(billing, entry, competition);
  if (payTarget?.amount != null) {
    return formatMoney(payTarget.amount, currency);
  }
  const dueFee = findBillingDueForEntry(billing, entry, competition);
  return formatMoney(dueFee, currency);
}

function EntryManageActions({
  eventId,
  entry,
  competition,
  onUpdated,
  canPay = false,
  onPay,
  paying = false,
  feeLabel,
  payHorseId = null,
  payEntryId = null,
  paymentCovered = false,
  coveredFeeLabel = null,
}) {
  const { t, i18n } = useTranslation('riderProfile');
  const [changing, setChanging] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!confirmRemove) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) setConfirmRemove(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, confirmRemove]);

  const canStartPay = payHorseId != null || payEntryId != null;
  if (!entry?.entry_id && !canStartPay && !paymentCovered) return null;
  if (!isEntryUnpaid(entry) && !canStartPay && !paymentCovered) return null;

  const locked = entryHasResults(entry);
  const registrationOpen = isCompetitionRegistrationOpen(competition);
  const alternatives = alternativeHorses(competition, entry.horse_id);
  const closesLabel = formatRegistrationClosesAt(
    competition?.registration_closes_at,
    t,
    i18n.language
  );
  const showManage = Boolean(entry?.entry_id) && !locked && registrationOpen;
  const showPay = Boolean(canPay && onPay && canStartPay && !paymentCovered);
  const showCoveredPay = Boolean(paymentCovered);
  const horseLabel =
    capitalizeName(entry.horse_name) || t('events.thisHorse');
  const competitionLabel =
    entry.competition_name ||
    competition?.competition_name ||
    t('events.thisCompetition');

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
      setError(formatApiError(err, t, 'events.changeHorseFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    try {
      setBusy(true);
      await deleteMyEventEntry(eventId, entry.entry_id);
      setConfirmRemove(false);
      await onUpdated();
    } catch (err) {
      setError(formatApiError(err, t, 'events.deleteFailed'));
      setConfirmRemove(false);
    } finally {
      setBusy(false);
    }
  };

  if (locked && !showPay && !showCoveredPay) {
    return (
      <p className={classes.entryLockedHint}>
        {t('events.resultsLocked')}
      </p>
    );
  }

  return (
    <div className={classes.entryActions}>
      {!changing ? (
        <>
          <div className={classes.entryActionBtns}>
            {showManage && (
              <button
                type="button"
                className={classes.entryActionBtn}
                onClick={() => {
                  setChanging(true);
                  setError('');
                  setSelectedHorseId('');
                }}
                disabled={busy || paying || alternatives.length === 0}
                title={
                  alternatives.length === 0
                    ? t('events.noOtherHorse')
                    : t('events.changeHorse')
                }
              >
                {t('events.changeHorse')}
              </button>
            )}
            {showPay && (
              <button
                type="button"
                className={classes.entryPayBtn}
                onClick={() =>
                  onPay(
                    payHorseId != null
                      ? { horseIds: [payHorseId] }
                      : { entryIds: [payEntryId] }
                  )
                }
                disabled={busy || paying}
                title={
                  feeLabel
                    ? t('events.payEntryAmount', { amount: feeLabel })
                    : t('events.payEntry')
                }
              >
                {paying
                  ? t('events.redirecting')
                  : feeLabel
                    ? t('events.payAmount', { amount: feeLabel })
                    : t('events.pay')}
              </button>
            )}
            {showCoveredPay && (
              <button
                type="button"
                className={`${classes.entryPayBtn} ${classes.entryPayBtnCovered}`}
                disabled
                title={t('events.payCoveredHint')}
              >
                <span className={classes.payCoveredAmount}>
                  {coveredFeeLabel
                    ? t('events.payAmount', { amount: coveredFeeLabel })
                    : t('events.pay')}
                </span>
              </button>
            )}
            {showManage && (
              <button
                type="button"
                className={`${classes.entryActionBtn} ${classes.entryActionBtnDanger}`}
                onClick={() => {
                  setError('');
                  setConfirmRemove(true);
                }}
                disabled={busy || paying}
              >
                {busy ? t('common.removing') : t('common.remove')}
              </button>
            )}
          </div>
          {!showManage && !locked && (
            <p className={classes.entryLockedHint}>
              {closesLabel
                ? t('events.regClosedOn', { date: closesLabel })
                : t('events.regClosedComp')}
            </p>
          )}
          {locked && (
            <p className={classes.entryLockedHint}>
              {t('events.resultsLockedHorse')}
            </p>
          )}
        </>
      ) : (
        <div className={classes.changeHorsePanel}>
          <span className={classes.horsePickLabel}>
            {t('events.selectNewHorse')}
          </span>
          {alternatives.length === 0 ? (
            <p className={classes.competitionHint}>
              {t('events.noOtherHorseForComp')}
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
                    {capitalizeName(h.horse_name)}
                    {h.horse_level_display || h.horse_level
                      ? ` (${getHorseLevelLabel(
                          h.horse_level_display || h.horse_level,
                          t
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
              {busy ? t('common.saving') : t('common.save')}
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
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
      {error && <p className={classes.error}>{error}</p>}

      {confirmRemove && (
        <div
          className={classes.confirmOverlay}
          role="presentation"
          onClick={() => {
            if (!busy) setConfirmRemove(false);
          }}
        >
          <div
            className={classes.confirmModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-entry-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="remove-entry-title" className={classes.confirmTitle}>
              {t('events.removeConfirmTitle')}
            </h3>
            <p className={classes.confirmText}>
              {t('events.removeConfirm', {
                horse: horseLabel,
                competition: competitionLabel,
              })}
            </p>
            <div className={classes.confirmActions}>
              <button
                type="button"
                className={classes.confirmCancelBtn}
                onClick={() => setConfirmRemove(false)}
                disabled={busy}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={classes.confirmDangerBtn}
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                {busy
                  ? t('common.removing')
                  : t('events.removeConfirmAction')}
              </button>
            </div>
          </div>
        </div>
      )}
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

function billingGroupsHaveAmounts(groups) {
  return groups.some((group) =>
    group.lines.some((line) => {
      if (line.due == null || line.due === '') return false;
      const n = Number(line.due);
      if (Number.isFinite(n)) return n > 0;
      return true;
    })
  );
}

function sumReceiptAmount(groups) {
  let total = 0;
  let any = false;
  for (const group of groups) {
    for (const line of group.lines) {
      const n = Number(line.due);
      if (Number.isFinite(n)) {
        total += n;
        any = true;
      }
    }
  }
  return any ? total : null;
}

function receiptGroupsFromEntries(event, t) {
  const competitions = event.competitions ?? [];
  const groups = groupEntriesByCompetition(event.entries ?? [], competitions);

  return groups
    .map((group, groupIndex) => {
      const competition = group.competition;
      const name =
        competition?.competition_name ||
        group.orphanName ||
        group.entries[0]?.competition_name ||
        t('events.competition');
      const lines = (group.entries ?? [])
        .filter(
          (entry) =>
            isEntryPaid(entry) ||
            firstAmount(
              entry.paid_amount,
              entry.amount_paid,
              entry.already_paid,
              entry.entry_fee
            ) != null
        )
        .map((entry) => ({
          horseName: entry.horse_name || t('common.horse'),
          due: firstAmount(
            entry.paid_amount,
            entry.amount_paid,
            entry.already_paid,
            entry.due,
            entry.entry_fee
          ),
          reason: entry.reason || entry.billing_reason || '',
        }));

      return {
        key: `receipt-${competition?.competition_id ?? name}-${groupIndex}`,
        competitionName: name,
        lines,
      };
    })
    .filter((group) => group.lines.length > 0);
}

function buildEventReceipt(event, t) {
  const competitions = event.competitions ?? [];
  const billing = Array.isArray(event.billing) ? event.billing : [];
  const fromBilling = groupBillingByCompetition(
    billing,
    competitions,
    t,
    getCompetitionPaidAmount
  );
  const groups = billingGroupsHaveAmounts(fromBilling)
    ? fromBilling
    : receiptGroupsFromEntries(event, t);
  const currency =
    event.paid_currency ||
    event.charge_currency ||
    event.unpaid_currency ||
    'GEL';
  const total =
    firstAmount(event.paid_total, event.amount_paid, event.total_paid) ??
    sumReceiptAmount(groups);

  return { groups, currency, total };
}

function EventReceipt({ event }) {
  const { t, i18n } = useTranslation('riderProfile');
  const { groups, currency, total } = buildEventReceipt(event, t);

  if (!groups.length && (total == null || total === '')) return null;

  return (
    <div className={classes.paySection}>
      <div className={classes.payAllHeader}>
        <h4 className={classes.payAllTitle}>{t('events.receiptTitle')}</h4>
        <p className={classes.payAllHint}>{t('events.receiptHint')}</p>
      </div>

      {groups.length > 0 && (
        <div className={classes.eventBillingList}>
          {groups.map((group) => (
            <div key={group.key} className={classes.eventBillingCompetition}>
              <div className={classes.eventBillingCompetitionTitle}>
                {translateBillingReason(
                  group.competitionName,
                  t,
                  i18n.language
                )}
              </div>
              <div className={classes.eventBillingHorseLines}>
                {group.lines.map((line, index) => (
                  <div
                    key={`${group.key}-${line.horseName}-${index}`}
                    className={classes.eventBillingHorseLine}
                  >
                    <span>
                      {capitalizeName(line.horseName)}
                      {line.reason
                        ? ` · ${translateBillingReason(
                            line.reason,
                            t,
                            i18n.language
                          )}`
                        : ''}
                    </span>
                    <span className={classes.eventBillingAmount}>
                      {formatMoney(line.due, currency) || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={classes.payAllTotals}>
        <div className={classes.payAllTotalRow}>
          <span>{t('events.paidTotal')}</span>
          <strong>{formatMoney(total, currency) || '—'}</strong>
        </div>
      </div>
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
  horseImageById,
  canPayEntry = false,
  onPayEntry,
  payingEntryId = null,
  unpaidCurrency = 'GEL',
  billing = null,
}) {
  const { t, i18n } = useTranslation('riderProfile');
  if (!entries?.length) return null;

  const comps = competitions ?? [];
  const dayLabelsByDate = buildCompetitionDayLabels(comps, t);
  const groups = groupEntriesByCompetition(entries, comps);

  return (
    <div className={classes.registeredByCompetition}>
      {groups.map((group, groupIndex) => {
        const competition = group.competition;
        const name =
          competition?.competition_name ||
          group.orphanName ||
          group.entries[0]?.competition_name ||
          t('events.competition');
        const details = resolveEntryDetails(group.entries[0], competition, t);
        const dateKey = normalizeCompetitionDate(
          competition?.competition_date ||
            competition?.date ||
            group.entries[0]?.competition_date
        );
        const prevDateKey =
          groupIndex > 0
            ? normalizeCompetitionDate(
                groups[groupIndex - 1]?.competition?.competition_date ||
                  groups[groupIndex - 1]?.competition?.date ||
                  groups[groupIndex - 1]?.entries?.[0]?.competition_date
              )
            : null;
        const dayLabel = dateKey ? dayLabelsByDate[dateKey] : null;
        const showDayBreak = Boolean(
          dayLabel &&
            (groupIndex === 0 ||
              (dateKey && prevDateKey && dateKey !== prevDateKey))
        );
        const heightLabel =
          details.height ||
          resolveCompetitionHeight(null, competition) ||
          group.entries
            .map((e) => resolveCompetitionHeight(e, competition))
            .find(Boolean) ||
          null;
        const feeLabel = resolveEntryFeeLabel(
          group.entries.find((e) => isEntryUnpaid(e)) || group.entries[0],
          competition,
          unpaidCurrency,
          billing
        );
        const tourLabel =
          details.tour ||
          getHorseLevelLabel(
            competition?.tour_level_display || competition?.tour_level,
            t
          );

        return (
          <Fragment
            key={
              competition?.competition_id ??
              `${name}-${groupIndex}`
            }
          >
          {showDayBreak && (
            <div className={classes.dayDivider} role="separator">
              <span className={classes.dayDividerLine} aria-hidden />
              <span className={classes.dayDividerLabel}>
                {dayLabel ||
                  formatDisplayDate(dateKey, i18n.language) ||
                  t('events.day', { n: toDayRoman(groupIndex + 1) })}
              </span>
              <span className={classes.dayDividerLine} aria-hidden />
            </div>
          )}
          <div className={classes.competitionRow}>
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
                  formatDisplayDate(
                    details.date || competition?.competition_date,
                    i18n.language
                  ),
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
                const result = showResults
                  ? formatEntryResult(entry, competition, t)
                  : null;
                const horseImage = resolveEntryHorseImage(
                  entry,
                  competition,
                  horseImageById
                );
                const payTarget = resolveCompetitionPayTarget(
                  billing,
                  entry,
                  competition
                );
                const covered = isEntryCoveredByHigherTour(
                  billing,
                  entry,
                  competition
                );
                const listFeeLabel = formatMoney(
                  resolveEntryListFeeAmount(entry, competition, billing),
                  unpaidCurrency
                );
                const entryFeeLabel = resolveEntryFeeLabel(
                  entry,
                  competition,
                  unpaidCurrency,
                  billing
                );
                const isPayingThis =
                  payingEntryId != null &&
                  ((payTarget?.horseId != null &&
                    String(payingEntryId) === `horse:${payTarget.horseId}`) ||
                    (payTarget?.entryId != null &&
                      String(payingEntryId) === String(payTarget.entryId)));

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
                          {capitalizeName(entry.horse_name) || '—'}
                        </span>
                        <div className={classes.entryBadges}>
                          {unpaid && !covered && (
                            <span className={classes.unpaidBadge}>
                              {t('events.unpaid')}
                            </span>
                          )}
                          {paid && (
                            <span className={classes.paidBadge}>
                              {t('events.paid')}
                            </span>
                          )}
                          {unpaid && covered && listFeeLabel && (
                            <>
                              <span
                                className={`${classes.entryFeeBadge} ${classes.feeCovered}`}
                              >
                                {listFeeLabel}
                              </span>
                              <span className={classes.coveredBadge}>
                                {t('events.includedInHighestTour')}
                              </span>
                            </>
                          )}
                          {unpaid && !covered && entryFeeLabel && (
                            <span className={classes.entryFeeBadge}>
                              {entryFeeLabel}
                            </span>
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
                        canPay={canPayEntry && !covered}
                        onPay={onPayEntry}
                        paying={isPayingThis}
                        feeLabel={entryFeeLabel}
                        payHorseId={covered ? null : payTarget?.horseId ?? null}
                        payEntryId={covered ? null : payTarget?.entryId ?? null}
                        paymentCovered={covered}
                        coveredFeeLabel={listFeeLabel}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </Fragment>
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
function buildCompetitionDayLabels(competitions, t) {
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
    map[date] = t('events.day', { n: toDayRoman(index + 1) });
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
  const { t, i18n } = useTranslation('riderProfile');
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
  const heightLabel = resolveCompetitionHeight(null, competition);
  const maxPerRider =
    competition.max_horses_per_rider ??
    competition.max_horses_per_competition ??
    3;

  const noHorsesAtAll = horses.length === 0;
  const registrationOpen = isCompetitionRegistrationOpen(competition);
  const closesLabel = formatRegistrationClosesAt(
    competition.registration_closes_at,
    t,
    i18n.language
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
          {getHorseLevelLabel(
            competition.tour_level_display || competition.tour_level,
            t
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
          {formatDisplayDate(competition.competition_date, i18n.language)}
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
            ? t('events.regOpenUntil', { date: closesLabel })
            : t('events.regClosedUntil', { date: closesLabel })}
        </p>
      )}
      {!closesLabel && !registrationOpen && (
        <p className={classes.competitionDeadlineClosed}>
          {t('events.regClosedComp')}
        </p>
      )}

      <p className={classes.slotsHint}>
        {t('events.horsesSlots', {
          used: competition.rider_entries_count ?? enteredHorses.length,
          max: maxPerRider,
        })}
        {slotsRemaining > 0
          ? ` · ${t('events.slotsLeft', { count: slotsRemaining })}`
          : ` · ${t('events.noSlotsLeft')}`}
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
                  <span className={classes.horsePickName}>
                    {capitalizeName(h.horse_name)}
                  </span>
                  <span className={classes.horsePickStatus}>
                    {t('events.registered')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!registrationOpen && (
        <p className={classes.competitionHint}>
          {t('events.lockedHint')}
        </p>
      )}

      {registrationOpen && noHorsesAtAll && (
        <p className={classes.competitionHint}>
          {t('events.addHorseFirst')}
        </p>
      )}

      {registrationOpen && !noHorsesAtAll && slotsRemaining <= 0 && (
        <p className={classes.competitionHint}>
          {t('events.maxHorses', { count: maxPerRider })}
        </p>
      )}

      {registrationOpen && !noHorsesAtAll && slotsRemaining > 0 && (
        <div className={classes.horsePick}>
          <span className={classes.horsePickLabel}>
            {t('events.selectHorses', { count: slotsRemaining })}
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
                      ? t('events.maxHorsesTitle', { count: slotsRemaining })
                      : capitalizeName(h.horse_name))
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
                  <span className={classes.horsePickName}>
                    {capitalizeName(h.horse_name)}
                  </span>
                </button>
              );
            })}
          </div>
          {selectableHorses.length === 0 && (
            <p className={classes.competitionHint}>
              {horses.some((h) => h.blocked_reason)
                ? horses.find((h) => h.blocked_reason)?.blocked_reason
                : t('events.noEligible')}
            </p>
          )}
          {selectedCount > 0 && (
            <p className={classes.selectionHint}>
              {t('events.selectedCount', {
                selected: selectedCount,
                max: slotsRemaining,
              })}
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
  const { t, i18n } = useTranslation('riderProfile');
  const [expanded, setExpanded] = useState(false);
  const [selections, setSelections] = useState({});
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [forbiddenBlockReason, setForbiddenBlockReason] = useState('');
  const [paying, setPaying] = useState(false);
  const [payingEntryId, setPayingEntryId] = useState(null);
  const [payError, setPayError] = useState('');
  const scrollToPayAfterRegister = useRef(false);

  const hasCover = Boolean(event.cover_image);
  const competitions = event.competitions ?? [];
  const dayLabelsByDate = buildCompetitionDayLabels(competitions, t);
  const hasUnpaid = Boolean(event.has_unpaid_entries);
  const unpaidCurrency = event.unpaid_currency || 'GEL';
  const chargeCurrency = event.charge_currency || unpaidCurrency;
  const billing = Array.isArray(event.billing) ? event.billing : [];
  const billingDueFallback = (() => {
    let sum = 0;
    let any = false;
    for (const row of billing) {
      const amt = firstAmount(row?.charge_due, row?.due);
      if (amt == null || amt === '') continue;
      const n = Number(amt);
      if (!Number.isFinite(n) || n <= 0) continue;
      sum += n;
      any = true;
    }
    return any ? String(sum) : null;
  })();
  const pendingAmount = firstAmount(
    event.pending_payment?.amount,
    event.pending_payment?.original_amount
  );
  // Prefer backend charge_due (highest-tour remainder). Do not invent fees.
  const chargeDueAmount = firstAmount(
    event.charge_due,
    event.due,
    event.unpaid_total,
    pendingAmount,
    billingDueFallback
  );
  const chargeDue = formatMoney(chargeDueAmount, chargeCurrency);
  const unpaidTotal = formatMoney(
    firstAmount(event.unpaid_total, event.charge_due, event.due, billingDueFallback),
    unpaidCurrency
  );
  const showChargePreview =
    event.charge_due != null &&
    event.charge_due !== '' &&
    event.unpaid_total != null &&
    event.unpaid_total !== '' &&
    String(event.charge_due) !== String(event.unpaid_total);
  const pendingUrl = getEventPendingRedirect(event);
  const gate = resolveRegisterGate(
    event,
    canRegisterForEvents,
    registerBlockedReason,
    t
  );
  // Pay all only on the card — not gated by registration_open / pendingUrl.
  const canPay = event.can_pay === true;
  const payBlockedReason = rewriteAgeBlockedReason(
    event.pay_blocked_reason || '',
    t
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
        result?.registered
          ? t('events.registeredFor', {
              count: result.registered,
              due: due ? t('events.dueSuffix', { amount: due }) : '',
            })
          : t('events.registrationCreated')
      );
      setSelections({});
      scrollToPayAfterRegister.current = true;
      await onRegistered();
      window.setTimeout(() => {
        if (!scrollToPayAfterRegister.current) return;
        const payEl = document.getElementById(`event-pay-${event.id}`);
        if (!payEl) return;
        scrollToPayAfterRegister.current = false;
        payEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      scrollToPayAfterRegister.current = false;
      const message = formatApiError(err, t, 'events.registrationFailed');
      setRegisterError(message);
      if (err instanceof ApiRequestError && err.status === 403) {
        setForbiddenBlockReason(message);
        setExpanded(false);
      }
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (!scrollToPayAfterRegister.current || !hasUnpaid) return;
    const timer = window.setTimeout(() => {
      if (!scrollToPayAfterRegister.current) return;
      const payEl = document.getElementById(`event-pay-${event.id}`);
      if (!payEl) return;
      scrollToPayAfterRegister.current = false;
      payEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [event.id, hasUnpaid, billing, event.has_unpaid_entries]);

  const redirectToBank = (url) => {
    window.location.href = url;
  };

  const handlePay = async ({ horseIds, entryIds, payAll = false } = {}) => {
    setPayError('');
    const horses = Array.isArray(horseIds)
      ? horseIds
          .map(Number)
          .filter((id) => Number.isFinite(id))
      : [];
    const entries = Array.isArray(entryIds)
      ? entryIds
          .map(Number)
          .filter((id) => Number.isFinite(id))
      : [];
    // Scoped pay must never fall through to empty body (pay-all).
    if (!payAll && horses.length === 0 && entries.length === 0) {
      setPayError(t('events.payStartFailed'));
      return;
    }
    try {
      setPaying(true);
      if (horses.length === 1) {
        setPayingEntryId(`horse:${horses[0]}`);
      } else if (entries.length === 1) {
        setPayingEntryId(entries[0]);
      } else {
        setPayingEntryId('all');
      }
      const response = await payForEvent(event.id, {
        horse_ids: horses.length > 0 ? horses : undefined,
        entry_ids: horses.length > 0 ? undefined : entries.length > 0 ? entries : undefined,
      });
      const redirectUrl = getPaymentRedirectUrl(response);
      if (!redirectUrl) {
        setPayError(t('events.noRedirect'));
        return;
      }
      redirectToBank(redirectUrl);
    } catch (err) {
      setPayError(formatApiError(err, t, 'events.payStartFailed'));
    } finally {
      setPaying(false);
      setPayingEntryId(null);
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
          {event.date && (
            <p className={classes.eventMeta}>
              {formatDisplayDate(event.date, i18n.language)}
            </p>
          )}
          {event.location && <p className={classes.eventMeta}>{event.location}</p>}
          {event.description && (
            <p className={classes.eventDescription}>{event.description}</p>
          )}

          {event.is_registered && (
            <span className={classes.registeredBadge}>
              {t('events.registered')}
            </span>
          )}

          {hasUnpaid && (unpaidTotal || chargeDue) && (
            <div className={classes.unpaidSummary}>
              <span className={classes.unpaidSummaryLabel}>
                {t('events.unpaidTotal')}
              </span>
              <strong className={classes.unpaidSummaryAmount}>
                {unpaidTotal || chargeDue}
              </strong>
              {showChargePreview && chargeDue && (
                <span className={classes.chargePreview}>
                  {t('events.chargePreview', { amount: chargeDue })}
                  {event.fx ? ` · ${event.fx}` : ''}
                </span>
              )}
            </div>
          )}

          {!registerBlocked && gate.anyCompetitionOpen && (
            <p className={classes.registrationDeadline}>
              {t('events.deadlineHint')}
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
            canPayEntry={canPay}
            onPayEntry={handlePay}
            payingEntryId={payingEntryId}
            unpaidCurrency={unpaidCurrency}
            billing={billing}
          />
        )}

        {hasUnpaid && (
          <div
            id={`event-pay-${event.id}`}
            className={classes.paySection}
          >
            <div className={classes.payAllHeader}>
              <h4 className={classes.payAllTitle}>{t('events.payAllTitle')}</h4>
              <p className={classes.payAllHint}>{t('events.payAllHint')}</p>
            </div>

            {billing.length > 0 && (
              <div className={classes.eventBillingList}>
                {(() => {
                  const duesRows = billing
                    .map((row) => {
                      const horseDue = firstAmount(row.charge_due, row.due);
                      const comps = (row.competitions || []).filter((c) =>
                        billingCompetitionIsUnpaid(c)
                      );
                      if (
                        (horseDue == null || Number(horseDue) <= 0) &&
                        comps.length === 0
                      ) {
                        return null;
                      }
                      return { row, horseDue, comps };
                    })
                    .filter(Boolean);
                  const showPerHorseAmount = duesRows.length > 1;

                  return duesRows.map(({ row, horseDue, comps }) => {
                    const horseDueLabel = formatMoney(
                      horseDue,
                      row.charge_currency || row.currency || unpaidCurrency
                    );
                    const alreadyPaid = firstAmount(row.already_paid);
                    return (
                      <div
                        key={row.horse_id ?? row.horse_name}
                        className={classes.duesHorseBlock}
                      >
                        <div className={classes.duesHorseHeader}>
                          <span className={classes.duesHorseName}>
                            {capitalizeName(row.horse_name) || t('common.horse')}
                          </span>
                          {showPerHorseAmount && horseDueLabel ? (
                            <span className={classes.eventBillingAmount}>
                              {horseDueLabel}
                            </span>
                          ) : null}
                        </div>
                        {comps.length > 0 && (
                          <ul className={classes.duesBreakdownList}>
                            {comps.map((comp) => {
                              const tour =
                                comp.tour_level_display ||
                                comp.tour_level ||
                                '';
                              const listFee = firstAmount(comp.entry_fee);
                              const maxFee = firstAmount(row.max_fee, horseDue);
                              const covered =
                                listFee != null &&
                                maxFee != null &&
                                Number(listFee) < Number(maxFee);
                              const feeLabel = formatMoney(
                                listFee,
                                comp.entry_currency ||
                                  row.currency ||
                                  unpaidCurrency
                              );
                              return (
                                <li
                                  key={
                                    comp.entry_id ??
                                    `${row.horse_id}-${comp.competition_id}`
                                  }
                                  className={`${classes.duesBreakdownItem}${
                                    covered
                                      ? ` ${classes.duesBreakdownCovered}`
                                      : ''
                                  }`}
                                >
                                  <span className={classes.duesBreakdownLabel}>
                                    {comp.competition_name ||
                                      t('events.competition')}
                                    {tour ? (
                                      <span className={classes.duesTourTag}>
                                        {tour}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className={classes.duesBreakdownFee}>
                                    {covered
                                      ? t('events.includedInHighestTour')
                                      : feeLabel || '—'}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {alreadyPaid != null && Number(alreadyPaid) > 0 ? (
                          <p className={classes.duesBreakdownNote}>
                            {t('events.highestTourRemainderNote', {
                              paid: formatMoney(
                                alreadyPaid,
                                row.currency || unpaidCurrency
                              ),
                              due: horseDueLabel || '—',
                            })}
                          </p>
                        ) : null}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            <div className={classes.payAllTotals}>
              <div className={classes.payAllTotalRow}>
                <span>{t('events.amountToCharge')}</span>
                <strong>{chargeDue || unpaidTotal || '—'}</strong>
              </div>
            </div>

            {payBlockedReason && !canPay && !pendingUrl && (
              <p className={classes.competitionHint}>{payBlockedReason}</p>
            )}

            {payError && <p className={classes.error}>{payError}</p>}

            {(pendingUrl || canPay) && (
              <div className={classes.eventPayRow}>
                {pendingUrl ? (
                  <button
                    type="button"
                    className={classes.payBtn}
                    onClick={() => redirectToBank(pendingUrl)}
                    disabled={paying}
                  >
                    {paying
                      ? t('events.redirecting')
                      : chargeDue || unpaidTotal
                        ? t('events.payAllAmount', {
                            amount: chargeDue || unpaidTotal,
                          })
                        : t('events.continuePayment')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={classes.payBtn}
                    onClick={() => void handlePay({ payAll: true })}
                    disabled={paying}
                  >
                    {paying && payingEntryId === 'all'
                      ? t('events.redirecting')
                      : chargeDue || unpaidTotal
                        ? t('events.payAllAmount', {
                            amount: chargeDue || unpaidTotal,
                          })
                        : t('events.payAll')}
                  </button>
                )}
              </div>
            )}
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
              {expanded ? t('events.hideRegistration') : t('events.registerFor')}
            </button>

            {expanded && (
              <div className={classes.registrationPanel}>
                {competitions.map((comp, index) => {
                  const dateKey = normalizeCompetitionDate(
                    comp.competition_date || comp.date
                  );
                  const prevDateKey =
                    index > 0
                      ? normalizeCompetitionDate(
                          competitions[index - 1]?.competition_date ||
                            competitions[index - 1]?.date
                        )
                      : null;
                  const dayLabel = dateKey ? dayLabelsByDate[dateKey] : null;
                  const showDayBreak = Boolean(
                    dayLabel &&
                      (index === 0 ||
                        (dateKey && prevDateKey && dateKey !== prevDateKey))
                  );
                  return (
                    <Fragment key={comp.competition_id}>
                      {showDayBreak && (
                        <div className={classes.dayDivider} role="separator">
                          <span className={classes.dayDividerLine} aria-hidden />
                          <span className={classes.dayDividerLabel}>
                            {dayLabel ||
                              formatDisplayDate(dateKey, i18n.language) ||
                              t('events.day', { n: toDayRoman(index + 1) })}
                          </span>
                          <span className={classes.dayDividerLine} aria-hidden />
                        </div>
                      )}
                      <CompetitionRegistrationRow
                        competition={comp}
                        selectedHorseIds={selections[comp.competition_id] ?? []}
                        onToggleHorse={handleToggleHorse}
                        dayLabel={dayLabel}
                        horseImageById={horseImageById}
                      />
                    </Fragment>
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
                  {registering ? t('events.registering') : t('events.register')}
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
  const { i18n } = useTranslation('riderProfile');
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
          {event.date && (
            <p className={classes.eventMeta}>
              {formatDisplayDate(event.date, i18n.language)}
            </p>
          )}
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
        <EventReceipt event={event} />
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
  const { t } = useTranslation('riderProfile');
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

  const pollAfterSuccessReturn = useCallback(
    async (eventId) => {
      setPaymentMessage('processing');
      setPaymentError('');

      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const latest = await loadEvents();
          const match = (latest?.upcoming ?? []).find(
            (ev) => String(ev.id) === String(eventId)
          );
          if (!match || !match.has_unpaid_entries) {
            setPaymentMessage('paySuccess');
            clearPaymentQuery();
            return;
          }
        } catch {
          /* keep polling */
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      setPaymentMessage('stillProcessing');
      clearPaymentQuery();
    },
    [clearPaymentQuery, loadEvents]
  );

  useEffect(() => {
    const run = async () => {
      try {
        await loadEvents();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || t('events.loadFailed'));
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

    // TBC uses a single return URL (payment=return); keep success/fail for older links.
    if (payment === 'return' || payment === 'success') {
      void pollAfterSuccessReturn(eventId);
    } else if (payment === 'fail') {
      setPaymentError(t('events.payFailed'));
      clearPaymentQuery();
    }
  }, [
    clearPaymentQuery,
    loading,
    pollAfterSuccessReturn,
    searchParams,
  ]);

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
  const { t } = useTranslation('riderProfile');
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
        <div className={classes.loading}>{t('events.loading')}</div>
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
      {paymentMessage && (
        <p className={classes.success}>
          {paymentMessage === 'processing' ||
          paymentMessage === 'paySuccess' ||
          paymentMessage === 'stillProcessing'
            ? t(`events.${paymentMessage}`)
            : paymentMessage}
        </p>
      )}
      {paymentError && <p className={classes.error}>{paymentError}</p>}

      <EventSection
        title={t('events.upcoming')}
        events={upcoming}
        emptyMessage={t('events.emptyUpcoming')}
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
  const { t } = useTranslation('riderProfile');
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
          <span>{t('events.history')}</span>
          {count != null && (
            <span className={classes.sectionCount}>{count}</span>
          )}
          <span className={classes.historyToggleHint}>
            {open ? t('events.hide') : t('events.show')}
          </span>
        </button>
      </div>

      {open && (
        <>
          <EventSection
            title={t('events.history')}
            events={visibleEvents}
            emptyMessage={t('events.emptyHistory')}
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
                {t('events.showMore')}
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
