# Live Scoring Feature — Spec

## Context

Existing app: React/Vite frontend, Node/Express backend, PostgreSQL, JWT auth (`backend/middleware/auth.js`), roles currently `member`, `admin`, `draw_admin`, `junior`. Matches are submitted manually via `SubmitMatch.jsx` / `SubmitMatchForm.jsx` and processed through the existing `/api/matches` routes (submit → approve → process-week).

Goal: add optional live scoring for matches, run entirely by dedicated ref devices. No live scoring for a match just means it falls back to the current manual submit flow — no changes needed there.

## Feature summary

- Some matches are scored live by a dedicated ref device (tablet/phone) sitting on a court.
- Ref devices are provisioned as individual user accounts with a new `ref` role, one account per device (e.g. `ref_court1`, `ref_court2`), not shared logins.
- Only `ref` or `admin` role can start a live scoring session on a pairing, and only that session's device (or an admin override) can post points to it.
- Any logged-in user can view a live match's score in real time (read-only, polling) and see a "LIVE" badge on the Draw page for in-progress matches.
- When a live match finishes, the result is written into the existing `matches` table via whatever internal function the current `/api/matches/submit` route uses — so approval and process-week logic downstream is completely unaffected by whether a result came from live scoring or manual entry.
- Squash scoring rules (rally to 11, win by 2, best of 3 or 5 sets) are enforced server-side — the ref device just posts "point to player A" or "point to player B" events, the server determines set/match completion.
- Transport: polling (e.g. every 2-3s), not websockets — this is a small club-scale app and polling is simpler to build/run on the existing Docker/Pi/Cloudflare Tunnel setup.

## What I need help with

Please review the existing schema (`backend/schema_export.sql`) and propose the concrete database changes needed to support this feature:

1. Whether `ref` should be added to an existing roles enum/check constraint on `users`, and the migration for that.
2. A new table (tentatively `live_matches`) to hold live scoring sessions, with something like:
   - link to the relevant `draws` pairing
   - `ref_user_id` (which device/account owns/started this session, for locking)
   - `status` (`live`, `completed`, `abandoned`)
   - a point-by-point event log (so undo is just "pop last event and recompute") rather than only a running tally
   - a derived/cached current score (sets + current set score) for fast reads without recomputing on every poll
   - `started_at` / `ended_at`
3. How this table should relate back to `matches` — i.e. what gets written into `matches` on completion, and whether `live_matches` should keep a reference to the resulting `matches.id` for traceability.
4. Any indexes needed for the polling read pattern (frequent reads of one live match's current state, plus a "give me all currently-live matches" query for the Draw page badge).
5. A migration script consistent with how `schema_export.sql` / existing migrations (if any) are structured in this repo.

Don't build the API routes or frontend yet — just the schema/migration piece for now.
