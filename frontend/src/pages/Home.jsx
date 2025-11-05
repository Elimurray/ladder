import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      <div className="home-title">
        <h1>Franklin Squash Club Ladder</h1>
      </div>
      {/* About Ladder Section */}
      <div className="ladder-rules-section">
        <h2>About Ladder</h2>
        <p className="info-intro">
          Ladder is a FREE club competition held on Thursday evenings from
          5:30pm for ALL financial club members.
        </p>
        <p>
          Players are initially given a position on the ladder (based on grading
          or past ladder results). A draw is generated weekly (By Monday),
          pairing up those closest on the ladder starting from position #1, and
          matches played that Thursday night. Players will move up and down the
          ladder based on the week's match result.
        </p>
        <br />

        <p>
          Ladder is a fantastic way to meet other club members and enjoy our
          fantastic bar and kitchen facilities. You can learn how to score
          squash in a friendly environment with senior members there to assist
          if needed. You can also choose to play for Squash Levels!
        </p>
      </div>

      {/* How to Join Ladder Section */}
      <div className="ladder-rules-section">
        <h2>How to join ladder:</h2>
        <ol className="rules-list">
          <li>
            Complete the Ladder Requests Form on our Club Website or email{" "}
            <a href="mailto:fscladder@gmail.com" className="email-link">
              fscladder@gmail.com
            </a>
          </li>
          <li>
            Once you have been registered on the ladder, an account login will
            be created for you to go and change your password and complete your
            profile details.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            You can then be added to the next draw!
          </li>
        </ol>
        <p>
          <strong>Note:</strong> Only Registered players can be added to the
          draw, submit scores, and view other player phone numbers.
        </p>
      </div>

      {/* Once Registered Section */}
      <div className="ladder-rules-section">
        <h2>Once registered, players should:</h2>
        <ol className="rules-list">
          <li>
            Before 5 pm the Sunday prior:
            <ol
              type="a"
              style={{
                marginTop: "0.5rem",
                marginLeft: "2rem",
                marginBottom: "0.5rem",
              }}
            >
              <li>
                Check your status for next Thursday is correct. If not available
                for 1 week, check that box, if unavailable for 3 or more weeks,
                use the withdraw button and email the ladder controller when you
                wish to return. If remaining active, then no change is
                necessary.
              </li>
              <li>
                Check that your match score has been submitted correctly -
                especially if for squash levels.
              </li>
            </ol>
          </li>
          <li>
            If you cannot play your scheduled time, then you may contact your
            opponent to play at another agreeable time. The game must be played
            and scores submitted online before Sunday 5pm. Advise the ladder
            Coordinator.
          </li>
          <li>
            Turn up 15 minutes before your scheduled match time, referee the
            subsequent match, and enter match results online.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            Please follow this link for the complete Ladder Rules and etiquette.
          </li>
        </ol>
        <p>
          The Ladder Coordinator controls the ladder. Any queries, please
          contact them via the ladder online entry system or email{" "}
          <a href="mailto:fscladder@gmail.com" className="email-link">
            fscladder@gmail.com
          </a>
          .
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
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <h3>Your Profile</h3>
            <p>Check your stats and history</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;
