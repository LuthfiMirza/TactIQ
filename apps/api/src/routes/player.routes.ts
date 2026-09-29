import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller.js';
import { validateQuery } from '../middlewares/validate.middleware.js';
import { PlayerQuerySchema } from '../validations/player.validation.js';

export const playerRoutes = Router();

// GET /api/v1/players (multi-criteria search & filtering with Zod validation)
playerRoutes.get('/', validateQuery(PlayerQuerySchema), PlayerController.getPlayers);

// GET /api/v1/players/:id (profile & radar stats)
playerRoutes.get('/:id', PlayerController.getPlayerById);

// GET /api/v1/players/:id/similar (ML similarity search)
playerRoutes.get('/:id/similar', PlayerController.getSimilarPlayers);
