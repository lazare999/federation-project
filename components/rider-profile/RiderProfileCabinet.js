'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiRequestError } from '@/lib/api/api-error';
import { clearAccessToken, getMe, patchMe } from '@/lib/api/auth';
import {
  EQUESTRIAN_CLUBS,
  getEquestrianClubLabel,
} from '@/lib/constants/equestrianClubs';
import {
  COUNTRIES,
  getCountryByCode,
  getCountryLabel,
  resolveCountryCode,
} from '@/lib/constants/countries';
import { getAccessToken, redirectToLogin } from '@/lib/auth/token';
import {
  MyEventsProvider,
  UpcomingEventsSection,
  ParticipationHistorySection,
} from '@/components/rider-profile/MyEventsSection';
import MembershipBlock from '@/components/rider-profile/MembershipBlock';
import MyHorsesSection from '@/components/rider-profile/MyHorsesSection';
import { toGeorgianScript } from '@/lib/utils/georgianTransliterate';
import { capitalizeName } from '@/lib/utils/capitalizeName';
import {
  ageFromBirthDate,
  formatDisplayDate,
  toDateInputValue,
} from '@/lib/utils/formatDisplayDate';
import classes from '@/styles/rider-profile/riderProfile.module.css';

const EDITABLE_FIELDS = [
  'name',
  'name_ka',
  'phone',
  'email',
  'country',
  'country_ka',
  'birth_date',
  'age',
  'club',
  'equestrian_club',
];

const GEORGIAN_FIELDS = new Set(['name_ka']);

function riderBirthDate(rider) {
  return toDateInputValue(
    rider?.birth_date || rider?.date_of_birth || ''
  );
}

function riderAge(rider) {
  const derived = ageFromBirthDate(riderBirthDate(rider));
  if (derived !== '') return derived;
  return rider?.age != null && rider.age !== '' ? rider.age : '';
}

