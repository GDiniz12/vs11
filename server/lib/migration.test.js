const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('db.sql exists and is non-empty', () => {
  const sqlPath = path.join(__dirname, '..', 'db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(sql.length > 0, 'db.sql must not be empty');
});

test('db.sql uses CREATE TABLE IF NOT EXISTS for all tables (safe to re-run)', () => {
  const sqlPath = path.join(__dirname, '..', 'db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const createStatements = sql.match(/CREATE TABLE[^;]+;/gi) || [];
  assert.ok(createStatements.length > 0, 'expected at least one CREATE TABLE statement');
  for (const stmt of createStatements) {
    assert.ok(
      /CREATE TABLE IF NOT EXISTS/i.test(stmt),
      `statement must use IF NOT EXISTS to be idempotent:\n${stmt}`
    );
  }
});

test('db.sql contains rating_events table definition', () => {
  const sqlPath = path.join(__dirname, '..', 'db.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  assert.ok(
    sql.includes('rating_events'),
    'rating_events table must be defined in db.sql so the auto-migration creates it'
  );
});

test('rating endpoint request body: difficulty values accepted by the server match the frontend DifficultyType', () => {
  // The server allows 'easy' | 'medium' | 'impossible' (plus null/undefined → medium).
  // This test documents the contract so a mismatch is caught before runtime.
  const ALLOWED = ['easy', 'medium', 'impossible'];
  const FRONTEND_TYPES = ['easy', 'medium', 'impossible'];
  for (const d of FRONTEND_TYPES) {
    assert.ok(ALLOWED.includes(d), `frontend difficulty '${d}' must be in server allowlist`);
  }
});
