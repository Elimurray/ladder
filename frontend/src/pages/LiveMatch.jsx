import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { liveAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const POLL_MS = 2500;

const fullscreenElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement;

// Read-only live scoreboard, polled every few seconds. Any logged-in user.
function LiveMatch() {
  const { id } = useParams();
  const { user } = useAuth();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!fullscreenElement());
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (fullscreenElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else if (cardRef.current) {
      const el = cardRef.current;
      const request = el.requestFullscreen || el.webkitRequestFullscreen;
      if (request) request.call(el);
    }
  };

  useEffect(() => {
    if (!user) return;

    let timer;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await liveAPI.getMatch(id);
        if (cancelled) return;
        setMatch(res.data);
        setError(null);
        setLoading(false);
        // Keep polling only while the match is still live
        if (res.data.status === "live") {
          timer = setTimeout(poll, POLL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setError(err.response?.data?.error || "Failed to load live match");
        setLoading(false);
      }
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id, user]);

  if (!user) {
    return (
      <div className="page">
        <div className="error">Please log in to watch live matches.</div>
      </div>
    );
  }

  if (loading) return <div className="page loading">Loading live match...</div>;

  if (error)
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );

  const score = match.current_score || {};
  const sets = score.sets_won || { p1: 0, p2: 0 };
  const current = score.current_set || { p1: 0, p2: 0 };
  const isLive = match.status === "live";

  return (
    <div className="page">
      <h1 style={{ textAlign: "center" }}>Live Match</h1>

      <div
        ref={cardRef}
        style={{
          border: "2px solid #e2e8f0",
          borderRadius: isFullscreen ? 0 : "12px",
          padding: "1.5rem",
          background: "white",
          color: "black",
          width: "100%",
          textAlign: "center",
          minHeight: isFullscreen ? "100vh" : "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button
          onClick={toggleFullscreen}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.5rem 0.75rem",
            background: "#2d3748",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {isFullscreen ? "✕ Exit" : "⛶ Fullscreen"}
        </button>

        <div style={{ marginBottom: "1rem" }}>
          {isLive ? (
            <span
              style={{
                background: "#e53e3e",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              ● LIVE — Best of {match.best_of}
            </span>
          ) : (
            <span
              style={{
                background: match.status === "completed" ? "#48bb78" : "#718096",
                color: "white",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "bold",
              }}
            >
              {match.status === "completed" ? "FINISHED" : "ABANDONED"}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, fontWeight: "bold", fontSize: "1.1rem" }}>
            {match.player1_name}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ flex: 1, fontWeight: "bold", fontSize: "1.1rem" }}>
            {match.player2_name}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              fontSize: isFullscreen
                ? "clamp(9rem, 40vh, 30rem)"
                : "clamp(7rem, 14vw, 11rem)",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {current.p1}
          </div>
          <div style={{ flex: 1, color: "#718096" }}>
            <div
              style={{
                fontSize: isFullscreen ? "5rem" : "3rem",
                fontWeight: "bold",
              }}
            >
              {sets.p1} - {sets.p2}
            </div>
            <div style={{ fontSize: isFullscreen ? "2rem" : "1.25rem" }}>
              SETS
            </div>
          </div>
          <div
            style={{
              flex: 1,
              fontSize: isFullscreen
                ? "clamp(9rem, 40vh, 30rem)"
                : "clamp(7rem, 14vw, 11rem)",
              fontWeight: "bold",
              lineHeight: 1,
            }}
          >
            {current.p2}
          </div>
        </div>

        {(score.completed_sets || []).length > 0 && (
          <div
            style={{
              color: "#718096",
              fontSize: "0.875rem",
              marginTop: "0.75rem",
            }}
          >
            Sets:{" "}
            {score.completed_sets.map((s) => `${s.p1}/${s.p2}`).join(", ")}
          </div>
        )}

        {match.status === "completed" && (
          <p style={{ marginTop: "1rem", fontWeight: "bold" }}>
            🏆{" "}
            {sets.p1 > sets.p2 ? match.player1_name : match.player2_name} wins!
          </p>
        )}
        {match.status === "abandoned" && (
          <p style={{ marginTop: "1rem", color: "#718096" }}>
            Live scoring was abandoned — the result will be submitted manually.
          </p>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Link to="/draw" style={{ color: "#3182ce" }}>
          ← Back to Draw
        </Link>
      </div>
    </div>
  );
}

export default LiveMatch;
