import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    squash_grade: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Submitting:", formData); // Debug log

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(
          formData.email,
          formData.full_name,
          formData.password,
          formData.phone_number,
          formData.squash_grade
        );
      }
      navigate("/profile");
    } catch (err) {
      console.error("Error response:", err.response?.data); // Debug log
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
        <h1>{isLogin ? "Login" : "Register"}</h1>
        <p>{isLogin ? "Welcome back!" : "Create your account"}</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name:</label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="+64 21 123 4567"
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Squash Grade:</label>
                <select
                  name="squash_grade"
                  value={formData.squash_grade}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Grade --</option>
                  <option value="A">A Grade</option>
                  <option value="B">B Grade</option>
                  <option value="C">C Grade</option>
                  <option value="D">D Grade</option>
                  <option value="E">E Grade</option>
                </select>
              </div>
            </>
          )}


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
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "1.5rem", textAlign: "center" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none",
              border: "none",
              color: "#667eea",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
