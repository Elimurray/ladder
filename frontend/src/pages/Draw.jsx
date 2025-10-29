import { useState, useEffect } from "react";
import { drawAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Draw() {
  const [draw, setDraw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchCurrentDraw();
  }, []);

  const fetchCurrentDraw = async () => {
    try {
      const response = await drawAPI.getCurrentDraw();
      setDraw(response.data);

      if (response.data.length > 0) {
        setCurrentWeek(response.data[0].week_date);
      }

      setLoading(false);
    } catch (err) {
      setError("No draw available yet");
      setLoading(false);
      console.error(err);
    }
  };

  const groupByTimeSlot = () => {
    const grouped = {};
    draw.forEach((pairing) => {
      const slot = pairing.time_slot || "Unscheduled";
      if (!grouped[slot]) {
        grouped[slot] = [];
      }
      grouped[slot].push(pairing);
    });
    return grouped;
  };

  const isMyMatch = (pairing) => {
    if (!user) return false;
    return pairing.player1_id === user.id || pairing.player2_id === user.id;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) return <div className="page loading">Loading draw...</div>;

  if (error)
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );

  const groupedDraw = groupByTimeSlot();
  const timeSlots = Object.keys(groupedDraw).sort();

  return (
    <div className="page">
      <h1>This Week's Draw</h1>

      {currentWeek && (
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            Week of {formatDate(currentWeek)}
          </h2>
        </div>
      )}

      {draw.length === 0 ? (
        <p style={{ textAlign: "center", color: "#718096", marginTop: "2rem" }}>
          No draw has been created yet. Check back soon!
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
                    className={`draw-match-card ${
                      isMyMatch(pairing) ? "my-match" : ""
                    }`}
                  >
                    <div className="match-players">
                      <div className="player">
                        <span className="position-badge">
                          #{pairing.player1_position}
                        </span>
                        <span className="player-name">
                          {pairing.player1_name}
                          {user && pairing.player1_id === user.id && " (You)"}
                        </span>
                      </div>

                      {/* SQUASH LEVELS BADGE HERE */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {pairing.player1_levels && pairing.player2_levels && (
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "white",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            🏆 LEVELS
                          </div>
                        )}
                        <span className="vs">VS</span>
                      </div>

                      <div className="player">
                        {pairing.player2_id ? (
                          <>
                            <span className="position-badge">
                              #{pairing.player2_position}
                            </span>
                            <span className="player-name">
                              {pairing.player2_name}
                              {user &&
                                pairing.player2_id === user.id &&
                                " (You)"}
                            </span>
                          </>
                        ) : (
                          <span className="bye">BYE</span>
                        )}
                      </div>
                    </div>

                    {pairing.bar_duty && (
                      <div className="bar-duty">
                        🍺 Bar Duty: {pairing.bar_duty}
                      </div>
                    )}

                    {pairing.notes && (
                      <div className="match-notes">📝 {pairing.notes}</div>
                    )}
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

export default Draw;
