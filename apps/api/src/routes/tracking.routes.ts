import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller.js';

export const trackingRoutes = Router();

// GET /api/v1/tracking/sessions
trackingRoutes.get('/sessions', TrackingController.getSessions);

// GET /api/v1/tracking/sessions/:id
trackingRoutes.get('/sessions/:id', TrackingController.getSessionById);

// POST /api/v1/tracking/start (kick off CV tracking stream)
trackingRoutes.post('/start', TrackingController.startTracking);
