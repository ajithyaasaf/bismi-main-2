// Dedicated API file for Vercel serverless functions
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage setup
interface Supplier {
  id: string;
  name: string;
  debt?: number;
  contact?: string;
  createdAt: Date;
}

interface InventoryItem {
  id: string;
  type: string;
  quantity: number;
  rate: number;
  updatedAt: Date;
}

interface Customer {
  id: string;
  name: string;
  type: string;
  contact?: string;
  pendingAmount?: number;
  createdAt: Date;
}

interface Order {
  id: string;
  customerId: string;
  items: any[];
  date: Date;
  total: number;
  status: string;
  type: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  entityId: string;
  entityType: string;
  date: Date;
  description?: string;
}

const suppliers: Supplier[] = [];
const inventory: InventoryItem[] = [];
const customers: Customer[] = [];
const orders: Order[] = [];
const transactions: Transaction[] = [];

const app = express();

// Setup middleware
app.use(express.json());

// Helper function for responses
function sendResponse(res: Response, data: any, status = 200) {
  return res.status(status).json(data);
}

// Setup basic routes
app.get('/api/hello', (_req, res) => {
  return sendResponse(res, { message: 'Hello from Vercel Serverless API!' });
});

// Supplier routes
app.get('/api/suppliers', (_req, res) => {
  return sendResponse(res, suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier: Supplier = {
    id: uuidv4(),
    name: req.body.name || 'New Supplier',
    debt: req.body.debt || 0,
    contact: req.body.contact || null,
    createdAt: new Date()
  };
  suppliers.push(newSupplier);
  return sendResponse(res, newSupplier, 201);
});

// Inventory routes
app.get('/api/inventory', (_req, res) => {
  return sendResponse(res, inventory);
});

app.post('/api/inventory', (req, res) => {
  const newItem: InventoryItem = {
    id: uuidv4(),
    type: req.body.type || 'unknown',
    quantity: req.body.quantity || 0,
    rate: req.body.rate || 0,
    updatedAt: new Date()
  };
  inventory.push(newItem);
  return sendResponse(res, newItem, 201);
});

// Customer routes
app.get('/api/customers', (_req, res) => {
  return sendResponse(res, customers);
});

app.post('/api/customers', (req, res) => {
  const newCustomer: Customer = {
    id: uuidv4(),
    name: req.body.name || 'New Customer',
    type: req.body.type || 'hotel',
    contact: req.body.contact || null,
    pendingAmount: req.body.pendingAmount || 0,
    createdAt: new Date()
  };
  customers.push(newCustomer);
  return sendResponse(res, newCustomer, 201);
});

// Order routes
app.get('/api/orders', (_req, res) => {
  return sendResponse(res, orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder: Order = {
    id: uuidv4(),
    customerId: req.body.customerId || '',
    items: req.body.items || [],
    total: req.body.total || 0,
    status: req.body.status || 'pending',
    type: req.body.type || 'dine-in',
    date: new Date()
  };
  orders.push(newOrder);
  return sendResponse(res, newOrder, 201);
});

// Transaction routes
app.get('/api/transactions', (_req, res) => {
  return sendResponse(res, transactions);
});

app.post('/api/transactions', (req, res) => {
  const newTransaction: Transaction = {
    id: uuidv4(),
    type: req.body.type || 'expense',
    amount: req.body.amount || 0,
    entityId: req.body.entityId || '',
    entityType: req.body.entityType || 'customer',
    description: req.body.description || null,
    date: new Date()
  };
  transactions.push(newTransaction);
  return sendResponse(res, newTransaction, 201);
});

// Fallback for all other routes
app.all('*', (req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

export default app;