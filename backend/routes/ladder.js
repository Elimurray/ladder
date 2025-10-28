const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Get full ladder (public - anyone can view)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lp.id,
        lp.position,
        lp.status,
        u.id as user_id,
        u.full_name,
        u.email,
        u.is_member,
        lp.updated_at
      FROM ladder_positions lp
      JOIN users u ON lp.user_id = u.id
      ORDER BY lp.position ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get specific user's ladder position
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        lp.id,
        lp.position,
        lp.status,
        u.full_name,
        lp.updated_at
      FROM ladder_positions lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.user_id = $1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not on ladder" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my position (requires authentication)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        lp.id,
        lp.position,
        lp.status,
        u.full_name,
        lp.updated_at
      FROM ladder_positions lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.user_id = $1
    `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "You are not on the ladder yet" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Set user status (withdraw, active, no_play) - User can do this themselves
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

// Admin: Add new user to ladder at specific position
router.post("/add", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { user_id, position } = req.body;

    // Check if user already on ladder
    const checkExisting = await pool.query(
      "SELECT * FROM ladder_positions WHERE user_id = $1",
      [user_id]
    );

    if (checkExisting.rows.length > 0) {
      return res.status(400).json({ error: "User already on ladder" });
    }

    // Shift everyone down who is at or below this position
    await pool.query(
      "UPDATE ladder_positions SET position = position + 1 WHERE position >= $1",
      [position]
    );

    // Insert new position
    const result = await pool.query(
      "INSERT INTO ladder_positions (user_id, position, status) VALUES ($1, $2, $3) RETURNING *",
      [user_id, position, "active"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Manually update position (for corrections)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    // Get current position
    const current = await pool.query(
      "SELECT position FROM ladder_positions WHERE id = $1",
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: "Ladder position not found" });
    }

    const oldPosition = current.rows[0].position;

    if (oldPosition === position) {
      return res.json({ message: "Position unchanged" });
    }

    // Move others around
    if (position > oldPosition) {
      // Moving down - shift others up
      await pool.query(
        "UPDATE ladder_positions SET position = position - 1 WHERE position > $1 AND position <= $2",
        [oldPosition, position]
      );
    } else {
      // Moving up - shift others down
      await pool.query(
        "UPDATE ladder_positions SET position = position + 1 WHERE position >= $1 AND position < $2",
        [position, oldPosition]
      );
    }

    // Update the position
    const result = await pool.query(
      "UPDATE ladder_positions SET position = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [position, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
