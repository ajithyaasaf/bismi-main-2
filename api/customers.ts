import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Sample data - will reset on each cold start in serverless
const customers = [
  {
    id: uuidv4(),
    name: "Spice Restaurant",
    type: "restaurant",
    contact: "555-987-6543",
    pendingAmount: 2500,
    createdAt: new Date()
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
      return res.status(200).json(customers);
    } 
    
    if (req.method === 'POST') {
      const newCustomer = {
        id: uuidv4(),
        name: req.body?.name || 'New Customer',
        type: req.body?.type || 'hotel',
        contact: req.body?.contact || null,
        pendingAmount: req.body?.pendingAmount || 0,
        createdAt: new Date()
      };
      customers.push(newCustomer);
      return res.status(201).json(newCustomer);
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