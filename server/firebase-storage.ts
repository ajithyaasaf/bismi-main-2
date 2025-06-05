import { IStorage } from './storage';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  type Firestore 
} from 'firebase/firestore';
import { 
  User, 
  InsertUser, 
  Supplier, 
  InsertSupplier, 
  Inventory, 
  InsertInventory, 
  Customer, 
  InsertCustomer, 
  Order, 
  InsertOrder, 
  Transaction, 
  InsertTransaction 
} from '@shared/schema';
import { v4 as uuidv4 } from 'uuid';

export class FirebaseStorage implements IStorage {
  private db: Firestore;

  constructor() {
    const firebaseConfig = {
      apiKey: "AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s",
      authDomain: "bismi-broilers-3ca96.firebaseapp.com",
      databaseURL: "https://bismi-broilers-3ca96-default-rtdb.firebaseio.com",
      projectId: "bismi-broilers-3ca96",
      storageBucket: "bismi-broilers-3ca96.firebasestorage.app",
      messagingSenderId: "949430744092",
      appId: "1:949430744092:web:4ea5638a9d38ba3e76dbd9"
    };

    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    console.log('Firebase Storage initialized with project:', firebaseConfig.projectId);
  }

  // Helper to convert Firestore timestamp to Date
  private convertTimestamp(timestamp: any): Date {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // User operations (kept for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    try {
      const userQuery = query(collection(this.db, 'users'), where('id', '==', id));
      const snapshot = await getDocs(userQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        username: data.username,
        password: data.password
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const userQuery = query(collection(this.db, 'users'), where('username', '==', username));
      const snapshot = await getDocs(userQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        username: data.username,
        password: data.password
      } as User;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const newUser = {
        id: Math.floor(Math.random() * 1000000),
        ...user
      };
      await addDoc(collection(this.db, 'users'), newUser);
      return newUser as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const snapshot = await getDocs(collection(this.db, 'suppliers'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          contact: data.contact,
          debt: data.debt || 0,
          createdAt: this.convertTimestamp(data.createdAt)
        } as Supplier;
      });
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    try {
      const supplierQuery = query(collection(this.db, 'suppliers'), where('id', '==', id));
      const snapshot = await getDocs(supplierQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        contact: data.contact,
        debt: data.debt || 0,
        createdAt: this.convertTimestamp(data.createdAt)
      } as Supplier;
    } catch (error) {
      console.error('Error getting supplier:', error);
      return undefined;
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    try {
      const newSupplier = {
        id: uuidv4(),
        ...supplier,
        debt: supplier.debt || 0,
        createdAt: Timestamp.now()
      };
      await addDoc(collection(this.db, 'suppliers'), newSupplier);
      return {
        ...newSupplier,
        createdAt: new Date()
      } as Supplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    try {
      const supplierQuery = query(collection(this.db, 'suppliers'), where('id', '==', id));
      const snapshot = await getDocs(supplierQuery);
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, supplier);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();
      return {
        id: data!.id,
        name: data!.name,
        contact: data!.contact,
        debt: data!.debt || 0,
        createdAt: this.convertTimestamp(data!.createdAt)
      } as Supplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      return undefined;
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const supplierQuery = query(collection(this.db, 'suppliers'), where('id', '==', id));
      const snapshot = await getDocs(supplierQuery);
      if (snapshot.empty) return false;
      
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return false;
    }
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    try {
      const snapshot = await getDocs(collection(this.db, 'inventory'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          type: data.type,
          quantity: data.quantity,
          rate: data.rate,
          updatedAt: this.convertTimestamp(data.updatedAt)
        } as Inventory;
      });
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    try {
      const inventoryQuery = query(collection(this.db, 'inventory'), where('id', '==', id));
      const snapshot = await getDocs(inventoryQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        type: data.type,
        quantity: data.quantity,
        rate: data.rate,
        updatedAt: this.convertTimestamp(data.updatedAt)
      } as Inventory;
    } catch (error) {
      console.error('Error getting inventory item:', error);
      return undefined;
    }
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    try {
      const newItem = {
        id: uuidv4(),
        ...item,
        updatedAt: Timestamp.now()
      };
      await addDoc(collection(this.db, 'inventory'), newItem);
      return {
        ...newItem,
        updatedAt: new Date()
      } as Inventory;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    try {
      const inventoryQuery = query(collection(this.db, 'inventory'), where('id', '==', id));
      const snapshot = await getDocs(inventoryQuery);
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, { ...item, updatedAt: Timestamp.now() });
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();
      return {
        id: data!.id,
        type: data!.type,
        quantity: data!.quantity,
        rate: data!.rate,
        updatedAt: this.convertTimestamp(data!.updatedAt)
      } as Inventory;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return undefined;
    }
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      const inventoryQuery = query(collection(this.db, 'inventory'), where('id', '==', id));
      const snapshot = await getDocs(inventoryQuery);
      if (snapshot.empty) return false;
      
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const snapshot = await getDocs(collection(this.db, 'customers'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          type: data.type,
          contact: data.contact,
          pendingAmount: data.pendingAmount || 0,
          createdAt: this.convertTimestamp(data.createdAt)
        } as Customer;
      });
    } catch (error) {
      console.error('Error getting customers:', error);
      return [];
    }
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const customerQuery = query(collection(this.db, 'customers'), where('id', '==', id));
      const snapshot = await getDocs(customerQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        type: data.type,
        contact: data.contact,
        pendingAmount: data.pendingAmount || 0,
        createdAt: this.convertTimestamp(data.createdAt)
      } as Customer;
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      const newCustomer = {
        id: uuidv4(),
        ...customer,
        pendingAmount: customer.pendingAmount || 0,
        createdAt: Timestamp.now()
      };
      await addDoc(collection(this.db, 'customers'), newCustomer);
      return {
        ...newCustomer,
        createdAt: new Date()
      } as Customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      const customerQuery = query(collection(this.db, 'customers'), where('id', '==', id));
      const snapshot = await getDocs(customerQuery);
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, customer);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();
      return {
        id: data!.id,
        name: data!.name,
        type: data!.type,
        contact: data!.contact,
        pendingAmount: data!.pendingAmount || 0,
        createdAt: this.convertTimestamp(data!.createdAt)
      } as Customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      return undefined;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const customerQuery = query(collection(this.db, 'customers'), where('id', '==', id));
      const snapshot = await getDocs(customerQuery);
      if (snapshot.empty) return false;
      
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    try {
      const snapshot = await getDocs(query(collection(this.db, 'orders'), orderBy('date', 'desc')));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          customerId: data.customerId,
          items: data.items,
          date: this.convertTimestamp(data.date),
          total: data.total,
          status: data.status,
          type: data.type
        } as Order;
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const orderQuery = query(
        collection(this.db, 'orders'), 
        where('customerId', '==', customerId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(orderQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          customerId: data.customerId,
          items: data.items,
          date: this.convertTimestamp(data.date),
          total: data.total,
          status: data.status,
          type: data.type
        } as Order;
      });
    } catch (error) {
      console.error('Error getting orders by customer:', error);
      return [];
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    try {
      const orderQuery = query(collection(this.db, 'orders'), where('id', '==', id));
      const snapshot = await getDocs(orderQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        customerId: data.customerId,
        items: data.items,
        date: this.convertTimestamp(data.date),
        total: data.total,
        status: data.status,
        type: data.type
      } as Order;
    } catch (error) {
      console.error('Error getting order:', error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const orderDate = order.date ? Timestamp.fromDate(new Date(order.date)) : Timestamp.now();
      const newOrder = {
        id: uuidv4(),
        ...order,
        date: orderDate
      };
      await addDoc(collection(this.db, 'orders'), newOrder);
      return {
        ...newOrder,
        date: order.date ? new Date(order.date) : new Date()
      } as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    try {
      const orderQuery = query(collection(this.db, 'orders'), where('id', '==', id));
      const snapshot = await getDocs(orderQuery);
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      const updateData = { ...order };
      
      // Preserve date if provided, don't override with current timestamp
      if (order.date) {
        updateData.date = Timestamp.fromDate(new Date(order.date));
      }
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();
      return {
        id: data!.id,
        customerId: data!.customerId,
        items: data!.items,
        date: this.convertTimestamp(data!.date),
        total: data!.total,
        status: data!.status,
        type: data!.type
      } as Order;
    } catch (error) {
      console.error('Error updating order:', error);
      return undefined;
    }
  }

  async deleteOrder(id: string): Promise<boolean> {
    try {
      const orderQuery = query(collection(this.db, 'orders'), where('id', '==', id));
      const snapshot = await getDocs(orderQuery);
      if (snapshot.empty) return false;
      
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(query(collection(this.db, 'transactions'), orderBy('date', 'desc')));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          type: data.type,
          amount: data.amount,
          entityId: data.entityId,
          entityType: data.entityType,
          date: this.convertTimestamp(data.date),
          description: data.description
        } as Transaction;
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async getTransactionsByEntity(entityId: string): Promise<Transaction[]> {
    try {
      const transactionQuery = query(
        collection(this.db, 'transactions'), 
        where('entityId', '==', entityId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(transactionQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          type: data.type,
          amount: data.amount,
          entityId: data.entityId,
          entityType: data.entityType,
          date: this.convertTimestamp(data.date),
          description: data.description
        } as Transaction;
      });
    } catch (error) {
      console.error('Error getting transactions by entity:', error);
      return [];
    }
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      const transactionQuery = query(collection(this.db, 'transactions'), where('id', '==', id));
      const snapshot = await getDocs(transactionQuery);
      if (snapshot.empty) return undefined;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: data.id,
        type: data.type,
        amount: data.amount,
        entityId: data.entityId,
        entityType: data.entityType,
        date: this.convertTimestamp(data.date),
        description: data.description
      } as Transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return undefined;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const transactionDate = transaction.date ? Timestamp.fromDate(new Date(transaction.date)) : Timestamp.now();
      const newTransaction = {
        id: uuidv4(),
        ...transaction,
        date: transactionDate
      };
      await addDoc(collection(this.db, 'transactions'), newTransaction);
      return {
        ...newTransaction,
        date: transaction.date ? new Date(transaction.date) : new Date()
      } as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    try {
      const transactionQuery = query(collection(this.db, 'transactions'), where('id', '==', id));
      const snapshot = await getDocs(transactionQuery);
      if (snapshot.empty) return undefined;
      
      const docRef = snapshot.docs[0].ref;
      await updateDoc(docRef, transaction);
      
      const updatedDoc = await getDoc(docRef);
      const data = updatedDoc.data();
      return {
        id: data!.id,
        type: data!.type,
        amount: data!.amount,
        entityId: data!.entityId,
        entityType: data!.entityType,
        date: this.convertTimestamp(data!.date),
        description: data!.description
      } as Transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return undefined;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const transactionQuery = query(collection(this.db, 'transactions'), where('id', '==', id));
      const snapshot = await getDocs(transactionQuery);
      if (snapshot.empty) return false;
      
      await deleteDoc(snapshot.docs[0].ref);
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }
}

export const firebaseStorage = new FirebaseStorage();