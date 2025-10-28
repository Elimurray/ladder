import { useState } from "react";

function SubmitMatch() {
  const [formData, setFormData] = useState({
    gamesWon: "",
    gamesLost: "",
    matchScore: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Match submitted:", formData);
    // TODO: Connect to API
    alert("Match submitted! (Not yet connected to backend)");
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="page">
      <h1>Submit Match Result</h1>

      <form className="match-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Games Won:</label>
          <input
            type="number"
            name="gamesWon"
            min="0"
            max="3"
            value={formData.gamesWon}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Games Lost:</label>
          <input
            type="number"
            name="gamesLost"
            min="0"
            max="3"
            value={formData.gamesLost}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Match Score:</label>
          <input
            type="text"
            name="matchScore"
            placeholder="e.g., 3-1"
            value={formData.matchScore}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Submit Match
        </button>
      </form>
    </div>
  );
}

export default SubmitMatch;
