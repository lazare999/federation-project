import { Suspense } from 'react';

import classes from '@/styles/auth/auth.module.css';
import SignupContent from './SignupContent';

function Loading() {
  return (
    <div className={classes.page}>
      <p className={classes.loading}>იტვირთება...</p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignupContent />
    </Suspense>
  );
}
