import { useState, useEffect } from "react";
import { profileAPI, ladderAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [editIsJunior, setEditIsJunior] = useState(false);

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGrade, setEditGrade] = useState("");

  // Preferences state

  const [earliestTime, setEarliestTime] = useState("");

  const [notes, setNotes] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  const timeSlots = ["5:30pm", "6:00pm", "6:30pm", "7:00pm", "7:30pm"];

  const getNextMonday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7; // 1 = Monday
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);

    return nextMonday.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
      setEditEmail(response.data.email);
      setEditGrade(response.data.squash_grade);
      setEditPhone(response.data.phone_number || "");
      setEarliestTime(response.data.earliest_time || "");
      setNotes(response.data.notes || "");
      setLoading(false);
      setEditIsJunior(response.data.is_junior || false);
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

  const handleWithdraw = async () => {
    if (
      !confirm(
        "Are you sure you want to withdraw from the ladder? This will remove you completely and an admin will need to add you back.",
      )
    ) {
      return;
    }

    try {
      await ladderAPI.withdrawFromLadder();
      setSuccess("You have been withdrawn from the ladder");
      setTimeout(() => {
        navigate("/ladder");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to withdraw from ladder");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await profileAPI.updatePreferences({
        earliest_time: earliestTime,
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setError(null);

    // Validation
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      await profileAPI.changePassword({
        currentPassword,
        newPassword,
      });
      setSuccess("Password changed successfully!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.error || "Failed to change password",
      );
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await profileAPI.updateContact({
        email: editEmail,
        phone_number: editPhone,
        squash_grade: editGrade,
        is_junior: editIsJunior,
      });
      setSuccess("Contact information updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setIsEditingContact(false);
      fetchProfile();
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to update contact information",
      );
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
              border: "2px solid rgb(226, 232, 240)",
              color: "black",
              padding: "2rem",
              borderRadius: "12px",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ margin: "0 0 1rem 0" }}>{profile.full_name}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "1rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Email</div>
                {isEditingContact ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    style={{
                      fontWeight: "bold",
                      padding: "0.5rem",
                      border: "2px solid #e2e8f0",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  />
                ) : (
                  <div style={{ fontWeight: "bold" }}>{profile.email}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Ladder Position
                </div>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>
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
                  Joined Ladder
                </div>
                <div style={{ fontWeight: "bold" }}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Phone Number
                </div>
                {isEditingContact ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{
                      fontWeight: "bold",
                      padding: "0.5rem",
                      border: "2px solid #e2e8f0",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  />
                ) : (
                  <div style={{ fontWeight: "bold" }}>
                    {profile.phone_number || "Not provided"}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  Squash Grade
                </div>
                <div style={{ fontWeight: "bold" }}>
                  {isEditingContact ? (
                    <select
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      style={{
                        fontWeight: "bold",
                        padding: "0.5rem",
                        border: "2px solid #e2e8f0",
                        borderRadius: "4px",
                        width: "100%",
                      }}
                    >
                      <option value="">-- Select Grade --</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                      <option value="F">F</option>
                      <option value="J">J</option>
                    </select>
                  ) : (
                    <div style={{ fontWeight: "bold" }}>
                      {profile.squash_grade || "Not Set"}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>Junior</div>
                {isEditingContact ? (
                  <select
                    value={editIsJunior}
                    onChange={(e) => setEditIsJunior(e.target.value === "true")}
                    style={{
                      fontWeight: "bold",
                      padding: "0.5rem",
                      border: "2px solid #e2e8f0",
                      borderRadius: "4px",
                      width: "100%",
                    }}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                ) : (
                  <div style={{ fontWeight: "bold" }}>
                    {profile.is_junior ? "Yes" : "No"}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              {!isEditingContact ? (
                <button
                  onClick={() => setIsEditingContact(true)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "#4299e1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  ✏️ Edit Contact Info
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSaveContact}
                    style={{
                      padding: "0.75rem 1.5rem",
                      background: "#48bb78",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ✓ Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingContact(false);
                      setEditEmail(profile.email);
                      setEditPhone(profile.phone_number || "");
                      setEditIsJunior(profile.is_junior || false);
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
                </>
              )}
            </div>
          </div>

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
              Availability Status for Week Starting {getNextMonday()}
            </h3>
            <p
              style={{
                color: "#718096",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Set your status for the upcoming week.
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
                onClick={handleWithdraw}
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
                🚫 Withdraw From Ladder
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "#f7fafc",
                borderRadius: "8px",
                fontSize: "0.875rem",
                color: "#4a5568",
              }}
            >
              <strong>Status Options:</strong>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                <li>
                  <strong>Active:</strong> Available to play this week -
                  included in draw
                </li>
                <li>
                  <strong>No Play This Week:</strong> Skip this week's draw but
                  stay on ladder
                </li>
                <li>
                  <strong>Withdraw:</strong> Permanently removes you from the
                  ladder (can be re-added by admin)
                </li>
              </ul>
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

          {/* Squash Levels */}
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
              Squash Levels
            </h3>
            <p
              style={{
                color: "#718096",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Do you want to play for squash levels? When both players opt-in,
              your match will count towards level rankings.
            </p>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={async () => {
                  try {
                    await profileAPI.updateSquashLevels(true);
                    setSuccess("Now playing for squash levels!");
                    setTimeout(() => setSuccess(null), 3000);
                    fetchProfile();
                  } catch (err) {
                    setError(err.response?.data?.error || "Failed to update");
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: profile.play_for_levels ? "#48bb78" : "#e2e8f0",
                  color: profile.play_for_levels ? "white" : "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✓ Yes, Play for Levels
              </button>
              <button
                onClick={async () => {
                  try {
                    await profileAPI.updateSquashLevels(false);
                    setSuccess("Not playing for levels");
                    setTimeout(() => setSuccess(null), 3000);
                    fetchProfile();
                  } catch (err) {
                    setError(err.response?.data?.error || "Failed to update");
                  }
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: !profile.play_for_levels ? "#e53e3e" : "#e2e8f0",
                  color: !profile.play_for_levels ? "white" : "#4a5568",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                ✗ No Thanks
              </button>
            </div>
          </div>

          {/* Password Change */}
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
              Change Password
            </h3>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgb(66, 153, 225)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🔒 Change Password
              </button>
            ) : (
              <form onSubmit={handleChangePassword}>
                {passwordError && (
                  <div
                    style={{
                      background: "#fed7d7",
                      borderLeft: "4px solid #e53e3e",
                      color: "#742a2a",
                      padding: "1rem 1.5rem",
                      borderRadius: "8px",
                      marginBottom: "1rem",
                      fontWeight: "500",
                    }}
                  >
                    ✗ {passwordError}
                  </div>
                )}

                <div className="form-group">
                  <label>Current Password:</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength="6"
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn-primary">
                    Save New Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError("");
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
            )}
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

            {/* Junior Notice */}
            {profile.is_junior && (
              <div
                style={{
                  background: "#fef3c7",
                  border: "2px solid #fbbf24",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <strong style={{ color: "#92400e" }}>⚠️ Junior Player:</strong>
                <span style={{ color: "#78350f", marginLeft: "0.5rem" }}>
                  You must play before 7:30pm
                </span>
              </div>
            )}

            <p
              style={{
                color: "#718096",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              Set your earliest available time slot. This helps admins schedule
              matches.
            </p>

            <form onSubmit={handleSavePreferences}>
              <div className="form-group">
                <label>Earliest Time I Can Play:</label>
                <select
                  value={earliestTime}
                  onChange={(e) => setEarliestTime(e.target.value)}
                >
                  {(profile.is_junior
                    ? timeSlots.filter((t) => {
                        // Only show times before 7:30pm for juniors
                        const hour = parseInt(t.split(":")[0]);
                        const isPM = t.includes("pm");
                        const time24 = isPM && hour !== 12 ? hour + 12 : hour;
                        return (
                          time24 < 19 || (time24 === 19 && t.includes("7:00"))
                        );
                      })
                    : timeSlots
                  ).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Additional Notes:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Can't play first week of each month"
                  rows="3"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    color: "black",
                    background: "white",
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
                      <th>Week</th>
                      <th>Position</th>
                      <th>Opponent</th>
                      <th>Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((match) => (
                      <tr key={match.id}>
                        <td>
                          {match.week_date
                            ? new Date(
                                match.week_date + "T00:00:00",
                              ).toLocaleDateString("en-NZ", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                        <td>
                          {match.position ? (
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                background: "#e2e8f0",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                color: "#4a5568",
                              }}
                            >
                              #{match.position}
                            </span>
                          ) : (
                            <span style={{ color: "#a0aec0" }}>-</span>
                          )}
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
                                    ? "#7c2d12"
                                    : match.result === "1"
                                      ? "#7c2d12"
                                      : "#742a2a",
                            }}
                          >
                            {match.result === "3"
                              ? "Won"
                              : match.result === "2"
                                ? "Lost"
                                : match.result === "1"
                                  ? "Lost"
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
