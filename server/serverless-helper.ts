// Helper for serverless environments
import { MemStorage } from './storage';

// Initialize storage singleton for serverless environment
// This ensures data persistence between function invocations within the same instance
let serverlessStorage: MemStorage | null = null;

/**
 * Get the storage instance for serverless environments
 * This helps maintain state between function calls on the same instance
 */
export function getServerlessStorage(): MemStorage {
  if (!serverlessStorage) {
    serverlessStorage = new MemStorage();
    
    // Add some initial data for demo purposes
    initializeDemoData(serverlessStorage);
  }
  
  return serverlessStorage;
}

/**
 * Initialize demo data for Vercel deployment
 */
async function initializeDemoData(storage: MemStorage) {
  try {
    // Add sample supplier
    await storage.createSupplier({
      name: "Supplier 1",
      debt: 0,
      contact: "supplier1@example.com"
    });
    
    // Add sample inventory items
    await storage.createInventoryItem({
      type: "chicken",
      quantity: 100,
      rate: 150
    });
    
    await storage.createInventoryItem({
      type: "goat",
      quantity: 50,
      rate: 300
    });
    
    // Add sample customer
    await storage.createCustomer({
      name: "Customer 1",
      type: "hotel",
      contact: "customer1@example.com",
      pendingAmount: 0
    });
    
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}