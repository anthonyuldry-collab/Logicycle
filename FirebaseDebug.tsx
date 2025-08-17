import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseDebug: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Vérification...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Vérification...');
  const [user, setUser] = useState<any>(null);
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    // Vérifier l'état de l'authentification
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setAuthStatus('✅ Connecté');
      } else {
        setUser(null);
        setAuthStatus('❌ Non connecté');
      }
    });

    // Vérifier la connexion Firestore
    const testFirestore = async () => {
      try {
        const usersCollection = collection(db, 'users');
        await getDocs(usersCollection);
        setFirestoreStatus('✅ Connecté');
        
        // Lister les collections disponibles
        const collectionsList = ['users', 'teams', 'teamMemberships', 'permissions'];
        setCollections(collectionsList);
      } catch (error) {
        console.error('Erreur Firestore:', error);
        setFirestoreStatus('❌ Erreur de connexion');
      }
    };

    testFirestore();

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Debug Firebase</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Auth:</strong> {authStatus}
        </div>
        <div>
          <strong>Firestore:</strong> {firestoreStatus}
        </div>
        {user && (
          <div>
            <strong>Utilisateur:</strong> {user.email}
          </div>
        )}
        {collections.length > 0 && (
          <div>
            <strong>Collections:</strong>
            <ul className="ml-2">
              {collections.map((col, index) => (
                <li key={index}>• {col}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseDebug; 