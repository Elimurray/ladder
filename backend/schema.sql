CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_member BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ladder_positions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, withdrawn, no_play
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  week_date DATE NOT NULL,
  player_id INTEGER REFERENCES users(id),
  games_won INTEGER NOT NULL,
  games_lost INTEGER NOT NULL,
  match_score VARCHAR(50),
  submitted_at TIMESTAMP DEFAULT NOW(),
  admin_approved BOOLEAN DEFAULT false
);