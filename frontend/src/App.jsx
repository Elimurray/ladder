import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home";
import Ladder from "./pages/Ladder";
import SubmitMatch from "./pages/SubmitMatch";
import Login from "./pages/Login";
import "./App.css";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Ladder</h1>

            {/* Hamburger button */}
            <button
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            {/* Navigation menu */}
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
              <li>
                <Link to="/submit" onClick={closeMenu}>
                  Submit Match
                </Link>
              </li>
              <li>
                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Overlay for mobile menu */}
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
