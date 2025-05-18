import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

// Sample data - will reset on each cold start in serverless
const suppliers = [
  {
    id: uuidv4(),
    name: "Fresh Farm Foods",
    debt: 1200,
    contact: "555-123-4567",
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

  // Get the supplier ID from the URL if present
  const urlParts = req.url?.split('/') || [];
  const supplierId = urlParts[urlParts.length - 1];

  try {
    // GET - Get all suppliers or a specific supplier
    if (req.method === 'GET') {
      if (supplierId && supplierId !== 'suppliers') {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        return res.status(200).json(supplier);
      }
      return res.status(200).json(suppliers);
    } 
    
    // POST - Create a new supplier
    if (req.method === 'POST') {
      const newSupplier = {
        id: uuidv4(),
        name: req.body?.name || 'New Supplier',
        debt: req.body?.debt || 0,
        contact: req.body?.contact || null,
        createdAt: new Date()
      };
      suppliers.push(newSupplier);
      return res.status(201).json(newSupplier);
    }
    
    // PUT - Update existing supplier
    if (req.method === 'PUT') {
      if (!supplierId || supplierId === 'suppliers') {
        return res.status(400).json({ error: 'Supplier ID is required' });
      }
      
      const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
      if (supplierIndex === -1) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      
      // Update the supplier with new data
      const updatedSupplier = {
        ...suppliers[supplierIndex],
        name: req.body?.name || suppliers[supplierIndex].name,
        debt: req.body?.debt !== undefined ? req.body.debt : suppliers[supplierIndex].debt,
        contact: req.body?.contact !== undefined ? req.body.contact : suppliers[supplierIndex].contact,
      };
      
      suppliers[supplierIndex] = updatedSupplier;
      return res.status(200).json(updatedSupplier);
    }
    
    // DELETE - Remove a supplier
    if (req.method === 'DELETE') {
      if (!supplierId || supplierId === 'suppliers') {
        return res.status(400).json({ error: 'Supplier ID is required' });
      }
      
      const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
      if (supplierIndex === -1) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      
      // Remove the supplier
      suppliers.splice(supplierIndex, 1);
      return res.status(200).json({ message: 'Supplier deleted successfully' });
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