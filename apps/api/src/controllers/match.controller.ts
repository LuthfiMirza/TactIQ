import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { MLService } from '../services/ml.service.js';
import type {
  FixtureDTO,
  H2HDTO,
  StandingDTO,
  ApiResponse,
  MatchPredictionResponse,
  MatchPredictRequest,
} from '@tactiq/shared-types';

export class MatchController {
  /**
   * GET /api/v1/matches/standings
   * Returns league table standings
   */
  public static async getStandings(_req: Request, res: Response): Promise<void> {
    try {
      const standings = await prisma.standing.findMany({
        where: {
          team: {
            league: 'Premier League',
          },
        },
        include: {
          team: true,
        },
        orderBy: {
          position: 'asc',
        },
      });

      const dtos: StandingDTO[] = standings.map((s) => ({
        id: s.id,
        teamId: s.teamId,
        team: s.team,
        position: s.position,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference: s.goalDifference,
        points: s.points,
      }));

      const currentMode = (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo';

      const response: ApiResponse<StandingDTO[]> = {
        success: true,
        data: dtos,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'database-seed / Football-Data.org',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: currentMode,
          total: dtos.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching standings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STANDINGS_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/fixtures
   * Returns list of scheduled and recent fixtures with home/away teams
   */
  public static async getFixtures(_req: Request, res: Response): Promise<void> {
    try {
      const fixtures = await prisma.fixture.findMany({
        include: {
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: {
          matchDate: 'asc',
        },
      });

      const fixtureDTOs: FixtureDTO[] = fixtures.map((f) => ({
        id: f.id,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        matchDate: f.matchDate.toISOString(),
        status: f.status as any,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        venue: f.venue,
      }));

      const currentMode = (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo';

      const response: ApiResponse<FixtureDTO[]> = {
        success: true,
        data: fixtureDTOs,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'database-seed / Football-Data.org',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: currentMode,
          total: fixtureDTOs.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FIXTURES_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/h2h/:homeId/:awayId
   * Returns head-to-head metrics and past encounters
   */
  public static async getH2H(req: Request, res: Response): Promise<void> {
    try {
      const { homeId, awayId } = req.params;

      let h2h = await prisma.h2H.findFirst({
        where: {
          OR: [
            { teamHomeId: homeId, teamAwayId: awayId },
            { teamHomeId: awayId, teamAwayId: homeId },
          ],
        },
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      });

      // If no recorded H2H in DB, return a default mock H2H
      const h2hDTO: H2HDTO = h2h
        ? {
            id: h2h.id,
            teamHomeId: h2h.teamHomeId,
            teamAwayId: h2h.teamAwayId,
            homeTeam: h2h.homeTeam,
            awayTeam: h2h.awayTeam,
            matchesPlayed: h2h.matchesPlayed,
            homeWins: h2h.homeWins,
            awayWins: h2h.awayWins,
            draws: h2h.draws,
          }
        : {
            id: `h2h-${homeId}-${awayId}`,
            teamHomeId: homeId,
            teamAwayId: awayId,
            matchesPlayed: 10,
            homeWins: 4,
            awayWins: 3,
            draws: 3,
          };

      const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';

      const response: ApiResponse<H2HDTO> = {
        success: true,
        data: h2hDTO,
        timestamp: new Date().toISOString(),
        meta: {
          source: h2h ? 'database-seed' : 'TactIQ Demo Engine',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: isLiveMode && h2h ? 'live' : 'demo',
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching H2H:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'H2H_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/matches/predict
   * Forwards match prediction request to FastAPI ML service
   */
  public static async predictMatch(req: Request, res: Response): Promise<void> {
    try {
      const payload: MatchPredictRequest = req.body;

      if (!payload.fixtureId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'fixtureId is required for match prediction.',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const prediction = await MLService.predictMatch(payload);

      const predictionData: MatchPredictionResponse = {
        ...prediction,
        modelType: 'DEMO MODEL (RandomForest on Synthetic Data)',
        xGType: 'Estimated xG (model)',
      };

      const response: ApiResponse<MatchPredictionResponse> = {
        success: true,
        data: predictionData,
        timestamp: new Date().toISOString(),
        meta: {
          source: 'RandomForest (services/ml synthetic)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error predicting match:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PREDICTION_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/live/scores
   * Live in-play scores via API-Football or dynamic LiveMatchEngine
   */
  public static async getLiveScores(_req: Request, res: Response): Promise<void> {
    try {
      const { ApiFootballService } = await import('../services/apiFootball.service.js');
      const liveMatches = await ApiFootballService.getLiveScores();
      const currentMode = (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo';

      res.json({
        success: true,
        data: liveMatches,
        timestamp: new Date().toISOString(),
        meta: {
          source: currentMode === 'live' ? 'API-Football Live API' : 'TactIQ LiveMatchEngine',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: currentMode,
          total: liveMatches.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'LIVE_SCORES_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/matches/live/simulate-event
   * Manually trigger a goal or event on a live match and broadcast via WebSocket
   */
  public static async simulateLiveEvent(req: Request, res: Response): Promise<void> {
    try {
      const { LiveMatchEngineService } = await import('../services/liveMatchEngine.service.js');
      const { fixtureId, team, player, detail } = req.body || {};
      const result = LiveMatchEngineService.simulateGoal(
        fixtureId || '1583654',
        team === 'home' ? 'home' : 'away',
        player,
        detail
      );

      res.json({
        success: true,
        data: result,
        message: `Simulated event triggered for ${result.match.homeTeam} vs ${result.match.awayTeam}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'SIMULATE_EVENT_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/matches/live/advance-minute
   * Advance minute on live match
   */
  public static async advanceLiveMinute(req: Request, res: Response): Promise<void> {
    try {
      const { LiveMatchEngineService } = await import('../services/liveMatchEngine.service.js');
      const { fixtureId, minutes } = req.body || {};
      const updated = LiveMatchEngineService.advanceMinute(fixtureId, minutes || 2);

      res.json({
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'ADVANCE_MINUTE_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * POST /api/v1/matches/live/reset
   * Reset match back to starting state
   */
  public static async resetLiveMatch(req: Request, res: Response): Promise<void> {
    try {
      const { LiveMatchEngineService } = await import('../services/liveMatchEngine.service.js');
      const { fixtureId } = req.body || {};
      const reset = LiveMatchEngineService.resetMatch(fixtureId);

      res.json({
        success: true,
        data: reset,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'RESET_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/home-ticker
   * Live in-play or scheduled fixtures for top marquee
   */
  public static async getHomeTicker(_req: Request, res: Response): Promise<void> {
    try {
      const { liveIngestionService } = await import('../services/liveIngestion.service.js');
      const result = await liveIngestionService.getHomeTicker();
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        meta: result.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'HOME_TICKER_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/:id/events
   * Real match timeline events (goals, cards, substitutions, VAR)
   */
  public static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const { liveIngestionService } = await import('../services/liveIngestion.service.js');
      const result = await liveIngestionService.getMatchEvents(req.params.id);
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        meta: result.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'EVENTS_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/:id/lineup
   * Confirmed tactical lineups (formations, startXI, subs)
   */
  public static async getLineup(req: Request, res: Response): Promise<void> {
    try {
      const { liveIngestionService } = await import('../services/liveIngestion.service.js');
      const homeName = (req.query.home as string) || '';
      const awayName = (req.query.away as string) || '';
      const result = await liveIngestionService.getMatchLineup(req.params.id, homeName, awayName);

      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        meta: result.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'LINEUP_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/preview/absentees & GET /api/v1/matches/:id/absentees
   * Real provider injury and suspension intelligence (no static mock array)
   */
  public static async getAbsentees(req: Request, res: Response): Promise<void> {
    try {
      const { liveIngestionService } = await import('../services/liveIngestion.service.js');
      const fixtureId = (req.query.fixtureId as string) || (req.query.id as string) || req.params.id;

      if (fixtureId) {
        const result = await liveIngestionService.getMatchInjuries(fixtureId);
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
          meta: result.meta,
        });
        return;
      }

      // No fixture provided: honestly state unavailable without static mock
      res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo',
          status: 'unavailable',
          reason: 'Specify fixtureId parameter to query live injury data. Static Transfermarkt mock data has been deprecated.',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'ABSENTEES_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/:id/statistics
   * Live match statistics (possession, shots, passes, defence)
   */
  public static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { liveIngestionService } = await import('../services/liveIngestion.service.js');
      const homeName = (req.query.home as string) || '';
      const awayName = (req.query.away as string) || '';
      const result = await liveIngestionService.getMatchStatistics(req.params.id, homeName, awayName);

      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        meta: result.meta,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'STATS_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/matches/:id/h2h
   * Historical head to head encounters & record
   */
  public static async getFixtureH2H(req: Request, res: Response): Promise<void> {
    try {
      const { ApiFootballService } = await import('../services/apiFootball.service.js');
      const h2hCode = (req.query.h2h as string) || undefined;
      const homeName = (req.query.home as string) || 'Home Team';
      const awayName = (req.query.away as string) || 'Away Team';
      const h2h = await ApiFootballService.getMatchH2H(h2hCode, homeName, awayName);
      const mode = (process.env.DATA_MODE || 'demo') === 'live' ? 'live' : 'demo';

      res.json({
        success: true,
        data: h2h,
        timestamp: new Date().toISOString(),
        meta: {
          source: mode === 'live' ? 'API-Football H2H API' : 'TactIQ H2H Archive',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: { code: 'H2H_FAILED', message: (error as Error).message },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
