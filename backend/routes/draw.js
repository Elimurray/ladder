const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Get draw for a specific week
router.get("/week/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      `
      SELECT 
        d.*,
        u1.full_name as player1_name,
        u1.email as player1_email,
        u2.full_name as player2_name,
        u2.email as player2_email
      FROM draws d
      LEFT JOIN users u1 ON d.player1_id = u1.id
      LEFT JOIN users u2 ON d.player2_id = u2.id
      WHERE d.week_date = $1
      ORDER BY d.time_slot, d.player1_position
    `,
      [date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current week's draw
router.get("/current", async (req, res) => {
  try {
    // Get the most recent draw
    const result = await pool.query(`
      SELECT 
        d.*,
        u1.full_name as player1_name,
        u1.email as player1_email,
        u2.full_name as player2_name,
        u2.email as player2_email
      FROM draws d
      LEFT JOIN users u1 ON d.player1_id = u1.id
      LEFT JOIN users u2 ON d.player2_id = u2.id
      WHERE d.week_date = (SELECT MAX(week_date) FROM draws)
      ORDER BY d.time_slot, d.player1_position
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Generate draw for a week (auto-pair based on ladder positions)
router.post("/generate", authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { week_date } = req.body;

    await client.query("BEGIN");

    // Check if draw already exists for this week
    const existingDraw = await client.query(
      "SELECT COUNT(*) FROM draws WHERE week_date = $1",
      [week_date]
    );

    if (existingDraw.rows[0].count > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Draw already exists for this week" });
    }

    // Get active ladder positions
    const ladder = await client.query(`
      SELECT 
        lp.id,
        lp.user_id,
        lp.position,
        u.full_name
      FROM ladder_positions lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.status = 'active'
      ORDER BY lp.position
    `);

    const players = ladder.rows;
    const draws = [];

    // Pair players: 1 vs 2, 3 vs 4, etc.
    for (let i = 0; i < players.length - 1; i += 2) {
      const player1 = players[i];
      const player2 = players[i + 1];

      draws.push({
        player1_id: player1.user_id,
        player2_id: player2.user_id,
        player1_position: player1.position,
        player2_position: player2.position,
      });
    }

    // If odd number of players, last player gets a bye
    if (players.length % 2 !== 0) {
      const lastPlayer = players[players.length - 1];
      draws.push({
        player1_id: lastPlayer.user_id,
        player2_id: null,
        player1_position: lastPlayer.position,
        player2_position: null,
      });
    }

    // Insert draws
    for (const draw of draws) {
      await client.query(
        "INSERT INTO draws (week_date, player1_id, player2_id, player1_position, player2_position) VALUES ($1, $2, $3, $4, $5)",
        [
          week_date,
          draw.player1_id,
          draw.player2_id,
          draw.player1_position,
          draw.player2_position,
        ]
      );
    }

    await client.query("COMMIT");
    res.json({
      message: "Draw generated successfully",
      pairings: draws.length,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// Admin: Update time slot for a pairing
router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { time_slot, bar_duty, notes } = req.body;

    const result = await pool.query(
      "UPDATE draws SET time_slot = $1, bar_duty = $2, notes = $3 WHERE id = $4 RETURNING *",
      [time_slot, bar_duty, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Draw not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Delete a draw (for regenerating)
router.delete(
  "/week/:date",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { date } = req.params;

      await pool.query("DELETE FROM draws WHERE week_date = $1", [date]);
      res.json({ message: "Draw deleted successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
