-- TactIQ Database Migration: FASE 2 Live Ingestion Schema (UP)
-- Adds provenance columns, match_events, match_lineups, match_statistics, match_injuries, and provider_mappings

-- 1. Provenance Columns on teams, fixtures, league_standings
ALTER TABLE "teams" 
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "provider" TEXT;

CREATE INDEX IF NOT EXISTS "teams_externalId_idx" ON "teams"("externalId");

ALTER TABLE "fixtures"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "provider" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'database-seed',
  ADD COLUMN IF NOT EXISTS "fetchedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isStale" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDelayed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "fixtures_externalId_idx" ON "fixtures"("externalId");

ALTER TABLE "league_standings"
  ADD COLUMN IF NOT EXISTS "externalId" TEXT,
  ADD COLUMN IF NOT EXISTS "provider" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'database-seed',
  ADD COLUMN IF NOT EXISTS "fetchedAt" TIMESTAMP(3);

-- 2. Match Events Table
CREATE TABLE IF NOT EXISTS "match_events" (
  "id" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "minute" INTEGER NOT NULL,
  "extraMinute" INTEGER,
  "teamName" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "assistName" TEXT,
  "type" TEXT NOT NULL,
  "detail" TEXT,
  "source" TEXT NOT NULL DEFAULT 'api-football',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "match_events_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "match_events_fixtureId_idx" ON "match_events"("fixtureId");
CREATE INDEX IF NOT EXISTS "match_events_minute_idx" ON "match_events"("minute");

-- 3. Match Lineups Table
CREATE TABLE IF NOT EXISTS "match_lineups" (
  "id" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "teamSide" TEXT NOT NULL,
  "teamName" TEXT NOT NULL,
  "formation" TEXT NOT NULL,
  "coachName" TEXT,
  "startXI" JSONB NOT NULL,
  "substitutes" JSONB NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'api-football',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_lineups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "match_lineups_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_lineups_fixtureId_teamSide_key" UNIQUE ("fixtureId", "teamSide")
);

-- 4. Match Statistics Table
CREATE TABLE IF NOT EXISTS "match_statistics" (
  "id" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "period" TEXT NOT NULL DEFAULT 'ALL',
  "homeStats" JSONB NOT NULL,
  "awayStats" JSONB NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'api-football',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_statistics_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "match_statistics_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "match_statistics_fixtureId_period_key" UNIQUE ("fixtureId", "period")
);

-- 5. Match Injuries Table
CREATE TABLE IF NOT EXISTS "match_injuries" (
  "id" TEXT NOT NULL,
  "fixtureId" TEXT NOT NULL,
  "teamName" TEXT NOT NULL,
  "playerName" TEXT NOT NULL,
  "type" TEXT,
  "reason" TEXT,
  "source" TEXT NOT NULL DEFAULT 'api-football',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "match_injuries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "match_injuries_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "fixtures"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "match_injuries_fixtureId_idx" ON "match_injuries"("fixtureId");

-- 6. Provider Mapping Table
CREATE TABLE IF NOT EXISTS "provider_mappings" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "internalId" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_mappings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_mappings_provider_entityType_externalId_key" UNIQUE ("provider", "entityType", "externalId")
);

CREATE INDEX IF NOT EXISTS "provider_mappings_internalId_idx" ON "provider_mappings"("internalId");

-- 7. Provider Fixture Mapping Table
CREATE TABLE IF NOT EXISTS "provider_fixture_map" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerFixtureId" TEXT NOT NULL,
  "internalFixtureId" TEXT,
  "matchKey" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'resolved',
  "kickoff" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_fixture_map_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "provider_fixture_map_provider_providerFixtureId_key" UNIQUE ("provider", "providerFixtureId")
);

CREATE INDEX IF NOT EXISTS "provider_fixture_map_internalFixtureId_idx" ON "provider_fixture_map"("internalFixtureId");
CREATE INDEX IF NOT EXISTS "provider_fixture_map_matchKey_idx" ON "provider_fixture_map"("matchKey");
