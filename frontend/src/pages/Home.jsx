import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      <div className="home-title">
        <h1>Franklin Squash Club Ladder</h1>
      </div>
      {/* About Ladder Section */}
      <div className="ladder-rules-section">
        <h2>🏆 About Ladder</h2>
        <ul className="rules-list">
          <li>
            Free weekly competition: Thursdays, 5:30pm, open to all financial
            club members.
          </li>
          <li>
            Players are ranked on a ladder (based on grading/past results).
          </li>
          <li>Weekly draw (posted Mondays) pairs players closest in rank.</li>
          <li>Results move players up or down the ladder.</li>
        </ul>
      </div>

      {/* Why Join Section */}
      <div className="ladder-rules-section">
        <h2>🎉 Why Join?</h2>
        <ul className="rules-list">
          <li>Meet fellow members & enjoy the bar/kitchen.</li>
          <li>Learn squash scoring with senior members' support.</li>
          <li>Option to play for Squash Levels.</li>
        </ul>
      </div>

      {/* How to Join Section */}
      <div className="ladder-rules-section">
        <h2>📌 How to Join</h2>
        <ul className="rules-list">
          <li>
            Fill out the{" "}
            <a
              href="https://www.franklinsquash.org.nz/club-ladder/"
              className="email-link"
            >
              Ladder Request Form
            </a>{" "}
            on the club website or email{" "}
            <a href="mailto:fscladder@gmail.com" className="email-link">
              fscladder@gmail.com
            </a>
            .
          </li>
          <li>
            Once registered, you'll get a login to set your password & profile.
          </li>
          <li>
            Registered players can enter draws, submit scores, and view
            contacts.
          </li>
        </ul>
      </div>

      {/* Player Responsibilities Section */}
      <div className="ladder-rules-section">
        <h2>✅ Player Responsibilities</h2>
        <ul className="rules-list">
          <li>
            <strong>By Sunday 5pm:</strong> Confirm your status for Thursday.
          </li>
          <li>Mark unavailable (1 week) or withdraw (3+ weeks) if needed.</li>
          <li>
            Ensure scores are submitted correctly (especially for Squash
            Levels).
          </li>
          <li>
            If rescheduling, play before Sunday 5pm & notify the Coordinator.
          </li>
          <li>
            Arrive 15 mins early, referee the next match, and enter results
            online.
          </li>
        </ul>
      </div>

      {/* Contact Section */}
      <div className="ladder-rules-section">
        <h2>📧 Contact</h2>
        <p>
          Questions? Reach out via the ladder entry system or email{" "}
          <a href="mailto:fscladder@gmail.com" className="email-link">
            fscladder@gmail.com
          </a>
          . Full{" "}
          <a
            href="https://www.franklinsquash.org.nz/club-ladder/"
            className="email-link"
          >
            rules & etiquette
          </a>{" "}
          available on the club website.
        </p>
      </div>

      <div className="home-cards">
        <Link to="/ladder" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <h3>View Ladder</h3>
            <p>See current standings and player positions</p>
          </div>
        </Link>
        <Link to="/submit" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <h3>Submit Match</h3>
            <p>Report your match results</p>
          </div>
        </Link>
        <a
          href="https://www.franklinsquash.org.nz/club-ladder/"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div className="card">
            <h3>Franklin Squash</h3>
            <p>Ladder page</p>
          </div>
        </a>
      </div>
    </div>
  );
}

export default Home;
