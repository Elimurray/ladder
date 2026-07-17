const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

// Register new user
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      full_name,
      password,
      phone_number,
      squash_grade,
      is_junior,
    } = req.body;

    // Validate input
    if (!email || !full_name || !password || !phone_number || !is_junior) {
      return res
        .status(400)
        .json({ error: "Please provide all required fields" });
    }

    // Check if user already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      "INSERT INTO users (email, full_name, password_hash, phone_number, squash_grade, is_member, is_junior) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, full_name, phone_number, squash_grade, is_member, is_admin, is_draw_admin, is_junior, play_for_levels, is_ref",
      [
        email,
        full_name,
        password_hash,
        phone_number,
        squash_grade,
        true,
        is_junior,
      ],
    );

    const user = result.rows[0];

    // Insert default preferences for new user
    await pool.query(
      "INSERT INTO user_preferences (user_id, earliest_time, notes) VALUES ($1, $2, $3)",
      [user.id, "6:00pm", ""],
    );

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        is_draw_admin: user.is_draw_admin,
        is_ref: user.is_ref,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        squash_grade: user.squash_grade,
        is_member: user.is_member,
        is_admin: user.is_admin,
        is_draw_admin: user.is_draw_admin,
        is_junior: user.is_junior,
        play_for_levels: user.play_for_levels,
        is_ref: user.is_ref,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    // Check if user exists
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        is_draw_admin: user.is_draw_admin,
        is_ref: user.is_ref,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        squash_grade: user.squash_grade,
        is_member: user.is_member,
        is_admin: user.is_admin,
        is_draw_admin: user.is_draw_admin,
        is_junior: user.is_junior,
        play_for_levels: user.play_for_levels,
        is_ref: user.is_ref,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get current user (verify token)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, full_name, phone_number, squash_grade, is_member, is_admin, is_draw_admin, is_junior, play_for_levels, is_ref, created_at FROM users WHERE id = $1",
      [req.user.id],
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

// Change password - ADD THIS ROUTE
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

// Reset password to "password" (Admin only)
router.post("/reset-password/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Hash the default password "password"
    const defaultPassword = "password";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Update user's password
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, full_name",
      [hashedPassword, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Password reset to 'password'",
      user: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
