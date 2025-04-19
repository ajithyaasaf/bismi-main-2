import { v4 as uuidv4 } from 'uuid';
import { 
  User, InsertUser, users,
  Supplier, InsertSupplier, suppliers,
  Inventory, InsertInventory, inventory,
  Customer, InsertCustomer, customers,
  Order, InsertOrder, orders, OrderItem,
  Transaction, InsertTransaction, transactions
} from "@shared/schema";
import { FirebaseStorage } from './firebase-storage';

// Interface with all CRUD operations for our application
export interface IStorage {
  // User operations (kept for compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Supplier operations
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  
  // Inventory operations
  getAllInventory(): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  
  // Transaction operations
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByEntity(entityId: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suppliers: Map<string, Supplier>;
  private inventoryItems: Map<string, Inventory>;
  private customersList: Map<string, Customer>;
  private ordersList: Map<string, Order>;
  private transactionsList: Map<string, Transaction>;
  
  currentId: number;

  constructor() {
    this.users = new Map();
    this.suppliers = new Map();
    this.inventoryItems = new Map();
    this.customersList = new Map();
    this.ordersList = new Map();
    this.transactionsList = new Map();
    this.currentId = 1;
  }

  // User operations (kept for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = uuidv4();
    const newSupplier: Supplier = { 
      ...supplier, 
      id, 
      createdAt: new Date()
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;
    
    const updatedSupplier: Supplier = { 
      ...existingSupplier, 
      ...supplier
    };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Inventory operations
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values());
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const id = uuidv4();
    const newItem: Inventory = { 
      ...item, 
      id, 
      updatedAt: new Date()
    };
    this.inventoryItems.set(id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: Inventory = { 
      ...existingItem, 
      ...item,
      updatedAt: new Date()
    };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customersList.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customersList.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = uuidv4();
    const newCustomer: Customer = { 
      ...customer, 
      id, 
      createdAt: new Date()
    };
    this.customersList.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customersList.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer: Customer = { 
      ...existingCustomer, 
      ...customer
    };
    this.customersList.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customersList.delete(id);
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.ordersList.values());
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.ordersList.values())
      .filter(order => order.customerId === customerId);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.ordersList.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const id = uuidv4();
    const newOrder: Order = { 
      ...order, 
      id
    };
    this.ordersList.set(id, newOrder);
    
    // Update inventory quantities
    for (const item of order.items) {
      const inventoryItem = Array.from(this.inventoryItems.values())
        .find(inv => inv.type === item.type);
      
      if (inventoryItem) {
        const updatedQuantity = inventoryItem.quantity - item.quantity;
        this.updateInventoryItem(inventoryItem.id, { quantity: updatedQuantity > 0 ? updatedQuantity : 0 });
      }
    }
    
    // Update customer pending amount if status is pending
    if (order.status === 'pending') {
      const customer = this.customersList.get(order.customerId);
      if (customer) {
        this.updateCustomer(order.customerId, { 
          pendingAmount: customer.pendingAmount + order.total 
        });
      }
    }
    
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.ordersList.get(id);
    if (!existingOrder) return undefined;
    
    // If status changes from pending to paid, update customer pending amount
    if (existingOrder.status === 'pending' && order.status === 'paid') {
      const customer = this.customersList.get(existingOrder.customerId);
      if (customer) {
        this.updateCustomer(existingOrder.customerId, { 
          pendingAmount: Math.max(0, customer.pendingAmount - existingOrder.total) 
        });
      }
    }
    
    const updatedOrder: Order = { 
      ...existingOrder, 
      ...order
    };
    this.ordersList.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.ordersList.delete(id);
  }

  // Transaction operations
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactionsList.values());
  }

  async getTransactionsByEntity(entityId: string): Promise<Transaction[]> {
    return Array.from(this.transactionsList.values())
      .filter(transaction => transaction.entityId === entityId);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactionsList.get(id);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = uuidv4();
    const newTransaction: Transaction = { 
      ...transaction, 
      id
    };
    this.transactionsList.set(id, newTransaction);
    
    // Update related entities based on transaction type
    if (transaction.entityType === 'supplier' && transaction.type === 'payment') {
      // Payment to supplier - reduce debt
      const supplier = this.suppliers.get(transaction.entityId);
      if (supplier) {
        this.updateSupplier(transaction.entityId, { 
          debt: Math.max(0, supplier.debt - transaction.amount) 
        });
      }
    } else if (transaction.entityType === 'customer' && transaction.type === 'receipt') {
      // Receipt from customer - reduce pending amount
      const customer = this.customersList.get(transaction.entityId);
      if (customer) {
        this.updateCustomer(transaction.entityId, { 
          pendingAmount: Math.max(0, customer.pendingAmount - transaction.amount) 
        });
      }
    }
    
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactionsList.get(id);
    if (!existingTransaction) return undefined;
    
    const updatedTransaction: Transaction = { 
      ...existingTransaction, 
      ...transaction
    };
    this.transactionsList.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactionsList.delete(id);
  }
}

// Use Firebase Storage Implementation
export const storage = new FirebaseStorage();
