// src/lib/firebase.ts

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBOLpRzw11Yw6xDDCyrO8KHpw4pBw6MQVE",
  authDomain: "the-mother-earth-project.firebaseapp.com",
  projectId: "the-mother-earth-project",
  storageBucket: "the-mother-earth-project.firebasestorage.app",
  messagingSenderId: "923391762712",
  appId: "1:923391762712:web:2993b089a3f9c3dfad7e6d",
  measurementId: "G-4EVWWXY3KX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
let analytics: Analytics | undefined;

// Emulator dihapus untuk produksi
/*
if (process.env.NODE_ENV === 'development') {
  console.log("Development mode: Attempting to connect to Firebase emulators...");
  try {
    connectFirestoreEmulator(db, 'localhost', 5000);
    connectStorageEmulator(storage, 'localhost', 5004);
    console.log("Successfully connected to Firestore and Storage emulators.");
  } catch (error) {
    console.error("Error connecting to Firebase emulators:", error);
  }
}
*/

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };
