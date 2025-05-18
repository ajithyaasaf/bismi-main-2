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

  // Get the transaction ID from the URL if present
  const urlParts = req.url?.split('/') || [];
  const transactionId = urlParts[urlParts.length - 1];

  try {
    // GET - Get all transactions or a specific transaction
    if (req.method === 'GET') {
      if (transactionId && transactionId !== 'transactions') {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found' });
        }
        return res.status(200).json(transaction);
      }
      return res.status(200).json(transactions);
    } 
    
    // POST - Create a new transaction
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
    
    // PUT - Update existing transaction
    if (req.method === 'PUT') {
      if (!transactionId || transactionId === 'transactions') {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }
      
      const transactionIndex = transactions.findIndex(t => t.id === transactionId);
      if (transactionIndex === -1) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Update the transaction with new data
      const updatedTransaction = {
        ...transactions[transactionIndex],
        type: req.body?.type || transactions[transactionIndex].type,
        amount: req.body?.amount !== undefined ? req.body.amount : transactions[transactionIndex].amount,
        entityId: req.body?.entityId || transactions[transactionIndex].entityId,
        entityType: req.body?.entityType || transactions[transactionIndex].entityType,
        description: req.body?.description !== undefined ? req.body.description : transactions[transactionIndex].description,
      };
      
      transactions[transactionIndex] = updatedTransaction;
      return res.status(200).json(updatedTransaction);
    }
    
    // DELETE - Remove a transaction
    if (req.method === 'DELETE') {
      if (!transactionId || transactionId === 'transactions') {
        return res.status(400).json({ error: 'Transaction ID is required' });
      }
      
      const transactionIndex = transactions.findIndex(t => t.id === transactionId);
      if (transactionIndex === -1) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      
      // Remove the transaction
      transactions.splice(transactionIndex, 1);
      return res.status(200).json({ message: 'Transaction deleted successfully' });
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