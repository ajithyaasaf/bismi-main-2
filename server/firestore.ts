import admin from 'firebase-admin';
import { initializeApp as initializeClientApp, getApps as getClientApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Create a type that can represent either admin or client Firestore
type FirestoreDB = AdminFirestore | ClientFirestore;

// Function to initialize Firebase - try Admin first, then fall back to client SDK
const initializeFirebase = () => {
  try {
    // First, try to initialize Firebase Admin SDK
    if (admin.apps.length === 0) {
      // For Vercel deployment - simplified initialization
      const adminApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'bismi-broilers-3ca96',
      });
      
      console.log('Firebase Admin SDK initialized successfully');
      return {
        app: adminApp,
        isAdmin: true
      };
    } else {
      console.log('Firebase Admin SDK already initialized');
      return {
        app: admin.apps[0],
        isAdmin: true
      };
    }
  } catch (adminError) {
    console.warn('Failed to initialize Firebase Admin SDK:', adminError);
    console.log('Falling back to Firebase Web SDK');
    
    // Fall back to initializing Firebase Web SDK
    try {
      // Check if Firebase Web SDK is already initialized
      if (!firebase.getApps().length) {
        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s",
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "bismi-broilers-3ca96.firebaseapp.com",
          databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://bismi-broilers-3ca96-default-rtdb.firebaseio.com",
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "bismi-broilers-3ca96",
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "bismi-broilers-3ca96.firebasestorage.app",
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "949430744092",
          appId: process.env.VITE_FIREBASE_APP_ID || "1:949430744092:web:4ea5638a9d38ba3e76dbd9"
        };
        
        const clientApp = firebase.initializeApp(firebaseConfig);
        console.log('Firebase Web SDK initialized successfully');
        return {
          app: clientApp,
          isAdmin: false
        };
      } else {
        console.log('Firebase Web SDK already initialized');
        return {
          app: firebase.getApp(),
          isAdmin: false
        };
      }
    } catch (clientError) {
      console.error('Failed to initialize Firebase Web SDK:', clientError);
      return {
        app: null,
        isAdmin: false
      };
    }
  }
};

// Initialize Firebase
const { app, isAdmin } = initializeFirebase();

// Initialize Firestore based on which initialization method worked
let db: FirestoreDB | null = null;
if (app) {
  if (isAdmin) {
    db = admin.firestore();
  } else {
    db = getClientFirestore(app as FirebaseApp);
  }
}

// Log initialization status
console.log(`Firebase initialized (using ${isAdmin ? 'Admin SDK' : 'Web SDK'})`);
console.log(`Firestore database ${db ? 'connected' : 'not available'}`);

// Timesteamp creation helper that works with both Admin and Web SDKs
const createTimestamp = () => {
  if (isAdmin) {
    return Timestamp.now();
  } else {
    return new Date();
  }
};

// Collection names
export const COLLECTIONS = {
  SUPPLIERS: 'suppliers',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

// Flag to track if Firestore is available
const isFirestoreAvailable = !!db;

// Generic functions to work with collections
export async function getAllDocuments<T>(collection: string): Promise<T[]> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot get all documents from ${collection}`);
    return [];
  }
  
  try {
    const snapshot = await db.collection(collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  } catch (error) {
    console.error(`Error getting all documents from ${collection}:`, error);
    return [];
  }
}

export async function getDocumentById<T>(collection: string, id: string): Promise<T | undefined> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot get document ${id} from ${collection}`);
    return undefined;
  }
  
  try {
    const doc = await db.collection(collection).doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as unknown as T;
  } catch (error) {
    console.error(`Error getting document ${id} from ${collection}:`, error);
    return undefined;
  }
}

export async function createDocument<T>(collection: string, data: any): Promise<T> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot create document in ${collection}`);
    const id = uuidv4();
    return { id, ...data, createdAt: new Date() } as unknown as T;
  }
  
  try {
    // Create a new document with a generated ID
    const id = uuidv4();
    const docRef = db.collection(collection).doc(id);
    
    // Add createdAt timestamp
    const docData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    await docRef.set(docData);
    return { id, ...docData } as unknown as T;
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error);
    const id = uuidv4();
    return { id, ...data, createdAt: new Date() } as unknown as T;
  }
}

export async function updateDocument<T>(collection: string, id: string, data: any): Promise<T | undefined> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot update document ${id} in ${collection}`);
    return { id, ...data, updatedAt: new Date() } as unknown as T;
  }
  
  try {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return undefined;
    
    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: Timestamp.now()
    };
    
    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    return { id, ...updatedDoc.data() } as unknown as T;
  } catch (error) {
    console.error(`Error updating document ${id} in ${collection}:`, error);
    return { id, ...data, updatedAt: new Date() } as unknown as T;
  }
}

export async function deleteDocument(collection: string, id: string): Promise<boolean> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot delete document ${id} from ${collection}`);
    return true;
  }
  
  try {
    const docRef = db.collection(collection).doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) return false;
    
    await docRef.delete();
    return true;
  } catch (error) {
    console.error(`Error deleting document ${id} from ${collection}:`, error);
    return false;
  }
}

export async function queryDocuments<T>(
  collection: string, 
  field: string, 
  operator: any, // Using any type to accommodate both SDKs
  value: any
): Promise<T[]> {
  if (!isFirestoreAvailable || !db) {
    console.warn(`Firestore not available, cannot query documents in ${collection}`);
    return [];
  }
  
  try {
    const snapshot = await db.collection(collection).where(field, operator, value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  } catch (error) {
    console.error(`Error querying documents in ${collection}:`, error);
    return [];
  }
}

// Initialize some collections if they don't exist
export async function ensureCollectionsExist() {
  if (!isFirestoreAvailable || !db) {
    console.warn('Firestore not available, skipping collection initialization');
    return;
  }
  
  try {
    // Check if collections exist, if not create them
    for (const collection of Object.values(COLLECTIONS)) {
      const collectionRef = db.collection(collection);
      const snapshot = await collectionRef.limit(1).get();
      
      // If collection is empty, it might be new
      if (snapshot.empty) {
        console.log(`Initializing empty collection: ${collection}`);
      }
    }
  } catch (error) {
    console.error('Error ensuring collections exist:', error);
  }
}

// Call this function when the server starts
if (isFirestoreAvailable) {
  ensureCollectionsExist().catch(error => {
    console.error('Error initializing Firestore collections:', error);
    console.warn('Due to Firestore initialization error, falling back to in-memory storage');
    // Mark Firestore as unavailable when initialization fails
    // This will be used in routes.ts to fallback to in-memory storage
    (global as any).FIRESTORE_FAILED = true;
  });
} else {
  console.warn('Firestore not available, using in-memory storage instead');
}

// Export the Firestore instance and helper functions
export default {
  db,
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  COLLECTIONS
};