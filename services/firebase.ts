import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKey_ForMockLocalTestingOnly",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bananaboom-nz.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bananaboom-nz",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bananaboom-nz.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

// Singleton initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Check if we are running in simulation/mock mode (i.e. if the user has not configured their own env key)
export const isFirebaseMockEnabled = !import.meta.env.VITE_FIREBASE_API_KEY;
