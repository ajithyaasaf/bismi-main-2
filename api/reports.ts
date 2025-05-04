import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Sample data for reporting
const sampleData = {
  orders: [
    {
      id: uuidv4(),
      customerId: uuidv4(),
      items: [{ id: uuidv4(), itemId: uuidv4(), quantity: 10, rate: 120 }],
      date: new Date(),
      total: 1200,
      status: "completed",
      type: "takeaway"
    },
    {
      id: uuidv4(),
      customerId: uuidv4(),
      items: [{ id: uuidv4(), itemId: uuidv4(), quantity: 5, rate: 150 }],
      date: new Date(),
      total: 750,
      status: "completed",
      type: "dine-in"
    }
  ],
  customers: [
    {
      id: uuidv4(),
      name: "Spice Restaurant",
      type: "restaurant",
      contact: "555-987-6543",
      pendingAmount: 2500,
      createdAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Hotel Paradise",
      type: "hotel",
      contact: "555-123-7890",
      pendingAmount: 1200,
      createdAt: new Date()
    }
  ],
  inventory: [
    {
      id: uuidv4(),
      type: "Chicken",
      quantity: 50,
      rate: 120,
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      type: "Eggs",
      quantity: 200,
      rate: 5,
      updatedAt: new Date()
    }
  ],
  suppliers: [
    {
      id: uuidv4(),
      name: "Fresh Farm Foods",
      debt: 1200,
      contact: "555-123-4567",
      createdAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Quality Meats",
      debt: 2500,
      contact: "555-987-1234",
      createdAt: new Date()
    }
  ],
  transactions: [
    {
      id: uuidv4(),
      type: "income",
      amount: 1200,
      entityId: uuidv4(),
      entityType: "customer",
      date: new Date(),
      description: "Payment received"
    },
    {
      id: uuidv4(),
      type: "expense",
      amount: 500,
      entityId: uuidv4(),
      entityType: "supplier",
      date: new Date(),
      description: "Payment made"
    }
  ]
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request (for CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate report data
    const reportData = {
      totalSales: sampleData.orders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: sampleData.orders.length,
      totalCustomers: sampleData.customers.length,
      totalInventory: sampleData.inventory.reduce((sum, item) => sum + item.quantity, 0),
      totalSuppliers: sampleData.suppliers.length,
      totalTransactions: sampleData.transactions.length,
      recentOrders: sampleData.orders.slice(-5),
      recentTransactions: sampleData.transactions.slice(-5)
    };
    
    return res.status(200).json(reportData);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}