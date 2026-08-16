import axiosInstance from '@/utils/axiosInstance';

/** Lightweight list for home / news page. */
export const getAllNews = async () => {
  const res = await axiosInstance.get('news/');
  return Array.isArray(res.data) ? res.data : [];
};

/** Full news detail. */
export const fetchNewsById = async (id) => {
  if (!id) throw new Error('News ID is missing');
  const res = await axiosInstance.get(`news/${id}/`);
  return res.data;
};
