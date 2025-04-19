import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, update, DatabaseReference, DataSnapshot } from "firebase/database";

// Firebase configuration
// When deploying to Vercel, consider using environment variables for these values
const firebaseConfig = {
  apiKey: "AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s",
  authDomain: "bismi-broilers-3ca96.firebaseapp.com",
  databaseURL: "https://bismi-broilers-3ca96-default-rtdb.firebaseio.com",
  projectId: "bismi-broilers-3ca96",
  storageBucket: "bismi-broilers-3ca96.firebasestorage.app",
  messagingSenderId: "949430744092",
  appId: "1:949430744092:web:4ea5638a9d38ba3e76dbd9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Database reference functions
export const getDbRef = (path: string): DatabaseReference => ref(database, path);

// Data listeners
export const subscribeToData = <T>(
  path: string, 
  callback: (data: T[]) => void
): (() => void) => {
  const dbRef = getDbRef(path);
  const unsubscribe = onValue(dbRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    const formattedData = data ? Object.keys(data).map(key => ({
      id: key,
      ...data[key]
    })) : [];
    callback(formattedData as T[]);
  });
  
  return unsubscribe;
};

// CRUD operations
export const addData = async <T>(path: string, data: T): Promise<string> => {
  const dbRef = getDbRef(path);
  const newItemRef = push(dbRef);
  await set(newItemRef, data);
  return newItemRef.key || '';
};

export const updateData = async <T>(path: string, id: string, data: Partial<T>): Promise<void> => {
  const itemRef = getDbRef(`${path}/${id}`);
  await update(itemRef, data as object);
};

export const deleteData = async (path: string, id: string): Promise<void> => {
  const itemRef = getDbRef(`${path}/${id}`);
  await remove(itemRef);
};

export const getData = async <T>(path: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const dbRef = getDbRef(path);
    onValue(dbRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      const formattedData = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      resolve(formattedData as T[]);
    }, {
      onlyOnce: true
    }, error => {
      reject(error);
    });
  });
};

export const getDataById = async <T>(path: string, id: string): Promise<T | null> => {
  return new Promise((resolve, reject) => {
    const itemRef = getDbRef(`${path}/${id}`);
    onValue(itemRef, (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        resolve({
          id,
          ...snapshot.val()
        } as T);
      } else {
        resolve(null);
      }
    }, {
      onlyOnce: true
    }, error => {
      reject(error);
    });
  });
};

export default {
  app,
  database,
  getDbRef,
  subscribeToData,
  addData,
  updateData,
  deleteData,
  getData,
  getDataById
};
