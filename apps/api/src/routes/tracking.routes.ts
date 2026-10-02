import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { TrackingController } from '../controllers/tracking.controller.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max limit
});

export const trackingRoutes = Router();

// GET /api/v1/tracking/sessions
trackingRoutes.get('/sessions', TrackingController.getSessions);

// GET /api/v1/tracking/sessions/:id
trackingRoutes.get('/sessions/:id', TrackingController.getSessionById);

// POST /api/v1/tracking/start (kick off CV tracking stream)
trackingRoutes.post('/start', TrackingController.startTracking);

// POST /api/v1/tracking/upload-video (multipart/form-data video upload + background YOLO tracking)
trackingRoutes.post('/upload-video', upload.single('video'), TrackingController.uploadVideo);

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

