import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import summaryRouter from './routes/summary.js';
import transactionsRouter from './routes/transactions.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Enable CORS for frontend clients (supporting localhost:3000 and any client origin)
  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parse incoming JSON request bodies
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/health', healthRouter);
  app.use('/api/summary', summaryRouter);
  app.use('/api/transactions', transactionsRouter);

  // 404 handler for undefined API routes
  app.use('/api', notFoundHandler);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
