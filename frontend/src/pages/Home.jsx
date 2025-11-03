import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      <div className="home-title">

        <h1>Franklin Squash Club</h1>
        <p>Track your standings, view draws and results</p>
      </div>
      {/* General Info Section */}
      <div className="ladder-rules-section">
        <h2>Club Ladder</h2>
        <p className="info-intro">
          Ladder is a FREE club competition held on a Thursday evening for ALL
          financial club members.
        </p>
        <ul className="rules-list">
          <li>
            Please complete the form below or email{" "}
            <a href="mailto:fscladder@gmail.com" className="email-link">
              fscladder@gmail.com
            </a>{" "}
            to join the ladder or be left off the draw for certain rounds.
          </li>
          <li>
            All ladder entries/exits, comments must be in by 5pm each Sunday so
            they can be included the following week. Please read the ladder rules
            below.
          </li>
          <li>
            If you cannot play your scheduled time, then you may contact your
            opponent to play at another agreeable time. The game must be played and
            scores submitted online at Submit Ladder Scores or emailed to{" "}
            <a href="mailto:fscladder@gmail.com" className="email-link">
              fscladder@gmail.com
            </a>{" "}
            before Sunday 5pm.
          </li>
          <li>
            <strong>Times:</strong> Ladder is played on Thursday nights from
            5:30pm onwards. Time requests cannot be actioned due to large numbers
            participating.
          </li>
          <li>
            Weekly Ladder draw and standings are posted here on the club website
            and a link emailed to current ladder participants.
          </li>
          <li>
            Ladder is a fantastic way to meet other club members and enjoy our bar
            and kitchen facilities.
          </li>
          <li>
            Learn how to score squash in a friendly environment. Ask a senior
            member to help you out!
          </li>
          <li>
            Simple system - if you win your match you move up the ladder!
          </li>
          <li>View your & other players match histories.</li>
          <li>
            The Ladder Coordinator controls the ladder. Any queries, please contact
            them via the ladder online entry system or email{" "}
            <a href="mailto:fscladder@gmail.com" className="email-link">
              fscladder@gmail.com
            </a>
            .
          </li>
        </ul>
      </div>

      {/* Rules Section */}
      <div className="ladder-rules-section">
        <h2>Ladder Rules</h2>
        <ul className="rules-list">
          <li>
            By signing up for the ladder you are signing up to play a social squash
            match on a Thursday night. You will play junior or senior players of
            your ability level. If you know you are not going to be available to
            play, make sure you leave the ladder for that week. You can do it
            online. You need to do this before Sunday evening at 5pm.
          </li>
          <li>
            If you can&apos;t make your scheduled game, you need to get in touch with
            your opponent. Find their contact details on the ladder draw or online
            by logging in through Hello Club &apos;book now&apos; and clicking on &apos;directory&apos;.
          </li>
          <li>
            <strong className="warning-text">
              No shows will be stood down from the ladder for a TWO (2) week
              period.
            </strong>
          </li>
          <li>
            If you can&apos;t make your scheduled game, your opponent is not obliged to
            play at another time – they can choose to take the win instead. Default
            matches will be scored 3-0.
          </li>
          <li>
            You are responsible for ensuring your match result is submitted using
            the online form Submit Ladder Scores or by emailing{" "}
            <a href="mailto:fscladder@gmail.com" className="rules-email-link">
              fscladder@gmail.com
            </a>{" "}
            before Sunday 5pm.
          </li>
          <li>
            If you win your game, it is squash etiquette that you offer to buy your
            opponent a drink. Juniors cannot buy alcoholic beverages for senior
            players.
          </li>
          <li>
            <strong className="warning-text">
              You are required to mark/referee a game on the night regardless of
              your ability level.
            </strong>{" "}
            This will usually be the game directly after you&apos;ve played (on the
            court you&apos;ve come off). Failure to do so may see you stood down for TWO
            (2) weeks.
          </li>
          <li className="conduct-text">
            The Squash Auckland Code of Conduct applies during all ladder games - a
            copy of which can be found on the notice board downstairs. Bad
            behaviour and poor sportsmanship will not be tolerated at our club -
            any incidence reported to the Ladder Controller or Committee will
            result in further action being taken, with the alleged incident being
            investigated and possibly resulting in official warnings, enforced
            stand-down periods or full expulsion from the ladder - as the committee
            see fit.
          </li>
        </ul>
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
