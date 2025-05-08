
// Firebase configuration is now hardcoded as per user request.
// Environment variables are no longer used for Firebase setup.

import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from "firebase/analytics";

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBOLpRzw11Yw6xDDCyrO8KHpw4pBw6MQVE",
  authDomain: "the-mother-earth-project.firebaseapp.com",
  projectId: "the-mother-earth-project",
  storageBucket: "the-mother-earth-project.appspot.com", // Corrected format
  messagingSenderId: "923391762712",
  appId: "1:923391762712:web:2993b089a3f9c3dfad7e6d",
  measurementId: "G-4EVWWXY3KX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
let analytics: Analytics | undefined;

if (typeof window !== 'undefined') {
  // Initialize Analytics only on the client side
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };

