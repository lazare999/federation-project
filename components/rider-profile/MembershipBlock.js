'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/lib/api/api-error';
import {
  getMyMembership,
  getMyPayments,
  requestMembershipPayment,
} from '@/lib/api/auth';
import { formatLongDate } from '@/lib/utils/formatDisplayDate';
import { rewriteAgeBlockedReason } from '@/lib/utils/rewriteAgeBlockedReason';
import classes from '@/styles/rider-profile/membership.module.css';

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 12;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatFee(fee) {
  if (!fee || fee.amount == null) return '—';
  const currency = fee.currency ? ` ${fee.currency}` : '';
  return `${fee.amount}${currency}`;
}

function formatPlanPrice(fee, perYearLabel) {
  const base = formatFee(fee);
  if (base === '—') return '—';
  return `${base} / ${perYearLabel}`;
}

function extractPaymentList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    payload.payments,
    payload.payment_history,
    payload.transactions,
    payload.results,
    payload.items,
    payload.invoices,
    payload.history,
    payload.data,
  ];

  for (const value of candidates) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = extractPaymentList(value);
      if (nested.length) return nested;
    }
  }

  const single =
    payload.last_payment ||
    payload.latest_payment ||
    payload.current_payment;
  if (single && typeof single === 'object' && !Array.isArray(single)) {
    return [single];
  }

  return [];
}

function paymentBogOrderId(item) {
  const value = item?.bog_order_id || item?.order_id;
  if (value == null || value === '') return '';
  return String(value);
}

function isMembershipPayment(row) {
  return String(row?.type || '').toLowerCase() === 'membership';
}

function normalizePayment(row, fallbackCurrency = 'GEL') {
  if (!row || typeof row !== 'object') return null;
  const amount =
    row.amount ??
    row.fee?.amount ??
    row.fee ??
    row.paid_amount ??
    row.value ??
    null;
  const currency =
    row.currency ||
    row.fee_currency ||
    row.fee?.currency ||
    fallbackCurrency;
  const status = String(row.status || row.payment_status || 'paid').toLowerCase();
  if (status === 'failed') return null;
  return {
    id: row.id ?? row.payment_id ?? `${row.paid_at || row.date}-${amount}`,
    date:
      row.paid_at ||
      row.payment_date ||
      row.created_at ||
      row.date ||
      row.paid_on ||
      row.valid_from ||
      null,
    amount,
    currency,
    status: row.status || row.payment_status || 'paid',
    label: row.reason || row.description || row.title || '',
    bogOrderId: paymentBogOrderId(row),
  };
}

function membershipAsPayment(data) {
  if (!isMembershipActive(data)) return null;
  const amount = data?.fee?.amount ?? data?.amount ?? data?.paid_amount ?? null;
  const date =
    data?.last_paid_at ||
    data?.paid_at ||
    data?.payment_date ||
    data?.valid_from ||
    data?.current_period_start ||
    null;
  if (amount == null && !date && !data?.valid_until) return null;
  return {
    id: data?.last_payment_id ?? 'current-membership',
    date,
    amount,
    currency: data?.fee?.currency || data?.currency || 'GEL',
    status: 'paid',
    label: '',
    bogOrderId: paymentBogOrderId(data) || paymentBogOrderId(data?.last_payment),
  };
}

function mergePayments(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const row of list || []) {
      if (!row) continue;
      const key = String(row.id ?? `${row.date}-${row.amount}`);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }
  }
  return merged;
}

function getPaymentRedirectUrl(response) {
  return response?.redirect_url || response?.payment?.redirect_url || null;
}

function getPendingRedirectUrl(data) {
  if (!data?.pending_payment) return null;
  if (typeof data.pending_payment === 'object') {
    return data.pending_payment.redirect_url || null;
  }
  return null;
}

function isMembershipActive(data) {
  return Boolean(data?.is_active) || data?.status === 'active';
}

function isPendingPayment(data) {
  return data?.status === 'pending_payment' || Boolean(getPendingRedirectUrl(data));
}

function BogOrderIdRow({ orderId }) {
  const { t } = useTranslation('riderProfile');
  const [copied, setCopied] = useState(false);

  if (!orderId) return null;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
    } catch {
      const input = document.createElement('textarea');
      input.value = orderId;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={classes.historyOrderRow}>
      <span className={classes.historyOrderLabel}>{t('membership.bogOrderId')}</span>
      <code className={classes.historyOrderId} title={orderId}>
        {orderId}
      </code>
      <button
        type="button"
        className={classes.copyBtn}
        onClick={() => void copyId()}
        aria-label={t('common.copy')}
        title={copied ? t('common.copied') : t('common.copy')}
      >
        {copied ? t('common.copied') : t('common.copy')}
      </button>
    </div>
  );
}

