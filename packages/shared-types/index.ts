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
// 5. Standard API Response Wrapper
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
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
  ping_stream: () => void;
}

export interface ServerToClientEvents {
  frame_update: (payload: TrackingFramePayload) => void;
  session_status: (data: { sessionId: string; status: TrackingSessionStatus }) => void;
  stream_error: (data: { sessionId: string; message: string }) => void;
  pong_stream: (data: { timestamp: number }) => void;
}
