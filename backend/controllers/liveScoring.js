// Squash scoring rules for live matches: rally-point to 11, win by 2,
// best of 3 or 5 sets. The ref device only ever posts "point to player 1/2";
// everything here is derived server-side by replaying the event log.

// points: array of 1 | 2 (1 = draws.player1_id, 2 = draws.player2_id),
// in event_number order. Returns the full derived state. Throws with
// code MATCH_ALREADY_OVER if points continue past match completion.
//
// firstServer (optional 1 | 2) enables serving derivation: rally winner
// serves; while the server retains serve the box alternates (R default at
// each new stint); the set winner serves first in the next set. The result
// is state.serving = { player, side } (null once the match is over, or when
// firstServer isn't known). Manual box choices at handout are applied by the
// caller on top of these defaults.
function computeScore(points, bestOf, firstServer) {
  const setsToWin = Math.ceil(bestOf / 2);
  const state = {
    sets_won: { p1: 0, p2: 0 },
    completed_sets: [],
    current_set: { p1: 0, p2: 0 },
    winner: null,
  };

  let server = firstServer === 1 || firstServer === 2 ? firstServer : null;
  let side = "R";

  for (const pointTo of points) {
    if (state.winner) {
      const err = new Error("Point recorded after match completion");
      err.code = "MATCH_ALREADY_OVER";
      throw err;
    }
    if (pointTo !== 1 && pointTo !== 2) {
      const err = new Error("point_to must be 1 or 2");
      err.code = "INVALID_POINT";
      throw err;
    }

    if (pointTo === 1) state.current_set.p1++;
    else state.current_set.p2++;

    let setWinner = null;
    const { p1, p2 } = state.current_set;
    if ((p1 >= 11 || p2 >= 11) && Math.abs(p1 - p2) >= 2) {
      state.completed_sets.push({ p1, p2 });
      setWinner = p1 > p2 ? 1 : 2;
      if (p1 > p2) state.sets_won.p1++;
      else state.sets_won.p2++;
      state.current_set = { p1: 0, p2: 0 };

      if (state.sets_won.p1 === setsToWin) state.winner = 1;
      else if (state.sets_won.p2 === setsToWin) state.winner = 2;
    }

    if (server) {
      if (setWinner) {
        server = setWinner; // set winner opens the next set
        side = "R";
      } else if (pointTo === server) {
        side = side === "R" ? "L" : "R"; // serve retained, box alternates
      } else {
        server = pointTo; // handout: rally winner takes over
        side = "R";
      }
    }
  }

  state.serving = server && !state.winner ? { player: server, side } : null;
  return state;
}

// Convert a finished live score into the two per-player payloads the manual
// submit flow writes into `matches`: result = sets won as a string ("0"-"3"),
// set_scores = {sets: ["11/7", ...]} from that player's perspective.
function buildFinalResults(score) {
  const p1Sets = score.sets_won.p1;
  const p2Sets = score.sets_won.p2;

  return {
    player1: {
      games_won: p1Sets,
      games_lost: p2Sets,
      result: String(p1Sets),
      match_score: `${p1Sets}-${p2Sets}`,
      set_scores: {
        sets: score.completed_sets.map((s) => `${s.p1}/${s.p2}`),
      },
    },
    player2: {
      games_won: p2Sets,
      games_lost: p1Sets,
      result: String(p2Sets),
      match_score: `${p2Sets}-${p1Sets}`,
      set_scores: {
        sets: score.completed_sets.map((s) => `${s.p2}/${s.p1}`),
      },
    },
  };
}

module.exports = { computeScore, buildFinalResults };
