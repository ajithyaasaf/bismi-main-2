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

// Collection names
export const COLLECTIONS = {
  SUPPLIERS: 'suppliers',
  INVENTORY: 'inventory',
  CUSTOMERS: 'customers',
  ORDERS: 'orders',
  TRANSACTIONS: 'transactions',
  USERS: 'users'
};

// Generic function to add a document to a collection
export async function addDocument(collectionName: string, data: any) {
  try {
    // Add a custom ID and timestamps
    const documentData = {
      ...data,
      id: uuidv4(),
      createdAt: serverTimestamp()
    };
    
    // Add the document to Firestore
    const docRef = await addDoc(collection(db, collectionName), documentData);
    console.log(`Document added to ${collectionName} with ID: ${docRef.id}`);
    
    // Return the data with the id included
    return documentData;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

// Generic function to get all documents from a collection
export async function getDocuments(collectionName: string) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        firebaseId: doc.id
      };
    });
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

// Generic function to get a document by ID
export async function getDocumentById(collectionName: string, id: string) {
  try {
    // First try to query by our custom ID field
    const q = query(collection(db, collectionName), where("id", "==", id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        ...docData,
        firebaseId: querySnapshot.docs[0].id,
        createdAt: docData.createdAt?.toDate() || new Date()
      };
    }
    
    // If not found by custom ID, try the Firebase document ID
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        firebaseId: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting document by ID from ${collectionName}:`, error);
    throw error;
  }
}

// Generic function to update a document
export async function updateDocument(collectionName: string, id: string, data: any) {
  try {
    // First try to find the document by our custom ID field
    const q = query(collection(db, collectionName), where("id", "==", id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firebaseId = querySnapshot.docs[0].id;
      const docRef = doc(db, collectionName, firebaseId);
      
      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Get the updated document
      const updatedDocSnap = await getDoc(docRef);
      if (updatedDocSnap.exists()) {
        const updatedData = updatedDocSnap.data();
        return {
          ...updatedData,
          firebaseId,
          createdAt: updatedData.createdAt?.toDate() || new Date(),
          updatedAt: updatedData.updatedAt?.toDate() || new Date()
        };
      }
    }
    
    // If not found by custom ID, try the Firebase document ID
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      // Get the updated document
      const updatedDocSnap = await getDoc(docRef);
      if (updatedDocSnap.exists()) {
        const updatedData = updatedDocSnap.data();
        return {
          ...updatedData,
          firebaseId: id,
          createdAt: updatedData.createdAt?.toDate() || new Date(),
          updatedAt: updatedData.updatedAt?.toDate() || new Date()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

// Generic function to delete a document
export async function deleteDocument(collectionName: string, id: string) {
  try {
    // First try to find the document by our custom ID field
    const q = query(collection(db, collectionName), where("id", "==", id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firebaseId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, collectionName, firebaseId));
      return true;
    }
    
    // If not found by custom ID, try the Firebase document ID
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

// Customer-specific functions
export async function addCustomer(customerData: any) {
  return addDocument(COLLECTIONS.CUSTOMERS, customerData);
}

export async function getCustomers() {
  return getDocuments(COLLECTIONS.CUSTOMERS);
}

export async function getCustomerById(id: string) {
  return getDocumentById(COLLECTIONS.CUSTOMERS, id);
}

export async function updateCustomer(id: string, data: any) {
  return updateDocument(COLLECTIONS.CUSTOMERS, id, data);
}

export async function deleteCustomer(id: string) {
  return deleteDocument(COLLECTIONS.CUSTOMERS, id);
}

// Supplier-specific functions
export async function addSupplier(supplierData: any) {
  return addDocument(COLLECTIONS.SUPPLIERS, supplierData);
}

export async function getSuppliers() {
  return getDocuments(COLLECTIONS.SUPPLIERS);
}

export async function getSupplierById(id: string) {
  return getDocumentById(COLLECTIONS.SUPPLIERS, id);
}

export async function updateSupplier(id: string, data: any) {
  return updateDocument(COLLECTIONS.SUPPLIERS, id, data);
}

export async function deleteSupplier(id: string) {
  return deleteDocument(COLLECTIONS.SUPPLIERS, id);
}

// Inventory-specific functions
export async function addInventoryItem(itemData: any) {
  return addDocument(COLLECTIONS.INVENTORY, itemData);
}

export async function getInventoryItems() {
  return getDocuments(COLLECTIONS.INVENTORY);
}

export async function getInventoryItemById(id: string) {
  return getDocumentById(COLLECTIONS.INVENTORY, id);
}

export async function updateInventoryItem(id: string, data: any) {
  return updateDocument(COLLECTIONS.INVENTORY, id, data);
}

export async function deleteInventoryItem(id: string) {
  return deleteDocument(COLLECTIONS.INVENTORY, id);
}

// Order-specific functions
export async function addOrder(orderData: any) {
  return addDocument(COLLECTIONS.ORDERS, orderData);
}

export async function getOrders() {
  return getDocuments(COLLECTIONS.ORDERS);
}

export async function getOrderById(id: string) {
  return getDocumentById(COLLECTIONS.ORDERS, id);
}

export async function updateOrder(id: string, data: any) {
  return updateDocument(COLLECTIONS.ORDERS, id, data);
}

export async function deleteOrder(id: string) {
  return deleteDocument(COLLECTIONS.ORDERS, id);
}

// Transaction-specific functions
export async function addTransaction(transactionData: any) {
  return addDocument(COLLECTIONS.TRANSACTIONS, transactionData);
}

export async function getTransactions() {
  return getDocuments(COLLECTIONS.TRANSACTIONS);
}

export async function getTransactionById(id: string) {
  return getDocumentById(COLLECTIONS.TRANSACTIONS, id);
}

export async function updateTransaction(id: string, data: any) {
  return updateDocument(COLLECTIONS.TRANSACTIONS, id, data);
}

export async function deleteTransaction(id: string) {
  return deleteDocument(COLLECTIONS.TRANSACTIONS, id);
}