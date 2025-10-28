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

  // Get users not on ladder
  const usersOnLadder = new Set(ladder.map((l) => l.user_id));
  const availableUsers = users.filter((u) => !usersOnLadder.has(u.id));

  if (loading)
    return <div className="page loading">Loading admin panel...</div>;

  return (
    <div className="page">
      <h1>🔧 Admin Panel</h1>

      {/* Success Message */}
      {successMessage && (
        <div className="admin-message success">✓ {successMessage}</div>
      )}

      {/* Error Message */}
      {error && <div className="error">✗ {error}</div>}

      {/* Add User to Ladder Section */}
      <div className="admin-section">
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
      <div className="admin-section">
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
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="btn-edit"
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
            <p className="admin-empty">No one on the ladder yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
