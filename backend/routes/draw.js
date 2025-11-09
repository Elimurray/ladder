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
        u1.play_for_levels as player1_levels,
        u2.full_name as player2_name,
        u2.email as player2_email,
        u2.play_for_levels as player2_levels
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
// Get current week's draw
router.get("/current", async (req, res) => {
  try {
    // Get the most recent draw
    const result = await pool.query(`
      SELECT 
        d.*,
        u1.full_name as player1_name,
        u1.email as player1_email,
        u1.play_for_levels as player1_levels,
        u2.full_name as player2_name,
        u2.email as player2_email,
        u2.play_for_levels as player2_levels
      FROM draws d
      LEFT JOIN users u1 ON d.player1_id = u1.id
      LEFT JOIN users u2 ON d.player2_id = u2.id
      WHERE d.week_date = (SELECT MAX(week_date) FROM draws)
      ORDER BY d.time_slot, d.player1_position
    `);

    // Check which matches have been submitted
    const drawIds = result.rows.map((d) => d.id);
    if (drawIds.length > 0) {
      const submissions = await pool.query(
        `SELECT DISTINCT draw_id FROM matches WHERE draw_id = ANY($1)`,
        [drawIds]
      );

      const submittedDrawIds = new Set(submissions.rows.map((s) => s.draw_id));

      // Add submitted flag to each draw item
      result.rows.forEach((draw) => {
        draw.submitted = submittedDrawIds.has(draw.id);
      });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Generate draw for a week
router.post("/generate", authMiddleware, adminMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { week_date } = req.body;

    console.log("Generating draw for:", week_date);

    await client.query("BEGIN");

    // Check if draw already exists
    const existingDraw = await client.query(
      "SELECT COUNT(*) FROM draws WHERE week_date = $1",
      [week_date]
    );

    if (parseInt(existingDraw.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Draw already exists for this week" });
    }

    // Get active ladder positions WITH user preferences
    const ladder = await client.query(`
      SELECT 
        lp.id,
        lp.user_id,
        lp.position,
        u.full_name,
        u.is_junior,
        up.earliest_time
      FROM ladder_positions lp
      JOIN users u ON lp.user_id = u.id
      LEFT JOIN user_preferences up ON u.id = up.user_id
      WHERE lp.status = 'active'
      ORDER BY lp.position
    `);

    console.log("Active players:", ladder.rows.length);

    if (ladder.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No active players on ladder" });
    }

    const players = ladder.rows;
    const pairings = [];

    // Pair players: 1 vs 2, 3 vs 4, etc.
    for (let i = 0; i < players.length - 1; i += 2) {
      const player1 = players[i];
      const player2 = players[i + 1];

      pairings.push({
        player1_id: player1.user_id,
        player2_id: player2.user_id,
        player1_position: player1.position,
        player2_position: player2.position,
        player1_junior: player1.is_junior,
        player2_junior: player2.is_junior,
        player1_earliest: player1.earliest_time,
        player2_earliest: player2.earliest_time,
      });
    }

    // Handle odd number (bye)
    if (players.length % 2 !== 0) {
      const lastPlayer = players[players.length - 1];
      pairings.push({
        player1_id: lastPlayer.user_id,
        player2_id: null,
        player1_position: lastPlayer.position,
        player2_position: null,
        player1_junior: lastPlayer.is_junior,
        player2_junior: false,
        player1_earliest: lastPlayer.earliest_time,
        player2_earliest: null,
      });
    }

    // Available time slots
    const timeSlots = [
      "5:30pm",
      "6:00pm",
      "6:30pm",
      "7:00pm",
      "7:30pm",
      "8:00pm",
      "8:30pm",
      "9:00pm",
      "9:30pm",
      "10:00pm",
      "10:30pm",
    ];

    // Auto-assign time slots
    const timeSlotAssignments = {};
    timeSlots.forEach((slot) => (timeSlotAssignments[slot] = []));

    // Helper function to convert time to 24hr for comparison
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const match = timeStr.match(/(\d+):(\d+)(am|pm)/);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3];
      if (period === "pm" && hours !== 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    // Sort pairings by constraints (juniors first, then by earliest time)
    pairings.sort((a, b) => {
      // Juniors first
      const aHasJunior = a.player1_junior || a.player2_junior;
      const bHasJunior = b.player1_junior || b.player2_junior;
      if (aHasJunior && !bHasJunior) return -1;
      if (!aHasJunior && bHasJunior) return 1;

      // Then by earliest time constraint
      const aEarliest = Math.max(
        timeToMinutes(a.player1_earliest || "5:30pm"),
        timeToMinutes(a.player2_earliest || "5:30pm")
      );
      const bEarliest = Math.max(
        timeToMinutes(b.player1_earliest || "5:30pm"),
        timeToMinutes(b.player2_earliest || "5:30pm")
      );
      return aEarliest - bEarliest;
    });

    // Assign pairings to time slots
    for (const pairing of pairings) {
      let assigned = false;
      const hasJunior = pairing.player1_junior || pairing.player2_junior;

      // Determine earliest possible slot for this pairing
      const earliestTime = Math.max(
        timeToMinutes(pairing.player1_earliest || "5:30pm"),
        timeToMinutes(pairing.player2_earliest || "5:30pm")
      );

      for (const slot of timeSlots) {
        const slotTime = timeToMinutes(slot);

        // Check constraints
        if (slotTime < earliestTime) continue; // Too early for their preference
        if (hasJunior && slotTime >= timeToMinutes("7:30pm")) continue; // Junior constraint
        if (timeSlotAssignments[slot].length >= 4) continue; // Slot full

        // Assign to this slot
        timeSlotAssignments[slot].push({ ...pairing, time_slot: slot });
        assigned = true;
        break;
      }

      if (!assigned) {
        // Fallback: put in first available slot with space (ignoring preferences)
        for (const slot of timeSlots) {
          if (timeSlotAssignments[slot].length < 4) {
            timeSlotAssignments[slot].push({ ...pairing, time_slot: slot });
            assigned = true;
            break;
          }
        }
      }

      if (!assigned) {
        // Still couldn't assign - this shouldn't happen unless >36 pairings
        timeSlotAssignments[timeSlots[0]].push({
          ...pairing,
          time_slot: timeSlots[0],
        });
      }
    }

    console.log("Creating", pairings.length, "pairings with auto time slots");

    // Insert draws with assigned time slots
    for (const slot of timeSlots) {
      for (const pairing of timeSlotAssignments[slot]) {
        await client.query(
          "INSERT INTO draws (week_date, player1_id, player2_id, player1_position, player2_position, time_slot) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            week_date,
            pairing.player1_id,
            pairing.player2_id,
            pairing.player1_position,
            pairing.player2_position,
            pairing.time_slot,
          ]
        );
      }
    }

    await client.query("COMMIT");

    // Count assignments per slot
    const slotCounts = {};
    timeSlots.forEach((slot) => {
      slotCounts[slot] = timeSlotAssignments[slot].length;
    });

    res.json({
      message: "Draw generated successfully with auto time slots",
      pairings: pairings.length,
      timeSlotDistribution: slotCounts,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Draw generation error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
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
// Admin: Delete a draw (for regenerating)
router.delete(
  "/week/:date",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { date } = req.params;

      await client.query("BEGIN");

      // First delete all matches associated with this draw
      await client.query(
        `DELETE FROM matches 
         WHERE draw_id IN (SELECT id FROM draws WHERE week_date = $1)`,
        [date]
      );

      // Then delete the draws
      await client.query("DELETE FROM draws WHERE week_date = $1", [date]);

      await client.query("COMMIT");
      res.json({ message: "Draw and associated matches deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err.message);
      res.status(500).json({ error: "Server error: " + err.message });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
