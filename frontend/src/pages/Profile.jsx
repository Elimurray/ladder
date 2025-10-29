import { useState, useEffect } from "react";
import { profileAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Preferences state
  const [preferredTimes, setPreferredTimes] = useState([]);
  const [earliestTime, setEarliestTime] = useState("");
  const [latestTime, setLatestTime] = useState("");
  const [notes, setNotes] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

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
  ];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchStats();
    fetchHistory();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      setProfile(response.data);
      setPreferredTimes(response.data.preferred_times || []);
      setEarliestTime(response.data.earliest_time || "");
      setLatestTime(response.data.latest_time || "");
      setNotes(response.data.notes || "");
      setLoading(false);
    } catch (err) {
      setError("Failed to load profile");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await profileAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await profileAPI.getHistory();
      setHistory(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTime = (time) => {
    if (preferredTimes.includes(time)) {
      setPreferredTimes(preferredTimes.filter((t) => t !== time));
    } else {
      setPreferredTimes([...preferredTimes, time]);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await profileAPI.updatePreferences({
        preferred_times: preferredTimes,
        earliest_time: earliestTime,
        latest_time: latestTime,
        notes: notes,
      });
      setSuccess("Preferences saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save preferences");
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await profileAPI.updateStatus(status);
      setSuccess(`Status updated to: ${status}`);
      setTimeout(() => setSuccess(null), 3000);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const calculateWinRate = () => {
    if (!stats || stats.total_matches === 0) return "0";
    return ((stats.wins / stats.total_matches) * 100).toFixed(1);
  };

  if (loading) return <div className="page loading">Loading profile...</div>;

  if (error && !profile) {
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>My Profile</h1>

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

      {error && <div className="error">{error}</div>}

      {/* Profile Info */}
      {profile && (
        <div>
          {/* Basic Info Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "2rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem 0" }}>{profile.full_name}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Email</div>
                <div style={{ fontWeight: "bold" }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Ladder Position
                </div>
                <div style={{ fontWeight: "bold", fontSize: "1.5rem" }}>
                  {profile.position ? `#${profile.position}` : "Not on ladder"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Status</div>
                <div
                  style={{ fontWeight: "bold", textTransform: "capitalize" }}
                >
                  {profile.status || "Active"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Member Since
                </div>
                <div style={{ fontWeight: "bold" }}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          {stats && stats.total_matches > 0 && (
            <div
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ marginBottom: "1.5rem", color: "#2d3748" }}>
                My Stats
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#667eea",
                    }}
                  >
                    {stats.total_matches}
                  </div>
                  <div style={{ color: "#718096", fontSize: "0.875rem" }}>
                    Total Matches
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#48bb78",
                    }}
                  >
                    {stats.wins}
                  </div>
                  <div style={{ color: "#718096", fontSize: "0.875rem" }}>
                    Wins
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#e53e3e",
                    }}
                  >
                    {stats.losses}
                  </div>
                  <div style={{ color: "#718096", fontSize: "0.875rem" }}>
                    Losses
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#667eea",
                    }}
                  >
                    {calculateWinRate()}%
                  </div>
                  <div style={{ color: "#718096", fontSize: "0.875rem" }}>
                    Win Rate
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: "bold",
                      color: "#4299e1",
                    }}
                  >
                    {stats.total_games_won || 0}
                  </div>
                  <div style={{ color: "#718096", fontSize: "0.875rem" }}>
                    Games Won
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Management */}
          <div
            style={{
              background: "white",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#2d3748" }}>
              Availability Status
            </h3>
            <p
              style={{
                color: "#718096",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Set your status if you need to withdraw for a week or take a
              break.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => handleUpdateStatus("active")}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    profile.status === "active" ? "#48bb78" : "#e2e8f0",
                  color: profile.status === "active" ? "white" : "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✓ Active
              </button>
              <button
                onClick={() => handleUpdateStatus("no_play")}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    profile.status === "no_play" ? "#ed8936" : "#e2e8f0",
                  color: profile.status === "no_play" ? "white" : "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ⏸ No Play This Week
              </button>
              <button
                onClick={() => handleUpdateStatus("withdrawn")}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    profile.status === "withdrawn" ? "#e53e3e" : "#e2e8f0",
                  color: profile.status === "withdrawn" ? "white" : "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🚫 Withdrawn
              </button>
            </div>
          </div>

          {/* Time Preferences */}
          <div
            style={{
              background: "white",
              border: "2px solid #e2e8f0",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#2d3748" }}>
              Time Preferences
            </h3>
            <p
              style={{
                color: "#718096",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Select your preferred time slots. This helps admins schedule
              matches.
            </p>

            <form onSubmit={handleSavePreferences}>
              <div className="form-group">
                <label>Preferred Time Slots:</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleToggleTime(time)}
                      style={{
                        padding: "0.5rem",
                        background: preferredTimes.includes(time)
                          ? "#667eea"
                          : "#f7fafc",
                        color: preferredTimes.includes(time)
                          ? "white"
                          : "#4a5568",
                        border: "2px solid #e2e8f0",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: preferredTimes.includes(time)
                          ? "600"
                          : "400",
                        transition: "all 0.2s",
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label>Earliest Time:</label>
                  <select
                    value={earliestTime}
                    onChange={(e) => setEarliestTime(e.target.value)}
                  >
                    <option value="">No preference</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Latest Time:</label>
                  <select
                    value={latestTime}
                    onChange={(e) => setLatestTime(e.target.value)}
                  >
                    <option value="">No preference</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Additional Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Can't play first week of each month, prefer early games"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <button type="submit" className="btn-primary">
                Save Preferences
              </button>
            </form>
          </div>

          {/* Match History */}
          {history.length > 0 && (
            <div
              style={{
                background: "white",
                border: "2px solid #e2e8f0",
                borderRadius: "12px",
                padding: "2rem",
              }}
            >
              <h3 style={{ marginBottom: "1.5rem", color: "#2d3748" }}>
                Recent Match History
              </h3>
              <div className="ladder-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opponent</th>
                      <th>Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((match) => (
                      <tr key={match.id}>
                        <td>
                          {new Date(match.week_date).toLocaleDateString()}
                        </td>
                        <td>{match.opponent_name || "BYE"}</td>
                        <td>{match.match_score}</td>
                        <td>
                          <span
                            style={{
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.875rem",
                              fontWeight: "bold",
                              background:
                                match.result === "3"
                                  ? "#c6f6d5"
                                  : match.result === "2"
                                  ? "#bee3f8"
                                  : match.result === "1"
                                  ? "#feebc8"
                                  : "#fed7d7",
                              color:
                                match.result === "3"
                                  ? "#22543d"
                                  : match.result === "2"
                                  ? "#2c5282"
                                  : match.result === "1"
                                  ? "#7c2d12"
                                  : "#742a2a",
                            }}
                          >
                            {match.result === "3"
                              ? "Won"
                              : match.result === "2"
                              ? "Won 2"
                              : match.result === "1"
                              ? "Won 1"
                              : match.result === "0"
                              ? "Lost"
                              : match.result === "~"
                              ? "No Play"
                              : "Default"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
