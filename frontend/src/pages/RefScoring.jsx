import { useState, useEffect, useRef } from "react";
import {
  Maximize,
  Minimize,
  ArrowLeftRight,
  Undo2,
  Ban,
} from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { liveAPI, drawAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const fullscreenElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement;

// Total points recorded = next event_number - 1. Derived from the cached
// score so a reloaded device resumes with the right sync counter.
const totalPoints = (score) => {
  if (!score) return 0;
  const setPoints = (score.completed_sets || []).reduce(
    (n, s) => n + s.p1 + s.p2,
    0,
  );
  return setPoints + (score.current_set?.p1 || 0) + (score.current_set?.p2 || 0);
};

function RefScoring() {
  const { user } = useAuth();
  const location = useLocation();
  const [session, setSession] = useState(null); // active live match (with names)
  const [pairings, setPairings] = useState([]);
  const [liveDrawIds, setLiveDrawIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(null); // completion info
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipped, setFlipped] = useState(false); // visual side swap only
  const [pickServer, setPickServer] = useState(null); // pairing awaiting server choice
  const cardRef = useRef(null);

  const canRef = !!user;

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
    if (canRef) loadInitial();
    else setLoading(false);
  }, [canRef]);

  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      const live = await liveAPI.getLiveMatches();
      const mine = live.data.find((s) => s.ref_user_id === user.id);
      if (mine) {
        const full = await liveAPI.getMatch(mine.id);
        setSession(full.data);
      } else {
        setSession(null);
        setLiveDrawIds(live.data.map((s) => s.draw_id));
        const draw = await drawAPI.getCurrentDraw();
        setPairings(
          draw.data.filter(
            (p) => p.player1_id && p.player2_id && !p.submitted,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to load");
    }
    setLoading(false);
  };

  const handleStart = async (drawId, firstServer) => {
    setBusy(true);
    setError(null);
    try {
      const res = await liveAPI.start(drawId, 5, firstServer);
      const full = await liveAPI.getMatch(res.data.session.id);
      setSession(full.data);
      setFinished(null);
      setPickServer(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to start match");
      setPickServer(null);
      loadInitial();
    }
    setBusy(false);
  };

  const handleServeSide = async () => {
    const serving = session?.current_score?.serving;
    if (!serving || busy) return;
    setBusy(true);
    setError(null);
    try {
      const newSide = serving.side === "R" ? "L" : "R";
      const res = await liveAPI.setServeSide(session.id, newSide);
      setSession({
        ...session,
        current_score: { ...session.current_score, serving: res.data.serving },
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to set serve side");
    }
    setBusy(false);
  };

  const resync = async () => {
    const full = await liveAPI.getMatch(session.id);
    setSession(full.data);
  };

  const handlePoint = async (playerNum) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const eventNumber = totalPoints(session.current_score) + 1;
      const res = await liveAPI.postPoint(session.id, playerNum, eventNumber);
      const updated = { ...session, current_score: res.data.current_score };
      if (res.data.status === "completed") {
        setFinished({
          winner: res.data.winner,
          winnerName:
            res.data.winner === 1 ? session.player1_name : session.player2_name,
          score: res.data.current_score,
          resultWritten: res.data.result_written,
          note: res.data.note,
        });
        setSession(null);
      } else {
        setSession(updated);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        await resync();
        setError("Device was out of sync — score refreshed, try again");
      } else {
        setError(err.response?.data?.error || "Failed to record point");
      }
    }
    setBusy(false);
  };

  const handleUndo = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await liveAPI.undo(session.id);
      setSession({ ...session, current_score: res.data.current_score });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to undo");
    }
    setBusy(false);
  };

  const handleAbandon = async () => {
    if (!window.confirm("Abandon this live match? The result can then be submitted manually."))
      return;
    setBusy(true);
    setError(null);
    try {
      await liveAPI.abandon(session.id);
      setSession(null);
      loadInitial();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to abandon");
    }
    setBusy(false);
  };

  // Scanned a court QR code while logged out (or with an expired token):
  // send them to login and come back here once they're in.
  if (!canRef) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname + location.search,
          message: "Log in to start live scoring.",
        }}
        replace
      />
    );
  }

  if (loading) return <div className="page loading">Loading...</div>;

  const cornerButton = {
    position: "absolute",
    top: "1rem",
    padding: "0.6rem",
    background: "white",
    color: "#718096",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // ---------- Match finished screen ----------
  if (finished) {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <h1>Match Complete</h1>
        <div
          style={{
            border: "2px solid #48bb78",
            background: "#f0fff4",
            borderRadius: "12px",
            padding: "2rem",
            margin: "2rem 0",
            width: "100%",
            color: "black",
          }}
        >
          <h2 style={{ marginTop: 0 }}>🏆 {finished.winnerName} wins!</h2>
          <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
            {finished.score.sets_won.p1} - {finished.score.sets_won.p2}
          </p>
          <p>
            ({finished.score.completed_sets.map((s) => `${s.p1}/${s.p2}`).join(", ")})
          </p>
          <p style={{ color: "#4a5568" }}>
            {finished.resultWritten
              ? "Result submitted — awaiting admin approval."
              : finished.note || "Result was not written."}
          </p>
        </div>
        <button
          onClick={() => {
            setFinished(null);
            loadInitial();
          }}
          style={{
            padding: "1rem 2rem",
            background: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Score Another Match
        </button>
      </div>
    );
  }

  // ---------- Active scoring screen ----------
  if (session) {
    const score = session.current_score || {};
    const sets = score.sets_won || { p1: 0, p2: 0 };
    const current = score.current_set || { p1: 0, p2: 0 };

    // Display-side mapping: flipping swaps which player renders left/right,
    // but point_to always identifies the real player on the server.
    const leftNum = flipped ? 2 : 1;
    const rightNum = flipped ? 1 : 2;
    const nameOf = (n) =>
      n === 1 ? session.player1_name : session.player2_name;
    const pointsOf = (n) => (n === 1 ? current.p1 : current.p2);
    const setsOf = (n) => (n === 1 ? sets.p1 : sets.p2);
    const setString = (s) => (flipped ? `${s.p2}/${s.p1}` : `${s.p1}/${s.p2}`);
    const playerColor = { 1: "#3182ce", 2: "#805ad5" };

    // The score digits ARE the point buttons: tap a player's score to add
    // a point for them. No chrome — just the giant digit as the tap target.
    const scoreTap = (n) => ({
      flex: 1,
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      background: "none",
      border: "none",
      color: playerColor[n],
      cursor: "pointer",
      touchAction: "manipulation",
      userSelect: "none",
      opacity: busy ? 0.6 : 1,
    });
    const digitSize = isFullscreen
      ? "clamp(6rem, min(42vh, 26vw), 32rem)"
      : "clamp(4.5rem, 24vw, 14rem)";

    // Score digit with the serve-box chip (L/R) underneath — the chip only
    // appears under whoever is serving; tapping it switches the box. The
    // slot is always reserved so the layout doesn't jump on handout.
    const scoreColumn = (n) => (
      <div
        style={{
          flex: 2,
          minWidth: 0,
          alignSelf: "stretch",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => handlePoint(n)}
          disabled={busy}
          style={scoreTap(n)}
        >
          <span
            style={{ fontSize: digitSize, fontWeight: "bold", lineHeight: 1 }}
          >
            {pointsOf(n)}
          </span>
        </button>
        <div
          style={{
            minHeight: isFullscreen ? "3.5rem" : "2.5rem",
            marginTop: "0.25rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {score.serving?.player === n && (
            <button
              onClick={handleServeSide}
              disabled={busy}
              title="Tap to switch service box"
              style={{
                padding: isFullscreen ? "0.4rem 1.2rem" : "0.3rem 0.9rem",
                background: "white",
                color: playerColor[n],
                border: `2px solid ${playerColor[n]}`,
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: isFullscreen ? "1.5rem" : "1.1rem",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {score.serving.side}
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className="page">
        <h1 style={{ textAlign: "center" }}>Live Scoring</h1>

        {error && (
          <div className="error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div
          ref={cardRef}
          style={{
            border: "2px solid #e2e8f0",
            borderRadius: isFullscreen ? 0 : "12px",
            padding: "1rem 0.5rem",
            background: "white",
            color: "black",
            width: "100%",
            minHeight: isFullscreen ? "100vh" : "60vh",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            position: "relative",
          }}
        >
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{ ...cornerButton, right: "1rem" }}
          >
            {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
          </button>

          <button
            onClick={() => setFlipped(!flipped)}
            title="Flip sides"
            style={{ ...cornerButton, left: "1rem" }}
          >
            <ArrowLeftRight size={22} />
          </button>

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
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
              ● LIVE — Best of {session.best_of}
            </span>
          </div>

          {/* Scoreboard */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div
              style={{
                flex: 2,
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
                flex: 2,
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
              textAlign: "center",
              marginBottom: "0.5rem",
              flex: 1,
              gap: "0.5rem",
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
                  fontSize: isFullscreen
                    ? "2rem"
                    : "clamp(0.8rem, 3vw, 1.25rem)",
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
                textAlign: "center",
                color: "#718096",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              Sets: {score.completed_sets.map(setString).join(", ")}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "0.75rem",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleUndo}
              disabled={busy || totalPoints(score) === 0}
              style={{
                padding: "0.6rem 1rem",
                background: "white",
                color: "#718096",
                border: "2px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                opacity: busy || totalPoints(score) === 0 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.9rem",
              }}
            >
              <Undo2 size={18} /> Undo
            </button>

            <button
              onClick={handleAbandon}
              disabled={busy}
              style={{
                padding: "0.6rem 1rem",
                background: "#e53e3e",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.9rem",
              }}
            >
              <Ban size={18} /> Abandon
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Choose first server (after tapping Start on a pairing) ----------
  if (pickServer) {
    return (
      <div className="page">
        <h1>Who Serves First?</h1>

        {error && (
          <div className="error" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <div
          style={{
            border: "2px solid #e2e8f0",
            borderRadius: "12px",
            padding: "1.5rem",
            background: "white",
            color: "black",
            width: "100%",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginTop: 0 }}>
            <strong>{pickServer.player1_name}</strong> vs{" "}
            <strong>{pickServer.player2_name}</strong> — best of 5
          </p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => handleStart(pickServer.id, n)}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "2rem 1rem",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                  background: n === 1 ? "#3182ce" : "#805ad5",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  opacity: busy ? 0.6 : 1,
                  touchAction: "manipulation",
                }}
              >
                {n === 1 ? pickServer.player1_name : pickServer.player2_name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPickServer(null)}
            disabled={busy}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              background: "white",
              color: "#718096",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---------- Pick a pairing screen ----------
  return (
    <div className="page">
      <h1>Start Live Scoring</h1>

      {error && (
        <div className="error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {pairings.length === 0 ? (
        <p style={{ color: "#718096" }}>
          No pairings available in the current draw.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", width: "100%" }}>
          {pairings.map((p) => {
            const alreadyLive = liveDrawIds.includes(p.id);
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "2px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1rem",
                  background: "white",
                  color: "black",
                }}
              >
                <div>
                  <strong>{p.player1_name}</strong> vs{" "}
                  <strong>{p.player2_name}</strong>
                  <div style={{ fontSize: "0.8rem", color: "#718096" }}>
                    {p.time_slot || "Unscheduled"}
                  </div>
                </div>
                {alreadyLive ? (
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
                    ● LIVE
                  </span>
                ) : (
                  <button
                    onClick={() => setPickServer(p)}
                    disabled={busy}
                    style={{
                      padding: "0.5rem 1.25rem",
                      background: "#48bb78",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RefScoring;
