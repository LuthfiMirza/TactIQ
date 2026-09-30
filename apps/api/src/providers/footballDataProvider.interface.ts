import {
  DataProvenanceMeta,
  ProviderCapabilities,
  ProviderHealthInfo,
  MatchEventDTO,
  MatchLineupBundleDTO,
  MatchStatsBundleDTO,
  MatchInjuryDTO,
} from '@tactiq/shared-types';
import { LiveScoreMatch } from '../services/apiFootball.service.js';

export interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'EXHAUSTED';
  consecutiveFailures: number;
  exhaustedUntil: string | null;
  lastError: string | null;
  lastAttemptAt: string | null;
}

export interface ProviderResult<T> {
  data: T;
  meta: DataProvenanceMeta;
}

export interface FootballDataProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  getHealthStatus(): ProviderHealthInfo;
  getCircuitBreakerState(): CircuitBreakerState;
  tripCircuitBreaker(reason: string, resetAt?: string): void;
  resetCircuitBreaker(): void;

  getLiveScores(leagueIds?: number[]): Promise<ProviderResult<LiveScoreMatch[]>>;

  getFixtures(
    leagueId: number,
    season?: number,
    date?: string
  ): Promise<ProviderResult<any[]>>;

  getMatchEvents(fixtureId: string): Promise<ProviderResult<MatchEventDTO[]>>;

  getMatchLineup(
    fixtureId: string,
    homeTeamName?: string,
    awayTeamName?: string
  ): Promise<ProviderResult<MatchLineupBundleDTO>>;

  getMatchStatistics(
    fixtureId: string,
    homeTeamName?: string,
    awayTeamName?: string
  ): Promise<ProviderResult<MatchStatsBundleDTO>>;

  getMatchInjuries(fixtureId: string): Promise<ProviderResult<MatchInjuryDTO[]>>;

  getStandings(
    leagueId: number,
    season?: number
  ): Promise<ProviderResult<any[]>>;
}
