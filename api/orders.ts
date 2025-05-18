import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Generate a customer ID for sample data
const sampleCustomerId = uuidv4();

// Sample data - will reset on each cold start in serverless
const orders = [
  {
    id: uuidv4(),
    customerId: sampleCustomerId,
    items: [{ id: uuidv4(), itemId: uuidv4(), quantity: 10, rate: 120 }],
    date: new Date(),
    total: 1200,
    status: "completed",
    type: "takeaway"
  }
];

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

  // Get the order ID from the URL if present
  const urlParts = req.url?.split('/') || [];
  const orderId = urlParts[urlParts.length - 1];

  try {
    // GET - Get all orders or a specific order
    if (req.method === 'GET') {
      if (orderId && orderId !== 'orders') {
        const order = orders.find(o => o.id === orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json(order);
      }
      return res.status(200).json(orders);
    } 
    
    // POST - Create a new order
    if (req.method === 'POST') {
      const newOrder = {
        id: uuidv4(),
        customerId: req.body?.customerId || '',
        items: req.body?.items || [],
        total: req.body?.total || 0,
        status: req.body?.status || 'pending',
        type: req.body?.type || 'dine-in',
        date: new Date()
      };
      orders.push(newOrder);
      return res.status(201).json(newOrder);
    }
    
    // PUT - Update existing order
    if (req.method === 'PUT') {
      if (!orderId || orderId === 'orders') {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Update the order with new data
      const updatedOrder = {
        ...orders[orderIndex],
        customerId: req.body?.customerId || orders[orderIndex].customerId,
        items: req.body?.items || orders[orderIndex].items,
        total: req.body?.total !== undefined ? req.body.total : orders[orderIndex].total,
        status: req.body?.status || orders[orderIndex].status,
        type: req.body?.type || orders[orderIndex].type,
      };
      
      orders[orderIndex] = updatedOrder;
      return res.status(200).json(updatedOrder);
    }
    
    // DELETE - Remove an order
    if (req.method === 'DELETE') {
      if (!orderId || orderId === 'orders') {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) {
        return res.status(404).json({ error: 'Order not found' });
      }
      
      // Remove the order
      orders.splice(orderIndex, 1);
      return res.status(200).json({ message: 'Order deleted successfully' });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}