import { Router } from 'express';
import { TrackingController } from '../controllers/tracking.controller.js';

export const trackingRoutes = Router();

// GET /api/v1/tracking/sessions
trackingRoutes.get('/sessions', TrackingController.getSessions);

// GET /api/v1/tracking/sessions/:id
trackingRoutes.get('/sessions/:id', TrackingController.getSessionById);

// POST /api/v1/tracking/start (kick off CV tracking stream)
trackingRoutes.post('/start', TrackingController.startTracking);

// -----------------------------------------------------------------------------
// TSK-31: Dynamic Homography Calibration via Field Line Detection
// -----------------------------------------------------------------------------
// POST /api/v1/tracking/homography/calibrate-lines
trackingRoutes.post('/homography/calibrate-lines', TrackingController.calibrateFieldLines);

// POST /api/v1/tracking/homography/calibrate-manual
trackingRoutes.post('/homography/calibrate-manual', TrackingController.calibrateManual);

// GET /api/v1/tracking/homography/status
trackingRoutes.get('/homography/status', TrackingController.getHomographyStatus);

// POST /api/v1/tracking/homography/transform
trackingRoutes.post('/homography/transform', TrackingController.transformCoordinates);
