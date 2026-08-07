const ACCESS_KEY = 'access';
const LEGACY_KEY = 'token';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY) || localStorage.getItem(LEGACY_KEY);
}

export function setAccessToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_KEY, token);
  localStorage.removeItem(LEGACY_KEY);
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

export function redirectToLogin() {
  if (typeof window === 'undefined') return;
  window.location.assign('/login/');
}
