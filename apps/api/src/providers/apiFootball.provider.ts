import {
  FootballDataProvider,
  CircuitBreakerState,
  ProviderResult,
} from './footballDataProvider.interface.js';
import {
  ProviderCapabilities,
  ProviderHealthInfo,
  MatchEventDTO,
  MatchLineupBundleDTO,
  MatchStatsBundleDTO,
  MatchInjuryDTO,
} from '@tactiq/shared-types';
import { LiveScoreMatch } from '../services/apiFootball.service.js';
import { redisPublisher } from '../services/redis.service.js';

interface CacheEnvelope<T> {
  data: T;
  fetchedAt: string;
}

export class ApiFootballProvider implements FootballDataProvider {
  public readonly name = 'api-football';
  public readonly capabilities: ProviderCapabilities = {
    live: true,
    lineup: true,
    events: true,
    stats: true,
    injuries: true,
    delayed: false,
  };

  private static readonly BASE_URL = 'https://v3.football.api-sports.io';

  // In-memory fallback cache when Redis is unavailable
  private localCache = new Map<string, { payload: any; expiresAt: number; fetchedAt: string }>();

  // Token bucket and daily quota tracking
  private dailyRequests = 0;
  private remainingQuota = 100;
  private currentDayUTC = new Date().toISOString().slice(0, 10);
  private minuteRequestTimestamps: number[] = [];
  private lastError: string | null = null;
  private lastSync: string | null = null;
  private status: 'available' | 'unavailable' | 'exhausted' | 'demo' = 'demo';

  private circuitBreaker: CircuitBreakerState = {
    status: 'CLOSED',
    consecutiveFailures: 0,
    exhaustedUntil: null,
    lastError: null,
    lastAttemptAt: null,
  };

  constructor() {
    this.refreshQuotaDay();
  }

