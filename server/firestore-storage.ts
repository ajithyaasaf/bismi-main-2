import { IStorage } from './storage';
import {
  User, InsertUser,
  Supplier, InsertSupplier,
  Inventory, InsertInventory,
  Customer, InsertCustomer,
  Order, InsertOrder,
  Transaction, InsertTransaction
} from '../shared/schema';
import firestore, { COLLECTIONS } from './firestore';

/**
 * Implementation of the IStorage interface using Firestore
 */
export class FirestoreStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const userDoc = await firestore.getDocumentById<User>(COLLECTIONS.USERS, id.toString());
    return userDoc;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await firestore.queryDocuments<User>(COLLECTIONS.USERS, 'username', '==', username);
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    return firestore.createDocument<User>(COLLECTIONS.USERS, user);
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    return firestore.getAllDocuments<Supplier>(COLLECTIONS.SUPPLIERS);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return firestore.getDocumentById<Supplier>(COLLECTIONS.SUPPLIERS, id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    return firestore.createDocument<Supplier>(COLLECTIONS.SUPPLIERS, supplier);
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    return firestore.updateDocument<Supplier>(COLLECTIONS.SUPPLIERS, id, supplier);
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return firestore.deleteDocument(COLLECTIONS.SUPPLIERS, id);
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    return firestore.getAllDocuments<Inventory>(COLLECTIONS.INVENTORY);
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return firestore.getDocumentById<Inventory>(COLLECTIONS.INVENTORY, id);
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    return firestore.createDocument<Inventory>(COLLECTIONS.INVENTORY, item);
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    return firestore.updateDocument<Inventory>(COLLECTIONS.INVENTORY, id, item);
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return firestore.deleteDocument(COLLECTIONS.INVENTORY, id);
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return firestore.getAllDocuments<Customer>(COLLECTIONS.CUSTOMERS);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return firestore.getDocumentById<Customer>(COLLECTIONS.CUSTOMERS, id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return firestore.createDocument<Customer>(COLLECTIONS.CUSTOMERS, customer);
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    return firestore.updateDocument<Customer>(COLLECTIONS.CUSTOMERS, id, customer);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return firestore.deleteDocument(COLLECTIONS.CUSTOMERS, id);
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return firestore.getAllDocuments<Order>(COLLECTIONS.ORDERS);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return firestore.queryDocuments<Order>(COLLECTIONS.ORDERS, 'customerId', '==', customerId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return firestore.getDocumentById<Order>(COLLECTIONS.ORDERS, id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return firestore.createDocument<Order>(COLLECTIONS.ORDERS, order);
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    return firestore.updateDocument<Order>(COLLECTIONS.ORDERS, id, order);
  }

  async deleteOrder(id: string): Promise<boolean> {
    return firestore.deleteDocument(COLLECTIONS.ORDERS, id);
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    return firestore.getAllDocuments<Transaction>(COLLECTIONS.TRANSACTIONS);
  }

  async getTransactionsByEntity(entityId: string): Promise<Transaction[]> {
    return firestore.queryDocuments<Transaction>(COLLECTIONS.TRANSACTIONS, 'entityId', '==', entityId);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return firestore.getDocumentById<Transaction>(COLLECTIONS.TRANSACTIONS, id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    return firestore.createDocument<Transaction>(COLLECTIONS.TRANSACTIONS, transaction);
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return firestore.updateDocument<Transaction>(COLLECTIONS.TRANSACTIONS, id, transaction);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return firestore.deleteDocument(COLLECTIONS.TRANSACTIONS, id);
  }
}

// Export an instance of FirestoreStorage
export const firestoreStorage = new FirestoreStorage();