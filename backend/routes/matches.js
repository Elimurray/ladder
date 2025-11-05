const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Submit match result (authenticated users only)
router.post("/submit", authMiddleware, async (req, res) => {
  try {
    const { draw_id, opponent_id, games_won, games_lost, result, set_scores, player_id } = req.body; // Add player_id here

    // Validate result
    const validResults = ["3", "2", "1", "0", "~", "D"];
    if (!validResults.includes(result)) {
      return res.status(400).json({ error: "Invalid result" });
    }

    // Get the draw information
    const drawInfo = await pool.query("SELECT * FROM draws WHERE id = $1", [
      draw_id,
    ]);

    if (drawInfo.rows.length === 0) {
      return res.status(404).json({ error: "Draw not found" });
    }

    const draw = drawInfo.rows[0];
    const week_date = draw.week_date;

    // // Check if player is part of this match
    // if (draw.player1_id !== player_id && draw.player2_id !== player_id) {
    //   return res.status(403).json({ error: "You are not part of this match" });
    // }

    // Check if result already submitted by EITHER player
    const existingResult = await pool.query(
      "SELECT * FROM matches WHERE draw_id = $1 AND (player_id = $2 OR player_id = $3)",
      [draw_id, player_id, opponent_id]
    );

    if (existingResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "A result has already been submitted for this match" });
    }

    // Calculate match score
    const match_score = `${games_won}-${games_lost}`;

    // Insert match result
    // Insert match result
    const resultInsert = await pool.query(
      `INSERT INTO matches 
   (week_date, player_id, opponent_id, draw_id, games_won, games_lost, result, match_score, set_scores, admin_approved) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false) 
   RETURNING *`,
      [
        week_date,
        player_id,
        opponent_id,
        draw_id,
        games_won,
        games_lost,
        result,
        match_score,
        set_scores ? JSON.stringify(set_scores) : null,
      ]
    );

    // AUTO-CREATE OPPONENT'S RESULT (add this entire block)
    if (opponent_id) {
      // Calculate opponent's result (opposite of player's result)
      const opponentGamesWon = games_lost;
      const opponentGamesLost = games_won;
      const opponentMatchScore = `${opponentGamesWon}-${opponentGamesLost}`;

      let opponentResult;
      if (result === "~") {
        opponentResult = "~"; // Both didn't play
      } else if (result === "D") {
        opponentResult = "3"; // Opponent wins by default
      } else {
        // Calculate opponent result based on games won
        if (opponentGamesWon === 3) opponentResult = "3";
        else if (opponentGamesWon === 2) opponentResult = "2";
        else if (opponentGamesWon === 1) opponentResult = "1";
        else if (opponentGamesWon === 0) opponentResult = "0";
      }

      // Insert opponent's result
      // Insert opponent's result
      await pool.query(
        `INSERT INTO matches 
   (week_date, player_id, opponent_id, draw_id, games_won, games_lost, result, match_score, set_scores, admin_approved) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)`,
        [
          week_date,
          opponent_id,
          player_id,
          draw_id,
          opponentGamesWon,
          opponentGamesLost,
          opponentResult,
          opponentMatchScore,
          set_scores
            ? JSON.stringify({
              sets: set_scores.sets.map((s) =>
                s.split("-").reverse().join("-")
              ),
            })
            : null, // Reverse scores for opponent
        ]
      );
    }

    res.status(201).json({
      message: "Match result submitted successfully. Awaiting admin approval.",
      match: resultInsert.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my submitted results
router.get("/my-results", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        u.full_name as opponent_name,
        d.week_date
      FROM matches m
      LEFT JOIN users u ON m.opponent_id = u.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.player_id = $1
      ORDER BY m.submitted_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Get my current week's match
router.get("/my-match", authMiddleware, async (req, res) => {
  try {
    // Get current week's draw for this user
    const result = await pool.query(
      `SELECT 
        d.*,
        u1.full_name as player1_name,
        u2.full_name as player2_name,
        u2.id as opponent_id,
        u2.full_name as opponent_name
      FROM draws d
      LEFT JOIN users u1 ON d.player1_id = u1.id
      LEFT JOIN users u2 ON d.player2_id = u2.id
      WHERE d.week_date = (SELECT MAX(week_date) FROM draws)
      AND (d.player1_id = $1 OR d.player2_id = $1)
      LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No match found for current week" });
    }

    const match = result.rows[0];

    // Determine opponent
    if (match.player1_id === req.user.id) {
      match.opponent_id = match.player2_id;
      match.opponent_name = match.player2_name;
    } else {
      match.opponent_id = match.player1_id;
      match.opponent_name = match.player1_name;
    }

    // Check if already submitted
    const submitted = await pool.query(
      "SELECT * FROM matches WHERE draw_id = $1 AND player_id = $2",
      [match.id, req.user.id]
    );

    match.already_submitted = submitted.rows.length > 0;
    if (match.already_submitted) {
      match.submitted_result = submitted.rows[0];
    }

    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get all pending results (grouped by match)
router.get("/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        m.*,
        u1.full_name as player_name,
        u1.play_for_levels as player1_levels,
        u2.full_name as opponent_name,
        u2.play_for_levels as player2_levels,
        d.week_date,
        d.time_slot
      FROM matches m
      JOIN users u1 ON m.player_id = u1.id
      LEFT JOIN users u2 ON m.opponent_id = u2.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.admin_approved = false
      ORDER BY d.week_date DESC, m.player_id`
    );

    // Group by match (each match has 2 entries - one per player)
    const matches = [];
    const processedPlayers = new Set();

    result.rows.forEach((row) => {
      if (!processedPlayers.has(row.player_id)) {
        // Find opponent's result
        const opponentResult = result.rows.find(
          (r) =>
            r.player_id === row.opponent_id && r.opponent_id === row.player_id
        );

        matches.push({
          match_id: `${row.player_id}-${row.opponent_id}`,
          player1_match_id: row.id,
          player2_match_id: opponentResult?.id,
          week_date: row.week_date,
          time_slot: row.time_slot,
          player1_id: row.player_id,
          player1_name: row.player_name,
          player1_score: row.match_score,
          player1_games_won: row.games_won,
          player1_games_lost: row.games_lost,
          player1_result: row.result,
          player1_set_scores: row.set_scores,
          player1_submitted_at: row.submitted_at,
          player1_levels: row.player1_levels,
          player2_id: row.opponent_id,
          player2_name: row.opponent_name,
          player2_score: opponentResult?.match_score || "Not submitted",
          player2_games_won: opponentResult?.games_won || 0,
          player2_games_lost: opponentResult?.games_lost || 0,
          player2_result: opponentResult?.result,
          player2_set_scores: opponentResult?.set_scores,
          player2_submitted_at: opponentResult?.submitted_at,
          player2_levels: opponentResult?.player2_levels,
          // Check if scores match
          scores_match:
            opponentResult &&
            row.games_won === opponentResult.games_lost &&
            row.games_lost === opponentResult.games_won,
        });

        processedPlayers.add(row.player_id);
        if (row.opponent_id) processedPlayers.add(row.opponent_id);
      }
    });

    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get all results for a specific week
router.get("/week/:date", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      `SELECT 
        m.*,
        u1.full_name as player_name,
        u2.full_name as opponent_name,
        d.player1_position,
        d.player2_position
      FROM matches m
      JOIN users u1 ON m.player_id = u1.id
      LEFT JOIN users u2 ON m.opponent_id = u2.id
      LEFT JOIN draws d ON m.draw_id = d.id
      WHERE m.week_date = $1
      ORDER BY d.player1_position`,
      [date]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Approve match result
router.patch(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "UPDATE matches SET admin_approved = true WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Match not found" });
      }

      res.json({ message: "Match approved", match: result.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin: Reject/delete match result
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM matches WHERE id = $1", [id]);
    res.json({ message: "Match result deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Process approved matches and update ladder
router.post(
  "/process-week/:date",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { date } = req.params;

      await client.query("BEGIN");

      // Get all approved matches for this week
      const matches = await client.query(
        `SELECT m.*, d.player1_position, d.player2_position
       FROM matches m
       JOIN draws d ON m.draw_id = d.id
       WHERE m.week_date = $1 AND m.admin_approved = true
       ORDER BY d.player1_position`,
        [date]
      );

      if (matches.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "No approved matches found for this week" });
      }

      console.log("Processing matches:", matches.rows); // Debug

      // Get current ladder - map user_id to ladder_positions entry
      const currentLadder = await client.query(
        "SELECT * FROM ladder_positions ORDER BY position"
      );

      // Create a map: user_id -> current ladder entry
      const ladderMap = {};
      currentLadder.rows.forEach((entry) => {
        ladderMap[entry.user_id] = {
          id: entry.id,
          position: entry.position,
          user_id: entry.user_id,
        };
      });

      // Calculate position changes for each player
      const positionChanges = {};

      matches.rows.forEach((match) => {
        const playerId = match.player_id;
        const result = match.result;

        let movement = 0;
        if (result === "3") movement = 6; // Won 3-0 - ADD 6 points
        else if (result === "2") movement = 3; // Won 2-1 - ADD 3 points
        else if (result === "1") movement = 0; // Won narrow - no change
        else if (result === "0") movement = -1; // Lost 0-3 - SUBTRACT 1 point
        else if (result === "~") movement = 0; // Didn't play - no change
        else if (result === "D") movement = -1; // Default - SUBTRACT 1 point

        positionChanges[playerId] = movement;
      });

      console.log("Position changes:", positionChanges);

      // Get total number of players on ladder
      const totalPlayers = currentLadder.rows.length;

      // Build new ladder using INVERSE METHOD
      const newLadder = currentLadder.rows.map((entry) => {
        const movement = positionChanges[entry.user_id] || 0;

        // Invert the position: position 1 becomes totalPlayers, position 2 becomes totalPlayers-1, etc.
        const invertedPosition = totalPlayers - entry.position + 1;

        // Add movement to inverted position (higher score = better)
        const score = invertedPosition + movement;

        return {
          ...entry,
          score: score,
          oldPosition: entry.position,
        };
      });

      // Sort by score DESCENDING (highest score = position 1)
      newLadder.sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score; // Descending
        }
        // If tied, keep original order (lower original position wins)
        return a.oldPosition - b.oldPosition;
      });

      console.log("New ladder order:", newLadder);

      // Assign final positions (1, 2, 3, 4, ...)
      for (let i = 0; i < newLadder.length; i++) {
        const entry = newLadder[i];
        const finalPosition = i + 1;

        await client.query(
          "UPDATE ladder_positions SET position = $1, updated_at = NOW() WHERE id = $2",
          [finalPosition, entry.id]
        );
      }

      // CLEAN UP AFTER PROCESSING (keeps matches for history)
      console.log("Cleaning up processed draw...");

      // Set draw_id to NULL in matches (so they become history records)
      await client.query(
        "UPDATE matches SET draw_id = NULL WHERE week_date = $1",
        [date]
      );

      // Delete the draw itself
      await client.query("DELETE FROM draws WHERE week_date = $1", [date]);

      await client.query("COMMIT");

      res.json({
        message: "Ladder updated successfully and draw deleted",
        processed: matches.rows.length,
        updates: newLadder.filter((e) => e.newPosition !== e.oldPosition)
          .length,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Process week error:", err);
      res.status(500).json({ error: "Server error: " + err.message });
    } finally {
      client.release();
    }
  }
);

// Admin: Approve a match (both players)
router.post(
  "/approve-match/:matchId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { matchId } = req.params; // Format: "player1Id-player2Id"
      const [player1Id, player2Id] = matchId
        .split("-")
        .map((id) => parseInt(id));

      const result = await pool.query(
        `UPDATE matches 
       SET admin_approved = true 
       WHERE (player_id = $1 AND opponent_id = $2) 
          OR (player_id = $2 AND opponent_id = $1)
       RETURNING *`,
        [player1Id, player2Id]
      );

      res.json({
        message: "Match approved",
        approved: result.rows.length,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin: Bulk approve all pending matches
router.post(
  "/approve-all",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(
        "UPDATE matches SET admin_approved = true WHERE admin_approved = false RETURNING *"
      );

      res.json({
        message: "All matches approved",
        approved: result.rows.length,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin: Delete a match (both players)
router.delete(
  "/match/:matchId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { matchId } = req.params;
      const [player1Id, player2Id] = matchId
        .split("-")
        .map((id) => parseInt(id));

      await pool.query(
        `DELETE FROM matches 
       WHERE (player_id = $1 AND opponent_id = $2) 
          OR (player_id = $2 AND opponent_id = $1)`,
        [player1Id, player2Id]
      );

      res.json({ message: "Match deleted" });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin: Update match (both players)
router.put(
  "/match/:matchId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { matchId } = req.params;
      const { player1_games_won, player1_games_lost } = req.body;
      const [player1Id, player2Id] = matchId
        .split("-")
        .map((id) => parseInt(id));

      await client.query("BEGIN");

      // Calculate results
      let player1Result;
      if (player1_games_won === 3) player1Result = "3";
      else if (player1_games_won === 2) player1Result = "2";
      else if (player1_games_won === 1) player1Result = "1";
      else if (player1_games_won === 0) player1Result = "0";

      let player2Result;
      if (player1_games_lost === 3) player2Result = "3";
      else if (player1_games_lost === 2) player2Result = "2";
      else if (player1_games_lost === 1) player2Result = "1";
      else if (player1_games_lost === 0) player2Result = "0";

      // Update player 1
      await client.query(
        `UPDATE matches 
       SET games_won = $1, 
           games_lost = $2, 
           result = $3, 
           match_score = $4
       WHERE player_id = $5 AND opponent_id = $6`,
        [
          player1_games_won,
          player1_games_lost,
          player1Result,
          `${player1_games_won}-${player1_games_lost}`,
          player1Id,
          player2Id,
        ]
      );

      // Update player 2 (opposite scores)
      await client.query(
        `UPDATE matches 
       SET games_won = $1, 
           games_lost = $2, 
           result = $3, 
           match_score = $4
       WHERE player_id = $5 AND opponent_id = $6`,
        [
          player1_games_lost,
          player1_games_won,
          player2Result,
          `${player1_games_lost}-${player1_games_won}`,
          player2Id,
          player1Id,
        ]
      );

      await client.query("COMMIT");

      res.json({ message: "Match updated successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err.message);
      res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
