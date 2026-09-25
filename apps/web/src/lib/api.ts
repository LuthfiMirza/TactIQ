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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        throw new Error(`API Request to ${endpoint} failed with HTTP ${response.status}`);
      }
      const json: ApiResponse<T> = await response.json();
      return json.data;
    } catch (error) {
      console.warn(`[ApiClient] Request to ${url} failed:`, (error as Error).message);
      throw error;
    }
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

  // Tracking
  public async startTracking(payload: TrackingStartRequest): Promise<TrackingStartResponse> {
    return this.request<TrackingStartResponse>('/api/v1/tracking/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
