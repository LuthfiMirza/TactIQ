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

      const response: ApiResponse<StandingDTO[]> = {
        success: true,
        data: dtos,
        timestamp: new Date().toISOString(),
        meta: {
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

      const response: ApiResponse<FixtureDTO[]> = {
        success: true,
        data: fixtureDTOs,
        timestamp: new Date().toISOString(),
        meta: {
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

      const response: ApiResponse<H2HDTO> = {
        success: true,
        data: h2hDTO,
        timestamp: new Date().toISOString(),
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

      const response: ApiResponse<MatchPredictionResponse> = {
        success: true,
        data: prediction,
        timestamp: new Date().toISOString(),
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
}
