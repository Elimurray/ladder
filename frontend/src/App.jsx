import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Ladder from "./pages/Ladder";
import SubmitMatch from "./pages/SubmitMatch";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  if (loading) {
    return <div className="page loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Ladder</h1>

            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            <ul className={`nav-menu ${menuOpen ? "active" : ""}`}>
              <li>
                <Link to="/" onClick={closeMenu}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/ladder" onClick={closeMenu}>
                  Ladder
                </Link>
              </li>
              {user && (
                <li>
                  <Link to="/submit" onClick={closeMenu}>
                    Submit Match
                  </Link>
                </li>
              )}
              {user ? (
                <li>
                  <button
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      cursor: "pointer",
                      padding: "0.5rem 1rem",
                      fontSize: "inherit",
                      fontWeight: "500",
                    }}
                  >
                    Logout ({user.full_name})
                  </button>
                </li>
              ) : (
                <li>
                  <Link to="/login" onClick={closeMenu}>
                    Login
                  </Link>
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
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
