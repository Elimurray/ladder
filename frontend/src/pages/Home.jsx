function Home() {
  return (
    <div className="page">
      <h1>Welcome to the Ladder</h1>
      <p>Track your position, submit matches, and climb to the top!</p>

      <div className="home-cards">
        <div className="card">
          <h3>📊 View Ladder</h3>
          <p>See current standings and player positions</p>
        </div>
        <div className="card">
          <h3>🎮 Submit Match</h3>
          <p>Report your match results</p>
        </div>
        <div className="card">
          <h3>👤 Your Profile</h3>
          <p>Check your stats and history</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
