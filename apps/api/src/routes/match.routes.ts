import { Router } from 'express';
import { MatchController } from '../controllers/match.controller.js';

export const matchRoutes = Router();

// GET /api/v1/matches/fixtures (scheduled fixtures)
matchRoutes.get('/fixtures', MatchController.getFixtures);

// GET /api/v1/matches/live/scores (API-Football live scores)
matchRoutes.get('/live/scores', MatchController.getLiveScores);

// GET /api/v1/matches/preview/absentees (Transfermarkt injury & ban intelligence)
matchRoutes.get('/preview/absentees', MatchController.getAbsentees);

// GET /api/v1/matches/:id/lineup (API-Football tactical lineup)
matchRoutes.get('/:id/lineup', MatchController.getLineup);

// GET /api/v1/matches/:id/statistics (API-Football live match statistics)
matchRoutes.get('/:id/statistics', MatchController.getStatistics);

// GET /api/v1/matches/:id/h2h (API-Football historical H2H)
matchRoutes.get('/:id/h2h', MatchController.getFixtureH2H);

// GET /api/v1/matches/standings (league table standings)
matchRoutes.get('/standings', MatchController.getStandings);

// GET /api/v1/matches/h2h/:homeId/:awayId (H2H comparison DB fallback)
matchRoutes.get('/h2h/:homeId/:awayId', MatchController.getH2H);

// POST /api/v1/matches/predict (proxy to ML prediction model)
matchRoutes.post('/predict', MatchController.predictMatch);
