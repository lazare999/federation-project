'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApiRequestError } from '@/lib/api/api-error';
import { getMyMembership, requestMembershipPayment } from '@/lib/api/auth';
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

function MembershipBlockContent() {
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
    setReturnMessage('Processing payment…');

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      try {
        const latest = await loadMembership();
        if (isMembershipActive(latest)) {
          setReturnMessage('Payment successful. Membership is now active.');
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

    setReturnMessage(
      'Payment is still processing. Refresh in a moment or contact support if this persists.'
    );
    setProcessingPayment(false);
    clearPaymentQuery();
  }, [clearPaymentQuery, loadMembership]);

  useEffect(() => {
    const run = async () => {
      try {
        await loadMembership();
      } catch (e) {
        if (e instanceof ApiRequestError && e.status !== 401) {
          setLoadError(e.message || 'Failed to load membership');
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
      setActionError('Payment could not be started (no redirect URL).');
    } catch (e) {
      if (e instanceof ApiRequestError && e.status !== 401) {
        setActionError(e.message || 'Payment request failed');
      } else if (!(e instanceof ApiRequestError)) {
        setActionError('Could not connect to the server');
      }
    } finally {
      setPaying(false);
    }
  };

  const handleContinuePayment = () => {
    const url = getPendingRedirectUrl(data);
    if (url) redirectToBank(url);
  };

  if (loading) {
    return (
      <aside id="membership" className={classes.membershipBlock}>
        <p className={classes.loading}>Loading membership...</p>
      </aside>
    );
  }

  if (loadError) {
    return (
      <aside id="membership" className={classes.membershipBlock}>
        <p className={classes.error}>{loadError}</p>
      </aside>
    );
  }

  const isActive = isMembershipActive(data);
  const pendingRedirect = getPendingRedirectUrl(data);
  const canPay = Boolean(data?.can_pay);
  const payBlockedReason = data?.pay_blocked_reason;
  const showContinue = Boolean(pendingRedirect);
  const showPayButton = canPay && !showContinue && !processingPayment;

  let statusClass = classes.statusInactive;
  let statusLabel = 'Inactive';
  if (isActive) {
    statusClass = classes.statusActive;
    statusLabel = 'Active';
  } else if (data?.status === 'pending_payment' || showContinue) {
    statusClass = classes.statusPending;
    statusLabel = 'Pending payment';
  }

  const payButtonLabel = isActive ? 'Renew membership' : 'Pay membership';

  return (
    <aside id="membership" className={classes.membershipBlock}>
      <h2 className={classes.blockTitle}>National registration / Membership</h2>

      {data?.payment_provider === 'bog' && (
        <p className={classes.providerNote}>Payment via Bank of Georgia</p>
      )}

      <div className={`${classes.statusRow} ${statusClass}`}>
        <span className={classes.statusDot} aria-hidden />
        {statusLabel}
      </div>

      {data?.valid_until && (
        <div className={classes.detailRow}>
          <span className={classes.detailLabel}>Valid until</span>
          <span className={classes.detailValue}>{data.valid_until}</span>
        </div>
      )}

      {data?.next_payment_date && (
        <div className={classes.detailRow}>
          <span className={classes.detailLabel}>Next payment</span>
          <span className={classes.detailValue}>{data.next_payment_date}</span>
        </div>
      )}

      {data?.fee && (
        <div className={classes.detailRow}>
          <span className={classes.detailLabel}>Amount</span>
          <span className={classes.detailValue}>{formatFee(data.fee)}</span>
        </div>
      )}

      {processingPayment && (
        <p className={classes.pendingNote}>{returnMessage || 'Processing payment…'}</p>
      )}

      {!processingPayment && returnMessage && (
        <p className={classes.successNote}>{returnMessage}</p>
      )}

      {actionError && <p className={classes.error}>{actionError}</p>}

      {payBlockedReason && !showPayButton && !showContinue && (
        <p className={classes.blockedNote}>{payBlockedReason}</p>
      )}

      {showContinue && (
        <button
          type="button"
          className={classes.payBtn}
          onClick={handleContinuePayment}
          disabled={paying || processingPayment}
        >
          Continue payment
        </button>
      )}

      {showPayButton && (
        <button
          type="button"
          className={classes.payBtn}
          onClick={handlePay}
          disabled={paying || processingPayment}
        >
          {paying ? 'Redirecting to bank…' : payButtonLabel}
        </button>
      )}
    </aside>
  );
}

function MembershipBlockFallback() {
  return (
    <aside className={classes.membershipBlock}>
      <p className={classes.loading}>Loading membership...</p>
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
