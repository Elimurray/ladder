import { useState, useEffect } from "react";
import { drawAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Draw() {
  const [draw, setDraw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState("");
  const { user } = useAuth();
  const [weekNotes, setWeekNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  useEffect(() => {
    fetchCurrentDraw();
  }, []);

  const fetchCurrentDraw = async () => {
    try {
      const response = await drawAPI.getCurrentDraw();
      setDraw(response.data);

      if (response.data.length > 0) {
        setCurrentWeek(response.data[0].week_date);

        // Fetch week notes
        try {
          const notesResponse = await drawAPI.getWeekNotes();
          setWeekNotes(notesResponse.data.notes || "");
        } catch (err) {
          console.error("Failed to fetch week notes:", err);
          setWeekNotes("");
        }
      }

      setLoading(false);
    } catch (err) {
      setError("No draw available yet");
      setLoading(false);
      console.error(err);
    }
  };
  const handleEditNotes = () => {
    setNotesInput(weekNotes);
    setIsEditingNotes(true);
  };
  const handleSaveNotes = async () => {
    try {
      await drawAPI.updateWeekNotes(notesInput);
      setWeekNotes(notesInput);
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Failed to update notes:", err);
      alert("Failed to update notes");
    }
  };

  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    setNotesInput("");
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

  // Replace the timeSlots sorting section with this:
  const timeSlots = Object.keys(groupedDraw).sort((a, b) => {
    // "Reschedule" should always be last
    if (a === "Reschedule") return 1;
    if (b === "Reschedule") return -1;

    // Sort other times normally
    return timeToMinutes(a) - timeToMinutes(b);
  });

  return (
    <div className="page">
      <h1>This Week's Draw</h1>

      {currentWeek && (
        <div
          style={{
            border: "2px solid rgb(226, 232, 240)",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            textAlign: "center",
            color: "black",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
            Week of {formatDate(currentWeek)}
          </h2>
        </div>
      )}

      {/* Week Notes Section */}
      {draw.length > 0 && (
        <div
          style={{
            border: "2px solid #e2e8f0",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            background: "white",
            color: "black",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: weekNotes || isEditingNotes ? "0.75rem" : "0",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#2d3748" }}>
              📋 Week Notes
            </h3>
            {user?.is_admin && !isEditingNotes && (
              <button
                onClick={handleEditNotes}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#3182ce",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {weekNotes ? "Edit" : "Add Notes"}
              </button>
            )}
          </div>

          {isEditingNotes ? (
            <div>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Add notes for this week's draw (e.g., court closures, special announcements...)"
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "2px solid #cbd5e0",
                  fontSize: "0.875rem",
                  resize: "vertical",
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                }}
              >
                <button
                  onClick={handleSaveNotes}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#48bb78",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#718096",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : weekNotes ? (
            <div
              style={{
                fontWeight: "600",

                color: "#4a5568",
                whiteSpace: "pre-wrap",
              }}
            >
              {weekNotes}
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "#a0aec0",
                fontStyle: "italic",
              }}
            >
              No notes for this week
            </p>
          )}
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
                            LEVELS
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

                    {/* Show reschedule notes for Reschedule time slot */}
                    {pairing.time_slot === "Reschedule" &&
                      pairing.reschedule_notes && (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "0.75rem",
                            background: "#fffbeb",
                            border: "2px solid #fbbf24",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            color: "#78350f",
                          }}
                        >
                          <strong>Reschedule Details:</strong>
                          <div style={{ marginTop: "0.25rem" }}>
                            {pairing.reschedule_notes}
                          </div>
                        </div>
                      )}

                    {pairing.bar_duty && (
                      <div className="bar-duty">
                        🍺 Bar Duty: {pairing.bar_duty}
                      </div>
                    )}

                    {pairing.notes && (
                      <div className="match-notes">{pairing.notes}</div>
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
