-- TactIQ Database Migration: DEF-01 Check Constraints
-- Ensures numerical attributes stay within standard FIFA [0, 100] bounds
-- and match scores cannot be negative integers.

ALTER TABLE "player_attributes"
  DROP CONSTRAINT IF EXISTS "chk_pace_range",
  ADD CONSTRAINT "chk_pace_range" CHECK (pace >= 0 AND pace <= 100),
  DROP CONSTRAINT IF EXISTS "chk_shooting_range",
  ADD CONSTRAINT "chk_shooting_range" CHECK (shooting >= 0 AND shooting <= 100),
  DROP CONSTRAINT IF EXISTS "chk_passing_range",
  ADD CONSTRAINT "chk_passing_range" CHECK (passing >= 0 AND passing <= 100),
  DROP CONSTRAINT IF EXISTS "chk_dribbling_range",
  ADD CONSTRAINT "chk_dribbling_range" CHECK (dribbling >= 0 AND dribbling <= 100),
  DROP CONSTRAINT IF EXISTS "chk_defending_range",
  ADD CONSTRAINT "chk_defending_range" CHECK (defending >= 0 AND defending <= 100),
  DROP CONSTRAINT IF EXISTS "chk_physical_range",
  ADD CONSTRAINT "chk_physical_range" CHECK (physical >= 0 AND physical <= 100),
  DROP CONSTRAINT IF EXISTS "chk_vision_range",
  ADD CONSTRAINT "chk_vision_range" CHECK (vision >= 0 AND vision <= 100);

ALTER TABLE "fixtures"
  DROP CONSTRAINT IF EXISTS "chk_home_score_non_negative",
  ADD CONSTRAINT "chk_home_score_non_negative" CHECK ("homeScore" IS NULL OR "homeScore" >= 0),
  DROP CONSTRAINT IF EXISTS "chk_away_score_non_negative",
  ADD CONSTRAINT "chk_away_score_non_negative" CHECK ("awayScore" IS NULL OR "awayScore" >= 0);
