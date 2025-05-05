import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firestoreStorage } from "./firestore-storage"; // Import Firestore storage
import { v4 as uuidv4 } from 'uuid';
import { 
  insertSupplierSchema, 
  insertInventorySchema, 
  insertCustomerSchema, 
  insertOrderSchema, 
  insertTransactionSchema 
} from "@shared/schema";
import { z } from "zod";

// Use Firestore storage if environment variable is set
const db = process.env.USE_FIRESTORE === "true" ? firestoreStorage : storage;

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Supplier routes
  apiRouter.get("/suppliers", async (req: Request, res: Response) => {
    try {
      const suppliers = await db.getAllSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  apiRouter.get("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const supplier = await db.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  apiRouter.post("/suppliers", async (req: Request, res: Response) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await db.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  apiRouter.put("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const updatedSupplier = await db.updateSupplier(req.params.id, supplierData);
      if (!updatedSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(updatedSupplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  apiRouter.delete("/suppliers/:id", async (req: Request, res: Response) => {
    try {
      const success = await db.deleteSupplier(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  apiRouter.post("/suppliers/:id/payment", async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const supplier = await db.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Create a payment transaction
      const transaction = await db.createTransaction({
        entityId: req.params.id,
        entityType: 'supplier',
        amount,
        date: new Date(),
        type: 'payment',
        description: description || `Payment to supplier: ${supplier.name}`
      });

      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Inventory routes
  apiRouter.get("/inventory", async (req: Request, res: Response) => {
    try {
      const inventory = await db.getAllInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  apiRouter.get("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const item = await db.getInventoryItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  apiRouter.post("/inventory", async (req: Request, res: Response) => {
    try {
      const itemData = insertInventorySchema.parse(req.body);
      const item = await db.createInventoryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  apiRouter.put("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const itemData = insertInventorySchema.partial().parse(req.body);
      const updatedItem = await db.updateInventoryItem(req.params.id, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  apiRouter.delete("/inventory/:id", async (req: Request, res: Response) => {
    try {
      const success = await db.deleteInventoryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Customer routes
  apiRouter.get("/customers", async (req: Request, res: Response) => {
    try {
      const customers = await db.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  apiRouter.get("/customers/:id", async (req: Request, res: Response) => {
    try {
      const customer = await db.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  apiRouter.post("/customers", async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await db.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  apiRouter.put("/customers/:id", async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const updatedCustomer = await db.updateCustomer(req.params.id, customerData);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(updatedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  apiRouter.delete("/customers/:id", async (req: Request, res: Response) => {
    try {
      const success = await db.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  apiRouter.post("/customers/:id/payment", async (req: Request, res: Response) => {
    try {
      const { amount, description } = req.body;
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      const customer = await db.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Create a receipt transaction
      const transaction = await db.createTransaction({
        entityId: req.params.id,
        entityType: 'customer',
        amount,
        date: new Date(),
        type: 'receipt',
        description: description || `Payment from customer: ${customer.name}`
      });

      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Order routes
  apiRouter.get("/orders", async (req: Request, res: Response) => {
    try {
      const customerId = req.query.customerId as string;
      let orders;
      
      if (customerId) {
        orders = await db.getOrdersByCustomer(customerId);
      } else {
        orders = await db.getAllOrders();
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  apiRouter.get("/orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await db.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  apiRouter.post("/orders", async (req: Request, res: Response) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await db.getCustomer(orderData.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Verify inventory has enough stock
      for (const item of orderData.items) {
        const inventoryItems = await db.getAllInventory();
        const inventoryItem = inventoryItems.find(inv => inv.type === item.type);
        
        if (!inventoryItem) {
          return res.status(404).json({ message: `Inventory item not found: ${item.type}` });
        }
        
        if (inventoryItem.quantity < item.quantity) {
          return res.status(400).json({ 
            message: `Not enough stock for ${item.type}. Available: ${inventoryItem.quantity}kg, Requested: ${item.quantity}kg` 
          });
        }
      }
      
      const order = await db.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  apiRouter.put("/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await db.updateOrder(req.params.id, orderData);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  apiRouter.delete("/orders/:id", async (req: Request, res: Response) => {
    try {
      const success = await db.deleteOrder(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Transaction routes
  apiRouter.get("/transactions", async (req: Request, res: Response) => {
    try {
      const entityId = req.query.entityId as string;
      let transactions;
      
      if (entityId) {
        transactions = await db.getTransactionsByEntity(entityId);
      } else {
        transactions = await db.getAllTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  apiRouter.get("/transactions/:id", async (req: Request, res: Response) => {
    try {
      const transaction = await db.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  apiRouter.post("/transactions", async (req: Request, res: Response) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await db.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Reports route
  apiRouter.get("/reports", async (req: Request, res: Response) => {
    try {
      const reportType = req.query.type as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      let report: any = {};
      
      switch (reportType) {
        case 'sales':
          // Get all orders within date range
          const orders = await db.getAllOrders();
          const filteredOrders = orders.filter(order => {
            // Skip orders with null dates or handle them as needed
            if (!order.date) return false;
            const orderDate = new Date(order.date);
            return (!startDate || orderDate >= startDate) && 
                  (!endDate || orderDate <= endDate);
          });
          
          report = {
            totalSales: filteredOrders.reduce((sum, order) => sum + order.total, 0),
            orderCount: filteredOrders.length,
            orders: filteredOrders
          };
          break;
          
        case 'debts':
          // Get all suppliers and customers with debts
          const suppliers = await db.getAllSuppliers();
          const customers = await db.getAllCustomers();
          
          report = {
            totalSupplierDebt: suppliers.reduce((sum, supplier) => sum + supplier.debt, 0),
            totalCustomerPending: customers.reduce((sum, customer) => sum + customer.pendingAmount, 0),
            suppliers: suppliers.filter(supplier => supplier.debt > 0),
            customers: customers.filter(customer => customer.pendingAmount > 0)
          };
          break;
          
        default:
          return res.status(400).json({ message: "Invalid report type" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
