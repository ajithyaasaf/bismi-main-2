// A simplified version of the Express server for Vercel deployment
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Parse JSON request body
app.use(express.json());

// Register routes - use promise instead of await
let server;
registerRoutes(app).then(s => {
  server = s;
});

// Static files for production
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

export default app;