  private refreshQuotaDay(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.currentDayUTC !== today) {
      this.currentDayUTC = today;
      this.dailyRequests = 0;
      this.remainingQuota = 100;
      if (this.circuitBreaker.status === 'EXHAUSTED') {
        this.resetCircuitBreaker();
      }
    }
  }

  public getCircuitBreakerState(): CircuitBreakerState {
    this.checkCircuitBreakerReset();
    return { ...this.circuitBreaker };
  }

  public tripCircuitBreaker(reason: string, resetAt?: string): void {
    const until = resetAt || this.getNextUtcMidnight();
    this.circuitBreaker.status = 'EXHAUSTED';
    this.circuitBreaker.lastError = reason;
    this.circuitBreaker.exhaustedUntil = until;
    this.status = 'exhausted';
    this.lastError = reason;
    console.warn(`⚡ [ApiFootballProvider] Circuit breaker TRIPPED (EXHAUSTED). Reason: ${reason}. Reset at: ${until}`);
  }

  public resetCircuitBreaker(): void {
    this.circuitBreaker.status = 'CLOSED';
    this.circuitBreaker.consecutiveFailures = 0;
    this.circuitBreaker.exhaustedUntil = null;
    this.circuitBreaker.lastError = null;
    this.status = 'available';
    this.lastError = null;
    console.log(`🔌 [ApiFootballProvider] Circuit breaker RESET to CLOSED.`);
  }

  private checkCircuitBreakerReset(): void {
    if (this.circuitBreaker.status === 'EXHAUSTED' && this.circuitBreaker.exhaustedUntil) {
      if (new Date() >= new Date(this.circuitBreaker.exhaustedUntil)) {
        this.resetCircuitBreaker();
      }
    }
  }

  private getNextUtcMidnight(): string {
    const d = new Date();
    d.setUTCHours(24, 0, 0, 0);
    return d.toISOString();
  }

  public getHealthStatus(): ProviderHealthInfo {
    this.refreshQuotaDay();
    this.checkCircuitBreakerReset();
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!isLive) {
      return {
        provider: this.name,
        status: 'demo',
        capabilities: this.capabilities,
        remainingQuota: this.remainingQuota,
        dailyQuota: 100,
        resetAt: this.getNextUtcMidnight(),
        lastError: null,
        lastSync: this.lastSync,
      };
    }

    if (!apiKey) {
      return {
        provider: this.name,
        status: 'unavailable',
        capabilities: this.capabilities,
        remainingQuota: 0,
        dailyQuota: 100,
        resetAt: null,
        lastError: 'API_FOOTBALL_KEY is not configured in environment',
        lastSync: this.lastSync,
      };
    }

    return {
      provider: this.name,
      status: this.circuitBreaker.status === 'EXHAUSTED' ? 'exhausted' : this.status,
      capabilities: this.capabilities,
      remainingQuota: this.remainingQuota,
      dailyQuota: 100,
      resetAt: this.circuitBreaker.exhaustedUntil || this.getNextUtcMidnight(),
      lastError: this.lastError,
      lastSync: this.lastSync,
    };
  }

  /**
   * Rate limiting enforcement with Jittered Backoff
   */
  private async checkRateLimit(): Promise<{ allowed: boolean; reason?: string }> {
    this.refreshQuotaDay();

    if (this.dailyRequests >= 100) {
      this.status = 'unavailable';
      this.lastError = 'Daily quota of 100 requests reached (resets at 00:00 UTC)';
      return { allowed: false, reason: this.lastError };
    }

    const now = Date.now();
    // Keep timestamps from the last 60 seconds
    this.minuteRequestTimestamps = this.minuteRequestTimestamps.filter((t) => now - t < 60000);

    if (this.minuteRequestTimestamps.length >= 10) {
      // Exceeded 10 requests per minute
      const oldest = this.minuteRequestTimestamps[0];
      const waitMs = 60000 - (now - oldest) + Math.floor(Math.random() * 200); // add jitter
      console.warn(`⏳ [ApiFootballProvider] Rate limit reached (10 req/min). Waiting ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    this.minuteRequestTimestamps.push(Date.now());
    this.dailyRequests++;
    return { allowed: true };
  }

  /**
   * Universal Redis/In-memory caching helper
   */
  private async getCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
    try {
      if (redisPublisher && redisPublisher.status === 'ready') {
        const raw = await redisPublisher.get(`tactiq:cache:${key}`);
        if (raw) {
          return JSON.parse(raw) as CacheEnvelope<T>;
        }
      }
    } catch (e) {
      // Fall through to in-memory cache
    }

    const local = this.localCache.get(key);
    if (local && Date.now() < local.expiresAt) {
      return { data: local.payload as T, fetchedAt: local.fetchedAt };
    }
    return null;
  }

  private async setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const envelope: CacheEnvelope<T> = {
      data,
      fetchedAt: new Date().toISOString(),
    };

    try {
      if (redisPublisher && redisPublisher.status === 'ready') {
        await redisPublisher.setex(`tactiq:cache:${key}`, ttlSeconds, JSON.stringify(envelope));
      }
    } catch (e) {
      // Ignored for local fallback
    }

    this.localCache.set(key, {
      payload: data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      fetchedAt: envelope.fetchedAt,
    });
  }

  /**
   * HTTP Fetcher with exponential backoff & error handling
   */
  private async executeFetch<T>(endpoint: string, retries = 2): Promise<T | null> {
    this.checkCircuitBreakerReset();
    if (this.circuitBreaker.status === 'EXHAUSTED') {
      return null;
    }

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      this.tripCircuitBreaker('API_FOOTBALL_KEY missing from environment');
      return null;
    }

    const rateCheck = await this.checkRateLimit();
    if (!rateCheck.allowed) {
      console.warn(`⚠️ [ApiFootballProvider] Request blocked: ${rateCheck.reason}`);
      return null;
    }

    let attempt = 0;
    while (attempt <= retries) {
      try {
        this.circuitBreaker.lastAttemptAt = new Date().toISOString();
        const res = await fetch(`${ApiFootballProvider.BASE_URL}${endpoint}`, {
          headers: {
            'x-apisports-key': apiKey,
          },
        });

        // Read remaining quota from response header
        const quotaRemaining = res.headers.get('x-ratelimit-requests-remaining');
        if (quotaRemaining) {
          const parsed = parseInt(quotaRemaining, 10);
          if (!isNaN(parsed)) {
            this.remainingQuota = Math.max(0, parsed);
            if (this.remainingQuota === 0) {
              this.tripCircuitBreaker('API-Football daily quota exhausted via x-ratelimit header (0 remaining)');
            }
          }
        }

        if (res.status === 429) {
          this.tripCircuitBreaker('API-Football returned 429 Rate Limit Exceeded');
          return null;
        }

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        }

        const json = (await res.json()) as any;
        if (json?.errors && Object.keys(json.errors).length > 0) {
          const errStr = JSON.stringify(json.errors);
          this.lastError = errStr;
          if (errStr.includes('request limit')) {
            this.tripCircuitBreaker('API-Football quota exhausted: ' + errStr);
          }
          console.warn(`⚠️ [ApiFootballProvider] API returned error:`, json.errors);
          return null;
        }

        this.status = 'available';
        this.lastError = null;
        this.lastSync = new Date().toISOString();
        this.circuitBreaker.consecutiveFailures = 0;
        return json?.response as T;
      } catch (err: any) {
        attempt++;
        this.circuitBreaker.consecutiveFailures++;
        if (attempt > retries) {
          this.lastError = err.message || 'Network request failed';
          console.error(`❌ [ApiFootballProvider] Fetch failed after ${retries} retries:`, err.message);
          return null;
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    return null;
  }

  // ---------------------------------------------------------------------------
  // 1. Live Scores
  // ---------------------------------------------------------------------------
  public async getLiveScores(leagueIds: number[] = [39, 140, 2]): Promise<ProviderResult<LiveScoreMatch[]>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `livescores:${leagueIds.join(',')}`;

    // Check cache (TTL 45s)
    const cached = await this.getCache<LiveScoreMatch[]>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      // In demo mode, fetch from LiveMatchEngine
      const { LiveMatchEngineService } = await import('../services/liveMatchEngine.service.js');
      const demoMatches = LiveMatchEngineService.getLiveMatches();
      return {
        data: demoMatches,
        meta: {
          source: 'database-seed (demo)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    // Call live endpoint
    const rawFixtures = await this.executeFetch<any[]>('/fixtures?live=all');
    if (!rawFixtures || !Array.isArray(rawFixtures)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Live feed unavailable',
        },
      };
    }

    // Filter to target leagues if specified, or return all active
    const targetFixtures = leagueIds.length > 0
      ? rawFixtures.filter((f) => leagueIds.includes(f?.league?.id))
      : rawFixtures;

    const mapped: LiveScoreMatch[] = (targetFixtures.length > 0 ? targetFixtures : rawFixtures.slice(0, 10)).map((f: any) => ({
      fixtureId: String(f.fixture.id),
      league: f.league.name,
      homeTeam: f.teams.home.name,
      homeTeamId: f.teams.home.id,
      homeLogo: f.teams.home.logo,
      homeScore: f.goals.home ?? 0,
      awayTeam: f.teams.away.name,
      awayTeamId: f.teams.away.id,
      awayLogo: f.teams.away.logo,
      awayScore: f.goals.away ?? 0,
      status: f.fixture.status.short === 'HT' ? 'HT' : f.fixture.status.short === 'FT' ? 'FT' : 'LIVE',
      minute: f.fixture.status.elapsed ?? 45,
      events: (f.events || []).map((e: any) => ({
        minute: e.time?.elapsed ?? 0,
        team: e.team?.name || '',
        player: e.player?.name || '',
        type: e.type === 'Goal' ? 'Goal' : e.type === 'Card' ? 'Card' : 'subst',
        detail: e.detail || undefined,
      })),
    }));

    await this.setCache(cacheKey, mapped, 45); // 45-second TTL

    return {
      data: mapped,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Fixtures & Results
  // ---------------------------------------------------------------------------
  public async getFixtures(leagueId = 39, season = 2024, date?: string): Promise<ProviderResult<any[]>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const dateParam = date ? `&date=${date}` : '';
    const cacheKey = `fixtures:${leagueId}:${season}:${date || 'all'}`;

    const cached = await this.getCache<any[]>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      return {
        data: [],
        meta: {
          source: 'database-seed (demo)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/fixtures?league=${leagueId}&season=${season}${dateParam}`);
    if (!raw || !Array.isArray(raw)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Fixtures unavailable',
        },
      };
    }

    await this.setCache(cacheKey, raw, 1800); // 30-min cache
    return {
      data: raw,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 3. Match Events
  // ---------------------------------------------------------------------------
  public async getMatchEvents(fixtureId: string): Promise<ProviderResult<MatchEventDTO[]>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `events:${fixtureId}`;

    const cached = await this.getCache<MatchEventDTO[]>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      return {
        data: [],
        meta: {
          source: 'demoData',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    if (!/^\d+$/.test(fixtureId)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          error: 'Invalid external fixture ID format',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/fixtures/events?fixture=${fixtureId}`);
    if (!raw || !Array.isArray(raw)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Match events unavailable',
        },
      };
    }

    const mapped: MatchEventDTO[] = raw.map((e: any, index: number) => ({
      id: `${fixtureId}-evt-${index}`,
      fixtureId,
      minute: e.time?.elapsed ?? 0,
      extraMinute: e.time?.extra || null,
      teamName: e.team?.name || '',
      playerName: e.player?.name || '',
      assistName: e.assist?.name || null,
      type: e.type || 'Event',
      detail: e.detail || null,
      source: 'api-football',
    }));

    await this.setCache(cacheKey, mapped, 60); // 1-minute TTL for live events
    return {
      data: mapped,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4. Lineups
  // ---------------------------------------------------------------------------
  public async getMatchLineup(
    fixtureId: string,
    homeTeamName = '',
    awayTeamName = ''
  ): Promise<ProviderResult<MatchLineupBundleDTO>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `lineup:${fixtureId}`;

    const cached = await this.getCache<MatchLineupBundleDTO>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      const { ApiFootballService } = await import('../services/apiFootball.service.js');
      const fallback = await ApiFootballService.getMatchLineup(fixtureId, homeTeamName, awayTeamName);
      return {
        data: {
          home: {
            formation: fallback.home.formation,
            teamName: fallback.home.team,
            startXI: fallback.home.startXI,
            substitutes: fallback.home.substitutes,
          },
          away: {
            formation: fallback.away.formation,
            teamName: fallback.away.team,
            startXI: fallback.away.startXI,
            substitutes: fallback.away.substitutes,
          },
        },
        meta: {
          source: 'database-seed (demo)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    if (!/^\d+$/.test(fixtureId)) {
      return {
        data: { home: null, away: null },
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          error: 'Invalid external fixture ID for lineup lookup',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/fixtures/lineups?fixture=${fixtureId}`);
    if (!raw || !Array.isArray(raw) || raw.length < 2) {
      return {
        data: { home: null, away: null },
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Lineups not announced yet by provider',
        },
      };
    }

    const homeRaw = raw[0];
    const awayRaw = raw[1];

    const mapTeamLineup = (t: any, fallbackName: string) => ({
      formation: t?.formation || '4-3-3',
      teamName: t?.team?.name || fallbackName,
      coachName: t?.coach?.name || null,
      startXI: (t?.startXI || []).map((p: any) => ({
        id: p.player?.id,
        number: p.player?.number ?? 0,
        name: p.player?.name || '',
        pos: p.player?.pos || 'M',
        grid: p.player?.grid || null,
        photoUrl: p.player?.photo || undefined,
      })),
      substitutes: (t?.substitutes || []).map((p: any) => ({
        id: p.player?.id,
        number: p.player?.number ?? 0,
        name: p.player?.name || '',
        pos: p.player?.pos || 'M',
        photoUrl: p.player?.photo || undefined,
      })),
    });

    const bundle: MatchLineupBundleDTO = {
      home: mapTeamLineup(homeRaw, homeTeamName),
      away: mapTeamLineup(awayRaw, awayTeamName),
    };

    await this.setCache(cacheKey, bundle, 3600); // 1-hour cache once lineups announced
    return {
      data: bundle,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Match Statistics
  // ---------------------------------------------------------------------------
  public async getMatchStatistics(
    fixtureId: string,
    _homeTeamName = '',
    _awayTeamName = ''
  ): Promise<ProviderResult<MatchStatsBundleDTO>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `stats:${fixtureId}`;

    const cached = await this.getCache<MatchStatsBundleDTO>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      return {
        data: {
          period: 'ALL',
          top: [],
          shots: [],
          passes: [],
          defence: [],
        },
        meta: {
          source: 'demoData',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    if (!/^\d+$/.test(fixtureId)) {
      return {
        data: { period: 'ALL', top: [], shots: [], passes: [], defence: [] },
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          error: 'Invalid external fixture ID for statistics lookup',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/fixtures/statistics?fixture=${fixtureId}`);
    if (!raw || !Array.isArray(raw) || raw.length < 2) {
      return {
        data: { period: 'ALL', top: [], shots: [], passes: [], defence: [] },
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Match statistics not yet published',
        },
      };
    }

    const homeRawStats = raw[0]?.statistics || [];
    const awayRawStats = raw[1]?.statistics || [];

    const getStatVal = (statsArr: any[], typeName: string): any => {
      const found = statsArr.find((s) => s.type?.toLowerCase() === typeName.toLowerCase());
      return found?.value ?? null;
    };

    const buildStatItem = (label: string, typeName: string) => {
      const hVal = getStatVal(homeRawStats, typeName);
      const aVal = getStatVal(awayRawStats, typeName);

      const hNum = typeof hVal === 'number' ? hVal : parseInt(String(hVal || '0').replace('%', ''), 10) || 0;
      const aNum = typeof aVal === 'number' ? aVal : parseInt(String(aVal || '0').replace('%', ''), 10) || 0;

      return {
        label,
        homeVal: hVal ?? '0',
        awayVal: aVal ?? '0',
        homeNum: hNum,
        awayNum: aNum,
      };
    };

    const xgHome = parseFloat(String(getStatVal(homeRawStats, 'expected_goals') || ''));
    const xgAway = parseFloat(String(getStatVal(awayRawStats, 'expected_goals') || ''));

    const bundle: MatchStatsBundleDTO = {
      period: 'ALL',
      top: [
        buildStatItem('Ball Possession', 'Ball Possession'),
        buildStatItem('Total Shots', 'Total Shots'),
        buildStatItem('Shots on Target', 'Shots on Goal'),
        buildStatItem('Corner Kicks', 'Corner Kicks'),
      ],
      shots: [
        buildStatItem('Shots on Goal', 'Shots on Goal'),
        buildStatItem('Shots off Goal', 'Shots off Goal'),
        buildStatItem('Total Shots', 'Total Shots'),
        buildStatItem('Blocked Shots', 'Blocked Shots'),
      ],
      passes: [
        buildStatItem('Total Passes', 'Total passes'),
        buildStatItem('Passes Accurate', 'Passes accurate'),
        buildStatItem('Pass Accuracy %', 'Passes %'),
      ],
      defence: [
        buildStatItem('Fouls', 'Fouls'),
        buildStatItem('Offsides', 'Offsides'),
        buildStatItem('Yellow Cards', 'Yellow Cards'),
        buildStatItem('Red Cards', 'Red Cards'),
        buildStatItem('Goalkeeper Saves', 'Goalkeeper Saves'),
      ],
      xG: !isNaN(xgHome) && !isNaN(xgAway)
        ? { home: xgHome, away: xgAway, available: true }
        : { home: null, away: null, available: false, reason: 'xG metric not provided for this fixture' },
    };

    await this.setCache(cacheKey, bundle, 90); // 90-second TTL
    return {
      data: bundle,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 6. Match Injuries & Absentees
  // ---------------------------------------------------------------------------
  public async getMatchInjuries(fixtureId: string): Promise<ProviderResult<MatchInjuryDTO[]>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `injuries:${fixtureId}`;

    const cached = await this.getCache<MatchInjuryDTO[]>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      return {
        data: [],
        meta: {
          source: 'demoData',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    if (!/^\d+$/.test(fixtureId)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          error: 'Invalid external fixture ID for injury lookup',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/injuries?fixture=${fixtureId}`);
    if (!raw || !Array.isArray(raw)) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Injury data unavailable from provider',
        },
      };
    }

    const mapped: MatchInjuryDTO[] = raw.map((inj: any) => ({
      teamName: inj?.team?.name || '',
      playerName: inj?.player?.name || '',
      type: inj?.player?.type || 'Missing Fixture',
      reason: inj?.player?.reason || null,
      source: 'api-football',
    }));

    await this.setCache(cacheKey, mapped, 7200); // 2 hours
    return {
      data: mapped,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 7. Standings
  // ---------------------------------------------------------------------------
  public async getStandings(leagueId = 39, season = 2024): Promise<ProviderResult<any[]>> {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    const cacheKey = `standings:${leagueId}:${season}`;

    const cached = await this.getCache<any[]>(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        meta: {
          source: 'api-football (cache)',
          fetchedAt: cached.fetchedAt,
          isStale: false,
          mode: isLive ? 'cached' : 'demo',
        },
      };
    }

    if (!isLive) {
      return {
        data: [],
        meta: {
          source: 'database-seed (demo)',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'demo',
        },
      };
    }

    const raw = await this.executeFetch<any[]>(`/standings?league=${leagueId}&season=${season}`);
    if (!raw || !Array.isArray(raw) || !raw[0]?.league?.standings?.[0]) {
      return {
        data: [],
        meta: {
          source: 'api-football',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          error: this.lastError || 'Standings unavailable from provider',
        },
      };
    }

    const standingsTable = raw[0].league.standings[0];
    await this.setCache(cacheKey, standingsTable, 43200); // 12-hour TTL

    return {
      data: standingsTable,
      meta: {
        source: 'api-football (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
      },
    };
  }
}

export const apiFootballProvider = new ApiFootballProvider();
