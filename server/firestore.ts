import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin
const app = initializeApp({
  // Use environment variables in production and default values for development
  projectId: process.env.FIREBASE_PROJECT_ID || 'bismi-broilers-3ca96',
  // If credentials are provided, use them, otherwise use default credentials
  ...(process.env.FIREBASE_PRIVATE_KEY && {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  })
});

// Initialize Firestore
const db = getFirestore(app);

// Collection names
export const COLLECTIONS = {
  SUPPLIERS: 'suppliers',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

// Generic functions to work with collections
export async function getAllDocuments<T>(collection: string): Promise<T[]> {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
}

export async function getDocumentById<T>(collection: string, id: string): Promise<T | undefined> {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) return undefined;
  return { id: doc.id, ...doc.data() } as unknown as T;
}

export async function createDocument<T>(collection: string, data: any): Promise<T> {
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
}

export async function updateDocument<T>(collection: string, id: string, data: any): Promise<T | undefined> {
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
}

export async function deleteDocument(collection: string, id: string): Promise<boolean> {
  const docRef = db.collection(collection).doc(id);
  const doc = await docRef.get();
  
  if (!doc.exists) return false;
  
  await docRef.delete();
  return true;
}

export async function queryDocuments<T>(
  collection: string, 
  field: string, 
  operator: FirebaseFirestore.WhereFilterOp, 
  value: any
): Promise<T[]> {
  const snapshot = await db.collection(collection).where(field, operator, value).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
}

// Initialize some collections if they don't exist
export async function ensureCollectionsExist() {
  // Check if collections exist, if not create them
  for (const collection of Object.values(COLLECTIONS)) {
    const collectionRef = db.collection(collection);
    const snapshot = await collectionRef.limit(1).get();
    
    // If collection is empty, it might be new
    if (snapshot.empty) {
      console.log(`Initializing empty collection: ${collection}`);
    }
  }
}

// Call this function when the server starts
ensureCollectionsExist().catch(console.error);

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