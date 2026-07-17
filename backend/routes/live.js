const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, refMiddleware } = require("../middleware/auth");
const { computeScore, buildFinalResults } = require("../controllers/liveScoring");

// Load a session and its full event log (points in event_number order).
// Locks the session row when a client with an open transaction is passed.
async function loadSession(db, id, forUpdate) {
  const session = await db.query(
    `SELECT * FROM live_matches WHERE id = $1${forUpdate ? " FOR UPDATE" : ""}`,
    [id],
  );
  if (session.rows.length === 0) return null;

  const events = await db.query(
    `SELECT point_to FROM live_match_events
     WHERE live_match_id = $1 ORDER BY event_number`,
    [id],
  );
  return {
    session: session.rows[0],
    points: events.rows.map((e) => e.point_to),
  };
}

// Only the ref device that started the session (or an admin) may write to it.
function canControl(session, user) {
  return session.ref_user_id === user.id || user.is_admin;
}

// Start a live scoring session on a draw pairing (ref or admin only)
router.post("/start", authMiddleware, refMiddleware, async (req, res) => {
  try {
    const { draw_id, best_of } = req.body;
    const bestOf = best_of || 5;

    if (![3, 5].includes(bestOf)) {
      return res.status(400).json({ error: "best_of must be 3 or 5" });
    }

    const drawInfo = await pool.query("SELECT * FROM draws WHERE id = $1", [
      draw_id,
    ]);
    if (drawInfo.rows.length === 0) {
      return res.status(404).json({ error: "Draw not found" });
    }
    const draw = drawInfo.rows[0];
    if (!draw.player1_id || !draw.player2_id) {
      return res
        .status(400)
        .json({ error: "This pairing does not have two players" });
    }

    // Pairings with a submitted result can't be scored live
    const existing = await pool.query(
      `SELECT id FROM matches
       WHERE week_date = $1
       AND ((player_id = $2 AND opponent_id = $3)
            OR (player_id = $3 AND opponent_id = $2))`,
      [draw.week_date, draw.player1_id, draw.player2_id],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "A result has already been submitted for this match",
      });
    }

    const result = await pool.query(
      `INSERT INTO live_matches (draw_id, ref_user_id, best_of)
       VALUES ($1, $2, $3) RETURNING *`,
      [draw_id, req.user.id, bestOf],
    );

    res.status(201).json({
      message: "Live scoring session started",
      session: result.rows[0],
    });
  } catch (err) {
    // Partial unique indexes reject double-starts; tell the ref which one hit
    if (err.code === "23505") {
      const message = err.constraint === "idx_live_matches_one_live_per_ref"
        ? "This ref device already has a match in progress"
        : "This match is already being scored live";
      return res.status(409).json({ error: message });
    }
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// All currently-live matches (any logged-in user; Draw page badge poll)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lm.id, lm.draw_id, lm.ref_user_id, lm.best_of, lm.current_score, lm.started_at,
              d.week_date, d.time_slot, d.player1_id, d.player2_id,
              u1.full_name AS player1_name, u2.full_name AS player2_name
       FROM live_matches lm
       JOIN draws d ON lm.draw_id = d.id
       LEFT JOIN users u1 ON d.player1_id = u1.id
       LEFT JOIN users u2 ON d.player2_id = u2.id
       WHERE lm.status = 'live'
       ORDER BY lm.started_at`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// One session's current state (any logged-in user; scoreboard poll)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lm.*,
              d.week_date, d.time_slot, d.player1_id, d.player2_id,
              u1.full_name AS player1_name, u2.full_name AS player2_name
       FROM live_matches lm
       JOIN draws d ON lm.draw_id = d.id
       LEFT JOIN users u1 ON d.player1_id = u1.id
       LEFT JOIN users u2 ON d.player2_id = u2.id
       WHERE lm.id = $1`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Live match not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Record a point (session's ref device or admin only).
// Body: { point_to: 1|2, event_number } — event_number is the device's count
// of its own events; retries of a dropped request are detected and ignored.
router.post("/:id/point", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { point_to, event_number } = req.body;

    await client.query("BEGIN");

    const loaded = await loadSession(client, req.params.id, true);
    if (!loaded) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Live match not found" });
    }
    const { session, points } = loaded;

    if (!canControl(session, req.user)) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Only this session's ref device can score it" });
    }
    if (session.status !== "live") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This match is not live" });
    }

    const nextNumber = points.length + 1;
    if (event_number !== undefined && event_number !== null) {
      if (event_number < nextNumber) {
        // Already applied (retry of a request whose response was lost)
        await client.query("ROLLBACK");
        return res.json({
          applied: false,
          message: "Point already recorded",
          current_score: session.current_score,
          status: session.status,
        });
      }
      if (event_number > nextNumber) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Device out of sync with server, refresh the match state",
          expected_event_number: nextNumber,
        });
      }
    }

    let score;
    try {
      score = computeScore([...points, point_to], session.best_of);
    } catch (scoreErr) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: scoreErr.message });
    }

    await client.query(
      `INSERT INTO live_match_events (live_match_id, event_number, point_to, created_by)
       VALUES ($1, $2, $3, $4)`,
      [session.id, nextNumber, point_to, req.user.id],
    );

    let matchId = null;
    let resultWritten = false;

    if (score.winner) {
      // Match over: write into `matches` exactly like the manual submit flow
      // (one row per player, admin_approved = false) so approval and
      // process-week downstream are unaffected.
      const drawInfo = await client.query(
        "SELECT * FROM draws WHERE id = $1",
        [session.draw_id],
      );
      const draw = drawInfo.rows[0];

      const existing = await client.query(
        `SELECT id FROM matches
         WHERE week_date = $1
         AND ((player_id = $2 AND opponent_id = $3)
              OR (player_id = $3 AND opponent_id = $2))`,
        [draw.week_date, draw.player1_id, draw.player2_id],
      );

      if (existing.rows.length === 0) {
        const finals = buildFinalResults(score);

        const p1Insert = await client.query(
          `INSERT INTO matches
           (week_date, player_id, opponent_id, draw_id, games_won, games_lost, result, match_score, set_scores, admin_approved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
           RETURNING id`,
          [
            draw.week_date,
            draw.player1_id,
            draw.player2_id,
            draw.id,
            finals.player1.games_won,
            finals.player1.games_lost,
            finals.player1.result,
            finals.player1.match_score,
            JSON.stringify(finals.player1.set_scores),
          ],
        );
        await client.query(
          `INSERT INTO matches
           (week_date, player_id, opponent_id, draw_id, games_won, games_lost, result, match_score, set_scores, admin_approved)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
          [
            draw.week_date,
            draw.player2_id,
            draw.player1_id,
            draw.id,
            finals.player2.games_won,
            finals.player2.games_lost,
            finals.player2.result,
            finals.player2.match_score,
            JSON.stringify(finals.player2.set_scores),
          ],
        );

        matchId = p1Insert.rows[0].id;
        resultWritten = true;
      }

      await client.query(
        `UPDATE live_matches
         SET status = 'completed', current_score = $1, match_id = $2, ended_at = NOW()
         WHERE id = $3`,
        [JSON.stringify(score), matchId, session.id],
      );
    } else {
      await client.query(
        "UPDATE live_matches SET current_score = $1 WHERE id = $2",
        [JSON.stringify(score), session.id],
      );
    }

    await client.query("COMMIT");

    res.json({
      applied: true,
      event_number: nextNumber,
      current_score: score,
      status: score.winner ? "completed" : "live",
      winner: score.winner,
      result_written: resultWritten,
      ...(score.winner && !resultWritten
        ? { note: "A result was already submitted for this pairing; live result not written" }
        : {}),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// Undo the last point (session's ref device or admin only)
router.post("/:id/undo", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const loaded = await loadSession(client, req.params.id, true);
    if (!loaded) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Live match not found" });
    }
    const { session, points } = loaded;

    if (!canControl(session, req.user)) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ error: "Only this session's ref device can score it" });
    }
    if (session.status !== "live") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "This match is not live" });
    }
    if (points.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No points to undo" });
    }

    await client.query(
      `DELETE FROM live_match_events
       WHERE live_match_id = $1
       AND event_number = (SELECT MAX(event_number) FROM live_match_events WHERE live_match_id = $1)`,
      [session.id],
    );

    const score = computeScore(points.slice(0, -1), session.best_of);
    await client.query(
      "UPDATE live_matches SET current_score = $1 WHERE id = $2",
      [JSON.stringify(score), session.id],
    );

    await client.query("COMMIT");

    res.json({
      event_number: points.length - 1,
      current_score: score,
      status: "live",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// Abandon a session — pairing falls back to the manual submit flow
// (session's ref device or admin only)
router.post("/:id/abandon", authMiddleware, async (req, res) => {
  try {
    const session = await pool.query(
      "SELECT * FROM live_matches WHERE id = $1",
      [req.params.id],
    );
    if (session.rows.length === 0) {
      return res.status(404).json({ error: "Live match not found" });
    }
    if (!canControl(session.rows[0], req.user)) {
      return res
        .status(403)
        .json({ error: "Only this session's ref device can abandon it" });
    }
    if (session.rows[0].status !== "live") {
      return res.status(400).json({ error: "This match is not live" });
    }

    const result = await pool.query(
      `UPDATE live_matches SET status = 'abandoned', ended_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id],
    );

    res.json({ message: "Live match abandoned", session: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
