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

-- Records each ranked game whose rating has been applied, so the same game
-- can never be counted twice (idempotency: e.g. a page refresh on /result).
CREATE TABLE IF NOT EXISTS rating_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);
