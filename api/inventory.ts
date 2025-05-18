import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Sample data - will reset on each cold start in serverless
const inventory = [
  {
    id: uuidv4(),
    type: "Chicken",
    quantity: 50,
    rate: 120,
    updatedAt: new Date()
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

  // Get the inventory item ID from the URL if present
  const urlParts = req.url?.split('/') || [];
  const itemId = urlParts[urlParts.length - 1];

  try {
    // GET - Get all inventory items or a specific item
    if (req.method === 'GET') {
      if (itemId && itemId !== 'inventory') {
        const item = inventory.find(i => i.id === itemId);
        if (!item) {
          return res.status(404).json({ error: 'Inventory item not found' });
        }
        return res.status(200).json(item);
      }
      return res.status(200).json(inventory);
    } 
    
    // POST - Create a new inventory item
    if (req.method === 'POST') {
      const newItem = {
        id: uuidv4(),
        type: req.body?.type || 'unknown',
        quantity: req.body?.quantity || 0,
        rate: req.body?.rate || 0,
        updatedAt: new Date()
      };
      inventory.push(newItem);
      return res.status(201).json(newItem);
    }
    
    // PUT - Update existing inventory item
    if (req.method === 'PUT') {
      if (!itemId || itemId === 'inventory') {
        return res.status(400).json({ error: 'Inventory item ID is required' });
      }
      
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      
      // Update the inventory item with new data
      const updatedItem = {
        ...inventory[itemIndex],
        type: req.body?.type || inventory[itemIndex].type,
        quantity: req.body?.quantity !== undefined ? req.body.quantity : inventory[itemIndex].quantity,
        rate: req.body?.rate !== undefined ? req.body.rate : inventory[itemIndex].rate,
        updatedAt: new Date() // Always update the timestamp
      };
      
      inventory[itemIndex] = updatedItem;
      return res.status(200).json(updatedItem);
    }
    
    // DELETE - Remove an inventory item
    if (req.method === 'DELETE') {
      if (!itemId || itemId === 'inventory') {
        return res.status(400).json({ error: 'Inventory item ID is required' });
      }
      
      const itemIndex = inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      
      // Remove the inventory item
      inventory.splice(itemIndex, 1);
      return res.status(200).json({ message: 'Inventory item deleted successfully' });
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