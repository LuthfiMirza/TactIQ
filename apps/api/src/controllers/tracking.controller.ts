import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { MLService } from '../services/ml.service.js';
import type {
  ApiResponse,
  VideoTrackingSessionDTO,
  TrackingStartRequest,
  TrackingStartResponse,
} from '@tactiq/shared-types';

export class TrackingController {
  /**
   * GET /api/v1/tracking/sessions
   * List available tracking video sessions
   */
  public static async getSessions(_req: Request, res: Response): Promise<void> {
    try {
      const sessions = await prisma.videoTrackingSession.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      const sessionDTOs: VideoTrackingSessionDTO[] = sessions.map((s) => ({
        id: s.id,
        youtubeUrl: s.youtubeUrl,
        matchTitle: s.matchTitle,
        status: s.status as any,
        durationSeconds: s.durationSeconds,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }));

      const response: ApiResponse<VideoTrackingSessionDTO[]> = {
        success: true,
        data: sessionDTOs,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'database-seed (Prisma tracking sessions)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
          total: sessionDTOs.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching tracking sessions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SESSIONS_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/tracking/sessions/:id
   * Get session metadata and pre-calculated frame coordinates
   */
  public static async getSessionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const session = await prisma.videoTrackingSession.findUnique({
        where: { id },
        include: {
          coordinates: {
            orderBy: {
              frameNumber: 'asc',
            },
          },
        },
      });

      if (!session) {
        res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Tracking session ${id} not found.`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const formattedCoordinates = session.coordinates.map((coord) => {
        const rawPlayers = Array.isArray(coord.playersData) ? (coord.playersData as any[]) : [];
        const normalizedEntities = rawPlayers.map((ent) => ({
          id: ent.id,
          team: ent.team || (ent.teamSide as 'home' | 'away' | 'ball') || 'home',
          x: ent.x !== undefined ? ent.x : (ent.xNorm ?? 0.5),
          y: ent.y !== undefined ? ent.y : (ent.yNorm ?? 0.5),
          speedKmh: ent.speedKmh ?? (ent.team === 'ball' || ent.teamSide === 'ball' ? 28.5 : 18.2),
          jerseyNumber: ent.jerseyNumber ?? (ent.id <= 20 ? ent.id : undefined),
        }));

        return {
          ...coord,
          playersData: normalizedEntities,
        };
      });

      res.json({
        success: true,
        data: {
          ...session,
          coordinates: formattedCoordinates,
        },
        timestamp: new Date().toISOString(),
        meta: {
          source: 'Precomputed 2D Planar Coordinates (database-seed)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      });
    } catch (error) {
      console.error('Error fetching session details:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SESSION_DETAILS_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/tracking/start
   * Proxies start-tracking request to ML service to kick off real-time CV pipeline
   */
  public static async startTracking(req: Request, res: Response): Promise<void> {
    try {
      const payload: TrackingStartRequest = req.body;

      if (!payload.session_id || !payload.youtube_url) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'session_id and youtube_url are required.',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await MLService.startTracking(payload);

      const response: ApiResponse<TrackingStartResponse> = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'TactIQ ML Tracking Pipeline (FastAPI / Redis)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error starting tracking:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRACKING_START_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/tracking/homography/calibrate-lines
   * [TSK-31] Dynamic Homography Calibration via Deteksi Garis Lapangan
   */
  public static async calibrateFieldLines(req: Request, res: Response): Promise<void> {
    try {
      const { video_path, frame_index } = req.body || {};
      const result = await MLService.calibrateFieldLines({ video_path, frame_index });

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'TactIQ ML Field Line & Homography Engine (TSK-31)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
        },
      });
    } catch (error) {
      console.error('Error in calibrateFieldLines:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HOMOGRAPHY_CALIBRATION_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/tracking/homography/calibrate-manual
   * [TSK-20 / TSK-31] 4-Point Manual Homography Re-Anchoring
   */
  public static async calibrateManual(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      if (!payload.camera_points || payload.camera_points.length !== 4) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_POINTS',
            message: 'Exactly 4 camera coordinate points are required [TL, TR, BR, BL].',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await MLService.calibrateHomographyManual(payload);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in calibrateManual:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MANUAL_CALIBRATION_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/tracking/homography/status
   * Returns current active homography calibration state and diagnostics
   */
  public static async getHomographyStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await MLService.getHomographyStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in getHomographyStatus:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HOMOGRAPHY_STATUS_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/tracking/homography/transform
   * Transforms camera perspective points to 2D pitch coordinates
   */
  public static async transformCoordinates(req: Request, res: Response): Promise<void> {
    try {
      const { points } = req.body;
      if (!Array.isArray(points)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_POINTS',
            message: 'Points must be an array of { camera_x, camera_y }',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await MLService.transformCoordinates(points);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in transformCoordinates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HOMOGRAPHY_TRANSFORM_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}

