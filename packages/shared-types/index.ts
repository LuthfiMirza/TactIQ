/**
 * TactIQ Shared Domain Contracts & Data Transfer Objects (DTOs)
 * Strictly typed interfaces shared between apps/api, apps/web, and services/ml contracts.
 */

// -----------------------------------------------------------------------------
// 1. Basic Enums and Value Types
// -----------------------------------------------------------------------------

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';

export type TrackingSessionStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';

export type EntityTeam = 'home' | 'away' | 'ball';

// -----------------------------------------------------------------------------
// 2. Club & Player Types
// -----------------------------------------------------------------------------

export interface TeamDTO {
  id: string;
  name: string;
  code: string;
  logoUrl: string;
  league: string;
}

export interface PlayerRadarMetrics {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  vision: number;
}

export interface PlayerDTO {
  id: string;
  teamId: string;
  name: string;
  position: PlayerPosition;
  nationality: string;
  age: number;
  marketValue: number; // in Euros or formatted currency
  photoUrl: string;
  team?: TeamDTO;
  attributes?: PlayerRadarMetrics;
}

export interface SimilarPlayerMatch {
  player: PlayerDTO;
  similarityScore: number; // Percentage 0 - 100 or 0.00 - 1.00
}

export interface PlayerSimilarityResponse {
  targetPlayer: PlayerDTO;
  similarPlayers: SimilarPlayerMatch[];
}

export interface PlayerFilterParams {
  position?: PlayerPosition;
  league?: string;
  teamId?: string;
  search?: string;
  minPassing?: number;
  minPace?: number;
  minDefending?: number;
  page?: number;
  limit?: number;
}

// -----------------------------------------------------------------------------
// 3. Match & H2H Types
// -----------------------------------------------------------------------------

export interface FixtureDTO {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: TeamDTO;
  awayTeam?: TeamDTO;
  matchDate: string; // ISO 8601 string
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  venue: string;
}

export interface H2HDTO {
  id: string;
  teamHomeId: string;
  teamAwayId: string;
  homeTeam?: TeamDTO;
  awayTeam?: TeamDTO;
  matchesPlayed: number;
  homeWins: number;
  awayWins: number;
  draws: number;
}

