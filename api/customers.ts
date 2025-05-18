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

  // Get the customer ID from the URL if present
  const urlParts = req.url?.split('/') || [];
  const customerId = urlParts[urlParts.length - 1];

  try {
    // GET - Get all customers or a specific customer
    if (req.method === 'GET') {
      if (customerId && customerId !== 'customers') {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) {
          return res.status(404).json({ error: 'Customer not found' });
        }
        return res.status(200).json(customer);
      }
      return res.status(200).json(customers);
    } 
    
    // POST - Create a new customer
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
    
    // PUT - Update existing customer
    if (req.method === 'PUT') {
      if (!customerId || customerId === 'customers') {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      // Update the customer with new data
      const updatedCustomer = {
        ...customers[customerIndex],
        name: req.body?.name || customers[customerIndex].name,
        type: req.body?.type || customers[customerIndex].type,
        contact: req.body?.contact !== undefined ? req.body.contact : customers[customerIndex].contact,
        pendingAmount: req.body?.pendingAmount !== undefined ? req.body.pendingAmount : customers[customerIndex].pendingAmount,
      };
      
      customers[customerIndex] = updatedCustomer;
      return res.status(200).json(updatedCustomer);
    }
    
    // DELETE - Remove a customer
    if (req.method === 'DELETE') {
      if (!customerId || customerId === 'customers') {
        return res.status(400).json({ error: 'Customer ID is required' });
      }
      
      const customerIndex = customers.findIndex(c => c.id === customerId);
      if (customerIndex === -1) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      // Remove the customer
      customers.splice(customerIndex, 1);
      return res.status(200).json({ message: 'Customer deleted successfully' });
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