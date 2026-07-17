-- Migration 001: live scoring (ref role + live match sessions)
--
-- Apply with:
--   psql postgresql://eli:password@192.168.1.11:5432/ladder_db -f backend/migrations/001_live_scoring.sql
-- After applying, refresh the schema snapshot:
--   pg_dump --schema-only postgresql://eli:password@192.168.1.11:5432/ladder_db > backend/schema_export.sql

BEGIN;

-- 1. Ref role: the app models roles as boolean flags on users
--    (is_admin, is_draw_admin, is_junior), not an enum, so is_ref follows suit.
ALTER TABLE users ADD COLUMN is_ref BOOLEAN DEFAULT false;

-- 2. Live scoring sessions, one per draw pairing being scored live.
CREATE TABLE live_matches (
  id SERIAL PRIMARY KEY,
  draw_id INTEGER NOT NULL REFERENCES draws(id),
  ref_user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'live'
    CHECK (status IN ('live', 'completed', 'abandoned')),
  best_of INTEGER NOT NULL DEFAULT 5 CHECK (best_of IN (3, 5)),
  -- Cached score derived from live_match_events, recomputed server-side on
  -- every point/undo so polling reads never replay the event log.
  -- Shape: {"sets_won": {"p1": 0, "p2": 0},
  --         "completed_sets": [{"p1": 11, "p2": 7}],
  --         "current_set": {"p1": 3, "p2": 2}}
  current_score JSONB NOT NULL
    DEFAULT '{"sets_won": {"p1": 0, "p2": 0}, "completed_sets": [], "current_set": {"p1": 0, "p2": 0}}',
  -- Set on completion to the primary row created by the shared submit logic
  -- (which inserts one row per player; this points at the first/RETURNING one).
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- 3. Point-by-point event log. Undo = delete the highest event_number for the
--    session and recompute current_score. point_to is 1 or 2, meaning
--    draws.player1_id / draws.player2_id of the session's pairing.
CREATE TABLE live_match_events (
  id SERIAL PRIMARY KEY,
  live_match_id INTEGER NOT NULL REFERENCES live_matches(id) ON DELETE CASCADE,
  event_number INTEGER NOT NULL,
  point_to INTEGER NOT NULL CHECK (point_to IN (1, 2)),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  -- Ordering key, replay index, and idempotency guard: a ref device retrying
  -- a dropped request re-sends the same event_number and conflicts instead of
  -- double-scoring the point.
  UNIQUE (live_match_id, event_number)
);

-- 4. Indexes for the polling read pattern.
-- Session lock: at most one live session per pairing. Doubles as the index
-- behind the Draw page "all currently live" badge query
-- (WHERE status = 'live' matches the partial predicate).
CREATE UNIQUE INDEX idx_live_matches_one_live_per_draw
  ON live_matches (draw_id) WHERE status = 'live';

-- Device lock: a ref account scores one match at a time. Drop this if a
-- single device should ever run two courts.
CREATE UNIQUE INDEX idx_live_matches_one_live_per_ref
  ON live_matches (ref_user_id) WHERE status = 'live';

-- History/traceability joins (all sessions for a pairing, live or not).
CREATE INDEX idx_live_matches_draw ON live_matches (draw_id);

COMMIT;
