// /lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB6XdFTYklKczOQ-OFUz2mgY5mSZ31klIg",
  authDomain: "federation-project-84bd0.firebaseapp.com",
  projectId: "federation-project-84bd0",
  storageBucket: "federation-project-84bd0.firebasestorage.app",
  messagingSenderId: "369680036994",
  appId: "1:369680036994:web:f9470fe1e57c416b16309b"
};

// prevent re-init (VERY IMPORTANT in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);