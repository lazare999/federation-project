// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6XdFTYklKczOQ-OFUz2mgY5mSZ31klIg",
  authDomain: "federation-project-84bd0.firebaseapp.com",
  projectId: "federation-project-84bd0",
  storageBucket: "federation-project-84bd0.firebasestorage.app",
  messagingSenderId: "369680036994",
  appId: "1:369680036994:web:f9470fe1e57c416b16309b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


const database = getDatabase(app);
const storage = getStorage(app);

export { database, storage };