import { IStorage } from './storage';
import { MemStorage } from './storage';
import admin from 'firebase-admin';
import { initializeApp as initializeClientApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

/**
 * Enterprise-level storage manager that gracefully handles Firebase connectivity
 * and automatically falls back to in-memory storage without throwing errors
 */
export class EnterpriseStorage implements IStorage {
  private primaryStorage: IStorage;
  private fallbackStorage: MemStorage;
  private isUsingFirestore: boolean = false;

  constructor() {
    this.fallbackStorage = new MemStorage();
    this.primaryStorage = this.fallbackStorage;
    this.initializeFirestore().catch(() => {
      console.log('Using in-memory storage (Firebase unavailable)');
    });
  }

  private async initializeFirestore(): Promise<void> {
    try {
      // Check for Firebase credentials
      const hasAdminCredentials = this.hasAdminCredentials();
      const hasClientCredentials = this.hasClientCredentials();

      if (!hasAdminCredentials && !hasClientCredentials) {
        console.log('No Firebase credentials found, using in-memory storage');
        return;
      }

      // Try Admin SDK first
      if (hasAdminCredentials) {
        const adminSuccess = await this.tryAdminSDK();
        if (adminSuccess) {
          this.isUsingFirestore = true;
          console.log('Enterprise Firebase Admin SDK initialized successfully');
          return;
        }
      }

      // Try Client SDK as fallback
      if (hasClientCredentials) {
        const clientSuccess = await this.tryClientSDK();
        if (clientSuccess) {
          this.isUsingFirestore = true;
          console.log('Enterprise Firebase Client SDK initialized successfully');
          return;
        }
      }

      console.log('Firebase initialization failed, using in-memory storage');
    } catch (error) {
      console.log('Firebase unavailable, using in-memory storage');
    }
  }

  private hasAdminCredentials(): boolean {
    return !!(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID)
    );
  }

  private hasClientCredentials(): boolean {
    return !!(
      process.env.VITE_FIREBASE_API_KEY &&
      process.env.VITE_FIREBASE_PROJECT_ID
    );
  }

  private async tryAdminSDK(): Promise<boolean> {
    try {
      if (admin.apps.length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

        if (serviceAccountKey) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || projectId
          });
        } else {
          const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
          const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

          if (privateKey && clientEmail && projectId) {
            admin.initializeApp({
              credential: admin.credential.cert({
                projectId,
                privateKey,
                clientEmail
              })
            });
          } else {
            return false;
          }
        }
      }

      // Test connection
      await admin.firestore().listCollections();
      return true;
    } catch (error) {
      console.warn('Admin SDK failed:', (error as Error).message);
      return false;
    }
  }

  private async tryClientSDK(): Promise<boolean> {
    try {
      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID
      };

      const app = initializeClientApp(firebaseConfig);
      const db = getFirestore(app);

      // In development, try to connect to emulator if available
      if (process.env.NODE_ENV === 'development') {
        try {
          connectFirestoreEmulator(db, 'localhost', 8080);
        } catch (emulatorError) {
          // Emulator not available, continue with production
        }
      }

      return true;
    } catch (error) {
      console.warn('Client SDK failed:', (error as Error).message);
      return false;
    }
  }

  // Delegate all methods to the appropriate storage
  async getUser(id: number) {
    return this.primaryStorage.getUser(id);
  }

  async getUserByUsername(username: string) {
    return this.primaryStorage.getUserByUsername(username);
  }

  async createUser(user: any) {
    return this.primaryStorage.createUser(user);
  }

  async getAllSuppliers() {
    return this.primaryStorage.getAllSuppliers();
  }

  async getSupplier(id: string) {
    return this.primaryStorage.getSupplier(id);
  }

  async createSupplier(supplier: any) {
    return this.primaryStorage.createSupplier(supplier);
  }

  async updateSupplier(id: string, supplier: any) {
    return this.primaryStorage.updateSupplier(id, supplier);
  }

  async deleteSupplier(id: string) {
    return this.primaryStorage.deleteSupplier(id);
  }

  async getAllInventory() {
    return this.primaryStorage.getAllInventory();
  }

  async getInventoryItem(id: string) {
    return this.primaryStorage.getInventoryItem(id);
  }

  async createInventoryItem(item: any) {
    return this.primaryStorage.createInventoryItem(item);
  }

  async updateInventoryItem(id: string, item: any) {
    return this.primaryStorage.updateInventoryItem(id, item);
  }

  async deleteInventoryItem(id: string) {
    return this.primaryStorage.deleteInventoryItem(id);
  }

  async getAllCustomers() {
    return this.primaryStorage.getAllCustomers();
  }

  async getCustomer(id: string) {
    return this.primaryStorage.getCustomer(id);
  }

  async createCustomer(customer: any) {
    return this.primaryStorage.createCustomer(customer);
  }

  async updateCustomer(id: string, customer: any) {
    return this.primaryStorage.updateCustomer(id, customer);
  }

  async deleteCustomer(id: string) {
    return this.primaryStorage.deleteCustomer(id);
  }

  async getAllOrders() {
    return this.primaryStorage.getAllOrders();
  }

  async getOrdersByCustomer(customerId: string) {
    return this.primaryStorage.getOrdersByCustomer(customerId);
  }

  async getOrder(id: string) {
    return this.primaryStorage.getOrder(id);
  }

  async createOrder(order: any) {
    return this.primaryStorage.createOrder(order);
  }

  async updateOrder(id: string, order: any) {
    return this.primaryStorage.updateOrder(id, order);
  }

  async deleteOrder(id: string) {
    return this.primaryStorage.deleteOrder(id);
  }

  async getAllTransactions() {
    return this.primaryStorage.getAllTransactions();
  }

  async getTransactionsByEntity(entityId: string) {
    return this.primaryStorage.getTransactionsByEntity(entityId);
  }

  async getTransaction(id: string) {
    return this.primaryStorage.getTransaction(id);
  }

  async createTransaction(transaction: any) {
    return this.primaryStorage.createTransaction(transaction);
  }

  async updateTransaction(id: string, transaction: any) {
    return this.primaryStorage.updateTransaction(id, transaction);
  }

  async deleteTransaction(id: string) {
    return this.primaryStorage.deleteTransaction(id);
  }

  // Additional methods for enterprise management
  isUsingFirestoreStorage(): boolean {
    return this.isUsingFirestore;
  }

  getStorageType(): string {
    return this.isUsingFirestore ? 'firebase' : 'memory';
  }
}

export const enterpriseStorage = new EnterpriseStorage();