'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function EventPaymentReturnRedirect() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get('payment');
    const eventId = params?.eventId;
    const query = new URLSearchParams();
    if (payment) query.set('payment', payment);
    if (eventId) query.set('eventId', String(eventId));
    const qs = query.toString();
    router.replace(`/rider-profile/${qs ? `?${qs}` : ''}`);
  }, [params, router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
      Loading…
    </div>
  );
}

/** BOG return URLs: /cabinet/events/{eventId}?payment=success|fail */
export default function CabinetEventPaymentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading…
        </div>
      }
    >
      <EventPaymentReturnRedirect />
    </Suspense>
  );
}
