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

export class HighlightlyProvider implements FootballDataProvider {
  public readonly name = 'highlightly';
  public readonly capabilities: ProviderCapabilities = {
    live: true,
    lineup: true,
    events: true,
    stats: false,
    injuries: false,
    delayed: false,
  };

  private static readonly BASE_URL = process.env.HIGHLIGHTLY_API_URL || 'https://sports.highlightly.net/football';
  private remainingQuota: number | 'unknown' = 'unknown';
  private dailyQuota: number | 'unknown' = 'unknown';
  private lastVerifiedAt: string | null = null;
  private quotaHeaderName: string | null = null;
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
    const hasKey = Boolean(process.env.HIGHLIGHTLY_API_KEY || process.env.RAPIDAPI_KEY || process.env.HIGHLIGHTLY_KEY);
    providerStateStore.getState(this.name, hasKey).then((s) => {
      this.remainingQuota = s.remainingQuota;
      this.dailyQuota = s.dailyQuota !== null ? s.dailyQuota : 'unknown';
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
      remainingQuota: this.remainingQuota,
      dailyQuota: this.dailyQuota,
      quotaHeaderName: this.quotaHeaderName,
      lastVerifiedAt: this.lastVerifiedAt,
      resetAt: this.circuitBreaker.exhaustedUntil || this.getNextUtcMidnight(),
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
    const until = resetAt || this.getNextUtcMidnight();
    this.circuitBreaker.status = 'EXHAUSTED';
    this.circuitBreaker.lastError = reason;
    this.circuitBreaker.exhaustedUntil = until;
    this.status = 'exhausted';
    this.lastError = reason;
    this.persistState();
    console.warn(`⚡ [HighlightlyProvider] Circuit breaker TRIPPED (EXHAUSTED). Reason: ${reason}. Reset at: ${until}`);
  }

  public resetCircuitBreaker(): void {
    this.circuitBreaker.status = 'CLOSED';
    this.circuitBreaker.consecutiveFailures = 0;
    this.circuitBreaker.exhaustedUntil = null;
    this.circuitBreaker.lastError = null;
    this.lastError = null;
    const hasKey = Boolean(process.env.HIGHLIGHTLY_API_KEY || process.env.RAPIDAPI_KEY || process.env.HIGHLIGHTLY_KEY);
    this.status = !hasKey ? 'not_configured' : (this.lastVerifiedAt ? 'available' : 'unknown');
    this.persistState();
    console.log(`🔌 [HighlightlyProvider] Circuit breaker RESET to CLOSED.`);
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
    this.checkCircuitBreakerReset();
    const apiKey = process.env.HIGHLIGHTLY_API_KEY || process.env.RAPIDAPI_KEY || process.env.HIGHLIGHTLY_KEY;
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';

    if (!apiKey) {
      return {
        provider: this.name,
        status: 'not_configured',
        capabilities: this.capabilities,
        remainingQuota: 'unknown',
        dailyQuota: 'unknown',
        perMinuteLimit: null,
        remainingPerMinute: null,
        quotaHeaderName: null,
        lastVerifiedAt: null,
        resetAt: null,
        lastError: 'HIGHLIGHTLY_API_KEY not configured in environment',
        lastSync: this.lastSync,
      };
    }

    if (!isLive) {
      return {
        provider: this.name,
        status: 'demo',
        capabilities: this.capabilities,
        remainingQuota: this.remainingQuota,
        dailyQuota: this.dailyQuota,
        perMinuteLimit: null,
        remainingPerMinute: null,
        quotaHeaderName: this.quotaHeaderName,
        lastVerifiedAt: this.lastVerifiedAt,
        resetAt: this.getNextUtcMidnight(),
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
      remainingQuota: this.remainingQuota,
      dailyQuota: this.dailyQuota,
      perMinuteLimit: null,
      remainingPerMinute: null,
      quotaHeaderName: this.quotaHeaderName,
      lastVerifiedAt: this.lastVerifiedAt,
      resetAt: this.circuitBreaker.exhaustedUntil || this.getNextUtcMidnight(),
      lastError: this.lastError,
      lastSync: this.lastSync,
    };
  }

  private async executeFetch<T>(endpoint: string): Promise<T | null> {
    this.checkCircuitBreakerReset();
    if (this.circuitBreaker.status === 'EXHAUSTED') {
      return null;
    }

    const apiKey = process.env.HIGHLIGHTLY_API_KEY;
    if (!apiKey) {
      this.tripCircuitBreaker('HIGHLIGHTLY_API_KEY not configured in environment');
      return null;
    }

    try {
      this.circuitBreaker.lastAttemptAt = new Date().toISOString();
      const res = await fetch(`${HighlightlyProvider.BASE_URL}${endpoint}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      // Track remaining quota from response header
      const quotaHeader = res.headers.get('x-ratelimit-requests-remaining');
      if (quotaHeader) {
        this.remainingQuota = Math.max(0, parseInt(quotaHeader, 10));
        if (this.remainingQuota === 0) {
          this.tripCircuitBreaker('Highlightly quota exhausted (0 remaining)');
        }
      }

      if (res.status === 429) {
        this.tripCircuitBreaker('Highlightly returned 429 Rate Limit Exceeded');
        return null;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as any;
      this.lastSync = new Date().toISOString();
      this.circuitBreaker.consecutiveFailures = 0;
      return json?.data || json?.matches || json;
    } catch (err: any) {
      this.circuitBreaker.consecutiveFailures++;
      this.lastError = err.message;
      if (this.circuitBreaker.consecutiveFailures >= 3) {
        this.tripCircuitBreaker(`Repeated failure: ${err.message}`);
      }
      return null;
    }
  }

  public async getLiveScores(_leagueIds?: number[]): Promise<ProviderResult<LiveScoreMatch[]>> {
    const raw = await this.executeFetch<any[]>('/matches/live');
    if (!raw || !Array.isArray(raw)) {
      return {
        data: [],
        meta: {
          source: 'highlightly',
          fetchedAt: new Date().toISOString(),
          isStale: true,
          mode: 'live',
          status: 'unavailable',
          isDelayed: false,
          missingCapabilities: ['stats', 'injuries'],
          provider: this.name,
          error: this.lastError || 'Highlightly live feed unavailable',
        },
      };
    }

    const mapped: LiveScoreMatch[] = raw.map((m: any) => ({
      fixtureId: String(m.id || m.matchId),
      league: m.league?.name || 'Football League',
      homeTeam: m.homeTeam?.name || m.home?.name || 'Home',
      homeScore: m.homeScore ?? m.home?.score ?? 0,
      awayTeam: m.awayTeam?.name || m.away?.name || 'Away',
      awayScore: m.awayScore ?? m.away?.score ?? 0,
      status: m.status === 'FT' ? 'FT' : 'LIVE',
      minute: m.minute ?? 45,
      events: [],
    }));

    return {
      data: mapped,
      meta: {
        source: 'highlightly (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        missingCapabilities: ['stats', 'injuries'],
        provider: this.name,
      },
    };
  }

  public async getFixtures(leagueId = 39, _season = 2024, date?: string): Promise<ProviderResult<any[]>> {
    const dateQuery = date ? `?date=${date}` : '';
    const raw = await this.executeFetch<any[]>(`/leagues/${leagueId}/matches${dateQuery}`);
    return {
      data: Array.isArray(raw) ? raw : [],
      meta: {
        source: 'highlightly',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        missingCapabilities: ['stats', 'injuries'],
        provider: this.name,
      },
    };
  }

  public async getMatchEvents(fixtureId: string): Promise<ProviderResult<MatchEventDTO[]>> {
    const raw = await this.executeFetch<any[]>(`/matches/${fixtureId}/events`);
    if (!raw || !Array.isArray(raw)) {
      return {
        data: [],
        meta: {
          source: 'highlightly',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          isDelayed: false,
          provider: this.name,
          status: 'unavailable',
          reason: 'No match events reported by Highlightly',
        },
      };
    }

    const mapped: MatchEventDTO[] = raw.map((e: any, idx: number) => ({
      id: `${fixtureId}-hl-${idx}`,
      fixtureId,
      minute: e.minute ?? 0,
      extraMinute: e.extraMinute || null,
      teamName: e.team?.name || e.teamName || '',
      playerName: e.player?.name || e.playerName || '',
      assistName: e.assist?.name || null,
      type: e.type || 'Event',
      detail: e.detail || null,
      source: 'highlightly',
    }));

    return {
      data: mapped,
      meta: {
        source: 'highlightly (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        provider: this.name,
      },
    };
  }

  public async getMatchLineup(
    fixtureId: string,
    homeTeamName = '',
    awayTeamName = ''
  ): Promise<ProviderResult<MatchLineupBundleDTO>> {
    const raw = await this.executeFetch<any>(`/matches/${fixtureId}/lineups`);
    if (!raw || (!raw.home && !raw.startXI)) {
      return {
        data: { home: null, away: null },
        meta: {
          source: 'highlightly',
          fetchedAt: new Date().toISOString(),
          isStale: false,
          mode: 'live',
          isDelayed: false,
          provider: this.name,
          status: 'unavailable',
          reason: 'Lineups not published on Highlightly',
        },
      };
    }

    const bundle: MatchLineupBundleDTO = {
      home: raw.home
        ? {
            formation: raw.home.formation || '4-3-3',
            teamName: raw.home.teamName || homeTeamName,
            coachName: raw.home.coach || null,
            startXI: (raw.home.startXI || []).map((p: any) => ({
              id: p.id,
              number: p.number ?? 0,
              name: p.name || '',
              pos: p.pos || 'M',
              grid: p.grid || null,
            })),
            substitutes: (raw.home.substitutes || []).map((p: any) => ({
              id: p.id,
              number: p.number ?? 0,
              name: p.name || '',
              pos: p.pos || 'M',
            })),
          }
        : null,
      away: raw.away
        ? {
            formation: raw.away.formation || '4-3-3',
            teamName: raw.away.teamName || awayTeamName,
            coachName: raw.away.coach || null,
            startXI: (raw.away.startXI || []).map((p: any) => ({
              id: p.id,
              number: p.number ?? 0,
              name: p.name || '',
              pos: p.pos || 'M',
              grid: p.grid || null,
            })),
            substitutes: (raw.away.substitutes || []).map((p: any) => ({
              id: p.id,
              number: p.number ?? 0,
              name: p.name || '',
              pos: p.pos || 'M',
            })),
          }
        : null,
    };

    return {
      data: bundle,
      meta: {
        source: 'highlightly (live)',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        provider: this.name,
      },
    };
  }

  public async getMatchStatistics(
    _fixtureId: string,
    _homeTeamName = '',
    _awayTeamName = ''
  ): Promise<ProviderResult<MatchStatsBundleDTO>> {
    // Highlightly free tier does NOT provide full in-play statistics
    return {
      data: { period: 'ALL', top: [], shots: [], passes: [], defence: [] },
      meta: {
        source: 'highlightly',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        missingCapabilities: ['stats'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Match statistics not supported in Highlightly Free tier',
      },
    };
  }

  public async getMatchInjuries(_fixtureId: string): Promise<ProviderResult<MatchInjuryDTO[]>> {
    return {
      data: [],
      meta: {
        source: 'highlightly',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        missingCapabilities: ['injuries'],
        status: 'unavailable',
        provider: this.name,
        reason: 'Injuries not provided by Highlightly',
      },
    };
  }

  public async getStandings(leagueId = 39, _season = 2024): Promise<ProviderResult<any[]>> {
    const raw = await this.executeFetch<any[]>(`/leagues/${leagueId}/standings`);
    return {
      data: Array.isArray(raw) ? raw : [],
      meta: {
        source: 'highlightly',
        fetchedAt: new Date().toISOString(),
        isStale: false,
        mode: 'live',
        isDelayed: false,
        provider: this.name,
      },
    };
  }
}

export const highlightlyProvider = new HighlightlyProvider();
