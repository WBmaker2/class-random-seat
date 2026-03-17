import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let persistenceInitialized = false;

export function getFirebaseApp() {
  if (!hasFirebaseConfig) {
    return null;
  }

  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return appInstance;
}

export function getFirebaseDb() {
  const app = getFirebaseApp();

  if (!app) {
    return null;
  }

  if (!dbInstance) {
    dbInstance = getFirestore(app);
  }

  return dbInstance;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();

  if (!app) {
    return null;
  }

  const auth = getAuth(app);

  if (typeof window !== "undefined" && !persistenceInitialized) {
    persistenceInitialized = true;
    void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  }

  return auth;
}

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});
