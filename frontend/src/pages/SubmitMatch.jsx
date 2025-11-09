import { useState, useEffect } from "react";
import { drawAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function SubmitMatch() {
  const [draw, setDraw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchDraw();
  }, [user, navigate]);

  const fetchDraw = async () => {
    try {
      const response = await drawAPI.getCurrentDraw();
      setDraw(response.data);
      setLoading(false);
    } catch (err) {
      setError("No draw available");
      setLoading(false);
    }
  };

  const groupByTimeSlot = () => {
    const grouped = {};
    draw.forEach((pairing) => {
      const slot = pairing.time_slot || "Unscheduled";
      if (!grouped[slot]) grouped[slot] = [];
      grouped[slot].push(pairing);
    });
    return grouped;
  };

  const handleMatchClick = (matchId) => {
    navigate(`/submit/${matchId}`);
  };

  if (loading) return <div className="page loading">Loading matches...</div>;
  if (error)
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );

  const groupedDraw = groupByTimeSlot();
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toLowerCase();
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };
  const timeSlots = Object.keys(groupedDraw).sort((a, b) => {
    // "Reschedule" should always be last
    if (a === "Reschedule") return 1;
    if (b === "Reschedule") return -1;

    // Sort other times normally
    return timeToMinutes(a) - timeToMinutes(b);
  });

  return (
    <div className="page">
      <h1>Submit Match Results</h1>
      <p style={{ color: "#718096", marginBottom: "2rem" }}>
        Click on any match to submit its result
      </p>

      {draw.length === 0 ? (
        <p style={{ textAlign: "center", color: "#718096" }}>
          No matches available
        </p>
      ) : (
        <div className="draw-schedule">
          {timeSlots.map((slot) => (
            <div key={slot} className="time-slot-section">
              <h3 className="time-slot-header">{slot}</h3>
              <div className="draw-matches">
                {groupedDraw[slot].map((pairing) => (
                  <div
                    key={pairing.id}
                    className="draw-match-card"
                    onClick={() => handleMatchClick(pairing.id)}
                    style={{
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {pairing.submitted && (
                      <div
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          backgroundColor: "#48bb78",
                          color: "white",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          zIndex: 10, // Add this to ensure it's on top
                        }}
                      >
                        ✓ Submitted
                      </div>
                    )}
                    <div
                      className="match-players"
                      style={{ transition: "transform 0.2s" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <div className="player">
                        <span className="position-badge">
                          #{pairing.player1_position}
                        </span>
                        <span className="player-name">
                          {pairing.player1_name}
                        </span>
                      </div>

                      <span className="vs">VS</span>

                      <div className="player">
                        {pairing.player2_id ? (
                          <>
                            <span className="position-badge">
                              #{pairing.player2_position}
                            </span>
                            <span className="player-name">
                              {pairing.player2_name}
                            </span>
                          </>
                        ) : (
                          <span className="bye">BYE</span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "0.5rem",
                        textAlign: "center",
                        fontSize: "0.875rem",
                        color: "#4299e1",
                        fontWeight: "600",
                      }}
                    >
                      Click to submit →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubmitMatch;
