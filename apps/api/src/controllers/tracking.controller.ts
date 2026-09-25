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

      res.json({
        success: true,
        data: session,
        timestamp: new Date().toISOString(),
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
}
