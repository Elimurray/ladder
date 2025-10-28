import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login email:", email);
    // TODO: Connect to backend auth
    alert("Login link would be sent to: " + email);
  };

  return (
    <div className="page">
      <div className="login-container">
        <h1>Login</h1>
        <p>Enter your email to receive a login link</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Send Login Link
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
