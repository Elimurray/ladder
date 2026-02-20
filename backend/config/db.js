const { Pool, types } = require("pg");
require("dotenv").config();

// Return DATE columns as plain YYYY-MM-DD strings instead of JS Date objects
// types.setTypeParser(1082, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: connection pool settings
  max: 20, // maximum number of clients
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected database error:", err);
  process.exit(-1);
});

module.exports = pool;
