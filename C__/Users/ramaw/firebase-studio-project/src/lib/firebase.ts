
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

if (process.env.NODE_ENV === 'development') {
  console.log('[Firebase] Development mode: Connecting to emulators...');
  try {
    // Ensure emulators are only connected once
    if (auth.emulatorConfig === null) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        console.log('[Firebase] Auth emulator connected.');
    }
    // Firestore and Storage emulators don't have a direct way to check if already connected via the JS SDK like auth does
    // connectFirestoreEmulator will throw an error if already connected to a different host/port, 
    // but not if re-connecting to the same one. For simplicity, we call it.
    // To be absolutely sure, you might need a global flag if hot-reloading causes issues.
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('[Firebase] Firestore emulator connection attempted.');
    connectStorageEmulator(storage, '127.0.0.1', 5004);
    console.log('[Firebase] Storage emulator connection attempted.');
  } catch (error) {
    console.error('[Firebase] Emulator connection error:', error);
  }
}

export { app, auth, db, storage, googleProvider };
