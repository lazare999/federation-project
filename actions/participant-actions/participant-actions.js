import axiosInstance from '@/utils/axiosInstance';

// =========================
// RIDER SEARCH
// =========================
export const searchRiders = async (q) => {
  const res = await axiosInstance.get(`/riders/?search=${q}`);
  return res.data;
};

// =========================
// HORSE SEARCH
// =========================
export const searchHorses = async (q) => {
  const res = await axiosInstance.get(`/horses/?search=${q}`);
  return res.data;
};

// =========================
// CREATE ENTRY
// =========================
export const createRiderHorseEntry = async (payload) => {
  const res = await axiosInstance.post('/rider-horse-entries/', payload);
  return res.data;
};
