import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration, provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBDHmsIdstWYdi4yHMW0PE7rSsCnvnkm7k",
  authDomain: "logicycle01.firebaseapp.com",
  projectId: "logicycle01",
  storageBucket: "logicycle01.appspot.com",
  messagingSenderId: "373355040435",
  appId: "1:373355040435:web:c85b13e61c6fa10d0eeac6",
  measurementId: "G-03X2FB0F0B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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