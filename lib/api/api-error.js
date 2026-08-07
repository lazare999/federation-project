export class ApiRequestError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.data = data;
  }
}

/** Prefer detail/message from Django-style error bodies. */
export function extractApiErrorMessage(data) {
  if (!data || typeof data !== 'object') return '';
  if (data.detail) return String(data.detail);
  if (data.message) return String(data.message);

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === 'string' && value) return value;
  }

  return '';
}
