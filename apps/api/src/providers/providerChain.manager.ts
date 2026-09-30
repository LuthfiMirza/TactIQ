import { FootballDataProvider } from './footballDataProvider.interface.js';
import { apiFootballProvider } from './apiFootball.provider.js';
import { highlightlyProvider } from './highlightly.provider.js';
import { footballDataOrgProvider } from './footballDataOrg.provider.js';
import { ProviderCapabilities, ProviderHealthInfo } from '@tactiq/shared-types';

export interface ProviderSwitchEvent {
  timestamp: string;
  fromProvider: string;
  toProvider: string;
  reason: string;
}

export class ProviderChainManager {
  private static instance: ProviderChainManager;
  private providers: FootballDataProvider[] = [
    apiFootballProvider,
    highlightlyProvider,
    footballDataOrgProvider,
  ];

  private currentPrimaryIndex = 0;
  private switchHistory: ProviderSwitchEvent[] = [];

  private constructor() {}

  public static getInstance(): ProviderChainManager {
    if (!ProviderChainManager.instance) {
      ProviderChainManager.instance = new ProviderChainManager();
    }
    return ProviderChainManager.instance;
  }

  /**
   * Selects the highest-priority non-exhausted provider.
   * If a required capability is specified, filters by capability.
   */
  public getActiveProvider(requiredCapability?: keyof ProviderCapabilities): FootballDataProvider {
    const isLive = (process.env.DATA_MODE || 'demo') === 'live';
    if (!isLive) {
      return apiFootballProvider; // Default demo engine
    }

    // Try providers in priority order
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const health = provider.getHealthStatus();
      const cbState = provider.getCircuitBreakerState();

      if (health.status === 'not_configured' || cbState.status === 'EXHAUSTED') {
        continue;
      }

      if (requiredCapability && !provider.capabilities[requiredCapability]) {
        continue;
      }

      if (i !== this.currentPrimaryIndex) {
        const from = this.providers[this.currentPrimaryIndex].name;
        const to = provider.name;
        const reason = cbState.lastError || `Switched to ${to} (satisfies ${requiredCapability || 'general'})`;

        this.recordSwitch(from, to, reason);
        this.currentPrimaryIndex = i;
      }

      return provider;
    }

    // If no provider satisfies the specific capability, return the first available fallback
    for (const provider of this.providers) {
      const health = provider.getHealthStatus();
      if (health.status !== 'not_configured' && provider.getCircuitBreakerState().status !== 'EXHAUSTED') {
        return provider;
      }
    }

    // If all are exhausted, return the primary to report its exhausted state honestly
    return this.providers[0];
  }

  public recordSwitch(from: string, to: string, reason: string): void {
    const event: ProviderSwitchEvent = {
      timestamp: new Date().toISOString(),
      fromProvider: from,
      toProvider: to,
      reason,
    };
    this.switchHistory.unshift(event);
    if (this.switchHistory.length > 50) {
      this.switchHistory.pop();
    }
    console.warn(`🔀 [ProviderChain] Switched provider: ${from} -> ${to}. Reason: ${reason}`);
  }

  public getSwitchHistory(): ProviderSwitchEvent[] {
    return [...this.switchHistory];
  }

  public getAllProvidersHealth(): ProviderHealthInfo[] {
    return this.providers.map((p) => p.getHealthStatus());
  }

  public getProviders(): FootballDataProvider[] {
    return [...this.providers];
  }

  /**
   * For testing & manual overrides
   */
  public setProviderExhausted(providerName: string, reason: string): void {
    const provider = this.providers.find((p) => p.name === providerName);
    if (provider) {
      provider.tripCircuitBreaker(reason);
      const active = this.getActiveProvider();
      this.recordSwitch(providerName, active.name, reason);
    }
  }

  public resetAllCircuitBreakers(): void {
    for (const p of this.providers) {
      p.resetCircuitBreaker();
    }
    this.currentPrimaryIndex = 0;
  }
}

export const providerChainManager = ProviderChainManager.getInstance();
