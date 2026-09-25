import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller.js';

export const playerRoutes = Router();

// GET /api/v1/players (multi-criteria search & filtering)
playerRoutes.get('/', PlayerController.getPlayers);

// GET /api/v1/players/:id (profile & radar stats)
playerRoutes.get('/:id', PlayerController.getPlayerById);

// GET /api/v1/players/:id/similar (ML similarity search)
playerRoutes.get('/:id/similar', PlayerController.getSimilarPlayers);