export interface StandingDTO {
  id: string;
  teamId: string;
  team?: TeamDTO;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface WinProbabilities {
  homeWin: number; // e.g. 54.5%
  draw: number;    // e.g. 23.0%
  awayWin: number; // e.g. 22.5%
}

export interface MatchPredictionResponse {
  fixtureId: string;
  winProbabilities: WinProbabilities;
  predictedScore: string; // e.g. "2 - 1"
  insights?: string[];
  modelType?: string; // e.g. "DEMO MODEL (RandomForest on Synthetic Data)"
  xGType?: string;    // e.g. "Estimated xG (model)"
  meta?: DataProvenanceMeta;
}

export interface MatchPredictRequest {
  fixtureId: string;
  homeTeamStats?: {
    recentFormPoints: number; // last 5 games points (0-15)
    goalsScoredAvg: number;
    goalsConcededAvg: number;
    possessionAvg: number;
  };
  awayTeamStats?: {
    recentFormPoints: number;
    goalsScoredAvg: number;
    goalsConcededAvg: number;
    possessionAvg: number;
  };
}

// -----------------------------------------------------------------------------
// 4. Computer Vision Tracking & WebSocket Payloads
// -----------------------------------------------------------------------------

export interface TrackingEntity {
  id: number;
  team: EntityTeam;
  x: number; // normalized coordinate 0.0 - 1.0 (or pitch coordinates 0 - 105m)
  y: number; // normalized coordinate 0.0 - 1.0 (or pitch coordinates 0 - 68m)
  speedKmh?: number;
  jerseyNumber?: number;
}

export interface TrackingFramePayload {
  sessionId: string;
  timestampMs: number;
  frameNumber?: number;
  entities: TrackingEntity[];
}

export interface VideoTrackingSessionDTO {
  id: string;
  youtubeUrl: string;
  matchTitle: string;
  status: TrackingSessionStatus;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingStartRequest {
  youtube_url: string;
  session_id: string;
}

export interface TrackingStartResponse {
  status: string;
  session_id: string;
  message: string;
  estimated_frames: number;
}

// -----------------------------------------------------------------------------
// 5. Data Provenance & Standard API Response Wrapper
// -----------------------------------------------------------------------------

export type DataMode = 'live' | 'cached' | 'demo';

export interface ProviderCapabilities {
  live: boolean;
  lineup: boolean;
  events: boolean;
  stats: boolean;
  injuries: boolean;
  delayed: boolean;
}

export type ProviderStatus = 'available' | 'unavailable' | 'exhausted' | 'not_configured' | 'demo' | 'unknown';

export interface ProviderHealthInfo {
  provider: string;
  status: ProviderStatus;
  capabilities: ProviderCapabilities;
  remainingQuota: number | 'unknown';
  dailyQuota: number | 'unknown' | null;
  perMinuteLimit?: number | 'unknown' | null;
  remainingPerMinute?: number | 'unknown' | null;
  quotaHeaderName?: string | null;
  lastVerifiedAt: string | null;
  resetAt: string | null;
  lastError: string | null;
  lastSync: string | null;
}

export interface DataProvenanceMeta {
  source: string;
  fetchedAt: string;
  isStale: boolean;
  mode: DataMode;
  status?: 'available' | 'unavailable' | 'exhausted' | 'stale';
  isDelayed?: boolean;
  missingCapabilities?: string[];
  provider?: string;
  reason?: string;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  meta?: DataProvenanceMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// -----------------------------------------------------------------------------
// 6. Socket.io Event Map
// -----------------------------------------------------------------------------

export interface ClientToServerEvents {
  join_session: (data: { sessionId: string }) => void;
  leave_session: (data: { sessionId: string }) => void;
  join_match: (data: { matchId: string }) => void;
  leave_match: (data: { matchId: string }) => void;
  ping_stream: () => void;
  simulate_match_event?: (data: { fixtureId: string; type?: string }) => void;
}

export interface ServerToClientEvents {
  frame_update: (payload: TrackingFramePayload) => void;
  session_status: (data: { sessionId: string; status: TrackingSessionStatus }) => void;
  stream_error: (data: { sessionId: string; message: string }) => void;
  pong_stream: (data: { timestamp: number }) => void;
  match_snapshot: (data: { match: any; events: any[]; meta: DataProvenanceMeta }) => void;
  match_score_update: (matches: any[], meta?: DataProvenanceMeta) => void;
  match_event: (event: {
    fixtureId: string;
    minute: number;
    team: string;
    player: string;
    type: 'Goal' | 'Card' | 'subst' | string;
    detail?: string;
    homeScore: number;
    awayScore: number;
    mode: 'live' | 'demo';
  }) => void;
}

// -----------------------------------------------------------------------------
// 7. FASE 2: Live Ingestion Domain Contracts
// -----------------------------------------------------------------------------

export interface MatchEventDTO {
  id: string;
  fixtureId: string;
  minute: number;
  extraMinute?: number | null;
  teamName: string;
  playerName: string;
  assistName?: string | null;
  type: string;
  detail?: string | null;
  source: string;
}

export interface MatchLineupPlayerDTO {
  id?: number;
  number: number;
  name: string;
  pos: string;
  grid?: string | null;
  photoUrl?: string;
}

export interface MatchLineupTeamDTO {
  formation: string;
  teamName: string;
  coachName?: string | null;
  startXI: MatchLineupPlayerDTO[];
  substitutes: MatchLineupPlayerDTO[];
}

export interface MatchLineupBundleDTO {
  home: MatchLineupTeamDTO | null;
  away: MatchLineupTeamDTO | null;
}

export interface MatchStatItemDTO {
  label: string;
  homeVal: string | number;
  awayVal: string | number;
  homeNum: number;
  awayNum: number;
}

export interface MatchStatsBundleDTO {
  period: string; // 'ALL' | '1ST' | '2ND'
  top: MatchStatItemDTO[];
  shots: MatchStatItemDTO[];
  passes: MatchStatItemDTO[];
  defence: MatchStatItemDTO[];
  xG?: {
    home: number | null;
    away: number | null;
    available: boolean;
    reason?: string;
  };
}

export interface MatchInjuryDTO {
  teamName: string;
  playerName: string;
  type?: string | null;
  reason?: string | null;
  source?: string;
}

export interface HomeTickerItemDTO {
  fixtureId: string;
  league: string;
  homeTeam: string;
  homeScore: number | null;
  homeLogo?: string;
  awayTeam: string;
  awayScore: number | null;
  awayLogo?: string;
  status: MatchStatus | 'HT' | 'FT' | 'LIVE';
  minute: number;
  matchDate: string;
  mode: DataMode;
}

