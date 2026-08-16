import axiosInstance from '@/utils/axiosInstance';

function toPlainError(error, fallback = 'Request failed') {
  const status = error?.response?.status;
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;
  const err = new Error(typeof detail === 'string' ? detail : fallback);
  err.status = status;
  return err;
}

/** Lightweight list for home / events page. */
export const getEvents = async () => {
  try {
    const res = await axiosInstance.get('events/');
    const data = res.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  } catch (error) {
    throw toPlainError(error, 'Failed to load events');
  }
};

/** Full event detail — competitions, results, entries, images. */
export const fetchEventById = async (id) => {
  try {
    const res = await axiosInstance.get(`events/${id}/`);
    if (!res.data) throw new Error('Event not found');
    return res.data;
  } catch (error) {
    throw toPlainError(error, 'Event not found');
  }
};
