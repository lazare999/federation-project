import axiosInstance from '@/utils/axiosInstance';

/** Lightweight list for home / horses page. */
export const getHorses = async () => {
  const res = await axiosInstance.get('horses/');
  const horses = Array.isArray(res.data) ? res.data : [];

  return horses
    .filter((horse) => horse.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/** Full horse detail. */
export const fetchHorseById = async (id) => {
  const res = await axiosInstance.get(`horses/${id}/`);
  if (!res.data) throw new Error('Horse not found');
  return res.data;
};
