import {
  clearAccessToken,
  getAccessToken,
  redirectToLogin,
  setAccessToken,
} from '@/lib/auth/token';

import { getApiOrigin } from './api-base';
import { ApiRequestError, extractApiErrorMessage } from './api-error';

const API_URL = getApiOrigin();

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is missing');
}

function getApiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

async function parseJsonResponse(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/** Authenticated fetch — sends Bearer token; redirects to login on 401. */
export async function authFetch(path, options = {}) {
  const token = getAccessToken();
  if (!token) {
    clearAccessToken();
    redirectToLogin();
    throw new ApiRequestError('Unauthorized', 401);
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  // Let the browser set multipart boundary for FormData.
  if (isFormData) {
    delete headers['Content-Type'];
  } else if (options.body != null && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(getApiUrl(path), {
    ...options,
    headers,
    cache: 'no-store',
  });

  const data = await parseJsonResponse(res);

  if (res.status === 401) {
    clearAccessToken();
    redirectToLogin();
    throw new ApiRequestError(
      extractApiErrorMessage(data) || 'Unauthorized',
      401,
      data
    );
  }

  if (!res.ok) {
    throw new ApiRequestError(
      extractApiErrorMessage(data) || 'Request failed',
      res.status,
      data
    );
  }

  return data;
}

export async function login({ email, password }) {
  const res = await fetch(getApiUrl('/api/auth/login/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const data = await parseJsonResponse(res);

  if (!res.ok) {
    throw new ApiRequestError(
      extractApiErrorMessage(data) || 'შესვლა ვერ მოხერხდა',
      res.status,
      data
    );
  }

  if (data.access) {
    setAccessToken(data.access);
  }

  return data;
}

export async function getMe() {
  return authFetch('/api/auth/me/', { method: 'GET' });
}

export async function patchMe(payload) {
  const isFormData =
    typeof FormData !== 'undefined' && payload instanceof FormData;

  return authFetch('/api/auth/me/', {
    method: 'PATCH',
    body: isFormData ? payload : JSON.stringify(payload),
  });
}

export async function getMyHorses() {
  return authFetch('/api/auth/me/horses/', { method: 'GET' });
}

export async function createMyHorse(payload) {
  return authFetch('/api/auth/me/horses/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function searchMyHorses(q) {
  const query = encodeURIComponent(String(q ?? '').trim());
  return authFetch(`/api/auth/me/horses/search/?q=${query}`, {
    method: 'GET',
  });
}

export async function getMyHorseClaimRequests({ status, action } = {}) {
  const params = new URLSearchParams();
  if (status != null && status !== '') {
    params.set('status', status);
  }
  if (action != null && action !== '') {
    params.set('action', action);
  }
  const query = params.toString();
  return authFetch(
    `/api/auth/me/horses/claim-requests/${query ? `?${query}` : ''}`,
    { method: 'GET' }
  );
}

/** Catalog claim / removal — JSON body. */
export async function createHorseClaimRequest({
  action = 'add',
  horse_ids = [],
  note = '',
}) {
  const trimmedNote = String(note ?? '').trim();
  return authFetch('/api/auth/me/horses/claim-requests/', {
    method: 'POST',
    body: JSON.stringify({
      action,
      horse_ids,
      note: trimmedNote,
    }),
  });
}

/** New horse claim — multipart/form-data (single optional image file). */
export async function createNewHorseClaimRequest({
  name,
  passport_number,
  birth_year,
  horse_level,
  color,
  gender,
  category,
  equestrian_club,
  studbook,
  image,
  note = '',
}) {
  const formData = new FormData();
  formData.append('action', 'add');
  formData.append('name', String(name ?? '').trim());
  formData.append('passport_number', String(passport_number ?? '').trim());
  formData.append('birth_year', String(birth_year ?? '').trim());

  if (horse_level) formData.append('horse_level', String(horse_level));
  if (color) formData.append('color', String(color));
  if (gender) formData.append('gender', String(gender));
  if (category) formData.append('category', String(category));
  if (equestrian_club) {
    formData.append('equestrian_club', String(equestrian_club));
  }

  const trimmedStudbook = String(studbook ?? '').trim();
  if (trimmedStudbook) formData.append('studbook', trimmedStudbook);

  const trimmedNote = String(note ?? '').trim();
  if (trimmedNote) formData.append('note', trimmedNote);

  if (image instanceof File) {
    formData.append('image', image);
  }

  return authFetch('/api/auth/me/horses/claim-requests/', {
    method: 'POST',
    body: formData,
  });
}

export async function getMyEvents() {
  return authFetch('/api/auth/me/events/', { method: 'GET' });
}

export async function registerForEvent(eventId, entries) {
  return authFetch(`/api/auth/me/events/${eventId}/register/`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  });
}

export async function payForEvent(eventId, { entry_ids } = {}) {
  const body =
    Array.isArray(entry_ids) && entry_ids.length > 0
      ? { entry_ids }
      : {};
  return authFetch(`/api/auth/me/events/${eventId}/pay/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMyEventEntry(eventId, entryId, { horse_id }) {
  return authFetch(`/api/auth/me/events/${eventId}/entries/${entryId}/`, {
    method: 'PATCH',
    body: JSON.stringify({ horse_id }),
  });
}

export async function deleteMyEventEntry(eventId, entryId) {
  return authFetch(`/api/auth/me/events/${eventId}/entries/${entryId}/`, {
    method: 'DELETE',
  });
}

export async function getMyMembership() {
  return authFetch('/api/auth/me/membership/', { method: 'GET' });
}

export async function requestMembershipPayment() {
  return authFetch('/api/auth/me/membership/', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Unpaid competition entry fees across events. */
export async function getMyEntryDues() {
  return authFetch('/api/auth/me/entry-dues/', { method: 'GET' });
}

/**
 * Start BOG payment for entry dues.
 * @param {number|string|null} [eventId] — required when multiple events are unpaid
 */
export async function requestEntryDuesPayment(eventId) {
  const body =
    eventId != null && eventId !== ''
      ? { event_id: Number(eventId) }
      : {};
  return authFetch('/api/auth/me/entry-dues/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function validateSignupInvite(token) {
  const res = await fetch(
    getApiUrl(`/api/auth/signup-invite/validate/?token=${encodeURIComponent(token)}`),
    { cache: 'no-store' }
  );

  const data = await parseJsonResponse(res);

  if (!res.ok) {
    throw new ApiRequestError(
      extractApiErrorMessage(data) || 'Invalid invite',
      res.status,
      data
    );
  }

  return data;
}

export async function completeSignup(payload) {
  const res = await fetch(getApiUrl('/api/auth/complete-signup/'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonResponse(res);

  if (res.status === 201) {
    return data;
  }

  if (!res.ok) {
    throw new ApiRequestError(
      extractApiErrorMessage(data) || 'Signup failed',
      res.status,
      data
    );
  }

  return data;
}

export { setAccessToken, clearAccessToken, getAccessToken };
