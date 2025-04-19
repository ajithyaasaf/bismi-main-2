import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../routes";
import { serveStatic, log } from "../vite";

// Create Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for Vercel deployment
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Initialize API routes
let server: any;

// Dedicated serverless handler for Vercel
const initializeServer = async () => {
  if (!server) {
    server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", err);
      res.status(status).json({ message });
    });

    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    }
  }
  return app;
};

// Initialize the app
const handler = async (req: Request, res: Response) => {
  const app = await initializeServer();
  return app(req, res);
};

export default handler;