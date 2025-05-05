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

// Collection name for orders
const ORDERS_COLLECTION = 'orders';

// Add a new order
export async function addOrder(orderData: any) {
  try {
    console.log('Adding order to Firestore:', orderData);
    
    // Add a custom ID and timestamps
    const documentData = {
      ...orderData,
      id: uuidv4(),
      createdAt: new Date(), // Using Date instead of serverTimestamp for better compatibility
      date: orderData.date || new Date()
    };
    
    // Add the document to Firestore directly
    const orderCollection = collection(db, ORDERS_COLLECTION);
    const docRef = await addDoc(orderCollection, documentData);
    
    console.log(`Order added to Firestore with ID: ${docRef.id}`);
    
    // Return the data with the id included
    return { ...documentData, firebaseId: docRef.id };
  } catch (error) {
    console.error('Error adding order to Firestore:', error);
    throw error;
  }
}

// Get all orders
export async function getOrders() {
  try {
    console.log('Getting all orders from Firestore');
    
    const orderCollection = collection(db, ORDERS_COLLECTION);
    const querySnapshot = await getDocs(orderCollection);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        date: data.date instanceof Date ? data.date : new Date()
      };
    });
    
    console.log(`Retrieved ${orders.length} orders from Firestore`);
    return orders;
  } catch (error) {
    console.error('Error getting orders from Firestore:', error);
    throw error;
  }
}

// Get orders by customer ID
export async function getOrdersByCustomer(customerId: string) {
  try {
    console.log(`Getting orders for customer with ID: ${customerId}`);
    
    const orderCollection = collection(db, ORDERS_COLLECTION);
    const q = query(orderCollection, where('customerId', '==', customerId));
    const querySnapshot = await getDocs(q);
    
    const orders = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        date: data.date instanceof Date ? data.date : new Date()
      };
    });
    
    console.log(`Retrieved ${orders.length} orders for customer ${customerId}`);
    return orders;
  } catch (error) {
    console.error(`Error getting orders for customer ${customerId}:`, error);
    throw error;
  }
}

// Update an existing order
export async function updateOrder(id: string, orderData: any) {
  try {
    console.log(`Updating order in Firestore with ID: ${id}`, orderData);
    
    // First try to find by our custom ID
    const orderCollection = collection(db, ORDERS_COLLECTION);
    const q = query(orderCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const orderRef = doc(db, ORDERS_COLLECTION, firestoreDocId);
      
      // Add updatedAt timestamp
      const updateData = {
        ...orderData,
        updatedAt: new Date() // Using Date instead of serverTimestamp for better compatibility
      };
      
      await updateDoc(orderRef, updateData);
      console.log(`Order with ID ${id} updated successfully in Firestore`);
      
      // Get the updated document
      const updatedDoc = await getDoc(orderRef);
      if (updatedDoc.exists()) {
        return { 
          ...updatedDoc.data(), 
          firebaseId: firestoreDocId
        };
      }
    }
    
    console.error(`Order with ID ${id} not found in Firestore`);
    return null;
  } catch (error) {
    console.error(`Error updating order in Firestore:`, error);
    throw error;
  }
}

// Delete an order
export async function deleteOrder(id: string) {
  try {
    console.log(`Deleting order from Firestore with ID: ${id}`);
    
    // First try to find by our custom ID
    const orderCollection = collection(db, ORDERS_COLLECTION);
    const q = query(orderCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const orderRef = doc(db, ORDERS_COLLECTION, firestoreDocId);
      
      await deleteDoc(orderRef);
      console.log(`Order with ID ${id} deleted successfully from Firestore`);
      return true;
    }
    
    console.error(`Order with ID ${id} not found in Firestore`);
    return false;
  } catch (error) {
    console.error(`Error deleting order from Firestore:`, error);
    throw error;
  }
}