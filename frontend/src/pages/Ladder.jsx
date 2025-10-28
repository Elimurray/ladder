import { useState, useEffect } from "react";
import { usersAPI } from "../services/api";

function Ladder() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load ladder");
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page error">{error}</div>;

  return (
    <div className="page">
      <h1>Current Ladder</h1>
      <div className="ladder-table">
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Name</th>
              {/* <th>Email</th>
              <th>Member</th> */}
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.full_name}</td>
                {/* <td>{user.email}</td>
                <td>{user.is_member ? "✓" : "✗"}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Ladder;
