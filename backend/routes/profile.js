const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Get my profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.is_member, u.is_admin, u.is_junior, u.play_for_levels, u.created_at,
          lp.position, lp.status,
          up.earliest_time, up.notes
   FROM users u
   LEFT JOIN ladder_positions lp ON u.id = lp.user_id
   LEFT JOIN user_preferences up ON u.id = up.user_id
   WHERE u.id = $1`,
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my match history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const matches = await pool.query(
      `SELECT 
        m.*,
        u.full_name as opponent_name,
        d.week_date,
        d.time_slot
       FROM matches m
       LEFT JOIN users u ON m.opponent_id = u.id
       LEFT JOIN draws d ON m.draw_id = d.id
       WHERE m.player_id = $1 AND m.admin_approved = true
       ORDER BY d.week_date DESC
       LIMIT 20`,
      [req.user.id]
    );

    res.json(matches.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_matches,
        COUNT(*) FILTER (WHERE result = '3') as wins,
        COUNT(*) FILTER (WHERE result IN ('0', '1', '2')) as losses,
        COUNT(*) FILTER (WHERE result = '~') as no_plays,
        COUNT(*) FILTER (WHERE result = 'D') as defaults,
        SUM(games_won) as total_games_won,
        SUM(games_lost) as total_games_lost
       FROM matches
       WHERE player_id = $1 AND admin_approved = true`,
      [req.user.id]
    );

    res.json(stats.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update my preferences
router.put("/preferences", authMiddleware, async (req, res) => {
  try {
    const { earliest_time, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO user_preferences (user_id, earliest_time, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         earliest_time = $2,
         notes = $3,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, earliest_time, notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update my ladder status (withdraw/active)
router.patch("/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (!["active", "withdrawn", "no_play"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE ladder_positions SET status = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *",
      [status, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "You are not on the ladder" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get all user preferences
router.get(
  "/all-preferences",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const preferences = await pool.query(
        `SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_junior,
    lp.position,
    lp.status,
    up.earliest_time,
    up.notes
   FROM users u
   LEFT JOIN ladder_positions lp ON u.id = lp.user_id
   LEFT JOIN user_preferences up ON u.id = up.user_id
   WHERE lp.status = 'active'
   ORDER BY lp.position`
      );

      res.json(preferences.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update squash levels preference
router.patch("/squash-levels", authMiddleware, async (req, res) => {
  try {
    const { play_for_levels } = req.body;

    const result = await pool.query(
      "UPDATE users SET play_for_levels = $1 WHERE id = $2 RETURNING id, email, full_name, is_member, is_admin, is_junior, play_for_levels",
      [play_for_levels, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
