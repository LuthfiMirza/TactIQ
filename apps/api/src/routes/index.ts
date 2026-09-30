import { Router } from 'express';
import { playerRoutes } from './player.routes.js';
import { matchRoutes } from './match.routes.js';
import { trackingRoutes } from './tracking.routes.js';
import { etlService } from '../services/etl.service.js';

import { prisma } from '../services/prisma.service.js';

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

// Data Health & Mode provenance endpoint (TSK Phase 1A)
apiRouter.get('/health/data', async (_req, res) => {
  const currentMode = (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo';
  const provider = process.env.DATA_PROVIDER || (process.env.FOOTBALL_DATA_TOKEN ? 'football-data.org' : (process.env.API_FOOTBALL_KEY ? 'api-football' : 'none'));

  const playersCount = await prisma.player.count().catch(() => 0);
  const teamsCount = await prisma.team.count().catch(() => 0);
  const fixturesCount = await prisma.fixture.count().catch(() => 0);
  const standingsCount = await prisma.standing.count().catch(() => 0);

  res.json({
    success: true,
    data: {
      mode: currentMode,
      provider,
      providerStatus: etlService.getLastStatus(),
      lastSync: etlService.getLastSync(),
      lastError: etlService.getLastError(),
      source: etlService.getLastSource(),
      databaseCounts: {
        players: playersCount,
        teams: teamsCount,
        fixtures: fixturesCount,
        standings: standingsCount,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Manual on-demand ETL synchronization trigger
apiRouter.post('/sync', async (_req, res, next) => {
  try {
    const result = await etlService.runFullETL();
    res.json({
      success: true,
      message: 'ETL sync executed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Mounted v1 feature routers
apiRouter.use('/players', playerRoutes);
apiRouter.use('/matches', matchRoutes);
apiRouter.use('/tracking', trackingRoutes);

