'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiRequestError, extractApiErrorMessage } from '@/lib/api/api-error';
import { completeSignup, validateSignupInvite } from '@/lib/api/auth';
import { capitalizeName } from '@/lib/utils/capitalizeName';
import classes from '@/styles/auth/auth.module.css';

function collectPasswordIssues(password) {
  const issues = [];
  if (!password || password.length < 8) {
    issues.push('პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო');
  }
  if (!/[A-Za-zა-ჰ]/.test(password)) {
    issues.push('პაროლი უნდა შეიცავდეს ასოს');
  }
  if (!/\d/.test(password)) {
    issues.push('პაროლი უნდა შეიცავდეს ციფრს');
  }
  return issues;
}

function translateAuthError(text) {
  if (!text) return '';
  const raw = String(text);
  const lower = raw.toLowerCase();

  if (lower.includes('too short') || lower.includes('at least')) {
    const match = raw.match(/\d+/);
    const n = match ? match[0] : '8';
    return `პაროლი უნდა იყოს მინიმუმ ${n} სიმბოლო`;
  }
  if (lower.includes('too common')) {
    return 'პაროლი ძალიან გავრცელებულია. აირჩიეთ უფრო რთული პაროლი';
  }
  if (lower.includes('entirely numeric')) {
    return 'პაროლი არ უნდა შედგებოდეს მხოლოდ ციფრებისგან';
  }
  if (lower.includes('too similar')) {
    return 'პაროლი ძალიან ჰგავს ელ. ფოსტას ან სახელს';
  }
  if (
    lower.includes('special') ||
    lower.includes('symbol') ||
    lower.includes('punctuation')
  ) {
    return 'პაროლი უნდა შეიცავდეს სპეციალურ სიმბოლოს (მაგ. !@#$%)';
  }
  if (lower.includes('uppercase') || lower.includes('capital')) {
    return 'პაროლი უნდა შეიცავდეს დიდ ასოს';
  }
  if (lower.includes('lowercase')) {
    return 'პაროლი უნდა შეიცავდეს პატარა ასოს';
  }
  if (lower.includes('digit') || lower.includes('number')) {
    return 'პაროლი უნდა შეიცავდეს ციფრს';
  }
  if (lower.includes('letter')) {
    return 'პაროლი უნდა შეიცავდეს ასოს';
  }

  return raw;
}

const PASSWORD_FIELDS = new Set([
  'password',
  'password1',
  'password2',
  'confirm_password',
]);

function formatFieldErrors(value, translate = false) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const text = formatFieldErrors(item, translate);
        if (!text) return '';
        return translate ? translateAuthError(text) : text;
      })
      .filter(Boolean)
      .join('. ');
  }
  if (typeof value === 'object') {
    return Object.values(value)
      .map((item) => formatFieldErrors(item, translate))
      .filter(Boolean)
      .join('. ');
  }
  return String(value);
}

function formatSignupApiError(err) {
  if (!(err instanceof ApiRequestError)) {
    return 'სერვერთან კავშირი ვერ დამყარდა. სცადეთ ხელახლა.';
  }

  const labels = {
    password: 'პაროლი',
    password1: 'პაროლი',
    password2: 'პაროლის დადასტურება',
    confirm_password: 'პაროლის დადასტურება',
    email: 'ელ. ფოსტა',
    phone: 'ტელეფონი',
    non_field_errors: '',
  };

  const data = err.data;
  if (data && typeof data === 'object') {
    const parts = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'detail' || key === 'message') continue;
      const text = formatFieldErrors(value, PASSWORD_FIELDS.has(key));
      if (!text) continue;
      const label = labels[key];
      if (label) parts.push(`${label}: ${text}`);
      else parts.push(text);
    }
    if (parts.length) return parts.join(' ');
  }

  const extracted = extractApiErrorMessage(data) || err.message;
  return translateAuthError(extracted) || extracted || 'ვალიდაციის შეცდომა';
}

export default function SignupInviteForm({ token }) {
  const router = useRouter();
  const { t } = useTranslation('auth');

  const [loading, setLoading] = useState(true);
  const [riderName, setRiderName] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const data = await validateSignupInvite(token);

        setRiderName(data.riderName);
        if (data.emailHint) setEmail(data.emailHint);
      } catch (e) {
        const status = e?.status;

        if (status === 410) setSubmitError(t('signup.linkExpired'));
        else if (status === 409) setSubmitError(t('signup.alreadyUsed'));
        else setSubmitError(t('signup.invalidLink'));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError('');
    setSuccessMessage('');

    if (password !== confirm) {
      setSubmitError(t('signup.passwordsMismatch'));
      return;
    }

    const passwordIssues = collectPasswordIssues(password);
    if (passwordIssues.length) {
      setSubmitError(passwordIssues.join('. '));
      return;
    }

    try {
      setSubmitLoading(true);

      await completeSignup({
        token,
        email,
        phone,
        password,
      });

      setSuccessMessage(t('signup.success'));

      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1800);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const status = e.status;

        if (status === 409) {
          setSubmitError(t('signup.alreadyUsed'));
        } else if (status === 404 || status === 410) {
          setSubmitError(t('signup.invalidOrExpired'));
        } else {
          setSubmitError(formatSignupApiError(e));
        }
      } else {
        setSubmitError(t('signup.connectionError'));
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={classes.page}>
        <p className={classes.loading}>{t('signup.loading')}</p>
      </div>
    );
  }

  if (submitError && !riderName) {
    return (
      <div className={classes.page}>
        <div className={classes.shell}>
          <h1 className={classes.errorBoxTitle}>{t('signup.errorTitle')}</h1>
          <p className={classes.errorBox}>{submitError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <div className={classes.shell}>
        <h1 className={classes.title}>{t('signup.title')}</h1>
        <p className={classes.subtitle}>
          {t('signup.as')} <strong>{capitalizeName(riderName)}</strong>
        </p>

        {successMessage && (
          <div className={classes.success}>{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.formField}>
            <label htmlFor="signup-email">{t('signup.email')}</label>
            <input
              id="signup-email"
              placeholder={t('signup.email')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-phone">{t('signup.phone')}</label>
            <input
              id="signup-phone"
              placeholder={t('signup.phone')}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-password">{t('signup.password')}</label>
            <input
              id="signup-password"
              type="password"
              placeholder={t('signup.password')}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className={classes.fieldHint}>{t('signup.passwordHint')}</p>
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-confirm">{t('signup.confirm')}</label>
            <input
              id="signup-confirm"
              type="password"
              placeholder={t('signup.confirm')}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {submitError && <p className={classes.error}>{submitError}</p>}

          <button
            type="submit"
            disabled={submitLoading}
            className={classes.primaryBtn}
          >
            {submitLoading ? t('signup.submitting') : t('signup.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
