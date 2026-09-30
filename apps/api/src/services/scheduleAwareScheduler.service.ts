import { prisma } from './prisma.service.js';
import { getFootballDataProvider } from '../providers/index.js';
import { io } from '../websocket/socket.server.js';
import { LiveScoreMatch } from './apiFootball.service.js';
import { DataProvenanceMeta } from '@tactiq/shared-types';

export interface SchedulerStatus {
  trackedLeagues: number[];
  inLiveWindow: boolean;
  activeMatchWindows: Array<{
    fixtureId: string;
    match: string;
    kickoff: string;
    remainingWindowSeconds: number;
  }>;
  totalRemainingLiveSecondsToday: number;
  remainingQuota: number | 'unknown';
  usableQuota: number;
  fixedBudget: number;
  safetyBuffer: number;
  isPollingLimited: boolean;
  isDataStale: boolean;
  currentIntervalSeconds: number;
  activeListenersCount: number;
  lastSyncDate: string | null;
  singleFlightActive: boolean;
}

export class ScheduleAwareSchedulerService {
  private static instance: ScheduleAwareSchedulerService;

  public trackedLeagues: number[] = [39, 140, 2]; // Premier League, La Liga, UCL
  private currentIntervalSeconds = 60;
  private minIntervalSeconds = 60;
  public readonly fixedBudget = 15; // 5 schedule + 10 match details (lineups/events/stats)
  public readonly safetyBuffer = 5;
  public get totalReservedBudget(): number {
    return this.fixedBudget + this.safetyBuffer;
  }

  public isPollingLimited = false;
  public isDataStale = false;

  private pollTimer: NodeJS.Timeout | null = null;
  private dailySyncTimer: NodeJS.Timeout | null = null;

  private isRunning = false;
  private lastSyncDate: string | null = null;
  private inFlightPromise: Promise<{ data: LiveScoreMatch[]; meta: DataProvenanceMeta }> | null = null;

  private constructor() {
    this.startScheduler();
  }

  public static getInstance(): ScheduleAwareSchedulerService {
    if (!ScheduleAwareSchedulerService.instance) {
      ScheduleAwareSchedulerService.instance = new ScheduleAwareSchedulerService();
    }
    return ScheduleAwareSchedulerService.instance;
  }

