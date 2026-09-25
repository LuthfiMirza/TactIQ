import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service.js';
import { MLService } from '../services/ml.service.js';
import { Position } from '@prisma/client';
import type { PlayerDTO, ApiResponse, PlayerSimilarityResponse } from '@tactiq/shared-types';

export class PlayerController {
  /**
   * GET /api/v1/players
   * Search and multi-criteria filtering: position, league, minPassing, minPace, search
   */
  public static async getPlayers(req: Request, res: Response): Promise<void> {
    try {
      const position = req.query.position as Position | undefined;
      const league = req.query.league as string | undefined;
      const minPassing = req.query.minPassing ? parseInt(req.query.minPassing as string, 10) : undefined;
      const minPace = req.query.minPace ? parseInt(req.query.minPace as string, 10) : undefined;
      const search = req.query.search as string | undefined;

      // Construct Prisma filter query
      const whereClause: any = {};

      if (position && ['GK', 'DEF', 'MID', 'FWD'].includes(position)) {
        whereClause.position = position;
      }

      if (search) {
        whereClause.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (league) {
        whereClause.team = {
          league: {
            contains: league,
            mode: 'insensitive',
          },
        };
      }

      if (minPassing !== undefined || minPace !== undefined) {
        whereClause.attributes = {
          ...(minPassing !== undefined ? { passing: { gte: minPassing } } : {}),
          ...(minPace !== undefined ? { pace: { gte: minPace } } : {}),
        };
      }

      const players = await prisma.player.findMany({
        where: whereClause,
        include: {
          team: true,
          attributes: true,
        },
        orderBy: {
          marketValue: 'desc',
        },
      });

      const playerDTOs: PlayerDTO[] = players.map((p) => ({
        id: p.id,
        teamId: p.teamId,
        name: p.name,
        position: p.position as any,
        nationality: p.nationality,
        age: p.age,
        marketValue: p.marketValue,
        photoUrl: p.photoUrl,
        team: p.team
          ? {
              id: p.team.id,
              name: p.team.name,
              code: p.team.code,
              logoUrl: p.team.logoUrl,
              league: p.team.league,
            }
          : undefined,
        attributes: p.attributes
          ? {
              pace: p.attributes.pace,
              shooting: p.attributes.shooting,
              passing: p.attributes.passing,
              dribbling: p.attributes.dribbling,
              defending: p.attributes.defending,
              physical: p.attributes.physical,
              vision: p.attributes.vision,
            }
          : undefined,
      }));

      const response: ApiResponse<PlayerDTO[]> = {
        success: true,
        data: playerDTOs,
        timestamp: new Date().toISOString(),
        meta: {
          total: playerDTOs.length,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PLAYERS_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/players/:id
   * Fetch player bio and radar attributes
   */
  public static async getPlayerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const player = await prisma.player.findUnique({
        where: { id },
        include: {
          team: true,
          attributes: true,
        },
      });

      if (!player) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: `Player with id ${id} not found.`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const playerDTO: PlayerDTO = {
        id: player.id,
        teamId: player.teamId,
        name: player.name,
        position: player.position as any,
        nationality: player.nationality,
        age: player.age,
        marketValue: player.marketValue,
        photoUrl: player.photoUrl,
        team: player.team
          ? {
              id: player.team.id,
              name: player.team.name,
              code: player.team.code,
              logoUrl: player.team.logoUrl,
              league: player.team.league,
            }
          : undefined,
        attributes: player.attributes
          ? {
              pace: player.attributes.pace,
              shooting: player.attributes.shooting,
              passing: player.attributes.passing,
              dribbling: player.attributes.dribbling,
              defending: player.attributes.defending,
              physical: player.attributes.physical,
              vision: player.attributes.vision,
            }
          : undefined,
      };

      const response: ApiResponse<PlayerDTO> = {
        success: true,
        data: playerDTO,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching player by id:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PLAYER_FETCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * GET /api/v1/players/:id/similar
   * Forwards to ML Service player similarity endpoint with graceful heuristic fallback
   */
  public static async getSimilarPlayers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const target = await prisma.player.findUnique({
        where: { id },
        include: {
          team: true,
          attributes: true,
        },
      });

      if (!target || !target.attributes) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TARGET_PLAYER_INVALID',
            message: 'Target player not found or missing radar attributes.',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Fetch all candidate players in similar positions
      const candidates = await prisma.player.findMany({
        where: {
          id: { not: id },
        },
        include: {
          team: true,
          attributes: true,
        },
        take: 30,
      });

      const targetDTO: PlayerDTO = {
        id: target.id,
        teamId: target.teamId,
        name: target.name,
        position: target.position as any,
        nationality: target.nationality,
        age: target.age,
        marketValue: target.marketValue,
        photoUrl: target.photoUrl,
        team: target.team,
        attributes: target.attributes,
      };

      const candidateDTOs: PlayerDTO[] = candidates.map((c) => ({
        id: c.id,
        teamId: c.teamId,
        name: c.name,
        position: c.position as any,
        nationality: c.nationality,
        age: c.age,
        marketValue: c.marketValue,
        photoUrl: c.photoUrl,
        team: c.team,
        attributes: c.attributes || undefined,
      }));

      const similarityResult = await MLService.getPlayerSimilarity(targetDTO, candidateDTOs);

      const response: ApiResponse<PlayerSimilarityResponse> = {
        success: true,
        data: similarityResult,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error finding similar players:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SIMILARITY_SEARCH_FAILED',
          message: (error as Error).message,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
