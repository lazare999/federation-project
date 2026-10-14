'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CabinetReturnRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get('payment');
    const eventId = searchParams.get('eventId');
    const query = new URLSearchParams();
    if (payment) query.set('payment', payment);
    if (eventId) query.set('eventId', eventId);
    const qs = query.toString();
    router.replace(`/rider-profile/${qs ? `?${qs}` : ''}`);
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
      Loading…
    </div>
  );
}

/** BOG return URLs: /cabinet?payment=success|fail&eventId={id} */
export default function CabinetPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading…
        </div>
      }
    >
      <CabinetReturnRedirect />
    </Suspense>
  );
}
