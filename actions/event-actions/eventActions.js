// // eventActions.js
// import { database, storage } from '@/lib/firebase/firebase'; // Adjust path if needed
// import { get, push, ref, set } from 'firebase/database';
// import {
//   getDownloadURL,
//   ref as storageRef,
//   uploadBytes,
// } from 'firebase/storage';

// // ADD EVENT
// export const addEvent = async (formData) => {
//   try {
//     let uploadedImageUrls = [];

//     // Upload each image to Firebase Storage
//     if (formData.images && formData.images.length > 0) {
//       for (const imageFile of formData.images) {
//         const imageStorageRef = storageRef(
//           storage,
//           `eventImages/${imageFile.name}`
//         );
//         await uploadBytes(imageStorageRef, imageFile);
//         const imageUrl = await getDownloadURL(imageStorageRef);
//         uploadedImageUrls.push(imageUrl);
//       }
//     }

//     // Prepare event data
//     const eventData = {
//       title: formData.title,
//       date: formData.date,
//       images: uploadedImageUrls, // Array of image URLs
//     };

//     // Save to Realtime Database
//     const eventsRef = ref(database, 'events');
//     const newEventRef = push(eventsRef);
//     await set(newEventRef, eventData);

//     return { success: true, eventId: newEventRef.key };
//   } catch (error) {
//     console.error('Error adding event:', error);
//     throw new Error(`Failed to upload event: ${error.message}`);
//   }
// };

// // GET EVENTS
// export const getEvents = async () => {
//   try {
//     const eventsRef = ref(database, 'events');
//     const snapshot = await get(eventsRef);

//     if (snapshot.exists()) {
//       const events = snapshot.val();
//       return Object.keys(events).map((eventId) => ({
//         $id: eventId,
//         ...events[eventId],
//         formattedDate: new Date(events[eventId].date).toLocaleDateString(),
//       }));
//     } else {
//       return [];
//     }
//   } catch (error) {
//     console.error('Error fetching events:', error);
//     throw new Error('Failed to fetch events.');
//   }
// };

import axiosInstance from '@/utils/axiosInstance';

export const getEvents = async () => {
  const res = await axiosInstance.get('events/');
  return res.data;
};

export const fetchEventById = async (id) => {
  const events = await getEvents();
  const event = events.find((e) => e.id === Number(id));
  if (!event) throw new Error('Event not found');
  return event;
};
