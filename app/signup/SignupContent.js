'use client';

import { useSearchParams } from 'next/navigation';

import SignupInviteForm from '@/components/auth/SignupInviteForm';
import classes from '@/styles/auth/auth.module.css';

export default function SignupContent() {
  const token = useSearchParams().get('token');

  if (!token) {
    return (
      <div className={classes.page}>
        <div className={classes.shell}>
          <h1 className={classes.errorBoxTitle}>არასწორი ლინკი</h1>
          <p className={classes.errorBox}>
            რეგისტრაცია შესაძლებელია მხოლოდ მოწვევის ლინკით.
          </p>
        </div>
      </div>
    );
  }

  return <SignupInviteForm token={token} />;
}
