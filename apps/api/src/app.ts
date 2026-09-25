import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRouter } from './routes/index.js';

export function createApp(): Application {
  const app: Application = express();

  // Security Middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows cross-origin video/socket media in local dev
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Middleware
  app.use(
    cors({
      origin: '*', // Allow local frontend ports
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Logging Middleware
  app.use(morgan('dev'));

  // Body Parsing Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root welcome / status
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'TactIQ Central API Gateway',
      version: '1.0.0',
      description: 'Data-Driven Football Analytics & Tactical Tracking Platform',
      endpoints: {
        health: '/api/v1/health',
        players: '/api/v1/players',
        matches: '/api/v1/matches/fixtures',
        tracking: '/api/v1/tracking/sessions',
      },
    });
  });

  // Mount API v1 Routes
  app.use('/api/v1', apiRouter);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist.`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred.',
      },
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
