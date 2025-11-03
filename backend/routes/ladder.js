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
    u.phone_number,
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
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { position } = req.body;

    await client.query("BEGIN");

    // Get current position
    const current = await client.query(
      "SELECT position, user_id FROM ladder_positions WHERE id = $1",
      [id]
    );

    if (current.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Ladder position not found" });
    }

    const oldPosition = current.rows[0].position;
    const userId = current.rows[0].user_id;

    if (oldPosition === parseInt(position)) {
      await client.query("COMMIT");
      return res.json({ message: "Position unchanged" });
    }

    // Remove this person from the ladder temporarily (set to 9999)
    await client.query(
      "UPDATE ladder_positions SET position = 9999 WHERE id = $1",
      [id]
    );

    // Shift others
    if (parseInt(position) > oldPosition) {
      // Moving down - shift others up
      await client.query(
        "UPDATE ladder_positions SET position = position - 1 WHERE position > $1 AND position <= $2 AND id != $3",
        [oldPosition, position, id]
      );
    } else {
      // Moving up - shift others down
      await client.query(
        "UPDATE ladder_positions SET position = position + 1 WHERE position >= $1 AND position < $2 AND id != $3",
        [position, oldPosition, id]
      );
    }

    // Now place the person at the new position
    await client.query(
      "UPDATE ladder_positions SET position = $1, updated_at = NOW() WHERE id = $2",
      [position, id]
    );

    // Normalize all positions to be sequential (1, 2, 3, 4...)
    const allPositions = await client.query(
      "SELECT id FROM ladder_positions ORDER BY position, updated_at"
    );

    for (let i = 0; i < allPositions.rows.length; i++) {
      await client.query(
        "UPDATE ladder_positions SET position = $1 WHERE id = $2",
        [i + 1, allPositions.rows[i].id]
      );
    }

    await client.query("COMMIT");

    // Return updated ladder
    const result = await client.query(
      "SELECT * FROM ladder_positions WHERE id = $1",
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
