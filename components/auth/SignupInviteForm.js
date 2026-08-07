'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ApiRequestError } from '@/lib/api/api-error';
import { completeSignup, validateSignupInvite } from '@/lib/api/auth';
import classes from '@/styles/auth/auth.module.css';

export default function SignupInviteForm({ token }) {
  const router = useRouter();

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

        if (status === 410) setSubmitError('ლინკს ვადა გაუვიდა');
        else if (status === 409)
          setSubmitError(
            'ეს მოწვევა უკვე გამოყენებულია ან ანგარიში უკვე არსებობს. გადადით შესვლაზე.'
          );
        else setSubmitError('არასწორი ლინკი');
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
      setSubmitError('პაროლები არ ემთხვევა');
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

      setSuccessMessage(
        'ანგარიში წარმატებით შექმნილია. გადამისამართება შესვლის გვერდზე...'
      );

      setTimeout(() => {
        router.push('/login?registered=1');
      }, 1800);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        const status = e.status;
        const data = e.data;

        if (status === 400) {
          if (data?.email) setSubmitError(data.email[0]);
          else if (data?.phone) setSubmitError(data.phone[0]);
          else setSubmitError('ვალიდაციის შეცდომა');
        }

        if (status === 409) {
          setSubmitError(
            'ეს მოწვევა უკვე გამოყენებულია ან ანგარიში უკვე არსებობს. გადადით შესვლაზე.'
          );
        }

        if (status === 404 || status === 410) {
          setSubmitError('მოწვევა არასწორია ან ვადა გაუვიდა');
        }
      } else {
        setSubmitError('სერვერთან კავშირი ვერ დამყარდა. სცადეთ ხელახლა.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={classes.page}>
        <p className={classes.loading}>იტვირთება...</p>
      </div>
    );
  }

  if (submitError && !riderName) {
    return (
      <div className={classes.page}>
        <div className={classes.shell}>
          <h1 className={classes.errorBoxTitle}>შეცდომა</h1>
          <p className={classes.errorBox}>{submitError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <div className={classes.shell}>
        <h1 className={classes.title}>რეგისტრაცია</h1>
        <p className={classes.subtitle}>
          როგორც: <strong>{riderName}</strong>
        </p>

        {successMessage && (
          <div className={classes.success}>{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.formField}>
            <label htmlFor="signup-email">ელ. ფოსტა</label>
            <input
              id="signup-email"
              placeholder="ელ. ფოსტა"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-phone">ტელეფონი</label>
            <input
              id="signup-phone"
              placeholder="ტელეფონი"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-password">პაროლი</label>
            <input
              id="signup-password"
              type="password"
              placeholder="პაროლი"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={classes.formField}>
            <label htmlFor="signup-confirm">პაროლის დადასტურება</label>
            <input
              id="signup-confirm"
              type="password"
              placeholder="პაროლის დადასტურება"
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
            {submitLoading ? 'რეგისტრაცია...' : 'რეგისტრაცია'}
          </button>
        </form>
      </div>
    </div>
  );
}