function MembershipBlockContent() {
  const { t, i18n } = useTranslation('riderProfile');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnHandled = useRef(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [returnMessage, setReturnMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [payments, setPayments] = useState([]);

  const loadMembership = useCallback(async () => {
    setLoadError('');
    const response = await getMyMembership();
    setData(response);
    return response;
  }, []);

  const clearPaymentQuery = useCallback(() => {
    router.replace('/rider-profile/', { scroll: false });
  }, [router]);

  const pollAfterSuccessReturn = useCallback(async () => {
    setProcessingPayment(true);
    setReturnMessage('processing');

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      try {
        const latest = await loadMembership();
        if (isMembershipActive(latest)) {
          setReturnMessage('success');
          setProcessingPayment(false);
          clearPaymentQuery();
          return;
        }
        if (!isPendingPayment(latest)) {
          setProcessingPayment(false);
          clearPaymentQuery();
          return;
        }
      } catch {
        /* keep polling */
      }
      await sleep(POLL_INTERVAL_MS);
    }

    setReturnMessage('stillProcessing');
    setProcessingPayment(false);
    clearPaymentQuery();
  }, [clearPaymentQuery, loadMembership]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadMembership();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || t('membership.loadFailed'));
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadMembership]);

  useEffect(() => {
    if (returnHandled.current || loading) return;

    const payment = searchParams.get('payment');
    if (!payment) return;

    // Event entry BOG returns include eventId — handled by MyEventsSection.
    if (searchParams.get('eventId')) return;

    returnHandled.current = true;

    if (payment === 'success') {
      pollAfterSuccessReturn();
    } else if (payment === 'fail') {
      setReturnMessage('');
      setActionError(t('membership.failed'));
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

  const handlePay = async () => {
    setActionError('');
    setReturnMessage('');
    try {
      setPaying(true);
      const response = await requestMembershipPayment();
      const redirectUrl = getPaymentRedirectUrl(response);
      if (redirectUrl) {
        redirectToBank(redirectUrl);
        return;
      }
      setData(response);
      setActionError(t('membership.noRedirect'));
    } catch (e) {
      if (e instanceof ApiRequestError && e.status !== 401) {
        setActionError(e.message || t('membership.payFailed'));
      } else if (!(e instanceof ApiRequestError)) {
        setActionError(t('common.connectionError'));
      }
    } finally {
      setPaying(false);
    }
  };

  const handleContinuePayment = () => {
    const url = getPendingRedirectUrl(data);
    if (url) redirectToBank(url);
  };

  const openPaymentHistory = async () => {
    setHistoryOpen(true);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      let latest = data;
      try {
        latest = await loadMembership();
      } catch {
        /* use cached membership */
      }

      const currency = latest?.fee?.currency || 'GEL';
      const fromMembership = extractPaymentList(latest)
        .filter(isMembershipPayment)
        .map((row) => normalizePayment(row, currency))
        .filter(Boolean);

      let fromApi = [];
      try {
        const response = await getMyPayments();
        fromApi = extractPaymentList(response)
          .filter(isMembershipPayment)
          .map((row) => normalizePayment(row, currency))
          .filter(Boolean);
      } catch (e) {
        if (
          e instanceof ApiRequestError &&
          e.status !== 404 &&
          e.status !== 405
        ) {
          throw e;
        }
      }

      const merged = mergePayments(fromApi, fromMembership);
      if (merged.length === 0) {
        const fallback = membershipAsPayment(latest);
        if (fallback) merged.push(fallback);
      }
      setPayments(merged);
    } catch (e) {
      if (e instanceof ApiRequestError && e.status !== 401) {
        setHistoryError(e.message || t('membership.historyLoadFailed'));
      } else if (!(e instanceof ApiRequestError)) {
        setHistoryError(t('common.connectionError'));
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!historyOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setHistoryOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historyOpen]);

  if (loading) {
    return (
      <aside
        id="membership"
        className={`${classes.membershipBlock} ${classes.membershipCard}`}
      >
        <p className={classes.loading}>{t('membership.loading')}</p>
      </aside>
    );
  }

  if (loadError) {
    return (
      <aside
        id="membership"
        className={`${classes.membershipBlock} ${classes.membershipCard}`}
      >
        <p className={classes.error}>{loadError}</p>
      </aside>
    );
  }

  const isActive = isMembershipActive(data);
  const pendingRedirect = getPendingRedirectUrl(data);
  const canPay = Boolean(data?.can_pay);
  const payBlockedReason = rewriteAgeBlockedReason(
    data?.pay_blocked_reason,
    t
  );
  const showContinue = Boolean(pendingRedirect);
  const showPayButton = canPay && !showContinue && !processingPayment;

  let statusClass = classes.statusInactive;
  let statusLabel = t('membership.inactive');
  if (isActive) {
    statusClass = classes.statusActive;
    statusLabel = t('membership.active');
  } else if (data?.status === 'pending_payment' || showContinue) {
    statusClass = classes.statusPending;
    statusLabel = t('membership.pendingPayment');
  }

  const payButtonLabel = isActive
    ? t('membership.renew')
    : t('membership.pay');
  const returnText =
    returnMessage === 'processing' ||
    returnMessage === 'success' ||
    returnMessage === 'stillProcessing'
      ? t(`membership.${returnMessage}`)
      : returnMessage;
  const paymentMethod =
    data?.payment_provider === 'bog' || !data?.payment_provider
      ? t('membership.providerBogName')
      : data.payment_provider;
  const sortedPayments = [...payments].sort((a, b) => {
    const left = a.date ? new Date(a.date).getTime() : 0;
    const right = b.date ? new Date(b.date).getTime() : 0;
    return right - left;
  });

  return (
    <>
      <aside id="membership" className={classes.membershipCard}>
        <div className={classes.cardHeader}>
          <h2 className={classes.cardTitle}>{t('membership.annualTitle')}</h2>
          <span className={`${classes.statusBadge} ${statusClass}`}>
            <span className={classes.statusDot} aria-hidden />
            {statusLabel}
          </span>
        </div>

        <div className={classes.cardBody}>
          {data?.fee && (
            <div className={classes.cardRow}>
              <span className={classes.cardLabel}>{t('membership.plan')}</span>
              <span className={classes.cardValue}>
                {formatPlanPrice(data.fee, t('membership.perYear'))}
              </span>
            </div>
          )}

          {data?.valid_until && (
            <div className={classes.cardRow}>
              <span className={classes.cardLabel}>
                {t('membership.validUntil')}
              </span>
              <span className={classes.cardValue}>
                {formatLongDate(data.valid_until, i18n.language)}
              </span>
            </div>
          )}

          <div className={classes.cardRow}>
            <span className={classes.cardLabel}>
              {t('membership.paymentMethod')}
            </span>
            <span className={`${classes.cardValue} ${classes.paymentMethodValue}`}>
              {paymentMethod}
              <span className={classes.cardIcon} aria-hidden>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <rect
                    x="0.75"
                    y="0.75"
                    width="16.5"
                    height="12.5"
                    rx="2.25"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M1 4.5h16" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </span>
          </div>
        </div>

        {processingPayment && (
          <p className={classes.pendingNote}>
            {returnText || t('membership.processing')}
          </p>
        )}

        {!processingPayment && returnText && (
          <p className={classes.successNote}>{returnText}</p>
        )}

        {actionError && <p className={classes.error}>{actionError}</p>}

        {payBlockedReason && !showPayButton && !showContinue && (
          <p className={classes.blockedNote}>{payBlockedReason}</p>
        )}

        <div className={classes.cardActions}>
          {showContinue && (
            <button
              type="button"
              className={classes.cardPayBtn}
              onClick={handleContinuePayment}
              disabled={paying || processingPayment}
            >
              {t('membership.continuePayment')}
            </button>
          )}

          {showPayButton && (
            <button
              type="button"
              className={classes.cardPayBtn}
              onClick={handlePay}
              disabled={paying || processingPayment}
            >
              {paying ? t('membership.redirecting') : payButtonLabel}
            </button>
          )}

          <button
            type="button"
            className={classes.manageLink}
            onClick={() => void openPaymentHistory()}
          >
            {t('membership.manageBilling')}
          </button>
        </div>
      </aside>

      {historyOpen && (
        <div
          className={classes.modalOverlay}
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className={classes.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="membership-history-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={classes.modalHeader}>
              <h3 id="membership-history-title" className={classes.modalTitle}>
                {t('membership.paymentHistory')}
              </h3>
              <button
                type="button"
                className={classes.modalClose}
                onClick={() => setHistoryOpen(false)}
                aria-label={t('common.close')}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {historyLoading && (
              <p className={classes.loading}>{t('common.loading')}</p>
            )}
            {historyError && <p className={classes.error}>{historyError}</p>}
            {!historyLoading && !historyError && sortedPayments.length === 0 && (
              <p className={classes.emptyHistory}>{t('membership.noPayments')}</p>
            )}
            {!historyLoading && sortedPayments.length > 0 && (
              <ul className={classes.historyList}>
                {sortedPayments.map((payment, index) => (
                  <li
                    key={payment.id ?? index}
                    className={classes.historyItem}
                  >
                    <div className={classes.historyMain}>
                      <span className={classes.historyDate}>
                        {payment.date
                          ? formatLongDate(payment.date, i18n.language)
                          : '—'}
                      </span>
                      {payment.label ? (
                        <span className={classes.historyLabel}>
                          {payment.label}
                        </span>
                      ) : null}
                      <BogOrderIdRow orderId={payment.bogOrderId} />
                    </div>
                    <div className={classes.historyMeta}>
                      <strong>
                        {payment.amount != null
                          ? `${payment.amount} ${payment.currency}`
                          : '—'}
                      </strong>
                      {payment.status ? (
                        <span className={classes.historyStatus}>
                          {payment.status}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MembershipBlockFallback() {
  const { t } = useTranslation('riderProfile');
  return (
    <aside
      className={classes.membershipCard}
    >
      <p className={classes.loading}>{t('membership.loading')}</p>
    </aside>
  );
}

export default function MembershipBlock() {
  return (
    <Suspense fallback={<MembershipBlockFallback />}>
      <MembershipBlockContent />
    </Suspense>
  );
}
