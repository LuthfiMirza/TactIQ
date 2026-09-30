import {
  FootballDataProvider,
  CircuitBreakerState,
  ProviderResult,
} from './footballDataProvider.interface.js';
import {
  ProviderCapabilities,
  ProviderHealthInfo,
  ProviderStatus,
  MatchEventDTO,
  MatchLineupBundleDTO,
  MatchStatsBundleDTO,
  MatchInjuryDTO,
} from '@tactiq/shared-types';
import { LiveScoreMatch } from '../services/apiFootball.service.js';
import { providerStateStore } from './providerStateStore.js';

export class FootballDataOrgProvider implements FootballDataProvider {
  public readonly name = 'football-data.org';
  public readonly capabilities: ProviderCapabilities = {
    live: false,
    lineup: false,
    events: false,
    stats: false,
    injuries: false,
    delayed: true,
  };

  private static readonly BASE_URL = 'https://api.football-data.org/v4';
  private remainingQuotaMinute: number | 'unknown' = 'unknown';
  private perMinuteLimit = 10;
  private lastVerifiedAt: string | null = null;
  private quotaHeaderName = 'x-requests-available-minute';
  private lastError: string | null = null;
  private lastSync: string | null = null;
  private status: ProviderStatus = 'not_configured';

  private circuitBreaker: CircuitBreakerState = {
    status: 'CLOSED',
    consecutiveFailures: 0,
    exhaustedUntil: null,
    lastError: null,
    lastAttemptAt: null,
  };

  constructor() {
    providerStateStore.getState(this.name, Boolean(process.env.FOOTBALL_DATA_TOKEN), 10).then((s) => {
      this.remainingQuotaMinute = (s.remainingPerMinute !== undefined ? s.remainingPerMinute : s.remainingQuota) as any;
      this.lastVerifiedAt = s.lastVerifiedAt;
      this.lastError = s.lastError;
      this.lastSync = s.lastSync;
      this.status = s.status;
      this.circuitBreaker = {
        ...this.circuitBreaker,
        ...s.circuitBreaker,
      };
    }).catch(() => {});
  }

  private persistState(): void {
    providerStateStore.updateMemoryState(this.name, {
      status: this.status,
      remainingQuota: 'unknown',
      dailyQuota: null,
      perMinuteLimit: this.perMinuteLimit,
      remainingPerMinute: this.remainingQuotaMinute,
      quotaHeaderName: this.quotaHeaderName,
      lastVerifiedAt: this.lastVerifiedAt,
      resetAt: this.circuitBreaker.exhaustedUntil,
      lastError: this.lastError,
      lastSync: this.lastSync,
      circuitBreaker: this.circuitBreaker,
    });
  }

  public getCircuitBreakerState(): CircuitBreakerState {
    this.checkCircuitBreakerReset();
    return { ...this.circuitBreaker };
  }

  public tripCircuitBreaker(reason: string, resetAt?: string): void {
    const until = resetAt || new Date(Date.now() + 60000).toISOString();
    this.circuitBreaker.status = 'EXHAUSTED';
    this.circuitBreaker.lastError = reason;
    this.circuitBreaker.exhaustedUntil = until;
    this.lastError = reason;
    console.warn(`⚡ [FootballDataOrgProvider] Circuit breaker TRIPPED (EXHAUSTED). Reason: ${reason}`);
  }

  public resetCircuitBreaker(): void {
    this.circuitBreaker.status = 'CLOSED';
    this.circuitBreaker.consecutiveFailures = 0;
    this.circuitBreaker.exhaustedUntil = null;
    this.circuitBreaker.lastError = null;
    this.lastError = null;
    console.log(`🔌 [FootballDataOrgProvider] Circuit breaker RESET to CLOSED.`);
  }

  private checkCircuitBreakerReset(): void {
    if (this.circuitBreaker.status === 'EXHAUSTED' && this.circuitBreaker.exhaustedUntil) {
      if (new Date() >= new Date(this.circuitBreaker.exhaustedUntil)) {
        this.resetCircuitBreaker();
      }
    }
  }

  public getHealthStatus(): ProviderHealthInfo {
    this.checkCircuitBreakerReset();
    const token = process.env.FOOTBALL_DATA_TOKEN;
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';

    if (!token) {
      return {
        provider: this.name,
        status: 'not_configured',
        capabilities: this.capabilities,
        remainingQuota: 'unknown',
        dailyQuota: null,
        perMinuteLimit: this.perMinuteLimit,
        remainingPerMinute: 'unknown',
        quotaHeaderName: 'x-requests-available-minute',
        lastVerifiedAt: null,
        resetAt: null,
        lastError: 'FOOTBALL_DATA_TOKEN is not configured',
        lastSync: this.lastSync,
      };
    }

    if (!isLive) {
      return {
        provider: this.name,
        status: 'demo',
        capabilities: this.capabilities,
        remainingQuota: 'unknown',
        dailyQuota: null,
        perMinuteLimit: this.perMinuteLimit,
        remainingPerMinute: this.remainingQuotaMinute,
        quotaHeaderName: this.quotaHeaderName,
        lastVerifiedAt: this.lastVerifiedAt,
        resetAt: null,
        lastError: null,
        lastSync: this.lastSync,
      };
    }

    const currentStatus: ProviderStatus =
      this.circuitBreaker.status === 'EXHAUSTED'
        ? 'exhausted'
        : this.lastVerifiedAt
        ? 'available'
        : 'unknown';

    return {
      provider: this.name,
      status: currentStatus,
      capabilities: this.capabilities,
      remainingQuota: 'unknown',
      dailyQuota: null, // Verified: Free tier does not use daily limit, restricted to 10 req/min
      perMinuteLimit: this.perMinuteLimit,
      remainingPerMinute: this.remainingQuotaMinute,
      quotaHeaderName: this.quotaHeaderName,
      lastVerifiedAt: this.lastVerifiedAt,
      resetAt: this.circuitBreaker.exhaustedUntil,
      lastError: this.lastError,
      lastSync: this.lastSync,
    };
  }

