const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
