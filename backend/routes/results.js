const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const RESULTS_SELECT = `SELECT 
        m.id,
        m.week_date,
        m.player_id,
        m.opponent_id,
        m.games_won,
        m.games_lost,
        m.match_score,
        m.result,
        m.set_scores,
        u1.full_name as player_name,
        u1.play_for_levels as player1_levels,
        u2.full_name as opponent_name,
        u2.play_for_levels as player2_levels,
        lh1.position as player1_position,
        lh2.position as player2_position
       FROM matches m
       JOIN users u1 ON m.player_id = u1.id
       LEFT JOIN users u2 ON m.opponent_id = u2.id
       LEFT JOIN ladder_history lh1 ON lh1.user_id = m.player_id AND lh1.week_date = m.week_date
       LEFT JOIN ladder_history lh2 ON lh2.user_id = m.opponent_id AND lh2.week_date = m.week_date`;

// Group rows into matches (each match has 2 rows, one per player).
// Rows may span multiple weeks, so pairing is scoped to week_date.
const pairMatches = (rows) => {
  const matches = [];
  const processedPlayers = new Set();
  const weekKey = (row) => new Date(row.week_date).getTime();

  rows.forEach((row) => {
    const key = `${weekKey(row)}:${row.player_id}`;
    if (processedPlayers.has(key)) return;

    // Find opponent's result
    const opponentResult = rows.find(
      (r) =>
        weekKey(r) === weekKey(row) &&
        r.player_id === row.opponent_id &&
        r.opponent_id === row.player_id
    );

    matches.push({
      week_date: row.week_date,
      player1_id: row.player_id,
      player1_name: row.player_name,
      player1_position: row.player1_position,
      player1_levels: row.player1_levels,
      player1_score: row.match_score,
      player1_games_won: row.games_won,
      player1_set_scores: row.set_scores,
      player2_id: row.opponent_id,
      player2_name: row.opponent_name,
      player2_position: row.player2_position,
      player2_levels: row.player2_levels,
      player2_score: opponentResult?.match_score || "0-0",
      player2_games_won: opponentResult?.games_won || 0,
      player2_set_scores: opponentResult?.set_scores,
      winner:
        row.games_won > (opponentResult?.games_won || 0)
          ? row.player_name
          : row.opponent_name,
    });

    processedPlayers.add(key);
    if (row.opponent_id)
      processedPlayers.add(`${weekKey(row)}:${row.opponent_id}`);
  });

  return matches;
};

// Get all processed weeks (weeks that have been completed)
router.get("/weeks", async (req, res) => {
  try {
    // Get distinct weeks from matches that have been processed (draw deleted means processed)
    const result = await pool.query(
      `SELECT DISTINCT week_date 
       FROM matches 
       WHERE admin_approved = true AND draw_id IS NULL
       ORDER BY week_date DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get results for a specific week
router.get("/week/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      `${RESULTS_SELECT}
       WHERE m.week_date = $1 
       AND m.admin_approved = true
       AND m.draw_id IS NULL
       ORDER BY COALESCE(lh1.position, 999), m.player_id`,
      [date]
    );

    res.json(pairMatches(result.rows));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get results across a date range (admin export)
router.get("/range", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "from and to dates are required" });
    }

    const result = await pool.query(
      `${RESULTS_SELECT}
       WHERE m.week_date BETWEEN $1 AND $2
       AND m.admin_approved = true
       AND m.draw_id IS NULL
       ORDER BY m.week_date, COALESCE(lh1.position, 999), m.player_id`,
      [from, to]
    );

    res.json(pairMatches(result.rows));
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
