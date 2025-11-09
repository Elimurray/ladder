import { useState, useEffect } from "react";
import { matchesAPI, drawAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

function SubmitMatchForm() {
  const { drawId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [gamesWon, setGamesWon] = useState("");
  const [gamesLost, setGamesLost] = useState("");
  const [result, setResult] = useState("");
  const [setScores, setSetScores] = useState([]);
  const [showSetScores, setShowSetScores] = useState(false);
  const [submittingFor, setSubmittingFor] = useState(""); // "player1" or "player2"

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMatch();
  }, [drawId, user, navigate]);

  const fetchMatch = async () => {
    try {
      // Fetch the current draw and find this specific match
      const response = await drawAPI.getCurrentDraw();
      const matchData = response.data.find((m) => m.id === parseInt(drawId));

      if (!matchData) {
        setError("Match not found");
        setLoading(false);
        return;
      }

      // The draw now includes a 'submitted' flag from the backend
      setMatch({
        ...matchData,
        already_submitted: matchData.submitted || false,
      });
      setLoading(false);
    } catch (err) {
      setError("Failed to load match");
      setLoading(false);
      console.error(err);
    }
  };

  const calculateResult = (won, lost) => {
    const w = parseInt(won);
    if (w === 3) return "3";
    if (w === 2) return "2";
    if (w === 1) return "1";
    if (w === 0) return "0";
    return "";
  };

  const validateSetScore = (score) => {
    if (!score) return false;
    const parts = score.split("-");
    if (parts.length !== 2) return false;

    const [score1, score2] = parts.map((s) => parseInt(s.trim()));
    if (isNaN(score1) || isNaN(score2)) return false;
    if (score1 < 15 && score2 < 15) return false;

    const winner = Math.max(score1, score2);
    const loser = Math.min(score1, score2);

    if (winner < 15) return false;
    if (loser >= 14 && winner - loser < 2) return false;

    return true;
  };

  const handleGamesChange = (won, lost) => {
    setGamesWon(won);
    setGamesLost(lost);

    if (won && lost) {
      const totalGames = parseInt(won) + parseInt(lost);
      setSetScores(new Array(totalGames).fill(""));
      setShowSetScores(true);
    } else {
      setShowSetScores(false);
      setSetScores([]);
    }
  };

  const handleSetScoreChange = (index, value) => {
    const newSetScores = [...setScores];
    newSetScores[index] = value;
    setSetScores(newSetScores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!submittingFor) {
      setError("Please select which player you're submitting for");
      return;
    }

    const won = parseInt(gamesWon);
    const lost = parseInt(gamesLost);

    if (won + lost !== 5 && won + lost !== 4 && won + lost !== 3) {
      setError("Invalid score. Total games should be 3, 4, or 5");
      return;
    }

    if (won === lost) {
      setError("Games won and lost cannot be equal");
      return;
    }

    const totalGames = won + lost;
    if (setScores.length !== totalGames) {
      setError("Please enter all set scores");
      return;
    }

    for (let i = 0; i < setScores.length; i++) {
      if (!setScores[i]) {
        setError(`Please enter score for Set ${i + 1}`);
        return;
      }
      if (!validateSetScore(setScores[i])) {
        setError(`Invalid score for Set ${i + 1}`);
        return;
      }
    }

    const calculatedResult = calculateResult(gamesWon, gamesLost);
    const playerId =
      submittingFor === "player1" ? match.player1_id : match.player2_id;
    const opponentId =
      submittingFor === "player1" ? match.player2_id : match.player1_id;

    try {
      await matchesAPI.submitResult({
        draw_id: match.id,
        player_id: playerId,
        opponent_id: opponentId,
        games_won: won,
        games_lost: lost,
        result: calculatedResult,
        set_scores: { sets: setScores },
      });

      setSuccess("Match result submitted successfully!");
      setTimeout(() => navigate("/submit"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit result");
    }
  };

  const handleDidNotPlay = async () => {
    if (!submittingFor) {
      setError("Please select which player you're submitting for");
      return;
    }

    const playerId =
      submittingFor === "player1" ? match.player1_id : match.player2_id;
    const opponentId =
      submittingFor === "player1" ? match.player2_id : match.player1_id;

    try {
      await matchesAPI.submitResult({
        draw_id: match.id,
        player_id: playerId,
        opponent_id: opponentId,
        games_won: 0,
        games_lost: 0,
        result: "~",
      });
      setSuccess("Marked as did not play.");
      setTimeout(() => navigate("/submit"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit");
    }
  };

  const handleDefaulted = async () => {
    if (!submittingFor) {
      setError("Please select which player you're submitting for");
      return;
    }

    if (
      !confirm(
        `Are you sure ${
          submittingFor === "player1" ? match.player1_name : match.player2_name
        } defaulted?`
      )
    )
      return;

    const playerId =
      submittingFor === "player1" ? match.player1_id : match.player2_id;
    const opponentId =
      submittingFor === "player1" ? match.player2_id : match.player1_id;

    try {
      await matchesAPI.submitResult({
        draw_id: match.id,
        player_id: playerId,
        opponent_id: opponentId,
        games_won: 0,
        games_lost: 3,
        result: "D",
      });
      setSuccess("Match marked as defaulted.");
      setTimeout(() => navigate("/submit"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit");
    }
  };

  useEffect(() => {
    if (gamesWon && gamesLost) {
      setResult(calculateResult(gamesWon, gamesLost));
    }
  }, [gamesWon, gamesLost]);

  if (loading) return <div className="page loading">Loading match...</div>;
  if (error && !match)
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );

  return (
    <div className="page">
      <button
        onClick={() => navigate("/submit")}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "#718096",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ← Back to All Matches
      </button>

      <h1>Submit Match Result</h1>

      {success && (
        <div
          style={{
            background: "#c6f6d5",
            borderLeft: "4px solid #48bb78",
            color: "#22543d",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
          }}
        >
          ✓ {success}
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {match && (
        <div>
          {/* Match Info */}
          <div
            style={{
              border: "2px solid rgb(226, 232, 240)",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Player 1
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {match.player1_name}
                </div>
                <div style={{ fontSize: "0.875rem", color: "#718096" }}>
                  Position #{match.player1_position}
                </div>
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>VS</div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Player 2
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {match.player2_name || "BYE"}
                </div>
                {match.player2_position && (
                  <div style={{ fontSize: "0.875rem", color: "#718096" }}>
                    Position #{match.player2_position}
                  </div>
                )}
              </div>
            </div>

            {match.time_slot && (
              <div
                style={{
                  marginTop: "1rem",
                  textAlign: "center",
                  paddingTop: "1rem",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                🕐 {match.time_slot}
              </div>
            )}
          </div>

          {/* Already Submitted */}
          {match.already_submitted ? (
            <div
              style={{
                background: "#e6fffa",
                border: "2px solid #81e6d9",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#234e52", marginBottom: "1rem" }}>
                ✓ Result Already Submitted
              </h3>
              <p style={{ color: "#2c7a7b" }}>Awaiting admin approval</p>
            </div>
          ) : !match.player2_id ? (
            <div
              style={{
                background: "#fef5e7",
                border: "2px solid #f39c12",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <h3>BYE - No match to submit</h3>
            </div>
          ) : (
            <>
              {/* Player Selection */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  Submitting result for:
                </label>
                <select
                  value={submittingFor}
                  onChange={(e) => setSubmittingFor(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "2px solid #e2e8f0",
                    fontSize: "1rem",
                  }}
                  required
                >
                  <option value="">-- Select Winner --</option>
                  <option value="player1">{match.player1_name}</option>
                  <option value="player2">{match.player2_name}</option>
                </select>
              </div>

              {/* Rest of your form (games won/lost, set scores, etc.) */}
              <form onSubmit={handleSubmit} className="match-form">
                <div className="form-group">
                  <label>Games Won (by selected player):</label>
                  <select
                    value={gamesWon}
                    onChange={(e) =>
                      handleGamesChange(e.target.value, gamesLost)
                    }
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                    <option value="0">0</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Games Lost:</label>
                  <select
                    value={gamesLost}
                    onChange={(e) =>
                      handleGamesChange(gamesWon, e.target.value)
                    }
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>

                {/* Set Scores (same as before) */}
                {showSetScores && (
                  <div
                    style={{
                      background: "#f7fafc",
                      padding: "1.5rem",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3 style={{ marginBottom: "1rem" }}>Enter Set Scores</h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#718096",
                        marginBottom: "1rem",
                      }}
                    >
                      Format: 15-10 (winner's score first)
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "1rem",
                      }}
                    >
                      {setScores.map((score, index) => (
                        <div
                          key={index}
                          className="form-group"
                          style={{ marginBottom: 0 }}
                        >
                          <label>Set {index + 1}:</label>
                          <input
                            type="text"
                            placeholder="15-10"
                            value={score}
                            onChange={(e) =>
                              handleSetScoreChange(index, e.target.value)
                            }
                            required
                            style={{ padding: "0.75rem", textAlign: "center" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result && (
                  <div
                    style={{
                      background: "#f0f4ff",
                      padding: "1rem",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                    }}
                  >
                    <strong>Result:</strong> {result}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#48bb78",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    width: "100%",
                  }}
                >
                  Submit Result
                </button>
              </form>

              {/* Alternative Options */}
              <div
                style={{
                  marginTop: "2rem",
                  paddingTop: "2rem",
                  borderTop: "2px solid #e2e8f0",
                }}
              >
                <h3 style={{ marginBottom: "1rem" }}>Other Options</h3>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button
                    onClick={handleDidNotPlay}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#718096",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Did Not Play (~)
                  </button>
                  <button
                    onClick={handleDefaulted}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#e53e3e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    Defaulted (D)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SubmitMatchForm;
