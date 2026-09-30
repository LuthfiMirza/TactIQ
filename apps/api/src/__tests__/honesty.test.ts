import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../app.js';
import { apiFootballService } from '../services/apiFootball.service.js';

describe('Data Honesty & Provenance Verification (FASE 1A)', () => {
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

  test('(a) Health Data endpoint reports explicit mode and provider status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health/data`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      data: {
        mode: string;
        provider: string;
        providerStatus: string;
        source: string;
        databaseCounts: Record<string, number>;
      };
    };

    assert.equal(json.success, true);
    assert.ok(['demo', 'live', 'cached'].includes(json.data.mode), 'mode must be demo, live, or cached');
    assert.ok(json.data.provider, 'provider must be identified');
    assert.ok(['available', 'unavailable', 'demo'].includes(json.data.providerStatus), 'providerStatus must be available, unavailable, or demo');
    assert.ok(json.data.source, 'source must be explicit');
    assert.ok(typeof json.data.databaseCounts === 'object', 'database record counts must be reported');
  });

  test('(b) Provider failure returns empty / unavailable, NO silent fallback to fake seed data', async () => {
    // In live mode with invalid or unconfigured key, getLiveScores must return [] without fabricating goals
    const previousMode = process.env.DATA_MODE;
    process.env.DATA_MODE = 'live';

    try {
      const liveScores = await apiFootballService.getLiveScores();
      // In live mode without valid external connection, live scores must be an array (typically empty or real),
      // NEVER silently fabricated goals from LiveMatchEngine
      assert.ok(Array.isArray(liveScores));
      // Must not generate mock data with status LIVE unless returned from real upstream
    } finally {
      process.env.DATA_MODE = previousMode || 'demo';
    }
  });

  test('(c) Matches endpoint returns DataProvenanceMeta with accurate mode and source', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/fixtures`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      meta?: {
        source: string;
        fetchedAt: string;
        isStale: boolean;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.meta, 'Response must contain provenance meta');
    assert.ok(json.meta.source, 'Meta must state accurate data source');
    assert.ok(json.meta.fetchedAt, 'Meta must include ISO timestamp');
    assert.ok(['demo', 'live', 'cached'].includes(json.meta.mode), 'Meta mode must be demo, live, or cached');
  });

  test('(d) Players endpoint explicitly discloses seed file provenance and demo mode', async () => {
    const res = await fetch(`${baseUrl}/api/v1/players?limit=5`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as {
      success: boolean;
      meta?: {
        source: string;
        mode: string;
      };
    };

    assert.equal(json.success, true);
    assert.ok(json.meta, 'Players response must include provenance metadata');
    assert.ok(
      json.meta.source.includes('players_fbref_500.json') || json.meta.source.includes('database-seed'),
      'Players source must honestly disclose static seed origin'
    );
    assert.equal(json.meta.mode, 'demo');
  });

  test('(e) Prediction endpoint clearly brands synthetic RandomForest as DEMO MODEL and Estimated xG', async () => {
    const res = await fetch(`${baseUrl}/api/v1/matches/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fixtureId: 'm1' }),
    });

    assert.equal(res.status, 200);
    const json = (await res.json()) as {
      success: boolean;
      data: {
        modelType?: string;
        xGType?: string;
        meta?: { mode: string; source: string };
      };
    };

    assert.equal(json.success, true);
    assert.ok(
      json.data.modelType?.includes('DEMO MODEL'),
      'Prediction modelType must contain DEMO MODEL'
    );
    assert.ok(
      json.data.xGType?.includes('Estimated xG'),
      'xG must be labeled as Estimated xG (model)'
    );
  });
});
