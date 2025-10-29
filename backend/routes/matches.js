const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Submit match result (authenticated users only)
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { draw_id, opponent_id, games_won, games_lost, result } = req.body;
    const player_id = req.user.id;

    // Validate result
    const validResults = ["3", "2", "1", "0", "~", "D"];
    if (!validResults.includes(result)) {
      return res.status(400).json({ error: "Invalid result" });
    }

    // Get the draw information
    const drawInfo = await pool.query("SELECT * FROM draws WHERE id = $1", [
      draw_id,
    ]);

    if (drawInfo.rows.length === 0) {
      return res.status(404).json({ error: "Draw not found" });
    }

    const draw = drawInfo.rows[0];
    const week_date = draw.week_date;

    // Check if player is part of this match
    if (draw.player1_id !== player_id && draw.player2_id !== player_id) {
      return res.status(403).json({ error: "You are not part of this match" });
    }

    // Check if result already submitted
    const existingResult = await pool.query(
      "SELECT * FROM matches WHERE draw_id = $1 AND player_id = $2",
      [draw_id, player_id]
    );

    if (existingResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "You have already submitted a result for this match" });
    }

    // Calculate match score
    const match_score = `${games_won}-${games_lost}`;

    // Insert match result
    const resultInsert = await pool.query(
      `INSERT INTO matches 
       (week_date, player_id, opponent_id, draw_id, games_won, games_lost, result, match_score, admin_approved) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) 
       RETURNING *`,
      [
        week_date,
        player_id,
        opponent_id,
        draw_id,
        games_won,
        games_lost,
        result,
        match_score,
      ]
    );

    res.status(201).json({
      message: "Match result submitted successfully. Awaiting admin approval.",
      match: resultInsert.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my submitted results
router.get("/my-results", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        u.full_name as opponent_name,
        d.week_date
      FROM matches m
      LEFT JOIN users u ON m.opponent_id = u.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.player_id = $1
      ORDER BY m.submitted_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my current week's match
router.get("/my-match", authMiddleware, async (req, res) => {
  try {
    // Get current week's draw for this user
    const result = await pool.query(
      `SELECT 
        d.*,
        u1.full_name as player1_name,
        u2.full_name as player2_name,
        u2.id as opponent_id,
        u2.full_name as opponent_name
      FROM draws d
      LEFT JOIN users u1 ON d.player1_id = u1.id
      LEFT JOIN users u2 ON d.player2_id = u2.id
      WHERE d.week_date = (SELECT MAX(week_date) FROM draws)
      AND (d.player1_id = $1 OR d.player2_id = $1)
      LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No match found for current week" });
    }

    const match = result.rows[0];

    // Determine opponent
    if (match.player1_id === req.user.id) {
      match.opponent_id = match.player2_id;
      match.opponent_name = match.player2_name;
    } else {
      match.opponent_id = match.player1_id;
      match.opponent_name = match.player1_name;
    }

    // Check if already submitted
    const submitted = await pool.query(
      "SELECT * FROM matches WHERE draw_id = $1 AND player_id = $2",
      [match.id, req.user.id]
    );

    match.already_submitted = submitted.rows.length > 0;
    if (match.already_submitted) {
      match.submitted_result = submitted.rows[0];
    }

    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get all pending results
router.get("/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        u1.full_name as player_name,
        u2.full_name as opponent_name,
        d.week_date,
        d.time_slot
      FROM matches m
      JOIN users u1 ON m.player_id = u1.id
      LEFT JOIN users u2 ON m.opponent_id = u2.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.admin_approved = false
      ORDER BY m.submitted_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get all results for a specific week
router.get("/week/:date", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      `SELECT 
        m.*,
        u1.full_name as player_name,
        u2.full_name as opponent_name,
        d.player1_position,
        d.player2_position
      FROM matches m
      JOIN users u1 ON m.player_id = u1.id
      LEFT JOIN users u2 ON m.opponent_id = u2.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.week_date = $1
      ORDER BY d.player1_position`,
      [date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Approve match result
router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "UPDATE matches SET admin_approved = true WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Match not found" });
      }

      res.json({ message: "Match approved", match: result.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin: Reject/delete match result
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM matches WHERE id = $1", [id]);
    res.json({ message: "Match result deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
