'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { ApiRequestError } from '@/lib/api/api-error';
import { login } from '@/lib/api/auth';
import classes from '@/styles/auth/auth.module.css';

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();

  const registered = params.get('registered');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await login({ email, password });
      router.push('/rider-profile/');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message || 'შესვლა ვერ მოხერხდა');
      } else {
        setError('სერვერთან კავშირი ვერ დამყარდა');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.shell}>
        <h1 className={`${classes.title} ${classes.loginTitleOnly}`}>შესვლა</h1>

        {registered === '1' && (
          <div className={classes.success}>
            რეგისტრაცია წარმატებულია. შედით თქვენი ელ. ფოსტით და პაროლით.
          </div>
        )}

        <form onSubmit={handleLogin} className={classes.form}>
          <div className={classes.formField}>
            <label htmlFor="login-email">ელ. ფოსტა</label>
            <input
              id="login-email"
              placeholder="ელ. ფოსტა"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="login-password">პაროლი</label>
            <input
              id="login-password"
              placeholder="პაროლი"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className={classes.error}>{error}</p>}

          <button type="submit" disabled={loading} className={classes.primaryBtn}>
            {loading ? 'შესვლა...' : 'შესვლა'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={classes.page}>
          <p className={classes.loading}>იტვირთება...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
