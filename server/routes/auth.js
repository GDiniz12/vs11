const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { computeRatingDelta, MAX_MATCHES } = require('../lib/rating');

const router = express.Router();
const SALT_ROUNDS = 10;

// Lightweight in-memory rate limiter (no external dependency). Throttles
// brute-force / spam against the auth endpoints per client IP.
function rateLimit({ windowMs, max, message }) {
  const hits = new Map(); // ip -> { count, resetAt }
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      return res.status(429).json({ code: 'rate_limited', message: message || 'Muitas tentativas. Tente novamente em instantes.' });
    }
    next();
  };
}

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ code: 'missing_fields', message: 'Nickname e senha são obrigatórios.' });
  }
  if (nickname.trim().length < 3) {
    return res.status(400).json({ code: 'nickname_too_short', message: 'Nickname deve ter no mínimo 3 caracteres.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ code: 'password_too_short', message: 'Senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(nickname) = LOWER($1)', [nickname.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ code: 'nickname_taken', message: 'Esse nickname já está em uso.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (nickname, password_hash) VALUES ($1, $2) RETURNING id, nickname, rating',
      [nickname.trim(), passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user.id, nickname: user.nickname, rating: user.rating } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ code: 'server_error', message: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ code: 'missing_fields', message: 'Nickname e senha são obrigatórios.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(nickname) = LOWER($1)', [nickname.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ code: 'invalid_credentials', message: 'Nickname ou senha incorretos.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ code: 'invalid_credentials', message: 'Nickname ou senha incorretos.' });
    }

    const token = jwt.sign({ id: user.id, nickname: user.nickname }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user.id, nickname: user.nickname, rating: user.rating } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ code: 'server_error', message: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nickname, rating FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/matches
router.post('/matches', verifyToken, async (req, res) => {
  const { opponent, goals_for, goals_against, result, tournament_type } = req.body;

  if (!opponent || goals_for == null || goals_against == null || !result) {
    return res.status(400).json({ message: 'Dados incompletos.' });
  }
  if (!['win', 'loss', 'draw'].includes(result)) {
    return res.status(400).json({ message: 'Resultado inválido.' });
  }

  try {
    // Delete oldest match if user already has 10
    const countResult = await pool.query('SELECT COUNT(*) FROM matches WHERE user_id = $1', [req.user.id]);
    if (parseInt(countResult.rows[0].count) >= 10) {
      await pool.query(
        'DELETE FROM matches WHERE id = (SELECT id FROM matches WHERE user_id = $1 ORDER BY played_at ASC LIMIT 1)',
        [req.user.id]
      );
    }

    const insertResult = await pool.query(
      'INSERT INTO matches (user_id, opponent, goals_for, goals_against, result, tournament_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, opponent, goals_for, goals_against, result, tournament_type || null]
    );

    res.status(201).json({ match: insertResult.rows[0] });
  } catch (err) {
    console.error('Save match error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/matches
router.get('/matches', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM matches WHERE user_id = $1 ORDER BY played_at DESC',
      [req.user.id]
    );
    res.json({ matches: result.rows });
  } catch (err) {
    console.error('Get matches error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// PATCH /api/auth/rating
// Receives the match OUTCOME (not a delta) plus a stable gameId. The server
// computes the rating change itself (SEC1) and applies it at most once per
// gameId (N2 — refreshing /result can't farm rating).
router.patch('/rating', verifyToken, async (req, res) => {
  const { gameId, wins, draws, losses, isOnline, difficulty, isHardcore, isChampion } = req.body;

  if (typeof gameId !== 'string' || gameId.trim().length === 0) {
    return res.status(400).json({ message: 'gameId obrigatório.' });
  }
  const ints = [wins, draws, losses];
  if (ints.some((n) => !Number.isInteger(n) || n < 0)) {
    return res.status(400).json({ message: 'Estatísticas inválidas.' });
  }
  if (wins + draws + losses > MAX_MATCHES) {
    return res.status(400).json({ message: 'Número de partidas implausível.' });
  }
  if (difficulty != null && !['easy', 'medium', 'impossible'].includes(difficulty)) {
    return res.status(400).json({ message: 'Dificuldade inválida.' });
  }

  const delta = computeRatingDelta({
    wins, draws, losses,
    isOnline: !!isOnline,
    difficulty: difficulty || 'medium',
    isHardcore: !!isHardcore,
    isChampion: !!isChampion,
  });

  try {
    // Idempotency guard: succeeds only the first time this gameId is seen.
    const claim = await pool.query(
      'INSERT INTO rating_events (user_id, game_id, delta) VALUES ($1, $2, $3) ON CONFLICT (user_id, game_id) DO NOTHING RETURNING id',
      [req.user.id, gameId.trim(), delta]
    );

    if (claim.rows.length === 0) {
      const current = await pool.query('SELECT id, nickname, rating FROM users WHERE id = $1', [req.user.id]);
      return res.json({ user: current.rows[0], duplicate: true });
    }

    const result = await pool.query(
      'UPDATE users SET rating = GREATEST(0, rating + $1) WHERE id = $2 RETURNING id, nickname, rating',
      [delta, req.user.id]
    );
    res.json({ user: result.rows[0], delta });
  } catch (err) {
    console.error('Rating update error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// GET /api/auth/hall-da-fama
router.get('/hall-da-fama', async (_req, res) => {
  try {
    // id ASC as a deterministic tie-break so equal-rating players keep a
    // stable order instead of an arbitrary one (N6).
    const result = await pool.query(
      'SELECT nickname, rating FROM users ORDER BY rating DESC, id ASC LIMIT 10'
    );
    res.json({ ranking: result.rows });
  } catch (err) {
    console.error('Hall da fama error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

module.exports = router;
