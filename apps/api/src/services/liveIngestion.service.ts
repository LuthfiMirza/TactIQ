import { getFootballDataProvider } from '../providers/index.js';
import { prisma } from './prisma.service.js';
import { io } from '../websocket/socket.server.js';
import {
  DataProvenanceMeta,
  HomeTickerItemDTO,
  MatchEventDTO,
  MatchLineupBundleDTO,
  MatchStatsBundleDTO,
  MatchInjuryDTO,
} from '@tactiq/shared-types';

export class LiveIngestionService {
  private static instance: LiveIngestionService;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling = false;

  private constructor() {
    this.startSmartPollingWorker();
  }

  public static getInstance(): LiveIngestionService {
    if (!LiveIngestionService.instance) {
      LiveIngestionService.instance = new LiveIngestionService();
    }
    return LiveIngestionService.instance;
  }

  /**
   * Adaptive Smart Polling Worker
   * Only triggers remote API requests when active WebSocket clients are listening
   */
  public startSmartPollingWorker(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    // Interval: 90 seconds in-play polling
    const intervalMs = 90 * 1000;

    this.pollingTimer = setInterval(async () => {
      await this.runAdaptiveCycle();
    }, intervalMs);
    this.pollingTimer.unref();

    console.log('📡 [LiveIngestionService] Adaptive Smart Polling worker initialized (90s cycle).');
  }

