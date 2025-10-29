const express = require("express");
const router = express.Router();
const pool = require("../config/db");

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
      `SELECT 
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
        u2.full_name as opponent_name
       FROM matches m
       JOIN users u1 ON m.player_id = u1.id
       LEFT JOIN users u2 ON m.opponent_id = u2.id
       WHERE m.week_date = $1 
       AND m.admin_approved = true
       AND m.draw_id IS NULL
       ORDER BY m.player_id`,
      [date]
    );

    // Group by match (each match will have 2 entries, one per player)
    const matches = [];
    const processedPlayers = new Set();

    result.rows.forEach((row) => {
      if (!processedPlayers.has(row.player_id)) {
        // Find opponent's result
        const opponentResult = result.rows.find(
          (r) =>
            r.player_id === row.opponent_id && r.opponent_id === row.player_id
        );

        matches.push({
          player1_id: row.player_id,
          player1_name: row.player_name,
          player1_score: row.match_score,
          player1_games_won: row.games_won,
          player1_set_scores: row.set_scores,
          player2_id: row.opponent_id,
          player2_name: row.opponent_name,
          player2_score: opponentResult?.match_score || "0-0",
          player2_games_won: opponentResult?.games_won || 0,
          player2_set_scores: opponentResult?.set_scores,
          winner:
            row.games_won > (opponentResult?.games_won || 0)
              ? row.player_name
              : row.opponent_name,
        });

        processedPlayers.add(row.player_id);
        if (row.opponent_id) processedPlayers.add(row.opponent_id);
      }
    });

    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
