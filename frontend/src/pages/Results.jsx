import { useState, useEffect } from "react";
import { resultsAPI } from "../services/api";

function Results() {
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const response = await resultsAPI.getWeeks();
      setWeeks(response.data);

      if (response.data.length > 0) {
        const mostRecent = response.data[0].week_date;
        setSelectedWeek(mostRecent);
        fetchWeekResults(mostRecent);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to load weeks");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchWeekResults = async (date) => {
    try {
      setLoading(true);
      const response = await resultsAPI.getWeekResults(date);
      setResults(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load results");
      setLoading(false);
      console.error(err);
    }
  };

  const handleWeekChange = (e) => {
    const date = e.target.value;
    setSelectedWeek(date);
    fetchWeekResults(date);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && weeks.length === 0) {
    return <div className="page loading">Loading results...</div>;
  }

  return (
    <div className="page">
      <h1>Match Results</h1>

      {error && <div className="error">{error}</div>}

      {weeks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#718096", marginTop: "2rem" }}>
          No completed weeks yet. Results will appear here after matches are
          processed.
        </p>
      ) : (
        <>
          {/* Week Selector */}
          <div style={{ marginBottom: "2rem" }}>
            <div className="form-group" style={{ maxWidth: "400px" }}>
              <label>Select Week:</label>
              <select
                value={selectedWeek}
                onChange={handleWeekChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                }}
              >
                {weeks.map((week) => (
                  <option key={week.week_date} value={week.week_date}>
                    Week of {formatDate(week.week_date)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "3rem", color: "#718096" }}
            >
              Loading results...
            </div>
          ) : results.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#718096",
                marginTop: "2rem",
              }}
            >
              No results found for this week.
            </p>
          ) : (
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Player 1</th>
                    <th>Score</th>
                    <th>Player 2</th>
                    <th>Levels</th>
                    <th>Sets</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((match, index) => (
                    <tr key={index}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {match.player1_position && (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                background: "#e2e8f0",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#4a5568",
                              }}
                            >
                              #{match.player1_position}
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight:
                                match.winner === match.player1_name
                                  ? "bold"
                                  : "normal",
                              color:
                                match.winner === match.player1_name
                                  ? "#2d3748"
                                  : "#718096",
                            }}
                          >
                            {match.player1_name}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                        }}
                      >
                        <span
                          style={{
                            color:
                              match.winner === match.player1_name
                                ? "#48bb78"
                                : "#718096",
                          }}
                        >
                          {match.player1_games_won}
                        </span>
                        {" - "}
                        <span
                          style={{
                            color:
                              match.winner === match.player2_name
                                ? "#48bb78"
                                : "#718096",
                          }}
                        >
                          {match.player2_games_won}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {match.player2_position && (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                background: "#e2e8f0",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                color: "#4a5568",
                              }}
                            >
                              #{match.player2_position}
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight:
                                match.winner === match.player2_name
                                  ? "bold"
                                  : "normal",
                              color:
                                match.winner === match.player2_name
                                  ? "#2d3748"
                                  : "#718096",
                            }}
                          >
                            {match.player2_name}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {match.player1_levels && match.player2_levels ? (
                          <span
                            style={{
                              padding: "0.25rem 0.75rem",
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              display: "inline-block",
                            }}
                          >
                            LEVELS
                          </span>
                        ) : (
                          <span
                            style={{ color: "#a0aec0", fontSize: "0.875rem" }}
                          >
                            -
                          </span>
                        )}
                      </td>
                      <td>
                        {match.player1_set_scores?.sets ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              fontSize: "0.875rem",
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {match.player1_set_scores.sets.map((score, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  background: "#f7fafc",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "4px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {score}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span
                            style={{ color: "#a0aec0", fontSize: "0.875rem" }}
                          >
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Results;
