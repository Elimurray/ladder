import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Ladder from "./pages/Ladder";
import SubmitMatch from "./pages/SubmitMatch";
import SubmitMatchForm from "./pages/SubmitMatchForm";
import Login from "./pages/login";
import Admin from "./pages/Admin";
import Draw from "./pages/Draw";
import Profile from "./pages/Profile";
import Results from "./pages/Results";
import logo from "./assets/logo.png";

import "./App.css";

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  if (loading) {
    return <div className="page loading">Loading...</div>;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <NavLink to="/" className="nav-logo" style={{ background: 'none' }}>
            <img src={logo} alt="Ladder Logo" className="nav-logo-img" />
          </NavLink>

          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
            <li>
              <NavLink to="/" onClick={closeMenu}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/ladder" onClick={closeMenu}>
                Ladder
              </NavLink>
            </li>
            <li>
              <NavLink to="/draw" onClick={closeMenu}>
                Draw
              </NavLink>
            </li>
            <li>
              <NavLink to="/results" onClick={closeMenu}>
                Results
              </NavLink>
            </li>
            {user && (
              <li>
                <NavLink to="/submit" onClick={closeMenu}>
                  Submit Match
                </NavLink>
              </li>
            )}
            {user && (
              <li>
                <NavLink to="/profile" onClick={closeMenu}>
                  Profile
                </NavLink>
              </li>
            )}
            {user && user.is_admin && (
              <li>
                <NavLink to="/admin" onClick={closeMenu}>
                  Admin
                </NavLink>
              </li>
            )}
            {user ? (
              <li>
                <button onClick={handleLogout}>
                  Logout ({user.full_name})
                </button>
              </li>
            ) : (
              <li>
                <NavLink to="/login" onClick={closeMenu}>
                  Login
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <div
        className={`nav-overlay ${menuOpen ? "active" : ""}`}
        onClick={closeMenu}
      />

      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ladder" element={<Ladder />} />
          <Route path="/submit" element={<SubmitMatch />} />
          <Route path="/submit/:drawId" element={<SubmitMatchForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/draw" element={<Draw />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;