'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function MembershipReturnRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get('payment');
    const query = payment ? `?payment=${encodeURIComponent(payment)}` : '';
    router.replace(`/rider-profile/${query}`);
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
      Loading…
    </div>
  );
}

/** TBC return URLs: /cabinet/membership?payment=return (also success|fail) */
export default function CabinetMembershipPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          Loading…
        </div>
      }
    >
      <MembershipReturnRedirect />
    </Suspense>
  );
}
