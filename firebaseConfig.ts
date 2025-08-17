import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}


// Export services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn("La persistance Firestore n'a pas pu être activée, probablement car plusieurs onglets sont ouverts.");
    } else if (err.code == 'unimplemented') {
      console.warn("La persistance Firestore n'est pas supportée sur ce navigateur.");
    } else {
        console.error("Erreur d'activation de la persistance Firestore:", err);
    }
  });