import { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerlessStorage } from '../server/serverless-helper';
import { insertInventorySchema } from '../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const storage = getServerlessStorage();

    if (req.method === 'GET') {
      const inventory = await storage.getAllInventory();
      return res.status(200).json(inventory);
    } 
    
    if (req.method === 'POST') {
      console.log('Vercel inventory POST:', req.body);
      
      const result = insertInventorySchema.safeParse(req.body);
      if (!result.success) {
        console.error("Inventory validation failed:", result.error.errors);
        return res.status(400).json({ 
          message: "Invalid inventory data", 
          errors: result.error.errors 
        });
      }

      const newItem = await storage.createInventoryItem(result.data);
      return res.status(201).json(newItem);
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vercel inventory API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}