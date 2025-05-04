// Fallback API route for Vercel
module.exports = (req, res) => {
  res.json({
    message: 'Bismi Chicken Shop API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/suppliers',
      '/api/inventory',
      '/api/customers',
      '/api/orders',
      '/api/transactions',
      '/api/reports',
      '/api/hello'
    ]
  });
};