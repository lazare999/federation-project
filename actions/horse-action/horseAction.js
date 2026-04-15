// import { database, storage } from '@/lib/firebase/firebase';
// import { get, push, ref, set } from 'firebase/database';
// import {
//   getDownloadURL,
//   ref as storageRef,
//   uploadBytes,
// } from 'firebase/storage';

// // ADD HORSE
// export const addHorse = async (formData) => {
//   try {
//     let uploadedImageUrls = [];

//     if (formData.images && formData.images.length > 0) {
//       for (const imageFile of formData.images) {
//         const imageStorageRef = storageRef(
//           storage,
//           `horseImages/${imageFile.name}`
//         );
//         await uploadBytes(imageStorageRef, imageFile);
//         const imageUrl = await getDownloadURL(imageStorageRef);
//         uploadedImageUrls.push(imageUrl);
//       }
//     }

//     const horseData = {
//       name: formData.name,
//       birthYear: formData.birthYear,
//       gender: formData.gender,
//       color: formData.color,
//       studbook: formData.studbook,
//       category: formData.category,
//       geo: formData.geo,
//       images: uploadedImageUrls,
//     };

//     const horsesRef = ref(database, 'horses');
//     const newHorseRef = push(horsesRef);
//     await set(newHorseRef, horseData);

//     return { success: true, horseId: newHorseRef.key };
//   } catch (error) {
//     console.error('Error adding horse:', error);
//     throw new Error(`Failed to upload horse: ${error.message}`);
//   }
// };

// // GET HORSES
// export const getHorses = async () => {
//   try {
//     const horsesRef = ref(database, 'horses');
//     const snapshot = await get(horsesRef);

//     if (snapshot.exists()) {
//       const horses = snapshot.val();
//       return Object.keys(horses).map((horseId) => ({
//         $id: horseId,
//         ...horses[horseId],
//       }));
//     } else {
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching horses:', error);
//     throw new Error('Failed to fetch horses.');
//   }
// };

import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";

// Fetch all horses
export const getHorses = async () => {
  try {
    const res = await axiosInstance.get("horses/");

    return res.data
      .filter((horse) => horse?.is_active)
      .sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Failed to fetch horses:", error);
    return []; // NEVER break build
  }
};

// Fetch single horse by ID (SAFE)
export const fetchHorseById = async (id) => {
  try {
    const res = await axiosInstance.get(`horses/${id}`);
    return res.data;
  } catch (error) {
    // handle 404 safely
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }

    console.error("Failed to fetch horse:", error);
    throw error;
  }
};