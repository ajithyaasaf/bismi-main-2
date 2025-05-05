import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Function to initialize Firebase Admin with better Vercel compatibility
const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
      // For Vercel deployment - simplified initialization
      // This works well with Vercel's environment and doesn't require a service account
      const app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'bismi-broilers-3ca96',
      });
      
      console.log('Firebase Admin initialized successfully');
      return app;
    } else {
      console.log('Firebase Admin already initialized');
      return getApps()[0];
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
};

// Initialize Firebase Admin
const app = initializeFirebaseAdmin();

// Initialize Firestore if Firebase Admin was initialized successfully
const db = app ? getFirestore(app) : null;

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
  operator: FirebaseFirestore.WhereFilterOp, 
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
  ensureCollectionsExist().catch(console.error);
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