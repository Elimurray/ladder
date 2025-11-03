import { useState, useEffect } from "react";
import { ladderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Ladder() {
  const [ladder, setLadder] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchLadder();
    if (user) {
      fetchMyPosition();
    }
  }, [user]);

  const fetchLadder = async () => {
    try {
      const response = await ladderAPI.getAll();
      setLadder(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load ladder");
      setLoading(false);
      console.error(err);
    }
  };

  const fetchMyPosition = async () => {
    try {
      const response = await ladderAPI.getMyPosition();
      setMyPosition(response.data);
    } catch (err) {
      console.log("User not on ladder yet");
    }
  };

  const getPositionClass = (position) => {
    if (position === 1) return "position-first";
    if (position <= 3) return "position-top3";
    if (position <= 10) return "position-top10";
    return "";
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: "Active", color: "#48bb78" },
      withdrawn: { text: "Withdrawn", color: "#f56565" },
      no_play: { text: "No Play", color: "#ed8936" },
    };
    const badge = badges[status] || badges.active;
    return (
      <span
        style={{
          background: badge.color,
          color: "white",
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: "bold",
        }}
      >
        {badge.text}
      </span>
    );
  };

  if (loading) return <div className="page loading">Loading ladder...</div>;
  if (error)
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );

  return (
    <div className="page">
      <h1>Current Ladder</h1>

      {myPosition && (
        <div
          style={{
            background: "white",
            color: "black",
            padding: "1.5rem",
            borderRadius: "8px",
            border: "2px solid rgb(226, 232, 240)",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
            Your Position
          </h2>
          <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#f97316" }}>
            #{myPosition.position}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            {getStatusBadge(myPosition.status)}
          </div>
        </div>
      )}

      <div className="ladder-table">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              {user && <th>Phone</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ladder.map((entry) => (
              <tr
                key={entry.id}
                className={`${getPositionClass(entry.position)} ${user && entry.user_id === user.id ? "my-row" : ""
                  }`}
                style={
                  user && entry.user_id === user.id
                    ? {
                      background: "#f0f4ff",
                      fontWeight: "bold",
                    }
                    : {}
                }
              >
                <td>
                  {entry.position === 1 && "🥇 "}
                  {entry.position === 2 && "🥈 "}
                  {entry.position === 3 && "🥉 "}
                  {entry.position}
                </td>
                <td>
                  {entry.full_name}
                  {user && entry.user_id === user.id && " (You)"}
                </td>
                {user && <td>{entry.phone_number || "Not provided"}</td>}
                <td>{getStatusBadge(entry.status)}</td>
                {/* <td>{entry.is_member ? "✓" : "✗"}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ladder.length === 0 && (
        <p style={{ textAlign: "center", color: "#718096", marginTop: "2rem" }}>
          No one on the ladder yet.
        </p>
      )}
    </div>
  );
}

export default Ladder;
