import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { createApp } from '../app.js';
import { etlService } from '../services/etl.service.js';

describe('TactIQ Central API Gateway & Endpoints (TSK-09)', () => {
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

  test('GET / returns API Gateway information and version', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as Record<string, unknown>;
    assert.equal(json.name, 'TactIQ Central API Gateway');
    assert.equal(json.version, '1.0.0');
    assert.ok(json.endpoints);
  });

  test('GET /api/v1/health returns healthy service status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const json = (await res.json()) as Record<string, unknown>;
    assert.equal(json.status, 'healthy');
    assert.equal(json.service, 'tactiq-api-gateway');
    assert.ok(typeof json.uptime === 'number');
  });

  test('GET /api/v1/nonexistent returns standard 404 error envelope', async () => {
    const res = await fetch(`${baseUrl}/api/v1/nonexistent-route-404`);
    assert.equal(res.status, 404);

    const json = (await res.json()) as { success: boolean; error: { code: string } };
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'ROUTE_NOT_FOUND');
  });

  test('ETLService instance singleton integrity', () => {
    const instance1 = etlService;
    const instance2 = etlService;
    assert.equal(instance1, instance2);
    assert.equal(typeof instance1.runFullETL, 'function');
    assert.equal(typeof instance1.startETLCronJob, 'function');
    assert.equal(typeof instance1.stopETLCronJob, 'function');
  });
});
