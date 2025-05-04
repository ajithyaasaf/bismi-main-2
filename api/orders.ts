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

  try {
    if (req.method === 'GET') {
      return res.status(200).json(orders);
    } 
    
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