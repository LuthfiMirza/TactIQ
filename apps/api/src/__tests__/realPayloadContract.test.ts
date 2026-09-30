import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../../../tests/fixtures/providers');

describe('Real Payload Contract Tests (Offline - Zero Network Quota Used)', () => {
  const originalFetch = global.fetch;

  before(() => {
    // Block any external HTTP calls to protect live API quotas during tests (Requirement E)
    global.fetch = (async (url: any, init?: any) => {
      const urlStr = String(url);
      if (
        urlStr.includes('api-sports.io') ||
        urlStr.includes('football-data.org') ||
        urlStr.includes('highlightly')
      ) {
        throw new Error(`🚫 BLOCKED LIVE API CALL IN TEST: ${urlStr}. Tests must use recorded fixtures.`);
      }
      return originalFetch(url, init);
    }) as any;
  });

  after(() => {
    global.fetch = originalFetch;
  });

  test('(1) football-data.org Standings Payload: Successfully parses recorded Premier League table', () => {
    const filePath = path.join(FIXTURES_DIR, 'football-data-org/standings_pl.json');
    assert.ok(fs.existsSync(filePath), 'Fixture file must exist');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(raw.status, 200);
    assert.equal(raw.endpoint, '/v4/competitions/PL/standings');
    assert.ok(raw.headers['x-requests-available-minute'], 'Must contain x-requests-available-minute header');
    assert.equal(raw.headers['x-requests-available-minute'], '9');

    const standingsTable = raw.body?.standings?.[0]?.table;
    assert.ok(Array.isArray(standingsTable), 'Standings table must be an array');
    assert.equal(standingsTable.length, 20, 'Premier League must have 20 teams');

    // Verify first row contract
    const firstTeam = standingsTable[0];
    assert.ok(typeof firstTeam.position === 'number');
    assert.ok(typeof firstTeam.team?.id === 'number');
    assert.ok(typeof firstTeam.team?.name === 'string');
    assert.ok(typeof firstTeam.playedGames === 'number');
    assert.ok(typeof firstTeam.won === 'number');
    assert.ok(typeof firstTeam.draw === 'number');
    assert.ok(typeof firstTeam.lost === 'number');
    assert.ok(typeof firstTeam.points === 'number');
    assert.ok(typeof firstTeam.goalsFor === 'number');
    assert.ok(typeof firstTeam.goalsAgainst === 'number');
    assert.ok(typeof firstTeam.goalDifference === 'number');
  });

  test('(2) football-data.org Matches Payload: Successfully maps finished matches to internal LiveScoreMatch DTO', () => {
    const filePath = path.join(FIXTURES_DIR, 'football-data-org/matches_pl.json');
    assert.ok(fs.existsSync(filePath), 'Fixture file must exist');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(raw.status, 200);
    assert.ok(Array.isArray(raw.body?.matches), 'Matches must be an array');
    assert.equal(raw.body.matches.length, 50);

    const matchSample = raw.body.matches[0];
    assert.ok(matchSample.id, 'Match must have an ID');
    assert.ok(matchSample.homeTeam?.name, 'Must have home team name');
    assert.ok(matchSample.awayTeam?.name, 'Must have away team name');
    assert.equal(matchSample.status, 'FINISHED');
    assert.ok(typeof matchSample.score?.fullTime?.home === 'number');
    assert.ok(typeof matchSample.score?.fullTime?.away === 'number');

    // Simulate mapping to internal LiveScoreMatch
    const internalMatch = {
      fixtureId: String(matchSample.id),
      league: raw.body.competition?.name || 'Premier League',
      homeTeam: matchSample.homeTeam.name,
      homeScore: matchSample.score.fullTime.home,
      awayTeam: matchSample.awayTeam.name,
      awayScore: matchSample.score.fullTime.away,
      status: matchSample.status === 'FINISHED' ? 'FT' : 'LIVE',
      minute: 90,
      events: [],
    };

    assert.equal(internalMatch.status, 'FT');
    assert.ok(internalMatch.fixtureId.length > 0);
  });

  test('(3) API-Football Exhausted Payload: Identifies quota exhaustion from response body and rejects deceptive headers', () => {
    const filePath = path.join(FIXTURES_DIR, 'api-football/status_exhausted.json');
    assert.ok(fs.existsSync(filePath), 'Fixture file must exist');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(raw.status, 200);
    assert.equal(raw.endpoint, '/v3/status');

    // Deceptive header check: API-Football returns 99 requests remaining even when quota is blown!
    const deceptiveHeader = raw.headers['x-ratelimit-requests-remaining'];
    assert.equal(deceptiveHeader, '99', 'API-Football header returns deceptive 99');

    // Body check: Actual error is in body.errors.requests
    const errorMsg = raw.body?.errors?.requests;
    assert.ok(errorMsg, 'Error message must be present in body.errors.requests');
    assert.ok(errorMsg.includes('request limit for the day'));

    // Verify detection logic
    const isExhausted = Boolean(errorMsg && errorMsg.includes('request limit'));
    assert.equal(isExhausted, true, 'System must identify exhaustion from body content');
  });
});
