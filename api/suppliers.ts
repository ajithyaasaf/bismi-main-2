import { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerlessStorage } from '../server/serverless-helper';
import { insertSupplierSchema } from '../shared/schema';

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
      const suppliers = await storage.getAllSuppliers();
      return res.status(200).json(suppliers);
    } 
    
    if (req.method === 'POST') {
      console.log('Vercel suppliers POST:', req.body);
      
      const result = insertSupplierSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Supplier validation failed:", result.error.errors);
        return res.status(400).json({ 
          message: "Invalid supplier data", 
          errors: result.error.errors 
        });
      }

      const newSupplier = await storage.createSupplier(result.data);
      return res.status(201).json(newSupplier);
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vercel suppliers API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}