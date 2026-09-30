import { redisPublisher } from '../services/redis.service.js';
import type { ProviderStatus } from '@tactiq/shared-types';

export interface CircuitBreakerPersistentState {
  status: 'CLOSED' | 'OPEN' | 'EXHAUSTED';
  consecutiveFailures: number;
  lastAttemptAt: string | null;
  exhaustedUntil: string | null;
}

export interface ProviderPersistentState {
  provider: string;
  status: ProviderStatus;
  remainingQuota: number | 'unknown';
  dailyQuota: number | 'unknown' | null;
  perMinuteLimit?: number | 'unknown' | null;
  remainingPerMinute?: number | 'unknown' | null;
  quotaHeaderName?: string | null;
  lastVerifiedAt: string | null;
  resetAt: string | null;
  lastError: string | null;
  lastSync: string | null;
  circuitBreaker: CircuitBreakerPersistentState;
}

export class ProviderStateStore {
  private static instance: ProviderStateStore;
  private memoryCache: Map<string, ProviderPersistentState> = new Map();

  private constructor() {}

  public static getInstance(): ProviderStateStore {
    if (!ProviderStateStore.instance) {
      ProviderStateStore.instance = new ProviderStateStore();
    }
    return ProviderStateStore.instance;
  }

  private getKey(provider: string): string {
    return `tactiq:provider_state:${provider}`;
  }

  public async getState(
    provider: string,
    hasApiKey: boolean,
    defaultPerMinute?: number | null
  ): Promise<ProviderPersistentState> {
    // 1. Check local in-memory cache
    const mem = this.memoryCache.get(provider);
    if (mem) {
      return mem;
    }

    // 2. Try Redis
    if (redisPublisher && redisPublisher.status === 'ready') {
      try {
        const raw = await redisPublisher.get(this.getKey(provider));
        if (raw) {
          const parsed = JSON.parse(raw) as ProviderPersistentState;
          this.memoryCache.set(provider, parsed);
          return parsed;
        }
      } catch (err: any) {
        console.warn(`⚠️ [ProviderStateStore] Failed reading Redis state for ${provider}:`, err.message);
      }
    }

    // 3. Fallback / Conservative initialization on cold start (Requirement B)
    // Never assume full quota if not yet verified
    const initialState: ProviderPersistentState = {
      provider,
      status: !hasApiKey ? 'not_configured' : 'unknown',
      remainingQuota: 'unknown',
      dailyQuota: provider === 'football-data.org' ? null : 'unknown',
      perMinuteLimit: defaultPerMinute || null,
      remainingPerMinute: defaultPerMinute ? 'unknown' : null,
      quotaHeaderName: null,
      lastVerifiedAt: null,
      resetAt: null,
      lastError: null,
      lastSync: null,
      circuitBreaker: {
        status: 'CLOSED',
        consecutiveFailures: 0,
        lastAttemptAt: null,
        exhaustedUntil: null,
      },
    };

    this.memoryCache.set(provider, initialState);
    await this.saveState(initialState).catch(() => {});
    return initialState;
  }

  public async saveState(state: ProviderPersistentState): Promise<void> {
    this.memoryCache.set(state.provider, state);

    if (redisPublisher && redisPublisher.status === 'ready') {
      try {
        await redisPublisher.set(this.getKey(state.provider), JSON.stringify(state));
      } catch (err: any) {
        console.warn(`⚠️ [ProviderStateStore] Failed persisting state to Redis for ${state.provider}:`, err.message);
      }
    }
  }

  public updateMemoryState(provider: string, patch: Partial<ProviderPersistentState>): ProviderPersistentState {
    const existing = this.memoryCache.get(provider) || {
      provider,
      status: 'unknown',
      remainingQuota: 'unknown',
      dailyQuota: 'unknown',
      lastVerifiedAt: null,
      resetAt: null,
      lastError: null,
      lastSync: null,
      circuitBreaker: {
        status: 'CLOSED',
        consecutiveFailures: 0,
        lastAttemptAt: null,
        exhaustedUntil: null,
      },
    };

    const updated: ProviderPersistentState = {
      ...existing,
      ...patch,
      circuitBreaker: {
        ...existing.circuitBreaker,
        ...(patch.circuitBreaker || {}),
      },
    };

    this.memoryCache.set(provider, updated);
    this.saveState(updated).catch(() => {});
    return updated;
  }
}

export const providerStateStore = ProviderStateStore.getInstance();
