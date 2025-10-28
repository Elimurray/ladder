import { useState, useEffect } from "react";
import { ladderAPI, usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [ladder, setLadder] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Add user to ladder state
  const [selectedUser, setSelectedUser] = useState("");
  const [newPosition, setNewPosition] = useState("");

  // Edit position state
  const [editingId, setEditingId] = useState(null);
  const [editPosition, setEditPosition] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!user || !user.is_admin) {
      navigate("/");
      return;
    }

    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [ladderRes, usersRes] = await Promise.all([
        ladderAPI.getAll(),
        usersAPI.getAll(),
      ]);

      setLadder(ladderRes.data);
      setUsers(usersRes.data);
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
      fetchData(); // Refresh data
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
      fetchData(); // Refresh data
    } catch (err) {
      showError(err.response?.data?.error || "Failed to update position");
      console.error(err);
    }
  };

  // Get users not on ladder
  const usersOnLadder = new Set(ladder.map((l) => l.user_id));
  const availableUsers = users.filter((u) => !usersOnLadder.has(u.id));

  if (loading)
    return <div className="page loading">Loading admin panel...</div>;

  return (
    <div className="page">
      <h1>🔧 Admin Panel</h1>

      {/* Success/Error Messages */}
      {successMessage && (
        <div
          style={{
            background: "#48bb78",
            color: "white",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div
          style={{
            background: "#f56565",
            color: "white",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          ✗ {error}
        </div>
      )}

      {/* Add User to Ladder Section */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Add User to Ladder</h2>

        <form onSubmit={handleAddToLadder}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <option value="">-- Choose a user --</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: "150px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "bold",
                }}
              >
                Position
              </label>
              <input
                type="number"
                min="1"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="e.g. 1"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: "#667eea",
                color: "white",
                padding: "0.5rem 1.5rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Add to Ladder
            </button>
          </div>
        </form>

        {availableUsers.length === 0 && (
          <p style={{ color: "#718096", marginTop: "1rem" }}>
            All users are already on the ladder.
          </p>
        )}
      </div>

      {/* Current Ladder with Edit Functionality */}
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Manage Ladder Positions</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>
                Position
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Email</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {ladder.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "0.75rem" }}>
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      min="1"
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      style={{
                        width: "80px",
                        padding: "0.25rem",
                        border: "2px solid #667eea",
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                      {entry.position === 1 && "🥇 "}
                      {entry.position === 2 && "🥈 "}
                      {entry.position === 3 && "🥉 "}
                      {entry.position}
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.75rem" }}>{entry.full_name}</td>
                <td style={{ padding: "0.75rem" }}>{entry.email}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span
                    style={{
                      background:
                        entry.status === "active"
                          ? "#48bb78"
                          : entry.status === "withdrawn"
                          ? "#f56565"
                          : "#ed8936",
                      color: "white",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {entry.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem", textAlign: "right" }}>
                  {editingId === entry.id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => handleSavePosition(entry.id)}
                        style={{
                          background: "#48bb78",
                          color: "white",
                          padding: "0.25rem 0.75rem",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          background: "#cbd5e0",
                          color: "#2d3748",
                          padding: "0.25rem 0.75rem",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(entry)}
                      style={{
                        background: "#667eea",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      Edit Position
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ladder.length === 0 && (
          <p style={{ textAlign: "center", color: "#718096", padding: "2rem" }}>
            No one on the ladder yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default Admin;
