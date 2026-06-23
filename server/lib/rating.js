// Server-authoritative rating formula. Kept in sync with the client's
// calcRating (frontend/src/app/result/page.tsx) so the UI can preview the
// gain, but the value the DB trusts is the one computed HERE — the client
// never gets to choose its own delta.

const MAX_MATCHES = 60; // sanity cap (Brasileirão = 38, the longest mode)

function computeRatingDelta({ wins, draws, losses, isOnline, difficulty, isHardcore, isChampion }) {
  let winPts, drawPts, lossPts;
  if (isOnline) {
    winPts = 100; drawPts = 30; lossPts = -50;
  } else if (difficulty === 'easy') {
    winPts = 15; drawPts = 3; lossPts = -7;
  } else if (difficulty === 'impossible') {
    winPts = 60; drawPts = 10; lossPts = -30;
  } else {
    winPts = 30; drawPts = 5; lossPts = -15;
  }
  const raw = wins * winPts + draws * drawPts + losses * lossPts;
  const base = isHardcore ? Math.round(raw * 1.35) : raw;
  return isChampion ? base * 2 : base;
}

module.exports = { computeRatingDelta, MAX_MATCHES };
