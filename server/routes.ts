import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import storageManager from "./storage-manager";
import { v4 as uuidv4 } from 'uuid';
import { 
  insertSupplierSchema, 
  insertInventorySchema, 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertTransactionSchema 
} from "@shared/schema";
import { z } from "zod";

// Enterprise-level storage manager initialization
let storageInstance: any = null;

async function getStorage() {
  if (!storageInstance) {
    storageInstance = await storageManager.initialize();
  }
  return storageInstance;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Health check endpoint
  apiRouter.get("/health", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const status = await storageManager.getStorageStatus();
      res.json({
        status: "healthy",
        storage: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Supplier routes
  apiRouter.get("/suppliers", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const suppliers = await storage.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  apiRouter.get("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to fetch supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  apiRouter.post("/suppliers", async (req: Request, res: Response) => {
    try {
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid supplier data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const supplier = await storage.createSupplier(result.data);
      res.status(201).json(supplier);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  apiRouter.put("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const result = insertSupplierSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid supplier data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const supplier = await storage.updateSupplier(req.params.id, result.data);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Failed to update supplier:", error);
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  apiRouter.delete("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteSupplier(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Supplier payment route
  apiRouter.post("/suppliers/:id/payment", async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const storage = await getStorage();
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        type: "payment",
        amount: parseFloat(amount),
        entityId: req.params.id,
        entityType: "supplier",
        description: description || `Payment to supplier: ${supplier.name}`,
        date: new Date()
      });

      // Update supplier debt
      const newDebt = (supplier.debt || 0) - parseFloat(amount);
      await storage.updateSupplier(req.params.id, { debt: Math.max(0, newDebt) });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to process supplier payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Inventory routes
  apiRouter.get("/inventory", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const inventory = await storage.getAllInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  apiRouter.get("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const item = await storage.getInventoryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Failed to fetch inventory item:", error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  apiRouter.post("/inventory", async (req: Request, res: Response) => {
    try {
      const result = insertInventorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid inventory data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const item = await storage.createInventoryItem(result.data);
      res.status(201).json(item);
    } catch (error) {
      console.error("Failed to create inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  apiRouter.put("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const result = insertInventorySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid inventory data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const item = await storage.updateInventoryItem(req.params.id, result.data);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Failed to update inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  apiRouter.delete("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteInventoryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Customer routes
  apiRouter.get("/customers", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  apiRouter.get("/customers/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  apiRouter.post("/customers", async (req: Request, res: Response) => {
    try {
      const result = insertCustomerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid customer data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const customer = await storage.createCustomer(result.data);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Failed to create customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  apiRouter.put("/customers/:id", async (req: Request, res: Response) => {
    try {
      const result = insertCustomerSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid customer data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const customer = await storage.updateCustomer(req.params.id, result.data);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Failed to update customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  apiRouter.delete("/customers/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Customer payment route
  apiRouter.post("/customers/:id/payment", async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const storage = await getStorage();
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Create transaction record
      const transaction = await storage.createTransaction({
        type: "receipt",
        amount: parseFloat(amount),
        entityId: req.params.id,
        entityType: "customer",
        description: description || `Payment from customer: ${customer.name}`,
        date: new Date()
      });

      // Update customer pending amount
      const newPending = (customer.pendingAmount || 0) - parseFloat(amount);
      await storage.updateCustomer(req.params.id, { pendingAmount: Math.max(0, newPending) });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to process customer payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Order routes
  apiRouter.get("/orders", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  apiRouter.get("/orders/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  apiRouter.post("/orders", async (req: Request, res: Response) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid order data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const order = await storage.createOrder(result.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Failed to create order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  apiRouter.put("/orders/:id", async (req: Request, res: Response) => {
    try {
      const result = insertOrderSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid order data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const order = await storage.updateOrder(req.params.id, result.data);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Failed to update order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  apiRouter.delete("/orders/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Failed to delete order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Transaction routes
  apiRouter.get("/transactions", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  apiRouter.get("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      console.error("Failed to fetch transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  apiRouter.post("/transactions", async (req: Request, res: Response) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid transaction data", errors: result.error.errors });
      }
      
      const storage = await getStorage();
      const transaction = await storage.createTransaction(result.data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Reports route
  apiRouter.get("/reports", async (req: Request, res: Response) => {
    try {
      const storage = await getStorage();
      const [orders, suppliers, customers, inventory, transactions] = await Promise.all([
        storage.getAllOrders(),
        storage.getAllSuppliers(),
        storage.getAllCustomers(),
        storage.getAllInventory(),
        storage.getAllTransactions()
      ]);

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalSupplierDebt = suppliers.reduce((sum, supplier) => sum + (supplier.debt || 0), 0);
      const totalCustomerPending = customers.reduce((sum, customer) => sum + (customer.pendingAmount || 0), 0);
      const lowStockItems = inventory.filter(item => item.quantity < 10);

      const report = {
        summary: {
          totalRevenue,
          totalSupplierDebt,
          totalCustomerPending,
          lowStockCount: lowStockItems.length,
          totalOrders: orders.length,
          totalSuppliers: suppliers.length,
          totalCustomers: customers.length,
          totalInventoryItems: inventory.length
        },
        lowStockItems,
        recentTransactions: transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
      };

      res.json(report);
    } catch (error) {
      console.error("Failed to generate reports:", error);
      res.status(500).json({ message: "Failed to generate reports" });
    }
  });

  const server = createServer(app);
  return server;
}