'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ApiRequestError } from '@/lib/api/api-error';
import { clearAccessToken, getMe, patchMe } from '@/lib/api/auth';
import {
  EQUESTRIAN_CLUBS,
  getEquestrianClubLabel,
} from '@/lib/constants/equestrianClubs';
import { getAccessToken, redirectToLogin } from '@/lib/auth/token';
import MyEventsSection from '@/components/rider-profile/MyEventsSection';
import MembershipBlock from '@/components/rider-profile/MembershipBlock';
import MyHorsesSection from '@/components/rider-profile/MyHorsesSection';
import classes from '@/styles/rider-profile/riderProfile.module.css';

const EDITABLE_FIELDS = [
  'name',
  'phone',
  'email',
  'country',
  'age',
  'club',
  'equestrian_club',
  'image',
];

function riderToForm(rider) {
  return {
    name: rider?.name ?? '',
    phone: rider?.phone ?? '',
    email: rider?.email ?? '',
    country: rider?.country ?? '',
    age: rider?.age ?? '',
    club: rider?.club ?? '',
    equestrian_club: rider?.equestrian_club ?? '',
    image: rider?.image ?? '',
  };
}

function buildPatchPayload(form, initial) {
  const payload = {};

  for (const key of EDITABLE_FIELDS) {
    const next = form[key];
    const prev = initial[key];

    if (key === 'age') {
      const nextNum =
        next === '' || next === null || next === undefined
          ? null
          : Number(next);
      const prevNum =
        prev === '' || prev === null || prev === undefined
          ? null
          : Number(prev);

      if (nextNum !== prevNum && !(Number.isNaN(nextNum) && prevNum === null)) {
        payload[key] = nextNum;
      }
      continue;
    }

    if (String(next ?? '') !== String(prev ?? '')) {
      payload[key] = next;
    }
  }

  return payload;
}

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function RiderProfileCabinet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadError('');
    setNotFound(false);

    const data = await getMe();

    if (!data?.rider) {
      setNotFound(true);
      setProfile(null);
      return;
    }

    setProfile(data);
    const nextForm = riderToForm(data.rider);
    setForm(nextForm);
    setInitialForm(nextForm);
    setImageError(false);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      redirectToLogin();
      return;
    }

    const run = async () => {
      try {
        await loadProfile();
      } catch (e) {
        if (e instanceof ApiRequestError) {
          if (e.status === 403) {
            setNotFound(true);
          } else if (e.status !== 401) {
            setLoadError(e.message || 'Failed to load profile');
          }
        } else {
          setLoadError('Could not connect to the server');
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [loadProfile]);

  const handleLogout = () => {
    clearAccessToken();
    router.push('/login/');
  };

  const handleEdit = () => {
    setSaveError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setSaveError('');
    setEditing(false);
    if (profile?.rider) {
      const reset = riderToForm(profile.rider);
      setForm(reset);
      setInitialForm(reset);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    const payload = buildPatchPayload(form, initialForm);
    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);
      const data = await patchMe(payload);
      setProfile(data);
      const nextForm = riderToForm(data.rider);
      setForm(nextForm);
      setInitialForm(nextForm);
      setImageError(false);
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status !== 401) {
        setSaveError(err.message || 'Failed to save profile');
      } else if (!(err instanceof ApiRequestError)) {
        setSaveError('Could not connect to the server');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={classes.loading}>Loading...</div>;
  }

  if (notFound) {
    return (
      <div className={classes.container}>
        <div className={classes.notFound}>
          <p>Profile not found</p>
          <button type="button" className={classes.secondaryBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={classes.container}>
        <p className={classes.error}>{loadError}</p>
        <button type="button" className={classes.secondaryBtn} onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  const rider = profile?.rider;
  const accountEmail = profile?.user?.email;

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>Rider dashboard</h1>
        <button type="button" className={classes.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className={classes.card}>
        <div className={classes.avatarWrap}>
          {rider?.image && !imageError ? (
            <img
              src={rider.image}
              alt={rider.name || 'Photo'}
              className={classes.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={classes.avatarPlaceholder}>{getInitials(rider?.name)}</div>
          )}
        </div>

        <div className={classes.profileLayout}>
          <div className={classes.profileMain}>
            {editing ? (
              <form className={classes.form} onSubmit={handleSave}>
            <div className={classes.formField}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="image">Photo URL</label>
              <input
                id="image"
                value={form.image}
                onChange={(e) => handleChange('image', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                min="0"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="country">Country</label>
              <input
                id="country"
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            {accountEmail && accountEmail !== form.email && (
              <p className={classes.label}>Account email: {accountEmail}</p>
            )}
            <div className={classes.formField}>
              <label htmlFor="club">Club (text)</label>
              <input
                id="club"
                value={form.club}
                onChange={(e) => handleChange('club', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="equestrian_club">Equestrian club</label>
              <select
                id="equestrian_club"
                value={form.equestrian_club}
                onChange={(e) => handleChange('equestrian_club', e.target.value)}
              >
                <option value="">—</option>
                {EQUESTRIAN_CLUBS.map((club) => (
                  <option key={club.value} value={club.value}>
                    {club.label}
                  </option>
                ))}
              </select>
            </div>

            {saveError && <p className={classes.error}>{saveError}</p>}

            <div className={classes.actions}>
              <button type="submit" className={classes.primaryBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className={classes.secondaryBtn}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
            ) : (
              <>
                <div className={classes.fieldGrid}>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Name</span>
                <span className={classes.value}>{rider?.name || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Age</span>
                <span className={classes.value}>
                  {rider?.age != null && rider.age !== '' ? rider.age : '—'}
                </span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Country</span>
                <span className={classes.value}>{rider?.country || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Phone</span>
                <span className={classes.value}>{rider?.phone || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Email</span>
                <span className={classes.value}>
                  {rider?.email || accountEmail || '—'}
                </span>
              </div>
              {accountEmail && rider?.email && accountEmail !== rider.email && (
                <div className={classes.fieldRow}>
                  <span className={classes.label}>Account email</span>
                  <span className={classes.value}>{accountEmail}</span>
                </div>
              )}
              <div className={classes.fieldRow}>
                <span className={classes.label}>Club (text)</span>
                <span className={classes.value}>{rider?.club || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>Equestrian club</span>
                <span className={classes.value}>
                  {getEquestrianClubLabel(rider?.equestrian_club)}
                </span>
              </div>
            </div>

            <div className={classes.actions}>
              <button type="button" className={classes.primaryBtn} onClick={handleEdit}>
                Edit profile
              </button>
            </div>
              </>
            )}
          </div>

          <MembershipBlock />
        </div>
      </div>

      <MyEventsSection />
      <MyHorsesSection />
    </div>
  );
}
