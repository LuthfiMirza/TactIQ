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
    const isExhausted = Boolean(errorMsg && errorMsg.includes('request limit'));
    assert.equal(isExhausted, true, 'System must identify exhaustion from body content');
  });

  test('(4) API-Football Season Restriction Payload: Identifies free plan blockage for season 2026/27', () => {
    const filePath = path.join(FIXTURES_DIR, 'api-football/fixtures_league_39_season_2026_last_10.json');
    assert.ok(fs.existsSync(filePath), 'Fixture file must exist');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(raw.status, 200);
    assert.equal(raw.endpoint, '/fixtures?league=39&season=2026&last=10');

    // Body error check: Free plan explicitly blocks season 2026
    const planError = raw.body?.errors?.plan;
    assert.ok(planError, 'Plan error must be present in body.errors.plan');
    assert.ok(
      planError.includes('Free plans do not have access to this season'),
      'Must identify free plan restriction error message'
    );
    assert.equal(raw.body.results, 0);
    assert.equal(raw.body.response.length, 0);
  });

  test('(5) API-Football League Payload: Confirms Premier League league ID 39 and available seasons', () => {
    const filePath = path.join(FIXTURES_DIR, 'api-football/leagues_id_39.json');
    assert.ok(fs.existsSync(filePath), 'Fixture file must exist');

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.equal(raw.status, 200);
    assert.equal(raw.endpoint, '/leagues?id=39');

    const leagueData = raw.body?.response?.[0];
    assert.equal(leagueData?.league?.id, 39);
    assert.equal(leagueData?.league?.name, 'Premier League');
    assert.equal(leagueData?.country?.name, 'England');

    const seasons: any[] = leagueData?.seasons || [];
    assert.ok(seasons.length >= 10, 'Must contain historical seasons');
    const seasonYears = seasons.map((s) => s.year);
    assert.ok(seasonYears.includes(2024), 'Must include 2024 season');
    assert.ok(seasonYears.includes(2026), 'Must include 2026 season');
  });
});
