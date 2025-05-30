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
  serverTimestamp,
  setLogLevel
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import * as OrderService from './order-service';

// Enable Firestore logs in development to help debug
if (import.meta.env.DEV) {
  setLogLevel('debug');
}

// Collection name for customers
const CUSTOMERS_COLLECTION = 'customers';

// Add a new customer
export async function addCustomer(customerData: any) {
  try {
    console.log('Adding customer to Firestore:', customerData);
    
    // Add a custom ID and timestamps
    const documentData = {
      ...customerData,
      id: uuidv4(),
      createdAt: new Date() // Using Date instead of serverTimestamp for better compatibility
    };
    
    // Add the document to Firestore directly
    const customerCollection = collection(db, CUSTOMERS_COLLECTION);
    const docRef = await addDoc(customerCollection, documentData);
    
    console.log(`Customer added to Firestore with ID: ${docRef.id}`);
    
    // Return the data with the id included
    return { ...documentData, firebaseId: docRef.id };
  } catch (error) {
    console.error('Error adding customer to Firestore:', error);
    throw error;
  }
}

// Get all customers
export async function getCustomers() {
  try {
    console.log('Getting all customers from Firestore');
    
    const customerCollection = collection(db, CUSTOMERS_COLLECTION);
    const querySnapshot = await getDocs(customerCollection);
    
    const customers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date()
      };
    });
    
    console.log(`Retrieved ${customers.length} customers from Firestore`);
    return customers;
  } catch (error) {
    console.error('Error getting customers from Firestore:', error);
    throw error;
  }
}

// Update an existing customer
export async function updateCustomer(id: string, customerData: any) {
  try {
    console.log(`Updating customer in Firestore with ID: ${id}`, customerData);
    
    // First try to find by our custom ID
    const customerCollection = collection(db, CUSTOMERS_COLLECTION);
    const q = query(customerCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const customerRef = doc(db, CUSTOMERS_COLLECTION, firestoreDocId);
      
      // Add updatedAt timestamp
      const updateData = {
        ...customerData,
        updatedAt: new Date() // Using Date instead of serverTimestamp for better compatibility
      };
      
      await updateDoc(customerRef, updateData);
      console.log(`Customer with ID ${id} updated successfully in Firestore`);
      
      // Get the updated document
      const updatedDoc = await getDoc(customerRef);
      if (updatedDoc.exists()) {
        return { 
          ...updatedDoc.data(), 
          firebaseId: firestoreDocId
        };
      }
    }
    
    console.error(`Customer with ID ${id} not found in Firestore`);
    return null;
  } catch (error) {
    console.error(`Error updating customer in Firestore:`, error);
    throw error;
  }
}

// Get a customer by ID
export async function getCustomerById(id: string) {
  try {
    console.log(`Getting customer from Firestore with ID: ${id}`);
    
    // First try to find by our custom ID
    const customerCollection = collection(db, CUSTOMERS_COLLECTION);
    const q = query(customerCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date()
      };
    }
    
    console.error(`Customer with ID ${id} not found in Firestore`);
    return null;
  } catch (error) {
    console.error(`Error getting customer from Firestore:`, error);
    throw error;
  }
}

// Recalculate a customer's pending amount based on their pending orders
export async function recalculateCustomerPendingAmount(customerId: string) {
  try {
    console.log(`Recalculating pending amount for customer with ID: ${customerId}`);
    
    // Get all orders for this customer
    const customerOrders = await OrderService.getOrdersByCustomer(customerId);
    
    // Calculate total pending amount by summing all pending orders
    const pendingAmount = customerOrders
      .filter(order => {
        // Check if the order has the required properties
        return order && 
               typeof order === 'object' && 
               'status' in order &&
               typeof order.status === 'string' &&
               order.status !== 'paid';
      })
      .reduce((sum, order) => {
        // Safely extract total value with type checking
        let orderTotal = 0;
        if (order && 
            typeof order === 'object' && 
            'total' in order) {
          orderTotal = typeof order.total === 'number' ? order.total : 0;
        }
        return sum + orderTotal;
      }, 0);
    
    console.log(`Calculated pending amount for customer ${customerId}: ${pendingAmount}`);
    
    // Update the customer with the new pending amount
    const updateResult = await updateCustomer(customerId, { pendingAmount });
    
    return updateResult;
  } catch (error) {
    console.error(`Error recalculating pending amount for customer ${customerId}:`, error);
    throw error;
  }
}

// Delete a customer
export async function deleteCustomer(id: string) {
  try {
    console.log(`Deleting customer from Firestore with ID: ${id}`);
    
    // First try to find by our custom ID
    const customerCollection = collection(db, CUSTOMERS_COLLECTION);
    const q = query(customerCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const customerRef = doc(db, CUSTOMERS_COLLECTION, firestoreDocId);
      
      await deleteDoc(customerRef);
      console.log(`Customer with ID ${id} deleted successfully from Firestore`);
      return true;
    }
    
    console.error(`Customer with ID ${id} not found in Firestore`);
    return false;
  } catch (error) {
    console.error(`Error deleting customer from Firestore:`, error);
    throw error;
  }
}