import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentData,
  QuerySnapshot,
  DocumentReference,
  DocumentSnapshot,
  CollectionReference,
  onSnapshot,
  WhereFilterOp,
  Query
} from "firebase/firestore";

// Firebase configuration
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

// Initialize Firestore
const db = getFirestore(app);

// Collection references
export const getCollection = <T = DocumentData>(collectionPath: string): CollectionReference<T> => 
  collection(db, collectionPath) as CollectionReference<T>;

// Data listeners
export const subscribeToCollection = <T>(
  collectionPath: string, 
  callback: (data: T[]) => void,
  queryConstraints: any[] = []
): (() => void) => {
  const collectionRef = getCollection(collectionPath);
  const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;
  
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
    callback(data);
  });
};

// CRUD operations
export const addDocument = async <T>(collectionPath: string, data: T): Promise<string> => {
  const collectionRef = getCollection(collectionPath);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateDocument = async <T>(collectionPath: string, id: string, data: Partial<T>): Promise<void> => {
  const docRef = doc(db, collectionPath, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date()
  });
};

export const deleteDocument = async (collectionPath: string, id: string): Promise<void> => {
  const docRef = doc(db, collectionPath, id);
  await deleteDoc(docRef);
};

export const getDocuments = async <T>(collectionPath: string, queryConstraints: any[] = []): Promise<T[]> => {
  const collectionRef = getCollection(collectionPath);
  const q = queryConstraints.length > 0 ? query(collectionRef, ...queryConstraints) : collectionRef;
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as T[];
};

export const getDocumentById = async <T>(collectionPath: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionPath, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as T;
  } else {
    return null;
  }
};

// Helper method to query documents by a field
export const queryDocuments = async <T>(
  collectionPath: string,
  field: string,
  operator: WhereFilterOp,
  value: any
): Promise<T[]> => {
  return getDocuments<T>(collectionPath, [where(field, operator, value)]);
};

// For compatibility with existing code
export const getDbRef = (path: string): string => path;
export const subscribeToData = <T>(path: string, callback: (data: T[]) => void): (() => void) => {
  return subscribeToCollection(path, callback);
};
export const addData = <T>(path: string, data: T): Promise<string> => {
  return addDocument(path, data);
};
export const updateData = <T>(path: string, id: string, data: Partial<T>): Promise<void> => {
  return updateDocument(path, id, data);
};
export const deleteData = (path: string, id: string): Promise<void> => {
  return deleteDocument(path, id);
};
export const getData = <T>(path: string): Promise<T[]> => {
  return getDocuments(path);
};
export const getDataById = <T>(path: string, id: string): Promise<T | null> => {
  return getDocumentById(path, id);
};

export default {
  app,
  db,
  getCollection,
  subscribeToCollection,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  getDocumentById,
  queryDocuments,
  // Legacy compatibility
  getDbRef,
  subscribeToData,
  addData,
  updateData,
  deleteData,
  getData,
  getDataById
};
