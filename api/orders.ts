import { VercelRequest, VercelResponse } from '@vercel/node';
import { getServerlessStorage } from '../server/serverless-helper';
import { insertOrderSchema } from '../shared/schema';

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
      const orders = await storage.getAllOrders();
      return res.status(200).json(orders);
    } 
    
    if (req.method === 'POST') {
      console.log('Vercel orders POST:', req.body);
      
      const now = new Date();
      const processedBody = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : now,
        createdAt: now
      };
      
      const result = insertOrderSchema.safeParse(processedBody);
      if (!result.success) {
        console.error("Order validation failed:", result.error.errors);
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: result.error.errors,
          receivedData: {
            customerId: req.body.customerId,
            items: req.body.items,
            date: req.body.date,
            total: req.body.total,
            status: req.body.status,
            type: req.body.type
          }
        });
      }

      const orderWithTimestamps = {
        ...result.data,
        createdAt: now
      };
      
      const order = await storage.createOrder(orderWithTimestamps as any);
      
      // Update inventory based on order items
      if (result.data.items && Array.isArray(result.data.items)) {
        const inventoryItems = await storage.getAllInventory();
        
        for (const item of result.data.items) {
          if (item.type && typeof item.quantity === 'number') {
            const inventoryItem = inventoryItems.find(inv => inv.type === item.type);
            if (inventoryItem) {
              const newQuantity = inventoryItem.quantity - item.quantity;
              await storage.updateInventoryItem(inventoryItem.id, {
                quantity: newQuantity
              });
            }
          }
        }
      }
      
      // If payment is pending, update customer pending amount
      if (result.data.status === 'pending' && result.data.customerId && result.data.total) {
        const customer = await storage.getCustomer(result.data.customerId);
        if (customer) {
          const newPending = (customer.pendingAmount || 0) + result.data.total;
          await storage.updateCustomer(result.data.customerId, {
            pendingAmount: newPending
          });
        }
      }
      
      return res.status(201).json(order);
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Vercel orders API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}