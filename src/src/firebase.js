import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBC8TpceNeSLgJn_MF_oydrdHf8o3OyvQs",
  authDomain: "bobbys-order-list.firebaseapp.com",
  projectId: "bobbys-order-list",
  storageBucket: "bobbys-order-list.firebasestorage.app",
  messagingSenderId: "722665008728",
  appId: "1:722665008728:web:1c307247d71e8e2fe7e42d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Storage API wrapper to match the interface used in the app
export const storage = {
  async get(key) {
    try {
      const docRef = doc(db, 'storage', key);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          key: key,
          value: docSnap.data().value,
          shared: false
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  async set(key, value) {
    try {
      const docRef = doc(db, 'storage', key);
      await setDoc(docRef, { value, updatedAt: new Date() });
      return {
        key: key,
        value: value,
        shared: false
      };
    } catch (error) {
      console.error('Error setting document:', error);
      throw error;
    }
  },

  async delete(key) {
    try {
      const docRef = doc(db, 'storage', key);
      await deleteDoc(docRef);
      return {
        key: key,
        deleted: true,
        shared: false
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  async list(prefix) {
    try {
      const storageRef = collection(db, 'storage');
      const snapshot = await getDocs(storageRef);
      const keys = [];
      
      snapshot.forEach((doc) => {
        if (!prefix || doc.id.startsWith(prefix)) {
          keys.push(doc.id);
        }
      });
      
      return {
        keys: keys,
        prefix: prefix,
        shared: false
      };
    } catch (error) {
      console.error('Error listing documents:', error);
      throw error;
    }
  }
};
