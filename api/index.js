// This file exports the serverless function for Vercel deployment
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getServerlessStorage } from '../server/serverless-helper.js';
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Setup API routes
const apiRouter = express.Router();
app.use('/api', apiRouter);

// Initialize serverless environment
const storage = getServerlessStorage();

export default async (req, res) => {
  try {
    // Handle API routes
    const path = req.url.replace(/^\/api\//, '');
    
    if (path.startsWith('suppliers')) {
      if (req.method === 'GET') {
        if (path === 'suppliers') {
          const suppliers = await storage.getAllSuppliers();
          return res.json(suppliers);
        } else {
          const id = path.split('/')[1];
          const supplier = await storage.getSupplier(id);
          return supplier ? res.json(supplier) : res.status(404).json({ error: 'Supplier not found' });
        }
      } else if (req.method === 'DELETE') {
        const id = path.split('/')[1];
        const success = await storage.deleteSupplier(id);
        return success 
          ? res.json({ message: 'Supplier deleted successfully' }) 
          : res.status(404).json({ message: 'Supplier not found' });
      } else if (req.method === 'PUT') {
        const id = path.split('/')[1];
        const supplierData = req.body;
        const updatedSupplier = await storage.updateSupplier(id, supplierData);
        return updatedSupplier 
          ? res.json(updatedSupplier) 
          : res.status(404).json({ message: 'Supplier not found' });
      } else if (req.method === 'POST') {
        if (path === 'suppliers') {
          const supplierData = req.body;
          const newSupplier = await storage.createSupplier(supplierData);
          return res.status(201).json(newSupplier);
        } else if (path.includes('/payment')) {
          const id = path.split('/')[1];
          const paymentData = req.body;
          
          if (!paymentData.amount) {
            return res.status(400).json({ message: 'Payment amount is required' });
          }
          
          // Create a transaction for the payment
          const transaction = {
            entityId: id,
            entityType: 'supplier',
            type: 'payment',
            amount: paymentData.amount,
            description: `Payment to supplier: ${paymentData.name || ''}`,
            date: new Date()
          };
          
          const newTransaction = await storage.createTransaction(transaction);
          
          // Update supplier debt if applicable
          const supplier = await storage.getSupplier(id);
          if (supplier && supplier.debt) {
            const updatedSupplier = await storage.updateSupplier(id, {
              debt: Math.max(0, supplier.debt - paymentData.amount)
            });
            
            return res.json({
              transaction: newTransaction,
              supplier: updatedSupplier
            });
          }
          
          return res.json({ transaction: newTransaction });
        }
      }
    }
    
    if (path.startsWith('customers')) {
      if (req.method === 'GET') {
        if (path === 'customers') {
          const customers = await storage.getAllCustomers();
          return res.json(customers);
        } else {
          const id = path.split('/')[1];
          const customer = await storage.getCustomer(id);
          return customer ? res.json(customer) : res.status(404).json({ error: 'Customer not found' });
        }
      } else if (req.method === 'DELETE') {
        const id = path.split('/')[1];
        const success = await storage.deleteCustomer(id);
        return success 
          ? res.json({ message: 'Customer deleted successfully' }) 
          : res.status(404).json({ message: 'Customer not found' });
      } else if (req.method === 'PUT') {
        const id = path.split('/')[1];
        const customerData = req.body;
        const updatedCustomer = await storage.updateCustomer(id, customerData);
        return updatedCustomer 
          ? res.json(updatedCustomer) 
          : res.status(404).json({ message: 'Customer not found' });
      } else if (req.method === 'POST') {
        if (path === 'customers') {
          const customerData = req.body;
          const newCustomer = await storage.createCustomer(customerData);
          return res.status(201).json(newCustomer);
        } else if (path.includes('/payment')) {
          const id = path.split('/')[1];
          const paymentData = req.body;
          
          if (!paymentData.amount) {
            return res.status(400).json({ message: 'Payment amount is required' });
          }
          
          // Create a transaction for the payment
          const transaction = {
            entityId: id,
            entityType: 'customer',
            type: 'payment',
            amount: paymentData.amount,
            description: `Payment from customer: ${paymentData.name || ''}`,
            date: new Date()
          };
          
          const newTransaction = await storage.createTransaction(transaction);
          
          // Update customer pending amount if applicable
          const customer = await storage.getCustomer(id);
          if (customer && customer.pendingAmount) {
            const updatedCustomer = await storage.updateCustomer(id, {
              pendingAmount: Math.max(0, customer.pendingAmount - paymentData.amount)
            });
            
            return res.json({
              transaction: newTransaction,
              customer: updatedCustomer
            });
          }
          
          return res.json({ transaction: newTransaction });
        }
      }
    }
    
    if (path.startsWith('inventory')) {
      if (req.method === 'GET') {
        if (path === 'inventory') {
          const items = await storage.getAllInventory();
          return res.json(items);
        } else {
          const id = path.split('/')[1];
          const item = await storage.getInventoryItem(id);
          return item ? res.json(item) : res.status(404).json({ error: 'Inventory item not found' });
        }
      } else if (req.method === 'DELETE') {
        const id = path.split('/')[1];
        const success = await storage.deleteInventoryItem(id);
        return success 
          ? res.json({ message: 'Inventory item deleted successfully' }) 
          : res.status(404).json({ message: 'Inventory item not found' });
      } else if (req.method === 'PUT') {
        const id = path.split('/')[1];
        const itemData = req.body;
        const updatedItem = await storage.updateInventoryItem(id, itemData);
        return updatedItem 
          ? res.json(updatedItem) 
          : res.status(404).json({ message: 'Inventory item not found' });
      }
    }
    
    if (path.startsWith('orders')) {
      if (req.method === 'GET') {
        if (path === 'orders') {
          const orders = await storage.getAllOrders();
          return res.json(orders);
        } else {
          const id = path.split('/')[1];
          const order = await storage.getOrder(id);
          return order ? res.json(order) : res.status(404).json({ error: 'Order not found' });
        }
      } else if (req.method === 'DELETE') {
        const id = path.split('/')[1];
        const success = await storage.deleteOrder(id);
        return success 
          ? res.json({ message: 'Order deleted successfully' }) 
          : res.status(404).json({ message: 'Order not found' });
      } else if (req.method === 'PUT') {
        const id = path.split('/')[1];
        const orderData = req.body;
        const updatedOrder = await storage.updateOrder(id, orderData);
        return updatedOrder 
          ? res.json(updatedOrder) 
          : res.status(404).json({ message: 'Order not found' });
      } else if (req.method === 'POST') {
        if (path === 'orders') {
          const orderData = req.body;
          const newOrder = await storage.createOrder(orderData);
          return res.status(201).json(newOrder);
        }
      }
    }
    
    if (path.startsWith('transactions')) {
      if (req.method === 'GET') {
        if (path === 'transactions') {
          const transactions = await storage.getAllTransactions();
          return res.json(transactions);
        } else {
          const id = path.split('/')[1];
          const transaction = await storage.getTransaction(id);
          return transaction ? res.json(transaction) : res.status(404).json({ error: 'Transaction not found' });
        }
      } else if (req.method === 'DELETE') {
        const id = path.split('/')[1];
        const success = await storage.deleteTransaction(id);
        return success 
          ? res.json({ message: 'Transaction deleted successfully' }) 
          : res.status(404).json({ message: 'Transaction not found' });
      } else if (req.method === 'PUT') {
        const id = path.split('/')[1];
        const transactionData = req.body;
        const updatedTransaction = await storage.updateTransaction(id, transactionData);
        return updatedTransaction 
          ? res.json(updatedTransaction) 
          : res.status(404).json({ message: 'Transaction not found' });
      } else if (req.method === 'POST') {
        if (path === 'transactions') {
          const transactionData = req.body;
          const newTransaction = await storage.createTransaction(transactionData);
          return res.status(201).json(newTransaction);
        }
      }
    }
    
    return res.status(404).json({ error: 'API endpoint not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};