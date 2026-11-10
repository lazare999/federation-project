// Live production Railway (Django admin / current prod DB).
const PRODUCTION_ORIGIN = 'https://web-production-42b8c.up.railway.app';

// Old Railway service left in Vercel env / prior builds — different DB, stale data.
const STALE_ORIGINS = new Set([
  'https://web-production-a673b.up.railway.app',
]);

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
  const origin = getApiOrigin();
  if (!origin || STALE_ORIGINS.has(origin)) {
    return PRODUCTION_ORIGIN;
  }
  return origin;
}
