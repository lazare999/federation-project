import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

let cachedDb = null;

/**
 * Parse FIREBASE_SERVICE_ACCOUNT_JSON. Supports raw JSON, extra quotes, or base64(JSON).
 */
function parseServiceAccountJson(raw) {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON (or base64-encoded JSON). Paste the full service account file as one JSON object.'
      );
    }
  }
}

/** True if Admin SDK can be configured (inline JSON or credentials file path). */
export function hasFirestoreAdmin() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

/**
 * Firestore with admin privileges (bypasses security rules). Server only.
 * Prefer FIREBASE_SERVICE_ACCOUNT_JSON on Railway/Vercel; use GOOGLE_APPLICATION_CREDENTIALS locally with a path to the .json file.
 */
export function getAdminFirestore() {
  if (cachedDb) return cachedDb;

  if (!getApps().length) {
    const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

    if (jsonRaw) {
      const credentials = parseServiceAccountJson(jsonRaw);
      if (!credentials.private_key || !credentials.client_email) {
        throw new Error(
          'Service account JSON must include private_key and client_email.'
        );
      }
      initializeApp({
        credential: cert(credentials),
        projectId: credentials.project_id,
      });
    } else if (gac) {
      initializeApp({ credential: applicationDefault() });
    } else {
      throw new Error(
        'Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.'
      );
    }
  }

  cachedDb = getFirestore();
  return cachedDb;
}

export { FieldValue };
