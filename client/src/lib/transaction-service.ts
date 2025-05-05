import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Collection name for transactions
const TRANSACTIONS_COLLECTION = 'transactions';

// Add a new transaction
export async function addTransaction(transactionData: any) {
  try {
    console.log('Adding transaction to Firestore:', transactionData);
    
    // Add a custom ID and timestamps
    const documentData = {
      ...transactionData,
      id: uuidv4(),
      createdAt: new Date(), // Using Date instead of serverTimestamp for better compatibility
      date: transactionData.date || new Date()
    };
    
    // Add the document to Firestore directly
    const transactionCollection = collection(db, TRANSACTIONS_COLLECTION);
    const docRef = await addDoc(transactionCollection, documentData);
    
    console.log(`Transaction added to Firestore with ID: ${docRef.id}`);
    
    // Return the data with the id included
    return { ...documentData, firebaseId: docRef.id };
  } catch (error) {
    console.error('Error adding transaction to Firestore:', error);
    throw error;
  }
}

// Get all transactions
export async function getTransactions() {
  try {
    console.log('Getting all transactions from Firestore');
    
    const transactionCollection = collection(db, TRANSACTIONS_COLLECTION);
    const querySnapshot = await getDocs(transactionCollection);
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        date: data.date instanceof Date ? data.date : new Date()
      };
    });
    
    console.log(`Retrieved ${transactions.length} transactions from Firestore`);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions from Firestore:', error);
    throw error;
  }
}

// Get transactions by entity ID (customer or supplier ID)
export async function getTransactionsByEntity(entityId: string, entityType?: string) {
  try {
    console.log(`Getting transactions for entity with ID: ${entityId}`);
    
    const transactionCollection = collection(db, TRANSACTIONS_COLLECTION);
    let q;
    
    if (entityType) {
      q = query(
        transactionCollection, 
        where('entityId', '==', entityId),
        where('entityType', '==', entityType)
      );
    } else {
      q = query(transactionCollection, where('entityId', '==', entityId));
    }
    
    const querySnapshot = await getDocs(q);
    
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        date: data.date instanceof Date ? data.date : new Date()
      };
    });
    
    console.log(`Retrieved ${transactions.length} transactions for entity ${entityId}`);
    return transactions;
  } catch (error) {
    console.error(`Error getting transactions for entity ${entityId}:`, error);
    throw error;
  }
}

// Update an existing transaction
export async function updateTransaction(id: string, transactionData: any) {
  try {
    console.log(`Updating transaction in Firestore with ID: ${id}`, transactionData);
    
    // First try to find by our custom ID
    const transactionCollection = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(transactionCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const transactionRef = doc(db, TRANSACTIONS_COLLECTION, firestoreDocId);
      
      // Add updatedAt timestamp
      const updateData = {
        ...transactionData,
        updatedAt: new Date() // Using Date instead of serverTimestamp for better compatibility
      };
      
      await updateDoc(transactionRef, updateData);
      console.log(`Transaction with ID ${id} updated successfully in Firestore`);
      
      // Get the updated document
      const updatedDoc = await getDoc(transactionRef);
      if (updatedDoc.exists()) {
        return { 
          ...updatedDoc.data(), 
          firebaseId: firestoreDocId
        };
      }
    }
    
    console.error(`Transaction with ID ${id} not found in Firestore`);
    return null;
  } catch (error) {
    console.error(`Error updating transaction in Firestore:`, error);
    throw error;
  }
}

// Delete a transaction
export async function deleteTransaction(id: string) {
  try {
    console.log(`Deleting transaction from Firestore with ID: ${id}`);
    
    // First try to find by our custom ID
    const transactionCollection = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(transactionCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const transactionRef = doc(db, TRANSACTIONS_COLLECTION, firestoreDocId);
      
      await deleteDoc(transactionRef);
      console.log(`Transaction with ID ${id} deleted successfully from Firestore`);
      return true;
    }
    
    console.error(`Transaction with ID ${id} not found in Firestore`);
    return false;
  } catch (error) {
    console.error(`Error deleting transaction from Firestore:`, error);
    throw error;
  }
}