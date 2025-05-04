import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Generate an entity ID for sample data
const sampleEntityId = uuidv4(); 

// Sample data - will reset on each cold start in serverless
const transactions = [
  {
    id: uuidv4(),
    type: "income",
    amount: 1200,
    entityId: sampleEntityId,
    entityType: "customer",
    date: new Date(),
    description: "Payment received"
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
      return res.status(200).json(transactions);
    } 
    
    if (req.method === 'POST') {
      const newTransaction = {
        id: uuidv4(),
        type: req.body?.type || 'expense',
        amount: req.body?.amount || 0,
        entityId: req.body?.entityId || '',
        entityType: req.body?.entityType || 'customer',
        description: req.body?.description || null,
        date: new Date()
      };
      transactions.push(newTransaction);
      return res.status(201).json(newTransaction);
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