import admin from 'firebase-admin';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import {
  IStorage,
  User, InsertUser,
  Supplier, InsertSupplier,
  Inventory, InsertInventory,
  Customer, InsertCustomer,
  Order, InsertOrder,
  Transaction, InsertTransaction
} from './storage';

export class EnterpriseFirestoreStorage implements IStorage {
  private db: any = null;
  private isAdmin = false;
  private isInitialized = false;

  constructor() {
    this.initialize().catch(error => {
      console.warn('Firestore initialization failed:', error.message);
    });
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Try Admin SDK first
      const adminSuccess = await this.initializeAdminSDK();
      if (adminSuccess) {
        this.isInitialized = true;
        return;
      }

      // Try Client SDK as fallback
      const clientSuccess = await this.initializeClientSDK();
      if (clientSuccess) {
        this.isInitialized = true;
        return;
      }

      throw new Error('Both Admin and Client SDK initialization failed');
    } catch (error) {
      console.error('Firestore initialization failed:', error);
      throw error;
    }
  }

  private async initializeAdminSDK(): Promise<boolean> {
    try {
      if (admin.apps.length === 0) {
        // Check for service account credentials
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

        if (serviceAccountKey && projectId) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId
          });
        } else if (projectId) {
          // Try with project ID only (for environments with default credentials)
          admin.initializeApp({ projectId });
        } else {
          return false;
        }
      }

      this.db = admin.firestore();
      this.isAdmin = true;

      // Test connection
      await this.db.listCollections();
      console.log('✅ Firebase Admin SDK initialized successfully');
      return true;
    } catch (error) {
      console.warn('Admin SDK initialization failed:', (error as Error).message);
      return false;
    }
  }

  private async initializeClientSDK(): Promise<boolean> {
    try {
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
      };

      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        return false;
      }

      const app = initializeClientApp(firebaseConfig);
      this.db = getFirestore(app);
      this.isAdmin = false;

      console.log('✅ Firebase Client SDK initialized successfully');
      return true;
    } catch (error) {
      console.warn('Client SDK initialization failed:', (error as Error).message);
      return false;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.db) {
      throw new Error('Firestore is not available');
    }
  }

  // Helper methods for data transformation
  private convertTimestamp(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  }

  private createTimestamp(): any {
    return this.isAdmin ? admin.firestore.Timestamp.now() : Timestamp.now();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      const docRef = this.isAdmin ? 
        this.db.collection('users').doc(id.toString()) :
        doc(this.db, 'users', id.toString());
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return { ...data, id } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('users').where('username', '==', username).get();
        if (snapshot.empty) return undefined;
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: parseInt(doc.id) } as User;
      } else {
        const q = query(collection(this.db, 'users'), where('username', '==', username));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return undefined;
        const docData = snapshot.docs[0];
        return { ...docData.data(), id: parseInt(docData.id) } as User;
      }
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      await this.ensureInitialized();
      const id = Date.now(); // Simple ID generation
      const userData = { ...user, id, createdAt: this.createTimestamp() };
      
      const docRef = this.isAdmin ?
        this.db.collection('users').doc(id.toString()) :
        doc(this.db, 'users', id.toString());
      
      if (this.isAdmin) {
        await docRef.set(userData);
      } else {
        await setDoc(docRef, userData);
      }
      
      return userData as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('suppliers').get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: this.convertTimestamp(doc.data().createdAt)
        }));
      } else {
        const snapshot = await getDocs(collection(this.db, 'suppliers'));
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: this.convertTimestamp(doc.data().createdAt)
        })) as Supplier[];
      }
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('suppliers').doc(id) :
        doc(this.db, 'suppliers', id);
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return {
        ...data,
        id,
        createdAt: this.convertTimestamp(data.createdAt)
      } as Supplier;
    } catch (error) {
      console.error('Error getting supplier:', error);
      return undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      await this.ensureInitialized();
      const id = uuidv4();
      const supplierData = {
        ...supplier,
        id,
        createdAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('suppliers').doc(id) :
        doc(this.db, 'suppliers', id);
      
      if (this.isAdmin) {
        await docRef.set(supplierData);
      } else {
        await setDoc(docRef, supplierData);
      }
      
      return {
        ...supplierData,
        createdAt: this.convertTimestamp(supplierData.createdAt)
      } as Supplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    try {
      await this.ensureInitialized();
      const updateData = {
        ...supplier,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('suppliers').doc(id) :
        doc(this.db, 'suppliers', id);
      
      if (this.isAdmin) {
        await docRef.update(updateData);
        const updated = await docRef.get();
        if (!updated.exists) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          createdAt: this.convertTimestamp(data.createdAt),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Supplier;
      } else {
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        if (!updated.exists()) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          createdAt: this.convertTimestamp(data.createdAt),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Supplier;
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      return undefined;
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('suppliers').doc(id) :
        doc(this.db, 'suppliers', id);
      
      if (this.isAdmin) {
        await docRef.delete();
      } else {
        await deleteDoc(docRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  // Implement remaining methods with similar pattern...
  // For brevity, I'll implement the key ones and the rest follow the same pattern

  async getAllInventory(): Promise<Inventory[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('inventory').get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          updatedAt: this.convertTimestamp(doc.data().updatedAt)
        }));
      } else {
        const snapshot = await getDocs(collection(this.db, 'inventory'));
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          updatedAt: this.convertTimestamp(doc.data().updatedAt)
        })) as Inventory[];
      }
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('inventory').doc(id) :
        doc(this.db, 'inventory', id);
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return {
        ...data,
        id,
        updatedAt: this.convertTimestamp(data.updatedAt)
      } as Inventory;
    } catch (error) {
      console.error('Error getting inventory item:', error);
      return undefined;
    }
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    try {
      await this.ensureInitialized();
      const id = uuidv4();
      const itemData = {
        ...item,
        id,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('inventory').doc(id) :
        doc(this.db, 'inventory', id);
      
      if (this.isAdmin) {
        await docRef.set(itemData);
      } else {
        await setDoc(docRef, itemData);
      }
      
      return {
        ...itemData,
        updatedAt: this.convertTimestamp(itemData.updatedAt)
      } as Inventory;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    try {
      await this.ensureInitialized();
      const updateData = {
        ...item,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('inventory').doc(id) :
        doc(this.db, 'inventory', id);
      
      if (this.isAdmin) {
        await docRef.update(updateData);
        const updated = await docRef.get();
        if (!updated.exists) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Inventory;
      } else {
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        if (!updated.exists()) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Inventory;
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('inventory').doc(id) :
        doc(this.db, 'inventory', id);
      
      if (this.isAdmin) {
        await docRef.delete();
      } else {
        await deleteDoc(docRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  // Customer operations (following same pattern)
  async getAllCustomers(): Promise<Customer[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('customers').get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: this.convertTimestamp(doc.data().createdAt)
        }));
      } else {
        const snapshot = await getDocs(collection(this.db, 'customers'));
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          createdAt: this.convertTimestamp(doc.data().createdAt)
        })) as Customer[];
      }
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('customers').doc(id) :
        doc(this.db, 'customers', id);
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return {
        ...data,
        id,
        createdAt: this.convertTimestamp(data.createdAt)
      } as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      await this.ensureInitialized();
      const id = uuidv4();
      const customerData = {
        ...customer,
        id,
        createdAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('customers').doc(id) :
        doc(this.db, 'customers', id);
      
      if (this.isAdmin) {
        await docRef.set(customerData);
      } else {
        await setDoc(docRef, customerData);
      }
      
      return {
        ...customerData,
        createdAt: this.convertTimestamp(customerData.createdAt)
      } as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      await this.ensureInitialized();
      const updateData = {
        ...customer,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('customers').doc(id) :
        doc(this.db, 'customers', id);
      
      if (this.isAdmin) {
        await docRef.update(updateData);
        const updated = await docRef.get();
        if (!updated.exists) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          createdAt: this.convertTimestamp(data.createdAt),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Customer;
      } else {
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        if (!updated.exists()) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          createdAt: this.convertTimestamp(data.createdAt),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Customer;
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      return undefined;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('customers').doc(id) :
        doc(this.db, 'customers', id);
      
      if (this.isAdmin) {
        await docRef.delete();
      } else {
        await deleteDoc(docRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('orders').get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        }));
      } else {
        const snapshot = await getDocs(collection(this.db, 'orders'));
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        })) as Order[];
      }
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('orders').where('customerId', '==', customerId).get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        }));
      } else {
        const q = query(collection(this.db, 'orders'), where('customerId', '==', customerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        })) as Order[];
      }
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('orders').doc(id) :
        doc(this.db, 'orders', id);
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return {
        ...data,
        id,
        date: this.convertTimestamp(data.date)
      } as Order;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      await this.ensureInitialized();
      const id = uuidv4();
      const orderData = {
        ...order,
        id,
        date: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('orders').doc(id) :
        doc(this.db, 'orders', id);
      
      if (this.isAdmin) {
        await docRef.set(orderData);
      } else {
        await setDoc(docRef, orderData);
      }
      
      return {
        ...orderData,
        date: this.convertTimestamp(orderData.date)
      } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      await this.ensureInitialized();
      const updateData = {
        ...order,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('orders').doc(id) :
        doc(this.db, 'orders', id);
      
      if (this.isAdmin) {
        await docRef.update(updateData);
        const updated = await docRef.get();
        if (!updated.exists) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          date: this.convertTimestamp(data.date),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Order;
      } else {
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        if (!updated.exists()) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          date: this.convertTimestamp(data.date),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Order;
      }
    } catch (error) {
      console.error('Error updating order:', error);
      return undefined;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('orders').doc(id) :
        doc(this.db, 'orders', id);
      
      if (this.isAdmin) {
        await docRef.delete();
      } else {
        await deleteDoc(docRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('transactions').get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        }));
      } else {
        const snapshot = await getDocs(collection(this.db, 'transactions'));
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        })) as Transaction[];
      }
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async getTransactionsByEntity(entityId: string): Promise<Transaction[]> {
    try {
      await this.ensureInitialized();
      
      if (this.isAdmin) {
        const snapshot = await this.db.collection('transactions').where('entityId', '==', entityId).get();
        return snapshot.docs.map((doc: any) => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        }));
      } else {
        const q = query(collection(this.db, 'transactions'), where('entityId', '==', entityId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: this.convertTimestamp(doc.data().date)
        })) as Transaction[];
      }
    } catch (error) {
      console.error('Error getting transactions by entity:', error);
      return [];
    }
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('transactions').doc(id) :
        doc(this.db, 'transactions', id);
      
      const docSnap = this.isAdmin ? await docRef.get() : await getDoc(docRef);
      
      if (!docSnap.exists) return undefined;
      const data = docSnap.data();
      return {
        ...data,
        id,
        date: this.convertTimestamp(data.date)
      } as Transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return undefined;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      await this.ensureInitialized();
      const id = uuidv4();
      const transactionData = {
        ...transaction,
        id,
        date: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('transactions').doc(id) :
        doc(this.db, 'transactions', id);
      
      if (this.isAdmin) {
        await docRef.set(transactionData);
      } else {
        await setDoc(docRef, transactionData);
      }
      
      return {
        ...transactionData,
        date: this.convertTimestamp(transactionData.date)
      } as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      await this.ensureInitialized();
      const updateData = {
        ...transaction,
        updatedAt: this.createTimestamp()
      };
      
      const docRef = this.isAdmin ?
        this.db.collection('transactions').doc(id) :
        doc(this.db, 'transactions', id);
      
      if (this.isAdmin) {
        await docRef.update(updateData);
        const updated = await docRef.get();
        if (!updated.exists) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          date: this.convertTimestamp(data.date),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Transaction;
      } else {
        await updateDoc(docRef, updateData);
        const updated = await getDoc(docRef);
        if (!updated.exists()) return undefined;
        const data = updated.data();
        return {
          ...data,
          id,
          date: this.convertTimestamp(data.date),
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Transaction;
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      return undefined;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const docRef = this.isAdmin ?
        this.db.collection('transactions').doc(id) :
        doc(this.db, 'transactions', id);
      
      if (this.isAdmin) {
        await docRef.delete();
      } else {
        await deleteDoc(docRef);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }
}

export const enterpriseFirestoreStorage = new EnterpriseFirestoreStorage();