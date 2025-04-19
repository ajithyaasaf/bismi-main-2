import { v4 as uuidv4 } from 'uuid';
import { 
  User, InsertUser,
  Supplier, InsertSupplier,
  Inventory, InsertInventory,
  Customer, InsertCustomer,
  Order, InsertOrder, OrderItem,
  Transaction, InsertTransaction
} from "@shared/schema";
import { IStorage } from "./storage";

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, remove, update, get, query, orderByChild, equalTo } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3f4gJOKZDIjy9gnhSSpMVLs1UblGxo0s",
  authDomain: "bismi-broilers-3ca96.firebaseapp.com",
  databaseURL: "https://bismi-broilers-3ca96-default-rtdb.firebaseio.com",
  projectId: "bismi-broilers-3ca96",
  storageBucket: "bismi-broilers-3ca96.firebasestorage.app",
  messagingSenderId: "949430744092",
  appId: "1:949430744092:web:4ea5638a9d38ba3e76dbd9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Firebase storage implementation
export class FirebaseStorage implements IStorage {
  
  // Helper methods
  private async getData<T>(path: string): Promise<T[]> {
    const dbRef = ref(database, path);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) as T[];
    }
    
    return [];
  }
  
  private async getDataById<T>(path: string, id: string): Promise<T | undefined> {
    const dbRef = ref(database, `${path}/${id}`);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      return {
        id,
        ...snapshot.val()
      } as T;
    }
    
    return undefined;
  }
  
  private async queryData<T>(path: string, field: string, value: string): Promise<T[]> {
    const dbRef = ref(database, path);
    const q = query(dbRef, orderByChild(field), equalTo(value));
    const snapshot = await get(q);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) as T[];
    }
    
    return [];
  }
  
  private async createData<T>(path: string, data: any): Promise<T> {
    const dbRef = ref(database, path);
    const newRef = push(dbRef);
    await set(newRef, data);
    return {
      id: newRef.key,
      ...data
    } as T;
  }
  
  private async updateData<T>(path: string, id: string, data: any): Promise<T | undefined> {
    const itemRef = ref(database, `${path}/${id}`);
    const snapshot = await get(itemRef);
    
    if (!snapshot.exists()) {
      return undefined;
    }
    
    const existingData = snapshot.val();
    const updatedData = { ...existingData, ...data };
    await update(itemRef, updatedData);
    
    return {
      id,
      ...updatedData
    } as T;
  }
  
  private async deleteData(path: string, id: string): Promise<boolean> {
    const itemRef = ref(database, `${path}/${id}`);
    try {
      await remove(itemRef);
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  }
  
  // USER OPERATIONS
  
  async getUser(id: number): Promise<User | undefined> {
    return this.getDataById<User>('users', id.toString());
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.queryData<User>('users', 'username', username);
    return users.length > 0 ? users[0] : undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    return this.createData<User>('users', insertUser);
  }
  
  // SUPPLIER OPERATIONS
  
  async getAllSuppliers(): Promise<Supplier[]> {
    return this.getData<Supplier>('suppliers');
  }
  
  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.getDataById<Supplier>('suppliers', id);
  }
  
  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    return this.createData<Supplier>('suppliers', supplier);
  }
  
  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    return this.updateData<Supplier>('suppliers', id, supplier);
  }
  
  async deleteSupplier(id: string): Promise<boolean> {
    return this.deleteData('suppliers', id);
  }
  
  // INVENTORY OPERATIONS
  
  async getAllInventory(): Promise<Inventory[]> {
    return this.getData<Inventory>('inventory');
  }
  
  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.getDataById<Inventory>('inventory', id);
  }
  
  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    return this.createData<Inventory>('inventory', item);
  }
  
  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    return this.updateData<Inventory>('inventory', id, item);
  }
  
  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.deleteData('inventory', id);
  }
  
  // CUSTOMER OPERATIONS
  
  async getAllCustomers(): Promise<Customer[]> {
    return this.getData<Customer>('customers');
  }
  
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.getDataById<Customer>('customers', id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return this.createData<Customer>('customers', customer);
  }
  
  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    return this.updateData<Customer>('customers', id, customer);
  }
  
  async deleteCustomer(id: string): Promise<boolean> {
    return this.deleteData('customers', id);
  }
  
  // ORDER OPERATIONS
  
  async getAllOrders(): Promise<Order[]> {
    return this.getData<Order>('orders');
  }
  
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return this.queryData<Order>('orders', 'customerId', customerId);
  }
  
  async getOrder(id: string): Promise<Order | undefined> {
    return this.getDataById<Order>('orders', id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder = await this.createData<Order>('orders', order);
    
    // Update inventory levels
    for (const item of order.items) {
      const inventoryItem = await this.getInventoryItem(item.itemId);
      if (inventoryItem) {
        const newQuantity = inventoryItem.quantity - item.quantity;
        await this.updateInventoryItem(item.itemId, { quantity: newQuantity });
      }
    }
    
    // If it's a pending order, update customer's pending amount
    if (order.status === 'pending') {
      const customer = await this.getCustomer(order.customerId);
      if (customer && order.total !== undefined) {
        const newPendingAmount = customer.pendingAmount + order.total;
        await this.updateCustomer(order.customerId, { pendingAmount: newPendingAmount });
      }
    }
    
    return newOrder;
  }
  
  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = await this.getOrder(id);
    if (!existingOrder) {
      return undefined;
    }
    
    // Handle payment status change
    if (order.status && order.status !== existingOrder.status) {
      if (order.status === 'paid' && existingOrder.status === 'pending') {
        // Update customer's pending amount when order status changes from pending to paid
        const customer = await this.getCustomer(existingOrder.customerId);
        if (customer && existingOrder.total !== undefined) {
          const newPendingAmount = Math.max(0, customer.pendingAmount - existingOrder.total);
          await this.updateCustomer(existingOrder.customerId, { pendingAmount: newPendingAmount });
        }
      } else if (order.status === 'pending' && existingOrder.status === 'paid') {
        // Update customer's pending amount when order status changes from paid to pending
        const customer = await this.getCustomer(existingOrder.customerId);
        if (customer && existingOrder.total !== undefined) {
          const newPendingAmount = customer.pendingAmount + existingOrder.total;
          await this.updateCustomer(existingOrder.customerId, { pendingAmount: newPendingAmount });
        }
      }
    }
    
    return this.updateData<Order>('orders', id, order);
  }
  
  async deleteOrder(id: string): Promise<boolean> {
    return this.deleteData('orders', id);
  }
  
  // TRANSACTION OPERATIONS
  
  async getAllTransactions(): Promise<Transaction[]> {
    return this.getData<Transaction>('transactions');
  }
  
  async getTransactionsByEntity(entityId: string): Promise<Transaction[]> {
    return this.queryData<Transaction>('transactions', 'entityId', entityId);
  }
  
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.getDataById<Transaction>('transactions', id);
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const newTransaction = await this.createData<Transaction>('transactions', transaction);
    
    // Update supplier debt or customer pending amount
    if (transaction.entityType === 'supplier') {
      const supplier = await this.getSupplier(transaction.entityId);
      if (supplier) {
        let newDebt = supplier.debt;
        if (transaction.type === 'payment') {
          // Payment to supplier reduces debt
          newDebt = Math.max(0, supplier.debt - transaction.amount);
        }
        await this.updateSupplier(transaction.entityId, { debt: newDebt });
      }
    } else if (transaction.entityType === 'customer') {
      const customer = await this.getCustomer(transaction.entityId);
      if (customer) {
        let newPendingAmount = customer.pendingAmount;
        if (transaction.type === 'receipt') {
          // Receipt from customer reduces pending amount
          newPendingAmount = Math.max(0, customer.pendingAmount - transaction.amount);
        }
        await this.updateCustomer(transaction.entityId, { pendingAmount: newPendingAmount });
      }
    }
    
    return newTransaction;
  }
  
  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return this.updateData<Transaction>('transactions', id, transaction);
  }
  
  async deleteTransaction(id: string): Promise<boolean> {
    return this.deleteData('transactions', id);
  }
}