const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const cron = require("node-cron");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const ladderRoutes = require("./routes/ladder");
const drawRoutes = require("./routes/draw");
const matchesRoutes = require("./routes/matches");
const profileRoutes = require("./routes/profile");
const resultsRoutes = require("./routes/results");
app.use("/api/results", resultsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/draw", drawRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/ladder", ladderRoutes);

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Server and database connected!",
      timestamp: result.rows[0].now,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Run every Sunday at 6:00am NZ time
// Sunday 6:00am NZ time (NZDT UTC+13 = Saturday 17:00 UTC)
cron.schedule("0 17 * * 6", async () => {
  try {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const result = await pool.query(
      `UPDATE ladder_positions
       SET status = 'active', resume_date = NULL, updated_at = NOW()
       WHERE status = 'no_play' AND resume_date IS NOT NULL AND resume_date <= $1
       RETURNING user_id`,
      [today],
    );
    console.log(`Auto-resume: ${result.rows.length} player(s) set back to active`);
  } catch (err) {
    console.error("Auto-resume cron error:", err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