  private async executeFetch<T>(endpoint: string): Promise<T | null> {
    this.checkCircuitBreakerReset();
    if (this.circuitBreaker.status === 'EXHAUSTED') {
      return null;
    }

    const token = process.env.FOOTBALL_DATA_TOKEN;
    if (!token) {
      this.tripCircuitBreaker('FOOTBALL_DATA_TOKEN missing');
      return null;
    }

    try {
      this.circuitBreaker.lastAttemptAt = new Date().toISOString();
      const res = await fetch(`${FootballDataOrgProvider.BASE_URL}${endpoint}`, {
        headers: {
          'X-Auth-Token': token,
        },
      });

      const quotaMinute = res.headers.get('x-requests-available-minute');
      if (quotaMinute) {
        const parsed = parseInt(quotaMinute, 10);
        if (!isNaN(parsed)) {
          this.remainingQuotaMinute = parsed;
        }
      }
      this.lastVerifiedAt = new Date().toISOString();

      if (res.status === 429) {
        this.tripCircuitBreaker('Football-data.org 429 Rate Limit Exceeded');
        this.persistState();
        return null;
      }

      if (!res.ok) {
        this.status = 'unavailable';
        this.persistState();
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as any;
      this.status = 'available';
      this.lastError = null;
      this.lastSync = new Date().toISOString();
      this.circuitBreaker.consecutiveFailures = 0;
      this.persistState();
      return json;
    } catch (err: any) {
      this.circuitBreaker.consecutiveFailures++;
      this.lastError = err.message;
      if (this.circuitBreaker.consecutiveFailures >= 3) {
        this.tripCircuitBreaker(`Repeated error: ${err.message}`);
      }
      return null;
    }
  }

  public async getLiveScores(_leagueIds?: number[]): Promise<ProviderResult<LiveScoreMatch[]>> {
    const raw = await this.executeFetch<any>('/matches?status=IN_PLAY');
    const matches = raw?.matches || [];

    const mapped: LiveScoreMatch[] = matches.map((m: any) => ({
      fixtureId: String(m.id),
      league: m.competition?.name || 'Competition',
      homeTeam: m.homeTeam?.name || 'Home',
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      awayTeam: m.awayTeam?.name || 'Away',
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      status: m.status === 'FINISHED' ? 'FT' : 'LIVE',
      minute: 45, // Delayed scores do not provide real-time elapsed minute
      events: [],
    }));

    return {
      data: mapped,
      meta: {
        source: 'football-data.org (delayed)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['lineup', 'events', 'stats', 'injuries'],
        provider: this.name,
      },
    };
  }

  public async getFixtures(leagueId = 39, _season = 2024, date?: string): Promise<ProviderResult<any[]>> {
    // Map league ID to code
    const leagueCode = leagueId === 39 ? 'PL' : leagueId === 140 ? 'PD' : 'CL';
    const dateQuery = date ? `?dateFrom=${date}&dateTo=${date}` : '';
    const raw = await this.executeFetch<any>(`/competitions/${leagueCode}/matches${dateQuery}`);
    return {
      data: raw?.matches || [],
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['lineup', 'events', 'stats', 'injuries'],
        provider: this.name,
      },
    };
  }

  public async getMatchEvents(_fixtureId: string): Promise<ProviderResult<MatchEventDTO[]>> {
    return {
      data: [],
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['events'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Match events are not supported in football-data.org free tier (requires paid plan)',
      },
    };
  }

  public async getMatchLineup(
    _fixtureId: string,
    _homeTeamName = '',
    _awayTeamName = ''
  ): Promise<ProviderResult<MatchLineupBundleDTO>> {
    return {
      data: { home: null, away: null },
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['lineup'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Lineups are not supported in football-data.org free tier (requires paid plan)',
      },
    };
  }

  public async getMatchStatistics(
    _fixtureId: string,
    _homeTeamName = '',
    _awayTeamName = ''
  ): Promise<ProviderResult<MatchStatsBundleDTO>> {
    return {
      data: { period: 'ALL', top: [], shots: [], passes: [], defence: [] },
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['stats'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Match statistics are not supported in football-data.org free tier (requires paid plan)',
      },
    };
  }

  public async getMatchInjuries(_fixtureId: string): Promise<ProviderResult<MatchInjuryDTO[]>> {
    return {
      data: [],
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        missingCapabilities: ['injuries'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Injury/absentee data is not provided by football-data.org',
      },
    };
  }

  public async getStandings(leagueId = 39, _season = 2024): Promise<ProviderResult<any[]>> {
    const leagueCode = leagueId === 39 ? 'PL' : leagueId === 140 ? 'PD' : 'CL';
    const raw = await this.executeFetch<any>(`/competitions/${leagueCode}/standings`);
    const table = raw?.standings?.[0]?.table || [];
    return {
      data: table,
      meta: {
        source: 'football-data.org',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: true,
        provider: this.name,
      },
    };
  }
}

export const footballDataOrgProvider = new FootballDataOrgProvider();
