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
  private remainingQuotaMinute: number = 10;
  private lastError: string | null = null;
  private lastSync: string | null = null;

  private circuitBreaker: CircuitBreakerState = {
    status: 'CLOSED',
    consecutiveFailures: 0,
    exhaustedUntil: null,
    lastError: null,
    lastAttemptAt: null,
  };

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

    if (!isLive) {
      return {
        provider: this.name,
        status: 'demo',
        capabilities: this.capabilities,
        remainingQuota: null,
        dailyQuota: null,
        resetAt: null,
        lastError: null,
        lastSync: this.lastSync,
      };
    }

    if (!token) {
      return {
        provider: this.name,
        status: 'unavailable',
        capabilities: this.capabilities,
        remainingQuota: 0,
        dailyQuota: null,
        resetAt: null,
        lastError: 'FOOTBALL_DATA_TOKEN is not configured',
        lastSync: this.lastSync,
      };
    }

    return {
      provider: this.name,
      status: this.circuitBreaker.status === 'EXHAUSTED' ? 'exhausted' : 'available',
      capabilities: this.capabilities,
      remainingQuota: this.remainingQuotaMinute,
      dailyQuota: null, // No explicit daily cap, minute rate limited
      resetAt: null,
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
        this.remainingQuotaMinute = parseInt(quotaMinute, 10);
      }

      if (res.status === 429) {
        this.tripCircuitBreaker('Football-data.org 429 Rate Limit Exceeded');
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as any;
      this.lastSync = new Date().toISOString();
      this.circuitBreaker.consecutiveFailures = 0;
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
