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

// Collection name for inventory items
const INVENTORY_COLLECTION = 'inventory';

// Add a new inventory item
export async function addInventoryItem(itemData: any) {
  try {
    console.log('Adding inventory item to Firestore:', itemData);
    
    // Add a custom ID and timestamps
    const documentData = {
      ...itemData,
      id: uuidv4(),
      createdAt: new Date() // Using Date instead of serverTimestamp for better compatibility
    };
    
    // Add the document to Firestore directly
    const inventoryCollection = collection(db, INVENTORY_COLLECTION);
    const docRef = await addDoc(inventoryCollection, documentData);
    
    console.log(`Inventory item added to Firestore with ID: ${docRef.id}`);
    
    // Return the data with the id included
    return { ...documentData, firebaseId: docRef.id };
  } catch (error) {
    console.error('Error adding inventory item to Firestore:', error);
    throw error;
  }
}

// Get all inventory items
export async function getInventoryItems() {
  try {
    console.log('Getting all inventory items from Firestore');
    
    const inventoryCollection = collection(db, INVENTORY_COLLECTION);
    const querySnapshot = await getDocs(inventoryCollection);
    
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        firebaseId: doc.id,
        // Convert Firestore timestamp to JS Date if needed
        createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(),
        updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date()
      };
    });
    
    console.log(`Retrieved ${items.length} inventory items from Firestore`);
    return items;
  } catch (error) {
    console.error('Error getting inventory items from Firestore:', error);
    throw error;
  }
}

// Update an existing inventory item
export async function updateInventoryItem(id: string, itemData: any) {
  try {
    console.log(`Updating inventory item in Firestore with ID: ${id}`, itemData);
    
    // First try to find by our custom ID
    const inventoryCollection = collection(db, INVENTORY_COLLECTION);
    const q = query(inventoryCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const itemRef = doc(db, INVENTORY_COLLECTION, firestoreDocId);
      
      // Add updatedAt timestamp
      const updateData = {
        ...itemData,
        updatedAt: new Date() // Using Date instead of serverTimestamp for better compatibility
      };
      
      await updateDoc(itemRef, updateData);
      console.log(`Inventory item with ID ${id} updated successfully in Firestore`);
      
      // Get the updated document
      const updatedDoc = await getDoc(itemRef);
      if (updatedDoc.exists()) {
        return { 
          ...updatedDoc.data(), 
          firebaseId: firestoreDocId
        };
      }
    }
    
    console.error(`Inventory item with ID ${id} not found in Firestore`);
    return null;
  } catch (error) {
    console.error(`Error updating inventory item in Firestore:`, error);
    throw error;
  }
}

// Delete an inventory item
export async function deleteInventoryItem(id: string) {
  try {
    console.log(`Deleting inventory item from Firestore with ID: ${id}`);
    
    // First try to find by our custom ID
    const inventoryCollection = collection(db, INVENTORY_COLLECTION);
    const q = query(inventoryCollection, where('id', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const firestoreDocId = querySnapshot.docs[0].id;
      const itemRef = doc(db, INVENTORY_COLLECTION, firestoreDocId);
      
      await deleteDoc(itemRef);
      console.log(`Inventory item with ID ${id} deleted successfully from Firestore`);
      return true;
    }
    
    console.error(`Inventory item with ID ${id} not found in Firestore`);
    return false;
  } catch (error) {
    console.error(`Error deleting inventory item from Firestore:`, error);
    throw error;
  }
}