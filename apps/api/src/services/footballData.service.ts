import { prisma } from './prisma.service.js';
import { MatchStatus } from '@prisma/client';

export interface FootballDataStandingItem {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FootballDataMatchItem {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
  venue?: string;
}

export class FootballDataService {
  private static readonly BASE_URL = 'https://api.football-data.org/v4';

  /**
   * Sync Premier League Standings from Football-Data.org into PostgreSQL
   */
  public static async syncStandings(competitionCode = 'PL'): Promise<number> {
    const token = process.env.FOOTBALL_DATA_TOKEN;

    if (!token) {
      console.log('ℹ️ [FootballData.org] No FOOTBALL_DATA_TOKEN provided in .env. Keeping cached 20-team table.');
      return 0;
    }

    try {
      console.log(`🌐 [FootballData.org] Fetching live standings for competition: ${competitionCode}...`);
      const response = await fetch(`${this.BASE_URL}/competitions/${competitionCode}/standings`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ [FootballData.org] API returned HTTP ${response.status}: ${response.statusText}`);
        return 0;
      }

      const json = (await response.json()) as any;
      const standingsTable = (json?.standings?.[0]?.table as FootballDataStandingItem[]) || [];

      if (!Array.isArray(standingsTable) || standingsTable.length === 0) {
        console.warn('⚠️ [FootballData.org] No standings table found in API response.');
        return 0;
      }

      let count = 0;
      for (const row of standingsTable) {
        const teamCode = (row.team.tla || row.team.shortName.slice(0, 3)).toUpperCase();
        const teamId = `team-${teamCode.toLowerCase()}`;

        // Ensure team exists
        await prisma.team.upsert({
          where: { id: teamId },
          update: {
            name: row.team.name,
            code: teamCode,
            logoUrl: row.team.crest || undefined,
            league: 'Premier League',
          },
          create: {
            id: teamId,
            name: row.team.name,
            code: teamCode,
            logoUrl: row.team.crest || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=128&q=80',
            league: 'Premier League',
          },
        });

        // Upsert standing record
        await prisma.standing.upsert({
          where: { teamId },
          update: {
            position: row.position,
            played: row.playedGames,
            won: row.won,
            drawn: row.draw,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            goalDifference: row.goalDifference,
            points: row.points,
          },
          create: {
            teamId,
            position: row.position,
            played: row.playedGames,
            won: row.won,
            drawn: row.draw,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            goalDifference: row.goalDifference,
            points: row.points,
          },
        });

        count++;
      }

      console.log(`✅ [FootballData.org] Successfully updated ${count} standings rows.`);
      return count;
    } catch (error) {
      console.error('❌ [FootballData.org] Standings sync failed:', error);
      return 0;
    }
  }

  /**
   * Sync Match Fixtures from Football-Data.org into PostgreSQL
   */
  public static async syncFixtures(competitionCode = 'PL'): Promise<number> {
    const token = process.env.FOOTBALL_DATA_TOKEN;

    if (!token) {
      return 0;
    }

    try {
      console.log(`🌐 [FootballData.org] Fetching live fixtures for competition: ${competitionCode}...`);
      const response = await fetch(`${this.BASE_URL}/competitions/${competitionCode}/matches?status=SCHEDULED,LIVE,FINISHED`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ [FootballData.org] Fixtures API returned HTTP ${response.status}`);
        return 0;
      }

      const json = (await response.json()) as any;
      const matches = (json?.matches as FootballDataMatchItem[]) || [];

      if (!Array.isArray(matches) || matches.length === 0) {
        return 0;
      }

      let count = 0;
      // Ingest latest/upcoming 10 matches
      const targetMatches = matches.slice(-10);

      for (const m of targetMatches) {
        const homeCode = (m.homeTeam.tla || m.homeTeam.shortName.slice(0, 3)).toUpperCase();
        const awayCode = (m.awayTeam.tla || m.awayTeam.shortName.slice(0, 3)).toUpperCase();
        const homeTeamId = `team-${homeCode.toLowerCase()}`;
        const awayTeamId = `team-${awayCode.toLowerCase()}`;
        const fixtureId = `fix-fdo-${m.id}`;

        let status: MatchStatus = MatchStatus.SCHEDULED;
        if (m.status === 'IN_PLAY' || m.status === 'PAUSED') status = MatchStatus.LIVE;
        else if (m.status === 'FINISHED') status = MatchStatus.FINISHED;

        await prisma.fixture.upsert({
          where: { id: fixtureId },
          update: {
            status,
            homeScore: m.score.fullTime.home,
            awayScore: m.score.fullTime.away,
            matchDate: new Date(m.utcDate),
          },
          create: {
            id: fixtureId,
            homeTeamId,
            awayTeamId,
            matchDate: new Date(m.utcDate),
            status,
            homeScore: m.score.fullTime.home,
            awayScore: m.score.fullTime.away,
            venue: m.venue || `${m.homeTeam.name} Stadium`,
          },
        });

        count++;
      }

      console.log(`✅ [FootballData.org] Successfully updated ${count} live fixtures.`);
      return count;
    } catch (error) {
      console.error('❌ [FootballData.org] Fixtures sync failed:', error);
      return 0;
    }
  }
}
