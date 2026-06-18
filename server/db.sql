CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent VARCHAR(100) NOT NULL,
  goals_for INTEGER NOT NULL,
  goals_against INTEGER NOT NULL,
  result VARCHAR(10) NOT NULL CHECK (result IN ('win', 'loss', 'draw')),
  tournament_type VARCHAR(50),
  played_at TIMESTAMP DEFAULT NOW()
);
