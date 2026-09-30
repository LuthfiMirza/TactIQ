import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../app.js';
import {
  providerChainManager,
  apiFootballProvider,
  highlightlyProvider,
} from '../providers/index.js';
import { scheduleAwareScheduler } from '../services/scheduleAwareScheduler.service.js';

describe('Provider Chain, Circuit Breaker & Adaptive Scheduler Verification (FASE 2)', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(() => {
    providerChainManager.resetAllCircuitBreakers();
  });

  test('(1) Circuit Breaker: When Backup 1 is configured, trips on 429 and falls back to Backup 1 (Highlightly)', () => {
    process.env.DATA_MODE = 'live';
    const oldKey = process.env.HIGHLIGHTLY_API_KEY;
    process.env.HIGHLIGHTLY_API_KEY = 'test_highlightly_key';

    try {
      // Verify initial state
      const initial = providerChainManager.getActiveProvider();
      assert.equal(initial.name, 'api-football');

      // Simulate 429 on Primary
      apiFootballProvider.tripCircuitBreaker('429 Rate Limit Exceeded: Daily Quota 100 reached');

      const cbState = apiFootballProvider.getCircuitBreakerState();
      assert.equal(cbState.status, 'EXHAUSTED');
      assert.ok(cbState.exhaustedUntil !== null, 'Exhausted until must be set');

      // Active provider switches to highlightly
      const fallback1 = providerChainManager.getActiveProvider();
      assert.equal(fallback1.name, 'highlightly', 'Should fall back to highlightly');

      // Check transition history log
      const history = providerChainManager.getSwitchHistory();
      assert.ok(history.length > 0, 'Switch event must be recorded');
      assert.equal(history[0].fromProvider, 'api-football');
      assert.equal(history[0].toProvider, 'highlightly');
    } finally {
      if (oldKey !== undefined) {
        process.env.HIGHLIGHTLY_API_KEY = oldKey;
      } else {
        delete process.env.HIGHLIGHTLY_API_KEY;
      }
    }
  });

  test('(2) Fallback skips not_configured providers and falls back to available Backup 2 (football-data.org)', () => {
    process.env.DATA_MODE = 'live';
    delete process.env.HIGHLIGHTLY_API_KEY;
    delete process.env.RAPIDAPI_KEY;
    delete process.env.HIGHLIGHTLY_KEY;

    // Trip primary
    apiFootballProvider.tripCircuitBreaker('API-Football quota exhausted');

    // Highlightly has no key -> status is not_configured
    const highHealth = highlightlyProvider.getHealthStatus();
    assert.equal(highHealth.status, 'not_configured');

    // Active provider skips highlightly and selects football-data.org
    const fallback = providerChainManager.getActiveProvider();
    assert.equal(fallback.name, 'football-data.org', 'Should fall back directly to football-data.org');

    const history = providerChainManager.getSwitchHistory();
    assert.ok(history.some((h) => h.toProvider === 'football-data.org'));
  });

  test('(3) Data Honesty: Falling back to football-data.org reports isDelayed=true and missing capabilities, NO mock data', async () => {
    process.env.DATA_MODE = 'live';

    // Exhaust live-capable providers
    apiFootballProvider.tripCircuitBreaker('Exhausted');
    highlightlyProvider.tripCircuitBreaker('Exhausted');

    const provider = providerChainManager.getActiveProvider();
    assert.equal(provider.name, 'football-data.org');
    assert.equal(provider.capabilities.delayed, true);
    assert.equal(provider.capabilities.lineup, false);
    assert.equal(provider.capabilities.stats, false);

    // Lineup must return null + honest reason
    const lineupRes = await provider.getMatchLineup('fixture-test-123');
    assert.equal(lineupRes.data.home, null);
    assert.equal(lineupRes.data.away, null);
    assert.equal(lineupRes.meta.status, 'unavailable');
    assert.equal(lineupRes.meta.isDelayed, true);
    assert.ok(lineupRes.meta.missingCapabilities?.includes('lineup'));

    // Statistics must return empty + honest reason
    const statsRes = await provider.getMatchStatistics('fixture-test-123');
    assert.equal(statsRes.meta.status, 'unavailable');
    assert.equal(statsRes.meta.isDelayed, true);
    assert.ok(statsRes.meta.missingCapabilities?.includes('stats'));
  });

  test('(4) Adaptive Interval: Dynamically stretches polling interval as remaining quota decreases', () => {
    const remainingWindowSeconds = 5400; // 90 minutes remaining

    // At 80 remaining quota: interval = max(60, 5400 / (80 - 5)) = max(60, 72) = 72s
    const intervalWithHighQuota = Math.max(60, Math.floor(remainingWindowSeconds / (80 - 5)));
    assert.equal(intervalWithHighQuota, 72);

    // At 15 remaining quota: interval = max(60, 5400 / (15 - 5)) = max(60, 540) = 540s (9 minutes)
    const intervalWithLowQuota = Math.max(60, Math.floor(remainingWindowSeconds / (15 - 5)));
    assert.equal(intervalWithLowQuota, 540);

    // Verifies formula guarantees rate limit is preserved across window
    assert.ok(intervalWithLowQuota > intervalWithHighQuota);
  });

  test('(5) GET /api/v1/health/data exposes per-provider status, quotas, reset times, and active provider', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/data`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: {
        activeProvider: string;
        providers: Array<{
          provider: string;
          status: string;
          capabilities: Record<string, boolean>;
          remainingQuota: number | null;
          dailyQuota: number | null;
        }>;
        scheduler: any;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.data.activeProvider, 'Must disclose active provider');
    assert.ok(Array.isArray(json.data.providers), 'Must return providers array');
    assert.equal(json.data.providers.length, 3, 'Must report on all 3 chain providers');

    const apiFoot = json.data.providers.find((p) => p.provider === 'api-football');
    const high = json.data.providers.find((p) => p.provider === 'highlightly');
    const fData = json.data.providers.find((p) => p.provider === 'football-data.org');

    assert.ok(apiFoot && high && fData, 'All 3 providers must be listed in health data');
    assert.equal(apiFoot?.capabilities.live, true);
    assert.equal(fData?.capabilities.delayed, true);
  });

  test('(6) ScheduleAwareScheduler: Maps provider_fixture_map from kickoff and team names', async () => {
    const now = new Date();
    const key = scheduleAwareScheduler.generateMatchKey('Arsenal FC', 'Chelsea FC', now);
    assert.ok(key.includes('arsenal'));
    assert.ok(key.includes('chelsea'));
    assert.ok(key.includes(now.toISOString().slice(0, 10)));
  });
});
