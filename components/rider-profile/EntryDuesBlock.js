'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiRequestError } from '@/lib/api/api-error';
import { getMyEntryDues, requestEntryDuesPayment } from '@/lib/api/auth';
import classes from '@/styles/rider-profile/membership.module.css';

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 12;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatAmount(amount, currency = 'GEL') {
  if (amount == null || amount === '') return '—';
  return `${amount}${currency ? ` ${currency}` : ''}`;
}

function getPaymentRedirectUrl(response) {
  return response?.redirect_url || response?.payment?.redirect_url || null;
}

function getEventPendingRedirect(event) {
  return event?.pending_payment?.redirect_url || null;
}

function getCompetitionLabel(value) {
  if (value == null || value === '') return 'Competition';
  if (typeof value === 'string') return value;
  return (
    value.name ||
    value.competition_name ||
    value.title ||
    value.tour_level_display ||
    'Competition'
  );
}

function getCompetitionFee(comp, horseRow) {
  if (comp && typeof comp === 'object') {
    const fee =
      comp.due ??
      comp.entry_fee ??
      comp.fee ??
      comp.amount ??
      null;
    if (fee != null && fee !== '') return fee;
  }
  const comps = horseRow?.competitions;
  if (Array.isArray(comps) && comps.length === 1) {
    return horseRow.due;
  }
  return null;
}

/** Invert horse-centric billing into competition → horses + fees. */
function groupBillingByCompetition(billing) {
  const groups = new Map();

  for (const row of billing || []) {
    const comps = Array.isArray(row.competitions) ? row.competitions : [];
    const list = comps.length > 0 ? comps : [null];

    list.forEach((comp, index) => {
      const competitionName =
        comp == null
          ? row.reason || 'Entry fee'
          : getCompetitionLabel(comp);
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

      groups.get(key).lines.push({
        horseName: row.horse_name || 'Horse',
        due: getCompetitionFee(comp, row),
        fallbackDue: row.due,
        singleCompetition: list.length === 1,
        reason: row.reason,
      });
    });
  }

  return [...groups.values()].map((group) => ({
    ...group,
    lines: group.lines.map((line) => ({
      horseName: line.horseName,
      due:
        line.due != null && line.due !== ''
          ? line.due
          : line.singleCompetition
            ? line.fallbackDue
            : null,
      reason: line.reason,
    })),
  }));
}

function EntryDuesBlockContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnHandled = useRef(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [returnMessage, setReturnMessage] = useState('');
  const [payingEventId, setPayingEventId] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadEntryDues = useCallback(async () => {
    setLoadError('');
    const response = await getMyEntryDues();
    setData(response);
    return response;
  }, []);

  const handleRefresh = async () => {
    if (refreshing || payingEventId != null || processingPayment) return;
    setActionError('');
    setReturnMessage('');
    try {
      setRefreshing(true);
      await loadEntryDues();
    } catch (e) {
      if (e instanceof ApiRequestError && e.status !== 401) {
        setLoadError(e.message || 'Failed to load entry dues');
      } else if (!(e instanceof ApiRequestError)) {
        setActionError('Could not connect to the server');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const clearPaymentQuery = useCallback(() => {
    router.replace('/rider-profile/', { scroll: false });
  }, [router]);

  const pollAfterSuccessReturn = useCallback(async () => {
    setProcessingPayment(true);
    setReturnMessage('Processing payment…');

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      try {
        const latest = await loadEntryDues();
        if (!latest?.has_unpaid) {
          setReturnMessage('Payment successful. Entry dues are settled.');
          setProcessingPayment(false);
          clearPaymentQuery();
          return;
        }
      } catch {
        /* keep polling */
      }
      await sleep(POLL_INTERVAL_MS);
    }

    setReturnMessage(
      'Payment is still processing. Refresh in a moment or contact support if this persists.'
    );
    setProcessingPayment(false);
    clearPaymentQuery();
  }, [clearPaymentQuery, loadEntryDues]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadEntryDues();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || 'Failed to load entry dues');
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadEntryDues]);

  useEffect(() => {
    if (returnHandled.current || loading) return;

    const payment = searchParams.get('payment');
    if (!payment) return;

    // Membership returns have no eventId; entry-dues / event pay include it.
    if (!searchParams.get('eventId')) return;

    returnHandled.current = true;

    if (payment === 'success') {
      pollAfterSuccessReturn();
    } else if (payment === 'fail') {
      setReturnMessage('');
      setActionError('Payment failed. Please try again.');
      clearPaymentQuery();
    }
  }, [
    clearPaymentQuery,
    loading,
    pollAfterSuccessReturn,
    searchParams,
  ]);

  const redirectToBank = (url) => {
    window.location.href = url;
  };

  const handlePay = async (eventId) => {
    setActionError('');
    setReturnMessage('');
    try {
      setPayingEventId(eventId ?? 'all');
      const response = await requestEntryDuesPayment(eventId);
      const redirectUrl = getPaymentRedirectUrl(response);
      if (redirectUrl) {
        redirectToBank(redirectUrl);
        return;
      }
      setData(response);
      setActionError('Payment could not be started (no redirect URL).');
    } catch (e) {
      if (e instanceof ApiRequestError && e.status !== 401) {
        setActionError(e.message || 'Payment request failed');
      } else if (!(e instanceof ApiRequestError)) {
        setActionError('Could not connect to the server');
      }
    } finally {
      setPayingEventId(null);
    }
  };

  if (loading) {
    return (
      <aside
        id="entry-dues"
        className={`${classes.membershipBlock} ${classes.entryDuesBlock}`}
      >
        <p className={classes.loading}>Loading entry dues...</p>
      </aside>
    );
  }

  if (loadError && !data) {
    return (
      <aside
        id="entry-dues"
        className={`${classes.membershipBlock} ${classes.entryDuesBlock}`}
      >
        <div className={classes.blockTitleRow}>
          <h2 className={classes.blockTitle}>Entry dues</h2>
          <button
            type="button"
            className={classes.refreshBtn}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh entry dues"
            title="Refresh"
          >
            <svg
              className={`${classes.refreshIcon}${
                refreshing ? ` ${classes.refreshIconSpin}` : ''
              }`}
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden
            >
              <path
                fill="currentColor"
                d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24L14 10h6V4l-2.35 2.35Z"
              />
            </svg>
          </button>
        </div>
        <p className={classes.error}>{loadError}</p>
      </aside>
    );
  }

  const events = Array.isArray(data?.events) ? data.events : [];
  const unpaidEvents = events.filter(
    (event) => Number(event?.due) > 0 || event?.can_pay || getEventPendingRedirect(event)
  );
  const hasUnpaid = Boolean(data?.has_unpaid) || unpaidEvents.length > 0;
  const currency = data?.currency || 'GEL';
  const statusLabel =
    data?.status_label || (hasUnpaid ? 'Unpaid' : 'Paid up');
  const globalCanPay = Boolean(data?.can_pay);
  const payBlockedReason = data?.pay_blocked_reason;
  const singleUnpaidEvent =
    unpaidEvents.length === 1 ? unpaidEvents[0] : null;

  let statusClass = classes.statusActive;
  if (hasUnpaid) {
    statusClass =
      data?.status_label?.toLowerCase?.().includes('pending') ||
      unpaidEvents.some((e) => getEventPendingRedirect(e))
        ? classes.statusPending
        : classes.statusInactive;
  }

  return (
    <aside
      id="entry-dues"
      className={`${classes.membershipBlock} ${classes.entryDuesBlock}`}
    >
      <div className={classes.blockTitleRow}>
        <h2 className={classes.blockTitle}>Entry dues</h2>
        <button
          type="button"
          className={classes.refreshBtn}
          onClick={handleRefresh}
          disabled={refreshing || payingEventId != null || processingPayment}
          aria-label="Refresh entry dues"
          title="Refresh"
        >
          <svg
            className={`${classes.refreshIcon}${
              refreshing ? ` ${classes.refreshIconSpin}` : ''
            }`}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24L14 10h6V4l-2.35 2.35Z"
            />
          </svg>
        </button>
      </div>

      <div className={`${classes.statusRow} ${statusClass}`}>
        <span className={classes.statusDot} aria-hidden />
        {statusLabel}
      </div>

      {hasUnpaid && (
        <div className={classes.detailRow}>
          <span className={classes.detailLabel}>Total due</span>
          <span className={classes.detailValue}>
            {formatAmount(
              unpaidEvents.length === 1
                ? (unpaidEvents[0]?.due ?? data?.total_due ?? 0)
                : (data?.total_due ?? 0),
              unpaidEvents.length === 1
                ? unpaidEvents[0]?.currency || currency
                : currency
            )}
          </span>
        </div>
      )}

      {processingPayment && (
        <p className={classes.pendingNote}>{returnMessage || 'Processing payment…'}</p>
      )}

      {!processingPayment && returnMessage && (
        <p className={classes.successNote}>{returnMessage}</p>
      )}

      {actionError && <p className={classes.error}>{actionError}</p>}

      {payBlockedReason && !globalCanPay && (
        <p className={classes.blockedNote}>{payBlockedReason}</p>
      )}

      {!hasUnpaid && !processingPayment && (
        <p className={classes.blockedNote}>No unpaid entry fees.</p>
      )}

      {unpaidEvents.map((event) => {
        const pendingUrl = getEventPendingRedirect(event);
        const eventCanPay = Boolean(event.can_pay);
        const billing = Array.isArray(event.billing) ? event.billing : [];
        const isPaying =
          payingEventId === event.event_id ||
          (payingEventId === 'all' && singleUnpaidEvent?.event_id === event.event_id);
        const eventHref = event.event_id ? `/events/${event.event_id}/` : null;

        return (
          <div key={event.event_id} className={classes.eventDueCard}>
            <div className={classes.eventDueHeader}>
              {eventHref ? (
                <a
                  href={eventHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.eventTitleLink}
                >
                  {event.event_title}
                </a>
              ) : (
                <span className={classes.eventTitlePlain}>{event.event_title}</span>
              )}
              {unpaidEvents.length > 1 && (
                <span className={classes.detailValue}>
                  {formatAmount(event.due, event.currency || currency)}
                </span>
              )}
            </div>
            {(event.date || event.end_date) && (
              <p className={classes.eventDueMeta}>
                {[event.date, event.end_date].filter(Boolean).join(' – ')}
              </p>
            )}

            {billing.length > 0 && (
              <div className={classes.billingList}>
                {groupBillingByCompetition(billing).map((group) => (
                  <div key={group.key} className={classes.billingCompetition}>
                    <div className={classes.billingCompetitionTitle}>
                      {group.competitionName}
                    </div>
                    <div className={classes.billingHorseLines}>
                      {group.lines.map((line, index) => (
                        <div
                          key={`${group.key}-${line.horseName}-${index}`}
                          className={classes.billingHorseLine}
                        >
                          <span className={classes.horseName}>
                            {line.horseName}
                          </span>
                          <span className={classes.detailValue}>
                            {formatAmount(
                              line.due,
                              event.currency || currency
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {event.pay_blocked_reason && !eventCanPay && !pendingUrl && (
              <p className={classes.blockedNote}>{event.pay_blocked_reason}</p>
            )}

            {(pendingUrl ||
              (eventCanPay && !pendingUrl && !processingPayment)) && (
              <div className={classes.eventPayRow}>
                {pendingUrl && (
                  <button
                    type="button"
                    className={`${classes.payBtn} ${classes.payBtnInline}`}
                    onClick={() => redirectToBank(pendingUrl)}
                    disabled={processingPayment || payingEventId != null}
                  >
                    Continue payment
                  </button>
                )}

                {eventCanPay && !pendingUrl && !processingPayment && (
                  <button
                    type="button"
                    className={`${classes.payBtn} ${classes.payBtnInline}`}
                    onClick={() =>
                      handlePay(
                        unpaidEvents.length === 1 ? null : event.event_id
                      )
                    }
                    disabled={payingEventId != null}
                  >
                    {isPaying ? 'Redirecting…' : 'Pay'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasUnpaid &&
        globalCanPay &&
        unpaidEvents.length === 0 &&
        !processingPayment && (
          <div className={classes.eventPayRow}>
            <button
              type="button"
              className={`${classes.payBtn} ${classes.payBtnInline}`}
              onClick={() => handlePay(null)}
              disabled={payingEventId != null}
            >
              {payingEventId != null ? 'Redirecting…' : 'Pay'}
            </button>
          </div>
        )}
    </aside>
  );
}

function EntryDuesBlockFallback() {
  return (
    <aside
      className={`${classes.membershipBlock} ${classes.entryDuesBlock}`}
    >
      <p className={classes.loading}>Loading entry dues...</p>
    </aside>
  );
}

export default function EntryDuesBlock() {
  return (
    <Suspense fallback={<EntryDuesBlockFallback />}>
      <EntryDuesBlockContent />
    </Suspense>
  );
}
