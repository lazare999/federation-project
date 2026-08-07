const FALLBACK_ORIGIN = 'https://web-production-a673b.up.railway.app';

/**
 * Normalize NEXT_PUBLIC_API_URL to origin only (no trailing slash, no /api).
 * Accepts both:
 *   https://host
 *   https://host/api/
 */
export function getApiOrigin() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  if (!raw) return '';

  return raw.replace(/\/+$/, '').replace(/\/api$/i, '');
}

export function getApiOriginOrFallback() {
  return getApiOrigin() || FALLBACK_ORIGIN;
}