  public async runAdaptiveCycle(): Promise<void> {
    if (this.isPolling) return;

    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const activeRooms = this.getActiveMatchRooms();

    // In live mode, only poll if clients are actively viewing match center
    if (isLiveMode && activeRooms.length === 0) {
      // No active users watching -> conserve daily 100 request quota!
      return;
    }

    this.isPolling = true;
    try {
      const provider = getFootballDataProvider();
      // Target leagues: Premier League (39), La Liga (140), Champions League (2)
      const targetLeagues = [39, 140, 2];
      const result = await provider.getLiveScores(targetLeagues);

      if (result.data.length > 0) {
        // Broadcast updates to rooms
        for (const match of result.data) {
          const roomName = `match_${match.fixtureId}`;
          if (io) {
            io.to(roomName).emit('match_score_update', [match], result.meta);
          }

          // In live mode, persist to database if matching fixture exists or create entry
          if (isLiveMode) {
            await this.persistLiveScore(match, result.meta);
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ [LiveIngestionService] Polling cycle error:', err.message);
    } finally {
      this.isPolling = false;
    }
  }

  private getActiveMatchRooms(): string[] {
    if (!io) return [];
    const rooms: string[] = [];
    const adapter = io.sockets.adapter;
    if (adapter && adapter.rooms) {
      for (const [room] of adapter.rooms.entries()) {
        if (room.startsWith('match_') || room === 'match_center') {
          rooms.push(room);
        }
      }
    }
    return rooms;
  }

  private async persistLiveScore(match: any, meta: DataProvenanceMeta): Promise<void> {
    try {
      const fixture = await prisma.fixture.findFirst({
        where: {
          OR: [
            { externalId: match.fixtureId },
            { id: match.fixtureId },
          ],
        },
      });

      if (fixture) {
        await prisma.fixture.update({
          where: { id: fixture.id },
          data: {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status === 'FT' ? 'FINISHED' : 'LIVE',
            isStale: meta.isStale,
            fetchedAt: new Date(meta.fetchedAt),
            source: meta.source,
          },
        });
      }
    } catch (e) {
      // Ignore persistence collision
    }
  }

  /**
   * Home Ticker Fixtures Feed
   */
  public async getHomeTicker(): Promise<{ data: HomeTickerItemDTO[]; meta: DataProvenanceMeta }> {
    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider();

    if (isLiveMode) {
      const liveRes = await provider.getLiveScores([39, 140, 2]);

      if (liveRes.data.length > 0) {
        const items: HomeTickerItemDTO[] = liveRes.data.map((m) => ({
          fixtureId: m.fixtureId,
          league: m.league,
          homeTeam: m.homeTeam,
          homeScore: m.homeScore,
          homeLogo: m.homeLogo,
          awayTeam: m.awayTeam,
          awayScore: m.awayScore,
          awayLogo: m.awayLogo,
          status: m.status === 'UPCOMING' ? 'SCHEDULED' : m.status,
          minute: m.minute,
          matchDate: new Date().toISOString(),
          mode: 'live',
        }));

        return { data: items, meta: liveRes.meta };
      }

      // If no live matches currently in progress, fetch today's fixtures or upcoming
      const fixturesRes = await provider.getFixtures(39, 2024);
      if (fixturesRes.data.length > 0) {
        const items: HomeTickerItemDTO[] = fixturesRes.data.slice(0, 10).map((f: any) => ({
          fixtureId: String(f.fixture?.id || f.id),
          league: f.league?.name || 'Premier League',
          homeTeam: f.teams?.home?.name || 'Home Team',
          homeScore: f.goals?.home ?? null,
          homeLogo: f.teams?.home?.logo,
          awayTeam: f.teams?.away?.name || 'Away Team',
          awayScore: f.goals?.away ?? null,
          awayLogo: f.teams?.away?.logo,
          status: f.fixture?.status?.short === 'FT' ? 'FINISHED' : 'SCHEDULED',
          minute: f.fixture?.status?.elapsed ?? 0,
          matchDate: f.fixture?.date || new Date().toISOString(),
          mode: 'live',
        }));

        return { data: items, meta: fixturesRes.meta };
      }
    }

    // Fallback in demo mode or when no live provider available
    const dbFixtures = await prisma.fixture.findMany({
      take: 8,
      orderBy: { matchDate: 'desc' },
      include: { homeTeam: true, awayTeam: true },
    });

    const items: HomeTickerItemDTO[] = dbFixtures.map((f) => ({
      fixtureId: f.id,
      league: f.homeTeam.league,
      homeTeam: f.homeTeam.name,
      homeScore: f.homeScore,
      homeLogo: f.homeTeam.logoUrl,
      awayTeam: f.awayTeam.name,
      awayScore: f.awayScore,
      awayLogo: f.awayTeam.logoUrl,
      status: f.status,
      minute: f.status === 'LIVE' ? 74 : 90,
      matchDate: f.matchDate.toISOString(),
      mode: 'demo',
    }));

    return {
      data: items,
      meta: {
        source: 'database-seed',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo',
      },
    };
  }

  /**
   * Match Events
   */
  public async getMatchEvents(fixtureId: string): Promise<{ data: MatchEventDTO[]; meta: DataProvenanceMeta }> {
    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider();

    if (isLiveMode && /^\d+$/.test(fixtureId)) {
      const res = await provider.getMatchEvents(fixtureId);
      // Persist to DB if valid fixture
      if (res.data.length > 0) {
        this.persistEventsToDb(fixtureId, res.data).catch(() => {});
      }
      return res;
    }

    // Query DB for stored events
    const dbEvents = await prisma.matchEvent.findMany({
      where: { fixtureId },
      orderBy: { minute: 'asc' },
    });

    if (dbEvents.length > 0) {
      return {
        data: dbEvents.map((e) => ({
          id: e.id,
          fixtureId: e.fixtureId,
          minute: e.minute,
          extraMinute: e.extraMinute,
          teamName: e.teamName,
          playerName: e.playerName,
          assistName: e.assistName,
          type: e.type,
          detail: e.detail,
          source: e.source,
        })),
        meta: {
          source: 'database (stored events)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: isLiveMode ? 'cached' : 'demo',
        },
      };
    }

    // In demo mode or if no stored events exist
    return {
      data: [],
      meta: {
        source: 'database-seed',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo',
        status: 'unavailable',
        reason: 'No match events recorded for this fixture',
      },
    };
  }

  private async persistEventsToDb(fixtureId: string, events: MatchEventDTO[]): Promise<void> {
    const fixture = await prisma.fixture.findFirst({
      where: { OR: [{ id: fixtureId }, { externalId: fixtureId }] },
    });
    if (!fixture) return;

    for (const evt of events) {
      await prisma.matchEvent.upsert({
        where: { id: evt.id },
        create: {
          id: evt.id,
          fixtureId: fixture.id,
          minute: evt.minute,
          extraMinute: evt.extraMinute,
          teamName: evt.teamName,
          playerName: evt.playerName,
          assistName: evt.assistName,
          type: evt.type,
          detail: evt.detail,
          source: evt.source,
        },
        update: {
          minute: evt.minute,
          extraMinute: evt.extraMinute,
          type: evt.type,
          detail: evt.detail,
        },
      });
    }
  }

  /**
   * Match Lineups
   */
  public async getMatchLineup(
    fixtureId: string,
    homeTeamName = '',
    awayTeamName = ''
  ): Promise<{ data: MatchLineupBundleDTO; meta: DataProvenanceMeta }> {
    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider();

    if (isLiveMode && /^\d+$/.test(fixtureId)) {
      return provider.getMatchLineup(fixtureId, homeTeamName, awayTeamName);
    }

    // Check DB for persisted lineup
    const dbLineups = await prisma.matchLineup.findMany({
      where: { fixtureId },
    });

    if (dbLineups.length >= 2) {
      const home = dbLineups.find((l) => l.teamSide === 'home');
      const away = dbLineups.find((l) => l.teamSide === 'away');
      return {
        data: {
          home: home
            ? {
                formation: home.formation,
                teamName: home.teamName,
                coachName: home.coachName,
                startXI: home.startXI as any,
                substitutes: home.substitutes as any,
              }
            : null,
          away: away
            ? {
                formation: away.formation,
                teamName: away.teamName,
                coachName: away.coachName,
                startXI: away.startXI as any,
                substitutes: away.substitutes as any,
              }
            : null,
        },
        meta: {
          source: 'database (stored lineups)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: isLiveMode ? 'cached' : 'demo',
        },
      };
    }

    return {
      data: { home: null, away: null },
      meta: {
        source: 'database-seed',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo',
        status: 'unavailable',
        reason: 'Lineup not available or match not started',
      },
    };
  }

  /**
   * Match Statistics
   */
  public async getMatchStatistics(
    fixtureId: string,
    homeTeamName = '',
    awayTeamName = ''
  ): Promise<{ data: MatchStatsBundleDTO; meta: DataProvenanceMeta }> {
    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider();

    if (isLiveMode && /^\d+$/.test(fixtureId)) {
      return provider.getMatchStatistics(fixtureId, homeTeamName, awayTeamName);
    }

    // Check DB
    const dbStats = await prisma.matchStatistic.findFirst({
      where: { fixtureId, period: 'ALL' },
    });

    if (dbStats) {
      return {
        data: {
          period: dbStats.period,
          top: (dbStats.homeStats as any)?.top || [],
          shots: (dbStats.homeStats as any)?.shots || [],
          passes: (dbStats.homeStats as any)?.passes || [],
          defence: (dbStats.homeStats as any)?.defence || [],
        },
        meta: {
          source: 'database (stored statistics)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: isLiveMode ? 'cached' : 'demo',
        },
      };
    }

    return {
      data: { period: 'ALL', top: [], shots: [], passes: [], defence: [] },
      meta: {
        source: 'database-seed',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo',
        status: 'unavailable',
        reason: 'Match statistics not provided for this fixture',
      },
    };
  }

  /**
   * Match Injuries & Absentees
   */
  public async getMatchInjuries(fixtureId: string): Promise<{ data: MatchInjuryDTO[]; meta: DataProvenanceMeta }> {
    const isLiveMode = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider();

    if (isLiveMode && /^\d+$/.test(fixtureId)) {
      return provider.getMatchInjuries(fixtureId);
    }

    // Check DB
    const dbInjuries = await prisma.matchInjury.findMany({
      where: { fixtureId },
    });

    if (dbInjuries.length > 0) {
      return {
        data: dbInjuries.map((i) => ({
          teamName: i.teamName,
          playerName: i.playerName,
          type: i.type,
          reason: i.reason,
          source: i.source,
        })),
        meta: {
          source: 'database (stored injuries)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: isLiveMode ? 'cached' : 'demo',
        },
      };
    }

    return {
      data: [],
      meta: {
        source: 'database-seed',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'demo',
        status: 'unavailable',
        reason: 'Injury/absentee data unavailable from provider (no static Transfermarkt fallback)',
      },
    };
  }
}

export const liveIngestionService = LiveIngestionService.getInstance();
