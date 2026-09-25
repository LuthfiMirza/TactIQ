/**
 * TactIQ Shared Domain Contracts & Data Transfer Objects (DTOs)
 * Strictly typed interfaces shared between apps/api, apps/web, and services/ml contracts.
 */
export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
export type TrackingSessionStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
export type EntityTeam = 'home' | 'away' | 'ball';
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
    marketValue: number;
    photoUrl: string;
    team?: TeamDTO;
    attributes?: PlayerRadarMetrics;
}
export interface SimilarPlayerMatch {
    player: PlayerDTO;
    similarityScore: number;
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
export interface FixtureDTO {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam?: TeamDTO;
    awayTeam?: TeamDTO;
    matchDate: string;
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
    homeWin: number;
    draw: number;
    awayWin: number;
}
export interface MatchPredictionResponse {
    fixtureId: string;
    winProbabilities: WinProbabilities;
    predictedScore: string;
    insights?: string[];
}
export interface MatchPredictRequest {
    fixtureId: string;
    homeTeamStats?: {
        recentFormPoints: number;
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
export interface TrackingEntity {
    id: number;
    team: EntityTeam;
    x: number;
    y: number;
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
export interface ClientToServerEvents {
    join_session: (data: {
        sessionId: string;
    }) => void;
    leave_session: (data: {
        sessionId: string;
    }) => void;
    ping_stream: () => void;
}
export interface ServerToClientEvents {
    frame_update: (payload: TrackingFramePayload) => void;
    session_status: (data: {
        sessionId: string;
        status: TrackingSessionStatus;
    }) => void;
    stream_error: (data: {
        sessionId: string;
        message: string;
    }) => void;
    pong_stream: (data: {
        timestamp: number;
    }) => void;
}
//# sourceMappingURL=index.d.ts.map