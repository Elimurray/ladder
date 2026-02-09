const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, is_member, created_at FROM users ORDER BY id",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get single user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, email, full_name, is_member FROM users WHERE id = $1",
      [id],
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

// Create user (simplified - you'll add password hashing later)
router.post("/", async (req, res) => {
  try {
    const { email, full_name } = req.body;

    const result = await pool.query(
      "INSERT INTO users (email, full_name, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [email, full_name, "temporary_hash"],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
