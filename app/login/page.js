'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/lib/api/api-error';
import { login } from '@/lib/api/auth';
import classes from '@/styles/auth/auth.module.css';

function LoginForm() {
  const { t } = useTranslation('auth');
  const params = useSearchParams();
  const router = useRouter();

  const registered = params.get('registered');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorKey('');

    try {
      setLoading(true);
      await login({ email, password });
      router.push('/rider-profile/');
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorKey('login.loginFailed');
      } else {
        setErrorKey('login.connectionError');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <div className={classes.shell}>
        <h1 className={`${classes.title} ${classes.loginTitleOnly}`}>
          {t('login.title')}
        </h1>

        {registered === '1' && (
          <div className={classes.success}>{t('login.registeredSuccess')}</div>
        )}

        <form onSubmit={handleLogin} className={classes.form}>
          <div className={classes.formField}>
            <label htmlFor="login-email">{t('login.email')}</label>
            <input
              id="login-email"
              placeholder={t('login.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="login-password">{t('login.password')}</label>
            <input
              id="login-password"
              placeholder={t('login.password')}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorKey && <p className={classes.error}>{t(errorKey)}</p>}

          <button
            type="submit"
            disabled={loading}
            className={classes.primaryBtn}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <Suspense
      fallback={
        <div className={classes.page}>
          <p className={classes.loading}>{t('login.loading')}</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
