import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOLpRzw11Yw6xDDCyrO8KHpw4pBw6MQVE",
  authDomain: "the-mother-earth-project.firebaseapp.com",
  projectId: "the-mother-earth-project",
  storageBucket: "the-mother-earth-project.firebasestorage.app",
  messagingSenderId: "923391762712",
  appId: "1:923391762712:web:2993b089a3f9c3dfad7e6d",
  measurementId: "G-4EVWWXY3KX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (process.env.NODE_ENV === "development") {
  console.log('[Firebase] Connecting to emulators...');
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 5000);
    connectStorageEmulator(storage, "localhost", 5004);
    console.log('[Firebase] Connected to emulators.');
  } catch (err) {
    console.error('[Firebase] Emulator connection error:', err);
  }
}

export { app, auth, db, storage };