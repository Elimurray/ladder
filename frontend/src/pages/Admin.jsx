import { useState, useEffect } from "react";
import {
  ladderAPI,
  usersAPI,
  authAPI,
  drawAPI,
  matchesAPI,
  profileAPI,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [ladder, setLadder] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentDraw, setCurrentDraw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [drawWeek, setDrawWeek] = useState("");
  const [processWeekDate, setProcessWeekDate] = useState("");

  // Register User
  const [newUserData, setNewUserData] = useState({
    email: "",
    full_name: "",
    password: "",
    phone_number: "",
    squash_grade: "",
  });

  // Add user to ladder state
  const [selectedUser, setSelectedUser] = useState("");
  const [newPosition, setNewPosition] = useState("");

  // Edit position state
  const [editingId, setEditingId] = useState(null);
  const [editPosition, setEditPosition] = useState("");

  // Edit draw pairing state
  const [editingDrawId, setEditingDrawId] = useState(null);
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editBarDuty, setEditBarDuty] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [pendingMatches, setPendingMatches] = useState([]);

  const [availableDraws, setAvailableDraws] = useState([]);
  const [selectedDrawDate, setSelectedDrawDate] = useState("");

  const [userPreferences, setUserPreferences] = useState([]);
  const [showPreferences, setShowPreferences] = useState(false);

  const [editingMatchId, setEditingMatchId] = useState(null);
  const [editGamesWon, setEditGamesWon] = useState("");
  const [editGamesLost, setEditGamesLost] = useState("");
  const [editSetScores, setEditSetScores] = useState([]);

  // Creating match
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newMatchPlayer1, setNewMatchPlayer1] = useState("");
  const [newMatchPlayer2, setNewMatchPlayer2] = useState("");
  const [newMatchTimeSlot, setNewMatchTimeSlot] = useState("");

  const [editRescheduleNotes, setEditRescheduleNotes] = useState("");
  const [newMatchRescheduleNotes, setNewMatchRescheduleNotes] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  // Time slot options
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
    "10:00pm",
    "10:30pm",
    "Reschedule",
  ];

  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate("/");
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchDrawByDate = async (date) => {
    console.log("Fetching draw for date:", date); // ADD THIS
    try {
      const drawRes = await drawAPI.getWeekDrawAdmin(date);
      console.log("Draw response:", drawRes.data); // ADD THIS
      setCurrentDraw(drawRes.data);
    } catch (err) {
      console.error("Error fetching draw by date:", err); // ADD THIS
      setCurrentDraw([]);
    }
  };

  const fetchData = async () => {
    try {
      const [ladderRes, usersRes, pendingRes] = await Promise.all([
        ladderAPI.getAll(),
        usersAPI.getAll(),
        matchesAPI.getPending(),
      ]);

      setLadder(ladderRes.data);
      setUsers(usersRes.data);
      setPendingMatches(pendingRes.data);

      // Fetch preferences separately
      try {
        const preferencesRes = await profileAPI.getAllPreferences();
        setUserPreferences(preferencesRes.data);
      } catch (err) {
        console.log("Could not load preferences");
        setUserPreferences([]);
      }

      // Fetch all available draws
      try {
        const allDrawsRes = await drawAPI.getAllDrawsAdmin(); // CHANGE THIS LINE
        console.log("All draws response:", allDrawsRes.data);
        if (allDrawsRes.data.length > 0) {
          // Get unique week dates from draws
          const uniqueDates = allDrawsRes.data.map((d) => d.week_date);
          console.log("Unique dates:", uniqueDates);
          setAvailableDraws(uniqueDates);

          // Auto-select most recent if none selected
          if (!selectedDrawDate && uniqueDates.length > 0) {
            setSelectedDrawDate(uniqueDates[0]);
            fetchDrawByDate(uniqueDates[0]);
          } else if (selectedDrawDate) {
            fetchDrawByDate(selectedDrawDate);
          }
        }
      } catch (err) {
        console.error("Error fetching draws:", err);
        setCurrentDraw([]);
        setAvailableDraws([]);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load data");
      setLoading(false);
      console.error(err);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 3000);
  };

  const handleAddToLadder = async (e) => {
    e.preventDefault();

    if (!selectedUser || !newPosition) {
      showError("Please select a user and position");
      return;
    }

    try {
      await ladderAPI.addToLadder(
        parseInt(selectedUser),
        parseInt(newPosition)
      );
      showSuccess("User added to ladder successfully!");
      setSelectedUser("");
      setNewPosition("");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to add user to ladder");
      console.error(err);
    }
  };

  const handleStartEdit = (entry) => {
    setEditingId(entry.id);
    setEditPosition(entry.position);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPosition("");
  };

  const handleSavePosition = async (id) => {
    try {
      await ladderAPI.updatePosition(id, parseInt(editPosition));
      showSuccess("Position updated successfully!");
      setEditingId(null);
      setEditPosition("");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update position");
      console.error(err);
    }
  };

  const handleGenerateDraw = async (e) => {
    e.preventDefault();

    if (!drawWeek) {
      showError("Please select a week date");
      return;
    }

    try {
      await drawAPI.generateDraw(drawWeek);
      showSuccess("Draw generated successfully!");
      setDrawWeek("");
      fetchData(); // Refresh to show new draw
    } catch (err) {
      showError(err.response?.data?.error || "Failed to generate draw");
    }
  };

  const handleStartEditDraw = (pairing) => {
    setEditingDrawId(pairing.id);
    setEditTimeSlot(pairing.time_slot || "");
    setEditBarDuty(pairing.bar_duty || "");
    setEditNotes(pairing.notes || "");
    setEditRescheduleNotes(pairing.reschedule_notes || "");
  };

  const handleCancelEditDraw = () => {
    setEditingDrawId(null);
    setEditTimeSlot("");
    setEditBarDuty("");
    setEditNotes("");
    setEditRescheduleNotes("");
  };

  const handleSaveDrawPairing = async (id) => {
    try {
      await drawAPI.updatePairing(id, {
        time_slot: editTimeSlot,
        bar_duty: editBarDuty,
        notes: editNotes,
        reschedule_notes:
          editTimeSlot === "Reschedule" ? editRescheduleNotes : null,
      });
      showSuccess("Pairing updated successfully!");
      setEditingDrawId(null);
      setEditTimeSlot("");
      setEditBarDuty("");
      setEditNotes("");
      setEditRescheduleNotes("");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update pairing");
      console.error(err);
    }
  };

  const handleDeleteDraw = async () => {
    if (!currentDraw.length) return;

    if (
      !confirm(
        "Are you sure you want to delete the current draw? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const weekDate = currentDraw[0].week_date;
      await drawAPI.deleteDraw(weekDate);
      showSuccess("Draw deleted successfully!");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to delete draw");
    }
  };
  const handleApproveMatch = async (matchId) => {
    try {
      await matchesAPI.approveMatch(matchId);
      showSuccess("Match approved successfully!");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to approve match");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm("Are you sure you want to delete this match result?")) {
      return;
    }

    try {
      await matchesAPI.deleteMatch(matchId);
      showSuccess("Match deleted successfully!");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to delete match");
    }
  };

  const handleSaveMatch = async (match) => {
    try {
      const gamesWon = parseInt(editGamesWon);
      const gamesLost = parseInt(editGamesLost);

      // Validate
      if (gamesWon + gamesLost > 5 || gamesWon + gamesLost < 3) {
        showError("Invalid score. Total must be 3, 4, or 5 games");
        return;
      }

      await matchesAPI.updateMatch(match.match_id, {
        player1_games_won: gamesWon,
        player1_games_lost: gamesLost,
        set_scores: editSetScores.some((s) => s)
          ? { sets: editSetScores }
          : null,
      });

      showSuccess("Match updated successfully!");
      setEditingMatchId(null);
      setEditGamesWon("");
      setEditGamesLost("");
      setEditSetScores([]);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update match");
    }
  };

  const handleDrawDateChange = (e) => {
    const date = e.target.value;
    setSelectedDrawDate(date);
    fetchDrawByDate(date);
  };

  const handleDeleteSelectedDraw = async () => {
    if (!selectedDrawDate) return;

    if (
      !confirm(
        `Are you sure you want to delete the draw for ${selectedDrawDate}? This will delete all matches and cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await drawAPI.deleteDraw(selectedDrawDate);
      showSuccess("Draw deleted successfully!");
      setSelectedDrawDate("");
      setCurrentDraw([]);

      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      showError(err.response?.data?.error || "Failed to delete draw");
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(`Approve all ${pendingMatches.length} pending matches?`)) {
      return;
    }

    try {
      const response = await matchesAPI.approveAll();
      showSuccess(`${response.data.approved} matches approved!`);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to approve matches");
    }
  };

  const handleStartEditMatch = (match) => {
    setEditingMatchId(match.match_id);
    setEditGamesWon(match.player1_games_won.toString());
    setEditGamesLost(match.player1_games_lost.toString());

    // Load existing set scores if available
    if (match.player1_set_scores) {
      const scores =
        typeof match.player1_set_scores === "string"
          ? JSON.parse(match.player1_set_scores)
          : match.player1_set_scores;
      setEditSetScores(scores.sets || []);
    } else {
      const total = match.player1_games_won + match.player1_games_lost;
      setEditSetScores(Array(total).fill(""));
    }
  };

  const handleCancelEditMatch = () => {
    setEditingMatchId(null);
    setEditGamesWon("");
    setEditGamesLost("");
    setEditSetScores([]);
  };

  const getResultBadge = (result) => {
    const badges = {
      3: { text: "Won 3", color: "#48bb78", movement: "↑ 6" },
      2: { text: "Won 2", color: "#38b2ac", movement: "↑ 3" },
      1: { text: "Won 1", color: "#ed8936", movement: "→ 0" },
      0: { text: "Won 0", color: "#e53e3e", movement: "↓ 1" },
      "~": { text: "No Play", color: "#718096", movement: "→ 0" },
      D: { text: "Default", color: "#e53e3e", movement: "↓ 1" },
    };
    return badges[result] || badges["0"];
  };

  const handleProcessWeek = async (e) => {
    e.preventDefault();

    if (!processWeekDate) {
      showError("Please select a week date");
      return;
    }

    if (
      !confirm(
        `Process all approved matches for week of ${processWeekDate}? This will update the ladder positions.`
      )
    ) {
      return;
    }

    try {
      const response = await matchesAPI.processWeek(processWeekDate);
      showSuccess(
        `Ladder updated! Processed ${response.data.processed} matches with ${response.data.updates} position changes.`
      );
      setProcessWeekDate("");
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to process week");
    }
  };

  const handleWithdrawPlayer = async (userId, playerName) => {
    if (
      !confirm(
        `Are you sure you want to withdraw ${playerName} from the ladder? This will remove them completely and move everyone below up one position.`
      )
    ) {
      return;
    }

    try {
      await ladderAPI.removeFromLadder(userId);
      showSuccess(`${playerName} has been withdrawn from the ladder`);
      fetchData();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to withdraw player");
    }
  };

  // Create and delete match handlers
  const handleDeletePairing = async (pairingId, player1Name, player2Name) => {
    if (
      !confirm(
        `Are you sure you want to delete the match between ${player1Name} and ${
          player2Name || "BYE"
        }?`
      )
    ) {
      return;
    }

    try {
      await drawAPI.deletePairing(pairingId);
      showSuccess("Match deleted successfully!");
      fetchDrawByDate(selectedDrawDate);
    } catch (err) {
      showError(err.response?.data?.error || "Failed to delete match");
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();

    if (!newMatchPlayer1) {
      showError("Please select Player 1");
      return;
    }

    if (newMatchTimeSlot === "Reschedule" && !newMatchRescheduleNotes) {
      showError("Please provide reschedule notes");
      return;
    }

    try {
      await drawAPI.createPairing({
        week_date: selectedDrawDate,
        player1_id: parseInt(newMatchPlayer1),
        player2_id: newMatchPlayer2 ? parseInt(newMatchPlayer2) : null,
        time_slot: newMatchTimeSlot || null,
        reschedule_notes:
          newMatchTimeSlot === "Reschedule" ? newMatchRescheduleNotes : null,
      });
      showSuccess("Match created successfully!");
      setShowCreateMatch(false);
      setNewMatchPlayer1("");
      setNewMatchPlayer2("");
      setNewMatchTimeSlot("");
      setNewMatchRescheduleNotes("");
      fetchDrawByDate(selectedDrawDate);
    } catch (err) {
      showError(err.response?.data?.error || "Failed to create match");
    }
  };

  // Get users not on ladder
  const usersOnLadder = new Set(ladder.map((l) => l.user_id));
  const availableUsers = users.filter((u) => !usersOnLadder.has(u.id));

  if (loading)
    return <div className="page loading">Loading admin panel...</div>;

  return (
    <div className="page admin-page">
      {/* Sticky Sidebar Navigation */}
      <div className="admin-sidebar">
        <h3>Quick Navigation</h3>
        <nav className="admin-nav">
          <a
            href="#generate-draw"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("generate-draw")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Generate Draw
          </a>
          <a
            href="#register-user"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("register-user")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Register User
          </a>
          <a
            href="#preferences"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("preferences")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Time Preferences
          </a>
          {pendingMatches.length > 0 && (
            <a
              href="#pending-matches"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("pending-matches")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              Pending Matches ({pendingMatches.length})
            </a>
          )}
          <a
            href="#process-week"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("process-week")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Process Week
          </a>
          {availableDraws.length > 0 && (
            <a
              href="#manage-draw"
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById("manage-draw")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              Manage Draw
            </a>
          )}
          <a
            href="#add-to-ladder"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("add-to-ladder")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Add to Ladder
          </a>
          <a
            href="#manage-positions"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("manage-positions")
                .scrollIntoView({ behavior: "smooth" });
            }}
          >
            Manage Positions
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        <h1>Admin Panel</h1>

        {successMessage && (
          <div className="admin-message success">✓ {successMessage}</div>
        )}

        {error && <div className="error">✗ {error}</div>}

        {/* Generate Draw Section */}
        <div className="admin-section" id="generate-draw">
          <h2>Generate Weekly Draw</h2>
          <form onSubmit={handleGenerateDraw} className="admin-form">
            <div className="admin-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Week Date (Thursday):</label>
                <input
                  type="date"
                  value={drawWeek}
                  onChange={(e) => setDrawWeek(e.target.value)}
                  required
                />
              </div>
              <div className="admin-button-group">
                <button type="submit" className="btn-primary">
                  Generate Draw
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Register New User Section */}
        <div className="admin-section" id="register-user">
          <h2>Register New User</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await authAPI.register(newUserData);
                showSuccess("User registered successfully!");
                setNewUserData({
                  email: "",
                  full_name: "",
                  password: "",
                  phone_number: "",
                  squash_grade: "",
                });
                fetchData(); // Refresh users list
              } catch (err) {
                showError(
                  err.response?.data?.error || "Failed to register user"
                );
              }
            }}
            className="admin-form"
          >
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                placeholder="John Doe"
                value={newUserData.full_name}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, full_name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                placeholder="john.doe@example.com"
                value={newUserData.email}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                placeholder="+64 21 123 4567"
                value={newUserData.phone_number}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    phone_number: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Squash Grade:</label>
              <select
                value={newUserData.squash_grade}
                onChange={(e) =>
                  setNewUserData({
                    ...newUserData,
                    squash_grade: e.target.value,
                  })
                }
                required
              >
                <option value="">-- Select Grade --</option>
                <option value="A">A Grade</option>
                <option value="B">B Grade</option>
                <option value="C">C Grade</option>
                <option value="D">D Grade</option>
                <option value="E">E Grade</option>
                <option value="F">F Grade</option>
                <option value="J">J Grade</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newUserData.password}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, password: e.target.value })
                }
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="btn-primary">
              Register User
            </button>
          </form>
        </div>

        {/* User Time Preferences */}
        <div className="admin-section" id="preferences">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2>Player Time Preferences</h2>
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              style={{
                padding: "0.5rem 1rem",
                background: "linear-gradient(90deg, #f97316, #ea580c)",

                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {showPreferences ? "▼ Hide" : "▶ Show"} Preferences
            </button>
          </div>

          {showPreferences && (
            <div style={{ marginTop: "1rem" }}>
              {userPreferences.length === 0 ? (
                <p style={{ color: "#718096", fontStyle: "italic" }}>
                  No active players with preferences set.
                </p>
              ) : (
                <div className="preferences-grid">
                  {userPreferences.map((player) => (
                    <div key={player.id} className="preference-card">
                      <div className="preference-header">
                        <div>
                          <strong
                            style={{ color: "#2d3748", fontSize: "1.1rem" }}
                          >
                            #{player.position} {player.full_name}
                            {player.is_junior && (
                              <span
                                style={{
                                  marginLeft: "0.5rem",
                                  padding: "0.25rem 0.5rem",
                                  background: "#fef3c7",
                                  color: "#92400e",
                                  borderRadius: "12px",
                                  fontSize: "0.75rem",
                                  fontWeight: "bold",
                                }}
                              >
                                JUNIOR
                              </span>
                            )}
                          </strong>
                          <div
                            style={{ fontSize: "0.875rem", color: "#718096" }}
                          >
                            {player.email}
                          </div>
                        </div>
                        <span
                          className={`status-badge status-${player.status}`}
                        >
                          {player.status}
                        </span>
                      </div>

                      {player.earliest_time ? (
                        <>
                          <div style={{ marginTop: "1rem" }}>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#4a5568",
                                marginBottom: "0.5rem",
                              }}
                            >
                              Earliest Time:
                            </div>
                            <span
                              style={{
                                padding: "0.5rem 1rem",
                                background: "#e6f3ff",
                                color: "#2c5282",
                                borderRadius: "20px",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                display: "inline-block",
                              }}
                            >
                              {player.earliest_time} or later
                            </span>
                          </div>

                          {player.notes && (
                            <div
                              style={{
                                marginTop: "0.75rem",
                                padding: "0.75rem",
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: "6px",
                                fontSize: "0.875rem",
                                color: "#78350f",
                              }}
                            >
                              <strong>📝 Notes:</strong> {player.notes}
                            </div>
                          )}
                        </>
                      ) : (
                        <div
                          style={{
                            marginTop: "1rem",
                            padding: "1rem",
                            background: "#f7fafc",
                            borderRadius: "6px",
                            textAlign: "center",
                            color: "#718096",
                            fontStyle: "italic",
                            fontSize: "0.875rem",
                          }}
                        >
                          No time preferences set
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Match Approvals */}
        {pendingMatches.length > 0 && (
          <div className="admin-section" id="pending-matches">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h2>Pending Match Approvals ({pendingMatches.length})</h2>
              <button
                onClick={handleApproveAll}
                style={{
                  padding: "0.75rem 1.5rem",
                  background:
                    "linear-gradient(135deg, #48bb78 0%, #38a169 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 2px 8px rgba(72, 187, 120, 0.3)",
                  fontSize: "1rem",
                }}
              >
                ✓ Approve All {pendingMatches.length} Matches
              </button>
            </div>

            <div className="pending-matches-grid">
              {pendingMatches.map((match) => {
                const isEditing = editingMatchId === match.match_id;

                return (
                  <div key={match.match_id} className="pending-match-card">
                    <div className="match-header">
                      <div className="match-date">
                        Week of {new Date(match.week_date).toLocaleDateString()}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        {match.player1_levels && match.player2_levels && (
                          <div
                            style={{
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              color: "white",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            🏆 LEVELS
                          </div>
                        )}
                        {match.time_slot && (
                          <div className="match-time">🕐 {match.time_slot}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ padding: "1rem 0" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <strong style={{ fontSize: "1rem" }}>
                          {match.player1_name}
                        </strong>
                        <span
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: match.scores_match ? "#48bb78" : "#e53e3e",
                          }}
                        >
                          {match.player1_games_won} - {match.player1_games_lost}
                        </span>
                        <strong style={{ fontSize: "1rem" }}>
                          {match.player2_name}
                        </strong>
                      </div>

                      {/* ADD SET SCORES DISPLAY */}
                      {match.player1_set_scores && (
                        <div
                          style={{
                            background: "#f7fafc",
                            padding: "0.75rem",
                            borderRadius: "6px",
                            marginTop: "0.75rem",
                            fontSize: "0.875rem",
                          }}
                        >
                          <strong
                            style={{
                              color: "#4a5568",
                              display: "block",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Set Scores:
                          </strong>
                          <div
                            style={{
                              color: "#2d3748",
                              fontFamily: "monospace",
                            }}
                          >
                            {(typeof match.player1_set_scores === "string"
                              ? JSON.parse(match.player1_set_scores)
                              : match.player1_set_scores
                            ).sets.join(", ")}
                          </div>
                        </div>
                      )}

                      {!match.scores_match && (
                        <div
                          style={{
                            background: "#fff5f5",
                            border: "1px solid #feb2b2",
                            padding: "0.5rem",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            color: "#c53030",
                            textAlign: "center",
                            marginTop: "0.5rem",
                          }}
                        >
                          ⚠️ Scores don't match - please review
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div
                        style={{
                          background: "#f7fafc",
                          padding: "1rem",
                          borderRadius: "8px",
                          marginTop: "1rem",
                        }}
                      >
                        <div style={{ marginBottom: "1rem" }}>
                          <label
                            style={{
                              display: "block",
                              marginBottom: "0.5rem",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                            }}
                          >
                            Correct Score ({match.player1_name}):
                          </label>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              alignItems: "center",
                              marginBottom: "1rem",
                            }}
                          >
                            <select
                              value={editGamesWon}
                              onChange={(e) => {
                                const won = e.target.value;
                                setEditGamesWon(won);
                                // Auto-update set scores array when games change
                                if (won && editGamesLost) {
                                  const total =
                                    parseInt(won) + parseInt(editGamesLost);
                                  setEditSetScores(Array(total).fill(""));
                                }
                              }}
                              style={{
                                padding: "0.5rem",
                                border: "2px solid #e2e8f0",
                                borderRadius: "6px",
                                flex: 1,
                              }}
                            >
                              <option value="">Won</option>
                              <option value="3">3</option>
                              <option value="2">2</option>
                              <option value="1">1</option>
                              <option value="0">0</option>
                            </select>
                            <span style={{ fontWeight: "bold" }}>-</span>
                            <select
                              value={editGamesLost}
                              onChange={(e) => {
                                const lost = e.target.value;
                                setEditGamesLost(lost);
                                // Auto-update set scores array when games change
                                if (editGamesWon && lost) {
                                  const total =
                                    parseInt(editGamesWon) + parseInt(lost);
                                  setEditSetScores(Array(total).fill(""));
                                }
                              }}
                              style={{
                                padding: "0.5rem",
                                border: "2px solid #e2e8f0",
                                borderRadius: "6px",
                                flex: 1,
                              }}
                            >
                              <option value="">Lost</option>
                              <option value="0">0</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                            </select>
                          </div>

                          {/* Set Scores Input */}
                          <div style={{ marginTop: "1rem" }}>
                            <label
                              style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "600",
                                fontSize: "0.875rem",
                              }}
                            >
                              Set Scores (optional):
                            </label>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit, minmax(100px, 1fr))",
                                gap: "0.5rem",
                              }}
                            >
                              {editSetScores.map((score, index) => (
                                <div key={index}>
                                  <label
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#4a5568",
                                      display: "block",
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    Set {index + 1}:
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="15-10"
                                    value={score}
                                    onChange={(e) => {
                                      const newScores = [...editSetScores];
                                      newScores[index] = e.target.value;
                                      setEditSetScores(newScores);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      border: "2px solid #e2e8f0",
                                      borderRadius: "6px",
                                      textAlign: "center",
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleSaveMatch(match)}
                            className="btn-save"
                            style={{ flex: 1 }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditMatch}
                            className="btn-cancel"
                            style={{ flex: 1 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="match-meta">
                          <small style={{ color: "#718096" }}>
                            Submitted{" "}
                            {new Date(
                              match.player1_submitted_at
                            ).toLocaleString()}
                          </small>
                        </div>

                        <div className="match-actions">
                          <button
                            onClick={() => {
                              setEditingMatchId(match.match_id);
                              setEditGamesWon(match.player1_games_won);
                              setEditGamesLost(match.player1_games_lost);
                              handleStartEditMatch(match);
                            }}
                            style={{
                              flex: 1,
                              padding: "0.75rem",
                              background: "#fd720d",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.95rem",
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleApproveMatch(match.match_id)}
                            className="btn-approve"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match.match_id)}
                            className="btn-reject"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Process Week and Update Ladder */}
        <div className="admin-section" id="process-week">
          <h2>Process Week & Update Ladder</h2>
          <p style={{ color: "#718096", marginBottom: "1rem" }}>
            After approving all matches, process the week to update ladder
            positions based on results.
          </p>

          <form onSubmit={handleProcessWeek} className="admin-form">
            <div className="admin-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select Week to Process:</label>
                <select
                  value={processWeekDate}
                  onChange={(e) => setProcessWeekDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                  required
                >
                  <option value="">-- Select a week --</option>
                  {availableDraws.map((date) => (
                    <option key={date} value={date}>
                      Week of{" "}
                      {new Date(date).toLocaleDateString("en-NZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-button-group">
                <button type="submit" className="btn-primary">
                  Process Week & Update Ladder
                </button>
              </div>
            </div>
          </form>

          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "#f0f4ff",
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "black",
            }}
          >
            <strong>Position Changes:</strong>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
              <li>
                Won 3 games: <strong>Move UP 6 positions</strong>
              </li>
              <li>
                Won 2 games: <strong>Move UP 3 positions</strong>
              </li>
              <li>
                Won 1 game: <strong>Stay in position</strong>
              </li>
              <li>
                Won 0 games: <strong>Move DOWN 1 position</strong>
              </li>
              <li>
                Did not play (~): <strong>Stay in position</strong>
              </li>
              <li>
                Defaulted (D): <strong>Move DOWN 1 position</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Manage Draw Section */}
        {availableDraws.length > 0 && (
          <div className="admin-section" id="manage-draw">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2>Manage Draw</h2>
            </div>

            {/* Draw Selector */}
            <div
              style={{
                marginBottom: "1.5rem",
                display: "flex",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Select Draw Week:</label>
                <select
                  value={selectedDrawDate}
                  onChange={handleDrawDateChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                  }}
                >
                  <option value="">-- Select a draw --</option>
                  {availableDraws.map((date) => (
                    <option key={date} value={date}>
                      Week of{" "}
                      {new Date(date).toLocaleDateString("en-NZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDrawDate && currentDraw.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      // Check if draw is currently published by looking at first pairing
                      const isPublished = currentDraw[0]?.is_published;

                      if (isPublished) {
                        await drawAPI.unpublishDraw(selectedDrawDate);
                        showSuccess("Draw unpublished - hidden from users");
                      } else {
                        await drawAPI.publishDraw(selectedDrawDate);
                        showSuccess("Draw published - now visible to users!");
                      }
                      fetchDrawByDate(selectedDrawDate);
                    } catch (err) {
                      showError(
                        err.response?.data?.error || "Failed to update draw"
                      );
                    }
                  }}
                  style={{
                    background: currentDraw[0]?.is_published
                      ? "#ed8936"
                      : "#48bb78",
                    color: "white",
                    padding: "0.75rem 1.5rem",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentDraw[0]?.is_published
                    ? "Unpublish Draw"
                    : "Publish Draw"}
                </button>
              )}

              {selectedDrawDate && (
                <>
                  <button
                    onClick={() => setShowCreateMatch(!showCreateMatch)}
                    style={{
                      background: "#48bb78",
                      color: "white",
                      padding: "0.75rem 1.5rem",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + Create Match
                  </button>
                  <button
                    onClick={handleDeleteSelectedDraw}
                    style={{
                      background: "#e53e3e",
                      color: "white",
                      padding: "0.75rem 1.5rem",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Delete This Draw
                  </button>
                </>
              )}
            </div>
            {/* Create Match Form */}
            {showCreateMatch && selectedDrawDate && (
              <div
                style={{
                  background: "#f7fafc",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <h3 style={{ marginBottom: "1rem" }}>Create New Match</h3>
                <form onSubmit={handleCreateMatch}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Player 1 (required):</label>
                      <select
                        value={newMatchPlayer1}
                        onChange={(e) => setNewMatchPlayer1(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "2px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                        required
                      >
                        <option value="">-- Select Player --</option>
                        {ladder
                          .filter((l) => {
                            // Only show active players
                            if (l.status !== "active") return false;

                            // Filter out players already in a match in this draw
                            const isInMatch = currentDraw.some(
                              (match) =>
                                match.player1_id === l.user_id ||
                                match.player2_id === l.user_id
                            );
                            return !isInMatch;
                          })
                          .map((player) => (
                            <option key={player.user_id} value={player.user_id}>
                              #{player.position} {player.full_name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Player 2 (optional - leave empty for BYE):</label>
                      <select
                        value={newMatchPlayer2}
                        onChange={(e) => setNewMatchPlayer2(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "2px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      >
                        <option value="">-- BYE --</option>
                        {ladder
                          .filter((l) => {
                            // Only show active players
                            if (l.status !== "active") return false;

                            // Filter out the selected Player 1
                            if (l.user_id === parseInt(newMatchPlayer1))
                              return false;

                            // Filter out players already in a match in this draw
                            const isInMatch = currentDraw.some(
                              (match) =>
                                match.player1_id === l.user_id ||
                                match.player2_id === l.user_id
                            );
                            return !isInMatch;
                          })
                          .map((player) => (
                            <option key={player.user_id} value={player.user_id}>
                              #{player.position} {player.full_name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Time Slot (optional):</label>
                      <select
                        value={newMatchTimeSlot}
                        onChange={(e) => setNewMatchTimeSlot(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.75rem",
                          border: "2px solid #e2e8f0",
                          borderRadius: "8px",
                        }}
                      >
                        <option value="">-- Select Time --</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                      {newMatchTimeSlot === "Reschedule" && (
                        <div
                          className="form-group"
                          style={{ marginBottom: 0, gridColumn: "1 / -1" }}
                        >
                          <label>Reschedule Notes (required):</label>
                          <textarea
                            value={newMatchRescheduleNotes}
                            onChange={(e) =>
                              setNewMatchRescheduleNotes(e.target.value)
                            }
                            placeholder="e.g., Players will arrange time directly - contact John at 021 XXX XXXX"
                            rows="2"
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "2px solid #e2e8f0",
                              borderRadius: "8px",
                              fontSize: "1rem",
                              fontFamily: "inherit",
                              resize: "vertical",
                            }}
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                  >
                    <button type="submit" className="btn-primary">
                      Create Match
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMatch(false);
                        setNewMatchPlayer1("");
                        setNewMatchPlayer2("");
                        setNewMatchTimeSlot("");
                      }}
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
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {currentDraw.length > 0 ? (
              <div className="draw-admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Match</th>
                      <th>Preferences</th>
                      <th>Time Slot</th>
                      <th>Bar Duty</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDraw
                      .sort((a, b) => {
                        // Helper function to convert time string to minutes since start of day
                        const timeToMinutes = (timeStr) => {
                          if (!timeStr) return 9999; // Put empty/unset times at the end

                          const match = timeStr.match(/(\d+):(\d+)(pm|am)/i);
                          if (!match) return 9999;

                          let hours = parseInt(match[1], 10);
                          const minutes = parseInt(match[2], 10);
                          const period = match[3].toLowerCase();

                          // Convert to 24-hour format
                          if (period === "pm" && hours !== 12) hours += 12;
                          if (period === "am" && hours === 12) hours = 0;

                          return hours * 60 + minutes;
                        };

                        const aMinutes = timeToMinutes(a.time_slot);
                        const bMinutes = timeToMinutes(b.time_slot);

                        return aMinutes - bMinutes; // Sort from earliest to latest
                      })
                      .map((pairing) => {
                        // Find preferences for both players
                        const player1Prefs = userPreferences.find(
                          (p) => p.id === pairing.player1_id
                        );
                        const player2Prefs = userPreferences.find(
                          (p) => p.id === pairing.player2_id
                        );

                        return (
                          <tr key={pairing.id}>
                            <td>
                              <strong>#{pairing.player1_position}</strong>{" "}
                              {pairing.player1_name}
                              <br />
                              <span style={{ color: "#718096" }}>vs</span>
                              <br />
                              {pairing.player2_id ? (
                                <>
                                  <strong>#{pairing.player2_position}</strong>{" "}
                                  {pairing.player2_name}
                                </>
                              ) : (
                                <span
                                  style={{
                                    color: "#ed8936",
                                    fontStyle: "italic",
                                  }}
                                >
                                  BYE
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: "0.875rem" }}>
                                {/* Player 1 Preferences */}
                                <div style={{ marginBottom: "0.75rem" }}>
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      color: "#4a5568",
                                      marginBottom: "0.25rem",
                                    }}
                                  >
                                    {pairing.player1_name}:
                                  </div>
                                  {player1Prefs?.earliest_time ? (
                                    <>
                                      <div
                                        style={{
                                          fontSize: "0.875rem",
                                          color: "#2c5282",
                                          fontWeight: "600",
                                        }}
                                      >
                                        ⏰ {player1Prefs.earliest_time} or later
                                      </div>
                                      {player1Prefs.is_junior && (
                                        <div
                                          style={{
                                            fontSize: "0.75rem",
                                            color: "#92400e",
                                            marginTop: "0.25rem",
                                          }}
                                        >
                                          ⚠️ Junior (before 7:30pm)
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span
                                      style={{
                                        color: "#a0aec0",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      Any time
                                    </span>
                                  )}
                                  {player1Prefs?.notes && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#78350f",
                                        background: "#fef3c7",
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "4px",
                                        marginTop: "0.25rem",
                                      }}
                                    >
                                      📝 {player1Prefs.notes}
                                    </div>
                                  )}
                                </div>

                                {/* Player 2 Preferences */}
                                {pairing.player2_id && (
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: "600",
                                        color: "#4a5568",
                                        marginBottom: "0.25rem",
                                      }}
                                    >
                                      {pairing.player2_name}:
                                    </div>
                                    {player2Prefs?.earliest_time ? (
                                      <>
                                        <div
                                          style={{
                                            fontSize: "0.875rem",
                                            color: "#5b21b6",
                                            fontWeight: "600",
                                          }}
                                        >
                                          ⏰ {player2Prefs.earliest_time} or
                                          later
                                        </div>
                                        {player2Prefs.is_junior && (
                                          <div
                                            style={{
                                              fontSize: "0.75rem",
                                              color: "#92400e",
                                              marginTop: "0.25rem",
                                            }}
                                          >
                                            ⚠️ Junior (before 7:30pm)
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span
                                        style={{
                                          color: "#a0aec0",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        Any time
                                      </span>
                                    )}
                                    {player2Prefs?.notes && (
                                      <div
                                        style={{
                                          fontSize: "0.75rem",
                                          color: "#78350f",
                                          background: "#fef3c7",
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "4px",
                                          marginTop: "0.25rem",
                                        }}
                                      >
                                        📝 {player2Prefs.notes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              {editingDrawId === pairing.id ? (
                                <>
                                  <select
                                    value={editTimeSlot}
                                    onChange={(e) =>
                                      setEditTimeSlot(e.target.value)
                                    }
                                    style={{
                                      width: "100%",
                                      padding: "0.5rem",
                                      marginBottom: "0.5rem",
                                    }}
                                  >
                                    <option value="">-- Select Time --</option>
                                    {timeSlots.map((slot) => (
                                      <option key={slot} value={slot}>
                                        {slot}
                                      </option>
                                    ))}
                                  </select>
                                  {editTimeSlot === "Reschedule" && (
                                    <textarea
                                      value={editRescheduleNotes}
                                      onChange={(e) =>
                                        setEditRescheduleNotes(e.target.value)
                                      }
                                      placeholder="Reschedule details..."
                                      rows="2"
                                      style={{
                                        width: "100%",
                                        padding: "0.5rem",
                                        border: "2px solid #e2e8f0",
                                        borderRadius: "4px",
                                        fontSize: "0.875rem",
                                      }}
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                  {pairing.time_slot || (
                                    <span style={{ color: "#a0aec0" }}>
                                      Not set
                                    </span>
                                  )}
                                  {pairing.time_slot === "Reschedule" &&
                                    pairing.reschedule_notes && (
                                      <div
                                        style={{
                                          marginTop: "0.5rem",
                                          padding: "0.5rem",
                                          background: "#fffbeb",
                                          border: "1px solid #fde68a",
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                          color: "#78350f",
                                        }}
                                      >
                                        📅 {pairing.reschedule_notes}
                                      </div>
                                    )}
                                </>
                              )}
                            </td>
                            <td>
                              {editingDrawId === pairing.id ? (
                                <input
                                  type="text"
                                  value={editBarDuty}
                                  onChange={(e) =>
                                    setEditBarDuty(e.target.value)
                                  }
                                  placeholder="e.g., Dave R"
                                  style={{ width: "100%", padding: "0.5rem" }}
                                />
                              ) : (
                                pairing.bar_duty || (
                                  <span style={{ color: "#a0aec0" }}>-</span>
                                )
                              )}
                            </td>
                            <td>
                              {editingDrawId === pairing.id ? (
                                <input
                                  type="text"
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Optional notes"
                                  style={{ width: "100%", padding: "0.5rem" }}
                                />
                              ) : (
                                pairing.notes || (
                                  <span style={{ color: "#a0aec0" }}>-</span>
                                )
                              )}
                            </td>
                            <td className="admin-actions">
                              {editingDrawId === pairing.id ? (
                                <div className="admin-edit-buttons">
                                  <button
                                    onClick={() =>
                                      handleSaveDrawPairing(pairing.id)
                                    }
                                    className="btn-save"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditDraw}
                                    className="btn-cancel"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.5rem",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    onClick={() => handleStartEditDraw(pairing)}
                                    className="btn-edit"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeletePairing(
                                        pairing.id,
                                        pairing.player1_name,
                                        pairing.player2_name
                                      )
                                    }
                                    style={{
                                      padding: "0.5rem 1rem",
                                      background: "#e53e3e",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontWeight: "600",
                                      fontSize: "0.875rem",
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p
                style={{
                  color: "#718096",
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "2rem",
                }}
              >
                {selectedDrawDate
                  ? "No pairings found for this draw."
                  : "Select a draw to manage."}
              </p>
            )}
          </div>
        )}

        {/* Add User to Ladder Section */}
        <div className="admin-section" id="add-to-ladder">
          <h2>Add User to Ladder</h2>

          <form onSubmit={handleAddToLadder} className="admin-form">
            <div className="admin-form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">-- Choose a user --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group admin-position-input">
                <label>Position</label>
                <input
                  type="number"
                  min="1"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="e.g. 1"
                />
              </div>

              <div className="admin-button-group">
                <button type="submit" className="btn-primary">
                  Add to Ladder
                </button>
              </div>
            </div>
          </form>

          {availableUsers.length === 0 && (
            <p className="admin-info">All users are already on the ladder.</p>
          )}
        </div>

        {/* Current Ladder with Edit Functionality */}
        <div className="admin-section" id="manage-positions">
          <h2>Manage Ladder Positions</h2>

          <div className="ladder-table">
            <table>
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ladder.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {editingId === entry.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editPosition}
                          onChange={(e) => setEditPosition(e.target.value)}
                          className="admin-edit-input"
                        />
                      ) : (
                        <span className="ladder-position">
                          {entry.position === 1 && "🥇 "}
                          {entry.position === 2 && "🥈 "}
                          {entry.position === 3 && "🥉 "}
                          {entry.position}
                        </span>
                      )}
                    </td>
                    <td>{entry.full_name}</td>
                    <td>{entry.email}</td>
                    <td>
                      <span className={`status-badge status-${entry.status}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="admin-actions">
                      {editingId === entry.id ? (
                        <div className="admin-edit-buttons">
                          <button
                            onClick={() => handleSavePosition(entry.id)}
                            className="btn-save"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="btn-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => handleStartEdit(entry)}
                            className="btn-edit"
                          >
                            Edit Position
                          </button>
                          <button
                            onClick={() =>
                              handleWithdrawPlayer(
                                entry.user_id,
                                entry.full_name
                              )
                            }
                            style={{
                              padding: "0.5rem 1rem",
                              background: "#e53e3e",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "600",
                              fontSize: "0.875rem",
                            }}
                          >
                            Withdraw
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ladder.length === 0 && (
              <p className="admin-empty">No one on the ladder yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
