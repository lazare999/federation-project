import axiosInstance from '@/utils/axiosInstance';

export const getSponsors = async () => {
  try {
    const response = await axiosInstance.get('sponsors/');

    return response.data.sort((a, b) => a.order - b.order); // Sort sponsors by order ASC
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw new Error('Failed to fetch sponsors.');
  }
};
