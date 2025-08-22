// import { ref, push, set, get } from "firebase/database";
// import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
// import { database, storage } from "@/lib/firebase/firebase";

// // ADD SPONSOR
// export const addSponsor = async (formData) => {
//   try {
//     let imageUrl = "";

//     if (formData.image) {
//       const imageStorageRef = storageRef(storage, `sponsorImages/${formData.image.name}`);
//       await uploadBytes(imageStorageRef, formData.image);
//       imageUrl = await getDownloadURL(imageStorageRef);
//     }

//     const sponsorData = {
//       name: formData.name,
//       link: formData.link,
//       image: imageUrl,
//     };

//     const sponsorsRef = ref(database, "sponsors");
//     const newSponsorRef = push(sponsorsRef);
//     await set(newSponsorRef, sponsorData);

//     return { success: true, sponsorId: newSponsorRef.key };
//   } catch (error) {
//     console.error("Error adding sponsor:", error);
//     throw new Error(`Failed to upload sponsor: ${error.message}`);
//   }
// };

// // GET SPONSORS
// export const getSponsors = async () => {
//   try {
//     const sponsorsRef = ref(database, "sponsors");
//     const snapshot = await get(sponsorsRef);

//     if (snapshot.exists()) {
//       const sponsors = snapshot.val();
//       return Object.keys(sponsors).map((sponsorId) => ({
//         $id: sponsorId,
//         ...sponsors[sponsorId],
//       }));
//     } else {
//       return [];
//     }
//   } catch (error) {
//     console.error("Error fetching sponsors:", error);
//     throw new Error("Failed to fetch sponsors.");
//   }
// };

import axiosInstance from '@/utils/axiosInstance';

export const getSponsors = async () => {
  try {
    const response = await axiosInstance.get('sponsors/');
    return response.data;
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw new Error('Failed to fetch sponsors.');
  }
};
