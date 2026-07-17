import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(formData.email.toLowerCase(), formData.password);
      // Ref devices land straight on the scoring page
      if (data.user?.is_ref && !data.user?.is_admin) {
        navigate("/ref");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="page">
      <div className="login-container">
        <h1>Login</h1>
        <p>Welcome back!</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
