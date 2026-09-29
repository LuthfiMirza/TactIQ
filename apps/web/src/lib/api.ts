import type {
  PlayerDTO,
  PlayerSimilarityResponse,
  FixtureDTO,
  StandingDTO,
  H2HDTO,
  MatchPredictionResponse,
  MatchPredictRequest,
  TrackingStartRequest,
  TrackingStartResponse,
  ApiResponse,
} from '@tactiq/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  public statusCode: number;
  public endpoint: string;

  constructor(message: string, statusCode: number, endpoint: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl: string, timeoutMs = 10000) {
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.message) errMessage = errJson.message;
        } catch {
          // Response is not JSON
        }
        throw new ApiError(errMessage, response.status, endpoint);
      }

      const json: ApiResponse<T> = await response.json();
      return json.data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ApiError(`Request timeout after ${this.timeoutMs}ms`, 408, endpoint);
      }
      console.warn(`[ApiClient] Request to ${url} failed:`, (error as Error).message);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Generic HTTP methods
  public get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Players
  public async getPlayers(params?: Record<string, string>): Promise<PlayerDTO[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<PlayerDTO[]>(`/api/v1/players${query}`);
  }

  public async getPlayerById(id: string): Promise<PlayerDTO> {
    return this.request<PlayerDTO>(`/api/v1/players/${id}`);
  }

  public async getSimilarPlayers(id: string): Promise<PlayerSimilarityResponse> {
    return this.request<PlayerSimilarityResponse>(`/api/v1/players/${id}/similar`);
  }

  // Matches
  public async getFixtures(): Promise<FixtureDTO[]> {
    return this.request<FixtureDTO[]>('/api/v1/matches/fixtures');
  }

  public async getStandings(): Promise<StandingDTO[]> {
    return this.request<StandingDTO[]>('/api/v1/matches/standings');
  }

  public async getH2H(homeId: string, awayId: string): Promise<H2HDTO> {
    return this.request<H2HDTO>(`/api/v1/matches/h2h/${homeId}/${awayId}`);
  }

  public async predictMatch(payload: MatchPredictRequest): Promise<MatchPredictionResponse> {
    return this.request<MatchPredictionResponse>('/api/v1/matches/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getLiveScores(): Promise<any[]> {
    return this.request<any[]>('/api/v1/matches/live/scores');
  }

  public async getMatchLineup(fixtureId: string, params?: { home?: string; away?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.home) q.set('home', params.home);
    if (params?.away) q.set('away', params.away);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<any>(`/api/v1/matches/${fixtureId}/lineup${qs}`);
  }

  public async getMatchStatistics(fixtureId: string, params?: { home?: string; away?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.home) q.set('home', params.home);
    if (params?.away) q.set('away', params.away);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<any>(`/api/v1/matches/${fixtureId}/statistics${qs}`);
  }

  public async getMatchH2H(fixtureId: string, params?: { h2h?: string; home?: string; away?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.h2h) q.set('h2h', params.h2h);
    if (params?.home) q.set('home', params.home);
    if (params?.away) q.set('away', params.away);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<any>(`/api/v1/matches/${fixtureId}/h2h${qs}`);
  }

  public async triggerETLSync(): Promise<any> {
    return this.request<any>('/api/v1/sync', { method: 'POST' });
  }

  // Tracking
  public async startTracking(payload: TrackingStartRequest): Promise<TrackingStartResponse> {
    return this.request<TrackingStartResponse>('/api/v1/tracking/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
