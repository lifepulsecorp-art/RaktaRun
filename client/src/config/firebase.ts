import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
const firebaseConfigured = Boolean(apiKey && apiKey !== 'YOUR_FIREBASE_API_KEY');

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// The app supports local JWT auth without Firebase credentials. Avoid creating
// Firebase Auth with the placeholder key from .env.example, which crashes the UI.
const app: FirebaseApp | null = firebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth: Auth | null = app ? getAuth(app) : null;

export default app;
