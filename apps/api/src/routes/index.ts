import { Router } from 'express';
import { playerRoutes } from './player.routes.js';
import { matchRoutes } from './match.routes.js';
import { trackingRoutes } from './tracking.routes.js';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'tactiq-api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mounted v1 feature routers
apiRouter.use('/players', playerRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/tracking', trackingRoutes);
