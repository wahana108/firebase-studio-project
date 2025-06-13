// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

if (process.env.NODE_ENV === 'development') {
  try {
    console.log("Firebase Lib: Development mode. Connecting to emulators.");
    // Auth emulator typically runs on 9099
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    // Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    // Storage emulator
    connectStorageEmulator(storage, 'localhost', 5004);
    console.log("Firebase Lib: Successfully connected to Auth, Firestore, and Storage emulators.");
  } catch (error) {
    console.error("Firebase Lib: Error connecting to Firebase emulators:", error);
  }
}

export { app, db, storage, auth, googleProvider };
