-- TactIQ Database Migration: FASE 2 Live Ingestion Schema (DOWN - Reversible)
-- Drops tables and columns added in 02_live_ingestion_schema.up.sql

DROP TABLE IF EXISTS "provider_fixture_map";
DROP TABLE IF EXISTS "provider_mappings";
DROP TABLE IF EXISTS "match_injuries";
DROP TABLE IF EXISTS "match_statistics";
DROP TABLE IF EXISTS "match_lineups";
DROP TABLE IF EXISTS "match_events";

ALTER TABLE "league_standings"
  DROP COLUMN IF EXISTS "fetchedAt",
  DROP COLUMN IF EXISTS "source",
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "externalId";

ALTER TABLE "fixtures"
  DROP COLUMN IF EXISTS "isDelayed",
  DROP COLUMN IF EXISTS "isStale",
  DROP COLUMN IF EXISTS "fetchedAt",
  DROP COLUMN IF EXISTS "source",
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "externalId";

ALTER TABLE "teams"
  DROP COLUMN IF EXISTS "provider",
  DROP COLUMN IF EXISTS "externalId";
