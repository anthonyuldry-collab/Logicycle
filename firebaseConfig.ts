import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration, using environment variables
const firebaseConfig = {
  apiKey: (process as any)?.env?.API_KEY,
  authDomain: (process as any)?.env?.AUTH_DOMAIN,
  projectId: (process as any)?.env?.PROJECT_ID,
  storageBucket: (process as any)?.env?.STORAGE_BUCKET,
  messagingSenderId: (process as any)?.env?.MESSAGING_SENDER_ID,
  appId: (process as any)?.env?.APP_ID,
  measurementId: (process as any)?.env?.MEASUREMENT_ID
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one.
      // This is a normal scenario, so we can handle it gracefully.
      console.warn("La persistance Firestore n'a pas pu être activée, probablement car plusieurs onglets sont ouverts.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence.
      console.warn("La persistance Firestore n'est pas supportée sur ce navigateur.");
    } else {
        console.error("Erreur d'activation de la persistance Firestore:", err);
    }
  });