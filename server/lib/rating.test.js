const { test } = require('node:test');
const assert = require('node:assert');
const { computeRatingDelta } = require('./rating');

test('offline medium: win/draw/loss point values', () => {
  assert.strictEqual(
    computeRatingDelta({ wins: 1, draws: 0, losses: 0, difficulty: 'medium' }), 30);
  assert.strictEqual(
    computeRatingDelta({ wins: 0, draws: 1, losses: 0, difficulty: 'medium' }), 5);
  assert.strictEqual(
    computeRatingDelta({ wins: 0, draws: 0, losses: 1, difficulty: 'medium' }), -15);
});

test('difficulty scales the values', () => {
  assert.strictEqual(computeRatingDelta({ wins: 1, draws: 0, losses: 0, difficulty: 'easy' }), 15);
  assert.strictEqual(computeRatingDelta({ wins: 1, draws: 0, losses: 0, difficulty: 'impossible' }), 60);
});

test('online uses the online point table regardless of difficulty', () => {
  assert.strictEqual(
    computeRatingDelta({ wins: 1, draws: 1, losses: 1, isOnline: true, difficulty: 'easy' }),
    100 + 30 - 50);
});

test('hardcore multiplies the base by 1.35 (rounded)', () => {
  // raw = 100, *1.35 = 135
  assert.strictEqual(
    computeRatingDelta({ wins: 1, draws: 0, losses: 0, isOnline: true, isHardcore: true }), 135);
});

test('champion doubles the (post-hardcore) total', () => {
  assert.strictEqual(
    computeRatingDelta({ wins: 1, draws: 0, losses: 0, difficulty: 'medium', isChampion: true }), 60);
  // hardcore + champion: round(30*1.35)=41, *2 = 82
  assert.strictEqual(
    computeRatingDelta({ wins: 1, draws: 0, losses: 0, difficulty: 'medium', isHardcore: true, isChampion: true }), 82);
});

test('a full losing campaign yields a negative delta', () => {
  assert.ok(computeRatingDelta({ wins: 0, draws: 0, losses: 7, difficulty: 'medium' }) < 0);
});
