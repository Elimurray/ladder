import { useState, useEffect } from "react";
import { matchesAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function SubmitMatch() {
  const [myMatch, setMyMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [gamesWon, setGamesWon] = useState("");
  const [gamesLost, setGamesLost] = useState("");
  const [result, setResult] = useState("");
  const [setScores, setSetScores] = useState([]);
  const [showSetScores, setShowSetScores] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchMyMatch();
  }, [user, navigate]);

  const fetchMyMatch = async () => {
    try {
      const response = await matchesAPI.getMyMatch();
      setMyMatch(response.data);
      setLoading(false);
    } catch (err) {
      setError("No match found for this week");
      setLoading(false);
      console.error(err);
    }
  };

  const calculateResult = (won, lost) => {
    const w = parseInt(won);
    const l = parseInt(lost);

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

    // One score must be 15 or higher
    if (score1 < 15 && score2 < 15) return false;

    // Winner must have at least 15
    const winner = Math.max(score1, score2);
    const loser = Math.min(score1, score2);

    if (winner < 15) return false;

    // If tied at 14, must win by 2
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

    const won = parseInt(gamesWon);
    const lost = parseInt(gamesLost);

    // Validation
    if (won + lost !== 5 && won + lost !== 4 && won + lost !== 3) {
      setError("Invalid score. Total games should be 3, 4, or 5 (best of 5)");
      return;
    }

    if (won === lost) {
      setError("Games won and lost cannot be equal");
      return;
    }

    // Validate all set scores are filled and valid
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
        setError(
          `Invalid score for Set ${i + 1
          }. Format: 15-10. Winner must reach 15, if tied at 14 must win by 2.`
        );
        return;
      }
    }

    const calculatedResult = calculateResult(gamesWon, gamesLost);

    try {
      await matchesAPI.submitResult({
        draw_id: myMatch.id,
        opponent_id: myMatch.opponent_id,
        games_won: won,
        games_lost: lost,
        result: calculatedResult,
        set_scores: { sets: setScores },
      });

      setSuccess(
        "Match result submitted successfully! Awaiting admin approval."
      );
      setGamesWon("");
      setGamesLost("");
      setResult("");
      setSetScores([]);
      setShowSetScores(false);

      // Refresh match data
      setTimeout(() => {
        fetchMyMatch();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit result");
      console.error(err);
    }
  };

  const handleDidNotPlay = async () => {
    try {
      await matchesAPI.submitResult({
        draw_id: myMatch.id,
        opponent_id: myMatch.opponent_id,
        games_won: 0,
        games_lost: 0,
        result: "~",
      });

      setSuccess("Marked as did not play.");
      fetchMyMatch();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit");
    }
  };

  const handleDefaulted = async () => {
    if (!confirm("Are you sure you defaulted this match?")) return;

    try {
      await matchesAPI.submitResult({
        draw_id: myMatch.id,
        opponent_id: myMatch.opponent_id,
        games_won: 0,
        games_lost: 3,
        result: "D",
      });

      setSuccess("Match marked as defaulted.");
      fetchMyMatch();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit");
    }
  };

  useEffect(() => {
    if (gamesWon && gamesLost) {
      setResult(calculateResult(gamesWon, gamesLost));
    }
  }, [gamesWon, gamesLost]);

  if (loading) return <div className="page loading">Loading your match...</div>;

  if (error && !myMatch) {
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
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
            fontWeight: "500",
          }}
        >
          ✓ {success}
        </div>
      )}

      {error && myMatch && <div className="error">{error}</div>}

      {myMatch && (
        <div>
          {/* Match Info Card */}
          <div
            style={{
              border: "2px solid rgb(226, 232, 240)",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>
              Your Match
            </h2>
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "center",
                fontSize: "1.1rem",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>You</div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {user.full_name}
                </div>
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>VS</div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Opponent
                </div>
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {myMatch.opponent_name || "BYE"}
                </div>
              </div>
            </div>

            {myMatch.time_slot && (
              <div
                style={{
                  marginTop: "1rem",
                  textAlign: "center",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                {myMatch.time_slot}
              </div>
            )}
          </div>

          {/* Already Submitted */}
          {myMatch.already_submitted ? (
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
              <p style={{ color: "#2c7a7b" }}>
                Result: <strong>{myMatch.submitted_result.match_score}</strong>{" "}
                ({myMatch.submitted_result.result})
              </p>
              {myMatch.submitted_result.set_scores?.sets && (
                <div style={{ marginTop: "1rem", color: "#2c7a7b" }}>
                  <strong>Set Scores:</strong>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {myMatch.submitted_result.set_scores.sets.map(
                      (score, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "0.25rem 0.75rem",
                            background: "#b2f5ea",
                            borderRadius: "6px",
                            fontWeight: "bold",
                          }}
                        >
                          Set {i + 1}: {score}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
              <p
                style={{
                  color: "#2c7a7b",
                  marginTop: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                {myMatch.submitted_result.admin_approved
                  ? "✓ Approved by admin"
                  : "⏳ Awaiting admin approval"}
              </p>
            </div>
          ) : (
            <>
              {/* Submit Form */}
              {!myMatch.opponent_id ? (
                <div
                  style={{
                    background: "#fef5e7",
                    border: "2px solid #f39c12",
                    borderRadius: "12px",
                    padding: "2rem",
                    textAlign: "center",
                  }}
                >
                  <h3 style={{ color: "#7c4000" }}>You have a BYE this week</h3>
                  <p style={{ color: "#856404", marginTop: "0.5rem" }}>
                    No match to play. You'll stay at your current position.
                  </p>
                </div>
              ) : (
                <div>
                  <form onSubmit={handleSubmit} className="match-form">
                    <div className="form-group">
                      <label>Games You Won:</label>
                      <select
                        value={gamesWon}
                        onChange={(e) =>
                          handleGamesChange(e.target.value, gamesLost)
                        }
                        required
                      >
                        <option value="">-- Select --</option>
                        <option value="3">3 (Won match)</option>
                        <option value="2">2 (Lost match)</option>
                        <option value="1">1 (Lost match)</option>
                        <option value="0">0 (Lost match)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Games You Lost:</label>
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

                    {/* Set Scores Input */}
                    {showSetScores && (
                      <div
                        style={{
                          background: "#f7fafc",
                          padding: "1.5rem",
                          borderRadius: "8px",
                          marginBottom: "1rem",
                        }}
                      >
                        <h3 style={{ marginBottom: "1rem", color: "#2d3748" }}>
                          Enter Set Scores
                        </h3>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            color: "#718096",
                            marginBottom: "1rem",
                          }}
                        >
                          First to 15 points. If tied at 14, must win by 2.
                          Format: 15-10
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
                                style={{
                                  padding: "0.75rem",
                                  fontSize: "1rem",
                                  textAlign: "center",
                                }}
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
                        <strong>Your Result:</strong> {result}
                        <br />
                        <small style={{ color: "#718096" }}>
                          {result === "3" && "You won! Move up 6 positions"}
                          {result === "2" &&
                            "Lost but got 2 games! Move up 3 positions"}
                          {result === "1" &&
                            "Lost with 1 game. Stay in position"}
                          {result === "0" && "Lost 0-3. Move down 1 position"}
                        </small>
                      </div>
                    )}
                    <div

                    >
                      <button style={{
                        padding: "0.75rem 1.5rem",
                        background: "#48bb78",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}>
                        Submit Result
                      </button>
                    </div>

                  </form>

                  {/* Alternative Options */}
                  <div
                    style={{
                      marginTop: "2rem",
                      paddingTop: "2rem",
                      borderTop: "2px solid #e2e8f0",
                    }}
                  >
                    <h3 style={{ marginBottom: "1rem", color: "#4a5568" }}>
                      Other Options
                    </h3>
                    <div
                      style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                    >
                      <button
                        onClick={handleDidNotPlay}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "#718096",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
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
                          fontWeight: "600",
                        }}
                      >
                        I Defaulted (D)
                      </button>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#718096",
                        marginTop: "1rem",
                      }}
                    >
                      <strong>Did Not Play (~):</strong> No position change
                      <br />
                      <strong>Defaulted (D):</strong> Move down 1 position
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SubmitMatch;
