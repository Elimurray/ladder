-- Migration 002: serving tracking for live scoring
--
-- Who serves first is a ref choice made when starting the match, so it must
-- be stored. Current server is derived from first_server + the point log
-- (rally winner serves; set winner opens the next set). The service box
-- (L/R) lives inside live_matches.current_score JSONB, so no column needed.
--
-- Apply with:
--   psql postgresql://eli:password@192.168.1.11:5432/ladder_db -f backend/migrations/002_first_server.sql

BEGIN;

ALTER TABLE live_matches ADD COLUMN first_server INTEGER CHECK (first_server IN (1, 2));

COMMIT;