  public startScheduler(): void {
    // 1. Initial daily schedule sync
    this.syncDailySchedules().catch((err) => {
      console.warn('⚠️ [Scheduler] Initial daily schedule sync failed:', err.message);
    });

    // 2. Schedule daily sync check every hour
    this.dailySyncTimer = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (this.lastSyncDate !== today) {
        this.syncDailySchedules().catch(() => {});
      }
    }, 3600 * 1000);
    this.dailySyncTimer.unref();

    // 3. Start adaptive live loop (runs tick every 15s to check windows and adjust intervals)
    this.pollTimer = setInterval(async () => {
      await this.tickAdaptiveCycle();
    }, 15 * 1000);
    this.pollTimer.unref();

    console.log('🕒 [ScheduleAwareScheduler] Initialized schedule-aware live window manager.');
  }

  /**
   * 1 request harian mengambil jadwal semua tracked_leagues ke DB
   */
  public async syncDailySchedules(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const provider = getFootballDataProvider();
    console.log(`📅 [Scheduler] Syncing daily schedule for leagues [${this.trackedLeagues.join(', ')}] on ${today}...`);

    for (const leagueId of this.trackedLeagues) {
      try {
        const fixturesRes = await provider.getFixtures(leagueId, 2024, today);
        if (fixturesRes.data && Array.isArray(fixturesRes.data)) {
          for (const item of fixturesRes.data) {
            await this.persistDailyFixture(item, provider.name);
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ [Scheduler] Failed to sync league ${leagueId} fixtures:`, err.message);
      }
    }

    this.lastSyncDate = today;
  }

  /**
   * Persists fixture & maps provider_fixture_map
   */
  public async persistDailyFixture(item: any, providerName: string): Promise<void> {
    try {
      const providerFixtureId = String(item.fixture?.id || item.id);
      const kickoff = new Date(item.fixture?.date || item.utcDate || item.date || Date.now());
      const homeName = item.teams?.home?.name || item.homeTeam?.name || 'Home Team';
      const awayName = item.teams?.away?.name || item.awayTeam?.name || 'Away Team';

      const matchKey = this.generateMatchKey(homeName, awayName, kickoff);

      // Attempt to find or map to internal fixture
      const internalMatchId = await this.resolveInternalFixture(homeName, awayName, kickoff);

      // Upsert into provider_fixture_map
      await prisma.providerFixtureMap.upsert({
        where: {
          provider_providerFixtureId: {
            provider: providerName,
            providerFixtureId,
          },
        },
        create: {
          provider: providerName,
          providerFixtureId,
          internalFixtureId: internalMatchId,
          matchKey,
          status: internalMatchId ? 'resolved' : 'unresolved',
          kickoff,
        },
        update: {
          internalFixtureId: internalMatchId,
          status: internalMatchId ? 'resolved' : 'unresolved',
          kickoff,
        },
      });
    } catch (e: any) {
      // Non-blocking mapping log
    }
  }

  public generateMatchKey(home: string, away: string, kickoff: Date): string {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
    const dateStr = kickoff.toISOString().slice(0, 10);
    return `${norm(home)}_${norm(away)}_${dateStr}`;
  }

  /**
   * Fuzzy / normalized matching for provider_fixture_map resolution.
   * If ambiguous (multiple fixtures found or uncertain match), records as unresolved.
   */
  public async resolveInternalFixture(homeName: string, awayName: string, kickoff: Date): Promise<string | null> {
    const startRange = new Date(kickoff.getTime() - 2 * 3600 * 1000);
    const endRange = new Date(kickoff.getTime() + 2 * 3600 * 1000);

    const candidates = await prisma.fixture.findMany({
      where: {
        matchDate: {
          gte: startRange,
          lte: endRange,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetH = norm(homeName);
    const targetA = norm(awayName);

    const matched = candidates.filter((c) => {
      const dbH = norm(c.homeTeam.name);
      const dbA = norm(c.awayTeam.name);
      return (
        (dbH.includes(targetH) || targetH.includes(dbH)) &&
        (dbA.includes(targetA) || targetA.includes(dbA))
      );
    });

    if (matched.length === 1) {
      return matched[0].id;
    }

    if (matched.length > 1) {
      console.warn(`⚠️ [Scheduler] Ambiguous fixture match for ${homeName} vs ${awayName}. Leaving unresolved.`);
      return null;
    }

    return null;
  }

  /**
   * Calculates total remaining live seconds across all matches today (UTC).
   * Live window for any match is [kickoff - 10m, kickoff + 125m].
   * If matches overlap, intervals are merged because a single /fixtures?live call
   * covers all active games simultaneously.
   */
  public async getRemainingLiveSecondsTodayUTC(): Promise<number> {
    const now = new Date();
    const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const minLookupDate = new Date(now.getTime() - 125 * 60 * 1000);

    try {
      const fixtures = await prisma.fixture.findMany({
        where: {
          matchDate: {
            gte: minLookupDate,
            lte: endOfTodayUTC,
          },
          status: {
            not: 'FINISHED',
          },
        },
        select: {
          id: true,
          matchDate: true,
        },
      });

      if (fixtures.length === 0) {
        return 0;
      }

      const rawIntervals: Array<[number, number]> = [];
      const nowMs = now.getTime();
      const endOfTodayMs = endOfTodayUTC.getTime();

      for (const f of fixtures) {
        const kickoffMs = f.matchDate.getTime();
        const windowStartMs = kickoffMs - 10 * 60 * 1000;
        const windowEndMs = kickoffMs + 125 * 60 * 1000;

        const startMs = Math.max(nowMs, windowStartMs);
        const endMs = Math.min(endOfTodayMs, windowEndMs);

        if (endMs > startMs) {
          rawIntervals.push([startMs, endMs]);
        }
      }

      if (rawIntervals.length === 0) {
        return 0;
      }

      // Merge overlapping intervals
      rawIntervals.sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [rawIntervals[0]];

      for (let i = 1; i < rawIntervals.length; i++) {
        const prev = merged[merged.length - 1];
        const curr = rawIntervals[i];

        if (curr[0] <= prev[1]) {
          prev[1] = Math.max(prev[1], curr[1]);
        } else {
          merged.push(curr);
        }
      }

      const totalMs = merged.reduce((sum, [start, end]) => sum + (end - start), 0);
      return Math.floor(totalMs / 1000);
    } catch (e: any) {
      return 0;
    }
  }

  /**
   * Adaptive Live Tick (Requirement C)
   */
  public async tickAdaptiveCycle(): Promise<void> {
    if (this.isRunning) return;

    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const windows = await this.getActiveMatchWindows();

    // 1. If not in live window, skip polling completely
    if (isLive && windows.length === 0) {
      return;
    }

    // 2. Check connected listeners
    const activeListeners = this.getActiveListenersCount();
    if (isLive && activeListeners === 0) {
      return;
    }

    const provider = getFootballDataProvider('live');
    const health = provider.getHealthStatus();
    const rawQuota = health.remainingQuota;
    const numericQuota = typeof rawQuota === 'number' ? rawQuota : 0;
    const usableQuota = numericQuota - this.totalReservedBudget;

    // 3. Tangani sisaKuota - cadangan <= 0 (jangan bagi nol):
    // Saat itu hentikan polling live dan tandai isStale/limited.
    if (usableQuota <= 0) {
      this.isPollingLimited = true;
      this.isDataStale = true;
      this.currentIntervalSeconds = 3600;
      console.warn(
        `🛑 [Scheduler] Live polling stopped: Quota depleted or reserved (${numericQuota} remaining <= ${this.totalReservedBudget} reserved). Data marked as stale/limited.`
      );

      if (io) {
        io.emit('match_score_update', [], {
          source: provider.name,
          fetchedAt: new Date().toISOString(),
          isStale: true,
          status: 'exhausted',
          reason: `Remaining quota (${numericQuota}) insufficient for reserved budget (${this.totalReservedBudget}). Polling halted.`,
          mode: isLive ? 'live' : 'demo',
        });
      }
      return;
    }

    this.isPollingLimited = false;
    this.isDataStale = false;

    // 4. Alokasikan kuota ke SEMUA jendela live yang tersisa hari ini (UTC)
    const totalRemainingLiveSeconds = await this.getRemainingLiveSecondsTodayUTC();
    const effectiveSeconds = totalRemainingLiveSeconds > 0 ? totalRemainingLiveSeconds : 5400;

    this.currentIntervalSeconds = this.calculateAdaptiveInterval(effectiveSeconds, usableQuota);

    this.isRunning = true;
    try {
      // 5. Single-flight polling
      const result = await this.fetchLiveScoresSingleFlight();

      if (result && result.data.length > 0) {
        for (const match of result.data) {
          const room = `match_${match.fixtureId}`;
          if (io) {
            io.to(room).emit('match_score_update', [match], result.meta);
          }
        }
      }
    } catch (e: any) {
      console.warn('⚠️ [Scheduler] Live polling error:', e.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Adaptive Interval Formula:
   * interval = max(minInterval, remainingLiveSecondsToday / (remainingQuota - reservedBudget))
   * Prevents division by zero when usableQuota <= 0.
   */
  public calculateAdaptiveInterval(remainingLiveSeconds: number, usableQuota: number): number {
    if (usableQuota <= 0) {
      return 3600;
    }
    const calculatedInterval = Math.floor(remainingLiveSeconds / usableQuota);
    return Math.max(this.minIntervalSeconds, calculatedInterval);
  }

  /**
   * Single-flight execution pattern:
   * All concurrent requests coalesce onto one in-flight promise
   */
  public async fetchLiveScoresSingleFlight(): Promise<{ data: LiveScoreMatch[]; meta: DataProvenanceMeta }> {
    if (this.inFlightPromise) {
      return this.inFlightPromise;
    }

    const provider = getFootballDataProvider('live');
    this.inFlightPromise = provider.getLiveScores(this.trackedLeagues).finally(() => {
      this.inFlightPromise = null;
    });

    return this.inFlightPromise;
  }

  public async getActiveMatchWindows(): Promise<Array<{
    fixtureId: string;
    match: string;
    kickoff: string;
    remainingWindowSeconds: number;
  }>> {
    const now = Date.now();
    // Live window: kickoff - 10m to kickoff + 125m
    const minStart = new Date(now - 125 * 60 * 1000);
    const maxEnd = new Date(now + 10 * 60 * 1000);

    const fixtures = await prisma.fixture.findMany({
      where: {
        matchDate: {
          gte: minStart,
          lte: maxEnd,
        },
        status: {
          not: 'FINISHED',
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    return fixtures.map((f) => {
      const endMs = f.matchDate.getTime() + 125 * 60 * 1000;
      const remainingSeconds = Math.max(0, Math.floor((endMs - now) / 1000));
      return {
        fixtureId: f.id,
        match: `${f.homeTeam.name} vs ${f.awayTeam.name}`,
        kickoff: f.matchDate.toISOString(),
        remainingWindowSeconds: remainingSeconds,
      };
    });
  }

  public getActiveListenersCount(): number {
    if (!io || !io.sockets.adapter) return 0;
    let count = 0;
    for (const [room, sids] of io.sockets.adapter.rooms.entries()) {
      if (room.startsWith('match_') || room === 'match_center') {
        count += sids.size;
      }
    }
    return count;
  }

  public getSchedulerStatus(): SchedulerStatus {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const provider = getFootballDataProvider('live');
    const health = provider.getHealthStatus();
    const rawQuota = health.remainingQuota;
    const numericQuota = typeof rawQuota === 'number' ? rawQuota : 0;
    const usableQuota = Math.max(0, numericQuota - this.totalReservedBudget);

    return {
      trackedLeagues: this.trackedLeagues,
      inLiveWindow: !isLive || false,
      activeMatchWindows: [],
      totalRemainingLiveSecondsToday: 0,
      remainingQuota: rawQuota,
      usableQuota,
      fixedBudget: this.fixedBudget,
      safetyBuffer: this.safetyBuffer,
      isPollingLimited: this.isPollingLimited,
      isDataStale: this.isDataStale,
      currentIntervalSeconds: this.currentIntervalSeconds,
      activeListenersCount: this.getActiveListenersCount(),
      lastSyncDate: this.lastSyncDate,
      singleFlightActive: this.inFlightPromise !== null,
    };
  }
}

export const scheduleAwareScheduler = ScheduleAwareSchedulerService.getInstance();
