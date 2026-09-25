import { Router } from 'express';
import { MatchController } from '../controllers/match.controller.js';

export const matchRoutes = Router();

// GET /api/v1/matches/fixtures (scheduled fixtures)
matchRoutes.get('/fixtures', MatchController.getFixtures);

// GET /api/v1/matches/h2h/:homeId/:awayId (H2H comparison)
matchRoutes.get('/h2h/:homeId/:awayId', MatchController.getH2H);

// POST /api/v1/matches/predict (proxy to ML prediction model)
matchRoutes.post('/predict', MatchController.predictMatch);
