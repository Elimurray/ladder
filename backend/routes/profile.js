const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Get my profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone_number, u.squash_grade, u.is_member, u.is_admin, u.is_junior, u.play_for_levels, u.created_at,
      lp.position, lp.status,
      up.earliest_time, up.notes
   FROM users u
   LEFT JOIN ladder_positions lp ON u.id = lp.user_id
   LEFT JOIN user_preferences up ON u.id = up.user_id
   WHERE u.id = $1`,
      [req.user.id],
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
        lh.position,
        TO_CHAR(m.week_date, 'YYYY-MM-DD') as week_date
       FROM matches m
       LEFT JOIN users u ON m.opponent_id = u.id
       LEFT JOIN ladder_history lh ON lh.user_id = m.player_id AND lh.week_date = m.week_date
       WHERE m.player_id = $1 AND m.admin_approved = true
       ORDER BY m.week_date DESC
       LIMIT 20`,
      [req.user.id],
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
       WHERE player_id = $1 AND admin_approved = true AND submitted_at >= '2026-02-09'`,
      [req.user.id],
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
      [req.user.id, earliest_time, notes],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Update contact information
router.put("/contact", authMiddleware, async (req, res) => {
  try {
    const { email, phone_number, squash_grade, is_junior } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email is already taken by another user
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, req.user.id],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const result = await pool.query(
      "UPDATE users SET email = $1, phone_number = $2, squash_grade = $3, is_junior = $4 WHERE id = $5 RETURNING id, email, full_name, phone_number, is_member, is_admin, squash_grade, is_junior",
      [email, phone_number, squash_grade, is_junior, req.user.id],
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
      [status, req.user.id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({
          error:
            "You are not currently on the ladder – please email fscladder@gmail.com to be added back on",
        });
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
   ORDER BY lp.position`,
      );

      res.json(preferences.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// Update squash levels preference
router.patch("/squash-levels", authMiddleware, async (req, res) => {
  try {
    const { play_for_levels } = req.body;

    const result = await pool.query(
      "UPDATE users SET play_for_levels = $1 WHERE id = $2 RETURNING id, email, full_name, is_member, is_admin, is_junior, play_for_levels",
      [play_for_levels, req.user.id],
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

// Change password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Please provide all fields" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Get user with password
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      req.user.id,
    ]);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
