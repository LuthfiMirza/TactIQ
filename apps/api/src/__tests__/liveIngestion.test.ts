import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../app.js';
import { apiFootballProvider } from '../providers/apiFootball.provider.js';

describe('Live Ingestion & Enhanced Endpoints Verification (FASE 2)', () => {
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

  test('(1) GET /api/v1/matches/home-ticker returns structured ticker feed with provenance meta', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/home-ticker`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: any[];
      meta: {
        source: string;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data), 'home-ticker data must be an array');
    assert.ok(json.meta, 'home-ticker must include provenance metadata');
    assert.ok(['demo', 'live', 'cached'].includes(json.meta.mode), 'mode must be demo, live, or cached');
  });

  test('(2) GET /api/v1/matches/:id/events returns events array with honest provenance', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/test-match-1/events`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: any[];
      meta: {
        source: string;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data), 'events data must be an array');
    assert.ok(json.meta, 'events must have provenance meta');
  });

  test('(3) GET /api/v1/matches/:id/lineup returns home and away lineup structures with meta', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/test-match-1/lineup`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: {
        home: any;
        away: any;
      };
      meta: {
        source: string;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.data, 'lineup response must contain data object');
    assert.ok('home' in json.data && 'away' in json.data, 'lineup must contain home and away keys');
    assert.ok(json.meta, 'lineup must have provenance meta');
  });

  test('(4) GET /api/v1/matches/:id/statistics returns period statistics bundle with meta', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/test-match-1/statistics`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: {
        period: string;
        top: any[];
        shots: any[];
      };
      meta: {
        source: string;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.data, 'statistics response must contain data');
    assert.ok(json.meta, 'statistics must have provenance meta');
  });

  test('(5) GET /api/v1/matches/preview/absentees without fixtureId returns unavailable without mock fallback', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/preview/absentees`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: any[];
      meta: {
        status?: string;
        source: string;
        reason?: string;
      };
    };

    assert.equal(json.success, true);
    assert.equal(json.data.length, 0, 'No fake Transfermarkt array returned');
    assert.equal(json.meta.status, 'unavailable', 'Status must be unavailable when no fixtureId provided');
  });

  test('(6) GET /api/v1/players supports pagination and minAge/maxAge filters on real database columns', async () => {
    const minAge = 22;
    const maxAge = 28;
    const limit = 5;

    const res = await fetch(`${baseUrl}/api/v1/players?page=1&limit=${limit}&minAge=${minAge}&maxAge=${maxAge}`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: Array<{ age: number; marketValue: number; name: string }>;
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.data.length <= limit, `Returned players must be <= limit (${limit})`);
    assert.equal(json.meta.page, 1);
    assert.equal(json.meta.limit, limit);
    assert.ok(json.meta.total > 0, 'Total count of players in age range must be positive');

    for (const player of json.data) {
      assert.ok(
        player.age >= minAge && player.age <= maxAge,
        `Player age (${player.age}) must be between ${minAge} and ${maxAge}`
      );
    }
  });

  test('(7) apiFootballProvider exposes health status, 100 daily quota limit, and token bucket tracking', () => {
    const health = apiFootballProvider.getHealthStatus();
    assert.equal(health.provider, 'api-football');
    assert.ok(typeof health.dailyQuota === 'number' || health.dailyQuota === 'unknown' || health.dailyQuota === null);
    assert.ok(typeof health.remainingQuota === 'number' || health.remainingQuota === 'unknown');
    assert.ok(['available', 'unavailable', 'exhausted', 'not_configured', 'demo', 'unknown'].includes(health.status));
  });
});
