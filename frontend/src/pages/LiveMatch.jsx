import { useState, useEffect, useRef } from "react";
import { Maximize, Minimize, ArrowLeftRight } from "lucide-react";
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
  const [flipped, setFlipped] = useState(false); // visual side swap only
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

  // Display-side mapping — flipping is cosmetic, the data stays canonical
  const leftNum = flipped ? 2 : 1;
  const rightNum = flipped ? 1 : 2;
  const nameOf = (n) => (n === 1 ? match.player1_name : match.player2_name);
  const pointsOf = (n) => (n === 1 ? current.p1 : current.p2);
  const setsOf = (n) => (n === 1 ? sets.p1 : sets.p2);
  const setString = (s) => (flipped ? `${s.p2}/${s.p1}` : `${s.p1}/${s.p2}`);
  const playerColor = { 1: "#3182ce", 2: "#805ad5" };

  // Score digit with a read-only serve-box chip (L/R) under the server.
  // The slot is always reserved so the layout doesn't jump on handout.
  const scoreColumn = (n) => (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontSize: isFullscreen
            ? "clamp(6rem, min(40vh, 26vw), 30rem)"
            : "clamp(4.5rem, 24vw, 11rem)",
          fontWeight: "bold",
          lineHeight: 1,
          color: playerColor[n],
        }}
      >
        {pointsOf(n)}
      </div>
      <div
        style={{
          minHeight: isFullscreen ? "3.5rem" : "2.5rem",
          marginTop: "0.25rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        {isLive && score.serving?.player === n && (
          <span
            style={{
              padding: isFullscreen ? "0.4rem 1.2rem" : "0.3rem 0.9rem",
              background: "white",
              color: playerColor[n],
              border: `2px solid ${playerColor[n]}`,
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: isFullscreen ? "1.5rem" : "1.1rem",
            }}
          >
            {score.serving.side}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="page">
      <h1 style={{ textAlign: "center" }}>Live Match</h1>

      <div
        ref={cardRef}
        style={{
          border: "2px solid #e2e8f0",
          borderRadius: isFullscreen ? 0 : "12px",
          padding: "1rem 0.5rem",
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
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.6rem",
            background: "white",
            color: "#718096",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>

        <button
          onClick={() => setFlipped(!flipped)}
          title="Flip sides"
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            padding: "0.6rem",
            background: "white",
            color: "#718096",
            border: "2px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeftRight size={22} />
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
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: "bold",
              fontSize: "clamp(1.1rem, 5vw, 2.2rem)",
              overflowWrap: "break-word",
            }}
          >
            {nameOf(leftNum)}
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontWeight: "bold",
              fontSize: "clamp(1.1rem, 5vw, 2.2rem)",
              overflowWrap: "break-word",
            }}
          >
            {nameOf(rightNum)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {scoreColumn(leftNum)}
          <div style={{ flex: 1, minWidth: 0, color: "#718096" }}>
            <div
              style={{
                fontSize: isFullscreen
                  ? "clamp(2rem, 8vw, 5rem)"
                  : "clamp(1.5rem, 8vw, 3rem)",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {setsOf(leftNum)}-{setsOf(rightNum)}
            </div>
            <div
              style={{
                fontSize: isFullscreen ? "2rem" : "clamp(0.8rem, 3vw, 1.25rem)",
              }}
            >
              SETS
            </div>
          </div>
          {scoreColumn(rightNum)}
        </div>

        {(score.completed_sets || []).length > 0 && (
          <div
            style={{
              color: "#718096",
              fontSize: "0.875rem",
              marginTop: "0.75rem",
            }}
          >
            Sets: {score.completed_sets.map(setString).join(", ")}
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
