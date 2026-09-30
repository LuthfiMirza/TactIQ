import { FootballDataProvider } from './footballDataProvider.interface.js';
import { providerChainManager } from './providerChain.manager.js';

export * from './footballDataProvider.interface.js';
export * from './apiFootball.provider.js';
export * from './highlightly.provider.js';
export * from './footballDataOrg.provider.js';
export * from './providerChain.manager.js';

export function getFootballDataProvider(requiredCapability?: keyof import('@tactiq/shared-types').ProviderCapabilities): FootballDataProvider {
  return providerChainManager.getActiveProvider(requiredCapability);
}