function riderToForm(rider) {
  const country = getCountryByCode(
    resolveCountryCode(rider?.country, rider?.country_ka)
  );
  const birthDate = riderBirthDate(rider);
  const derivedAge = ageFromBirthDate(birthDate);
  return {
    name: rider?.name ?? '',
    name_ka: rider?.name_ka ?? '',
    phone: rider?.phone ?? '',
    email: rider?.email ?? '',
    country: country.en,
    country_ka: country.ka,
    birth_date: birthDate,
    age: derivedAge !== '' ? derivedAge : (rider?.age ?? ''),
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

function appendPayloadToFormData(formData, payload) {
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) {
      formData.append(key, '');
    } else {
      formData.append(key, String(value));
    }
  }
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
  const { t, i18n } = useTranslation('riderProfile');
  const router = useRouter();
  const photoInputId = useId();
  const fileInputRef = useRef(null);
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
            setLoadError(e.message || t('profile.loadFailed'));
          }
        } else {
          setLoadError(t('common.connectionError'));
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

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const clearImageFile = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = () => {
    setSaveError('');
    clearImageFile();
    setEditing(true);
  };

  const handleCancel = () => {
    setSaveError('');
    setEditing(false);
    clearImageFile();
    if (profile?.rider) {
      const reset = riderToForm(profile.rider);
      setForm(reset);
      setInitialForm(reset);
    }
  };

  const handleChange = (field, value) => {
    const next = GEORGIAN_FIELDS.has(field) ? toGeorgianScript(value) : value;
    setForm((prev) => {
      const updated = { ...prev, [field]: next };
      if (field === 'equestrian_club' && next !== 'other') {
        updated.club = '';
      }
      if (field === 'birth_date') {
        updated.age = ageFromBirthDate(next);
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    const payload = buildPatchPayload(form, initialForm);
    const imageCleared =
      !imageFile &&
      String(form?.image ?? '') === '' &&
      String(initialForm?.image ?? '') !== '';

    if (
      Object.keys(payload).length === 0 &&
      !imageFile &&
      !imageCleared
    ) {
      setEditing(false);
      return;
    }

    try {
      setSaving(true);

      let data;
      if (imageFile) {
        const formData = new FormData();
        appendPayloadToFormData(formData, payload);
        formData.append('image', imageFile);
        data = await patchMe(formData);
      } else if (imageCleared) {
        data = await patchMe({ ...payload, image: null });
      } else {
        data = await patchMe(payload);
      }

      setProfile(data);
      const nextForm = riderToForm(data.rider);
      setForm(nextForm);
      setInitialForm(nextForm);
      setImageError(false);
      clearImageFile();
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status !== 401) {
        setSaveError(err.message || t('profile.saveFailed'));
      } else if (!(err instanceof ApiRequestError)) {
        setSaveError(t('common.connectionError'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={classes.loading}>{t('common.loading')}</div>;
  }

  if (notFound) {
    return (
      <div className={classes.container}>
        <div className={classes.notFound}>
          <p>{t('profile.notFound')}</p>
          <button type="button" className={classes.secondaryBtn} onClick={handleLogout}>
            {t('profile.logOut')}
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
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  const rider = profile?.rider;
  const accountEmail = profile?.user?.email;

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>{t('profile.title')}</h1>
        <button type="button" className={classes.logoutBtn} onClick={handleLogout}>
          {t('profile.logOut')}
        </button>
      </div>

      <div className={classes.card}>
        <div className={classes.avatarWrap}>
          {rider?.image && !imageError ? (
            <img
              src={rider.image}
              alt={capitalizeName(rider.name) || t('profile.photoAlt')}
              className={classes.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={classes.avatarPlaceholder}>
              {getInitials(rider?.name)}
            </div>
          )}
        </div>

        <div className={classes.profileLayout}>
          <div className={classes.profileMain}>
            {editing ? (
              <form className={classes.form} onSubmit={handleSave}>
            <div className={classes.formField}>
              <label htmlFor="name">{t('profile.name')}</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="name_ka">{t('profile.nameKa')}</label>
              <input
                id="name_ka"
                value={form.name_ka}
                onChange={(e) => handleChange('name_ka', e.target.value)}
                lang="ka"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="birth_date">{t('profile.birthDate')}</label>
              <input
                id="birth_date"
                type="date"
                max={toDateInputValue(new Date())}
                value={form.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="age">{t('profile.age')}</label>
              <input
                id="age"
                type="number"
                min="0"
                readOnly
                value={form.age}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="country">{t('profile.country')}</label>
              <select
                id="country"
                value={resolveCountryCode(form.country, form.country_ka)}
                onChange={(e) => {
                  const next = getCountryByCode(e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    country: next.en,
                    country_ka: next.ka,
                  }));
                }}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {getCountryLabel(country.en, country.ka, i18n.language)}
                  </option>
                ))}
              </select>
            </div>
            <div className={classes.formField}>
              <label htmlFor="phone">{t('profile.phone')}</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div className={classes.formField}>
              <label htmlFor="email">{t('profile.email')}</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            {accountEmail && accountEmail !== form.email && (
              <p className={classes.label}>
                {t('profile.accountEmailValue', { email: accountEmail })}
              </p>
            )}
            <div className={classes.formField}>
              <label htmlFor="equestrian_club">{t('profile.equestrianClub')}</label>
              <select
                id="equestrian_club"
                value={form.equestrian_club}
                onChange={(e) => handleChange('equestrian_club', e.target.value)}
              >
                <option value="">—</option>
                {EQUESTRIAN_CLUBS.map((club) => (
                  <option key={club.value} value={club.value}>
                    {club.value === 'other' ? t('profile.otherClub') : club.label}
                  </option>
                ))}
              </select>
            </div>
            {form.equestrian_club === 'other' && (
              <div className={classes.formField}>
                <label htmlFor="club">{t('profile.clubName')}</label>
                <input
                  id="club"
                  value={form.club}
                  onChange={(e) => handleChange('club', e.target.value)}
                  placeholder={t('profile.clubNamePlaceholder')}
                  autoComplete="off"
                />
              </div>
            )}

            <div className={classes.formField}>
              <span className={classes.fileFieldLabel}>{t('common.photo')}</span>
              <input
                id={photoInputId}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={classes.fileInputHidden}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                }}
              />
              <label
                htmlFor={photoInputId}
                className={`${classes.fileDropzone}${
                  imagePreview || form.image
                    ? ` ${classes.fileDropzoneFilled}`
                    : ''
                }`}
              >
                {imagePreview || form.image ? (
                  <>
                    <img
                      src={imagePreview || form.image}
                      alt=""
                      className={classes.filePreview}
                    />
                    <span className={classes.fileDropzoneOverlay}>
                      {t('common.changePhoto')}
                    </span>
                  </>
                ) : (
                  <span className={classes.fileDropzoneEmpty}>
                    <span className={classes.fileDropzoneTitle}>
                      {t('common.addPhoto')}
                    </span>
                    <span className={classes.fileDropzoneHint}>JPG / PNG</span>
                  </span>
                )}
              </label>
              {(imageFile || form.image) && (
                <button
                  type="button"
                  className={classes.fileClearBtn}
                  onClick={() => {
                    clearImageFile();
                    handleChange('image', '');
                  }}
                >
                  {t('common.removePhoto')}
                </button>
              )}
            </div>

            {saveError && <p className={classes.error}>{saveError}</p>}

            <div className={classes.actions}>
              <button type="submit" className={classes.primaryBtn} disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </button>
              <button
                type="button"
                className={classes.secondaryBtn}
                onClick={handleCancel}
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
            ) : (
              <>
                <div className={classes.fieldGrid}>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.name')}</span>
                <span className={classes.value}>
                  {capitalizeName(rider?.name) || '—'}
                </span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.nameKa')}</span>
                <span className={classes.value}>{rider?.name_ka || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.birthDate')}</span>
                <span className={classes.value}>
                  {riderBirthDate(rider)
                    ? formatDisplayDate(riderBirthDate(rider), i18n.language)
                    : '—'}
                </span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.age')}</span>
                <span className={classes.value}>{riderAge(rider) || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.country')}</span>
                <span className={classes.value}>
                  {getCountryLabel(
                    rider?.country,
                    rider?.country_ka,
                    i18n.language
                  )}
                </span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.phone')}</span>
                <span className={classes.value}>{rider?.phone || '—'}</span>
              </div>
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.email')}</span>
                <span className={classes.value}>
                  {rider?.email || accountEmail || '—'}
                </span>
              </div>
              {accountEmail && rider?.email && accountEmail !== rider.email && (
                <div className={classes.fieldRow}>
                  <span className={classes.label}>{t('profile.accountEmail')}</span>
                  <span className={classes.value}>{accountEmail}</span>
                </div>
              )}
              <div className={classes.fieldRow}>
                <span className={classes.label}>{t('profile.equestrianClub')}</span>
                <span className={classes.value}>
                  {getEquestrianClubLabel(
                    rider?.equestrian_club,
                    rider?.club,
                    t
                  )}
                </span>
              </div>
            </div>

            <div className={classes.actions}>
              <button type="button" className={classes.primaryBtn} onClick={handleEdit}>
                {t('profile.edit')}
              </button>
            </div>
              </>
            )}
          </div>

          <MembershipBlock />
        </div>
      </div>

      <MyEventsProvider>
        <UpcomingEventsSection />
        <MyHorsesSection />
        <ParticipationHistorySection />
      </MyEventsProvider>
    </div>
  );
}
