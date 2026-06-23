# Application Tasks & Issue Tracker

## 🤖 General Rules & Guidelines for Claude Code
- **Implement Tests:** You must implement tests to verify your fixes and new features. You have the autonomy to choose and configure the appropriate testing libraries (e.g., Jest, React Testing Library, Cypress, Supertest) for both the `frontend` and the `server`. Test everything you touch.
- **Commit Protocol:** Make granular, well-described commits immediately after a fix/feature is fully tested and verified.

---

## ✅ Completed Tasks

- [x] **Super Mundial de Clubes Pool Bug:** National teams excluded from `startLeaguePhase` in `GameContext.tsx` — fixed with mode-aware pool selection.
- [x] **Position Refactor:** Removed `SA`, `LIB`, `ALA` positions; reassigned to `CA/MEI`, `ZAG`, `MD/ME`.
- [x] **Remove Reload Warning:** `beforeunload` listener removed.
- [x] **World Cup UI Consistency:** Copa-group routing + knockout title fix for Copa do Mundo mode.
- [x] **World Cup Bracket Authenticity:** Cross-matching rules implemented for Round of 16.
- [x] **Brasileirão Final Screen:** "Ver Resultados" button added.
- [x] **Unranked Points Leak:** Rating submission and display gated behind `isRanked`.
- [x] **Doubled Statistics Bug:** Duplicate `startKnockoutPhase` calls eliminated.
- [x] **Logo URLs:** Fluminense, Botafogo, Athletico PR logos updated in `data.ts`.
- [x] **Super Mundial League Pool:** `startLeaguePhase` fixed to exclude national teams for Super Mundial.

---

## 📋 Open Issues (Audit Findings — 2026-06-19)

---

### 🔴 BUGS

#### ✅ B1 — `tournament/page.tsx:101` — Title hardcoded for one mode
**File:** `frontend/src/app/tournament/page.tsx`
**Line:** 101
**Problem:** `const title = lang === "pt" ? "SUPER MUNDIAL DE CLUBES" : "SUPER CLUB WORLD CUP"` — this page is also used for **Louco** mode but always shows Super Mundial title.
**Fix:** Add `tournamentMode` from `useGame()` and compute the title like `knockout/page.tsx` does (handle `"louco"` → `"MODO LOUCOS"` / `"CRAZY MODE"`).

---

#### ✅ B2 — `draft/page.tsx:41` — National teams in Super Mundial rolling animation
**File:** `frontend/src/app/draft/page.tsx`
**Line:** 38-42
**Problem:** The `allTeams` useMemo fallthrough case (`return getAllTeams(americans, europeans, nationalTeams)`) runs for both `super-mundial` AND `louco`. In super-mundial, national teams should be excluded from the slot-machine animation (they briefly flash national team names even though they can never be drafted in that mode). In louco, all teams should be included — which is correct.
**Fix:**
```typescript
const allTeams = useMemo(() => {
  if (tournamentMode === 'copa-do-mundo') return getAllTeams({} as any, {} as any, nationalTeams);
  if (tournamentMode === 'brasileirao') return getBrazilianTeams(americans);
  if (tournamentMode === 'super-mundial') return getAllTeams(americans, europeans); // clubs only
  return getAllTeams(americans, europeans, nationalTeams); // louco: everything
}, [tournamentMode]);
```

---

#### ✅ B3 — `simulation.ts:98` — Stale position codes in `calculateSectorStrengths`
**File:** `frontend/src/utils/simulation.ts`
**Line:** 98
**Problem:** `if (["PE", "PD", "CA", "SA", "ATA"].includes(pos))` — `"SA"` and `"ATA"` were removed in the position refactor but are still listed here. Dead code; no functional impact currently since no players have those codes, but should be cleaned up.
**Fix:** Remove `"SA"` and `"ATA"` from the array.

---

#### ✅ B4 — Brasileirão champion → result page shows "CAMPANHA ENCERRADA"
**Files:** `frontend/src/context/GameContext.tsx`, `frontend/src/app/result/page.tsx`
**Problem:** `isChampion` is only set to `true` inside `startKnockoutPhase`. For Brasileirão, there is no knockout phase — the result is determined by final standings position. So when a Brasileirão champion navigates to `/result`, `isChampion` is `false` and the page renders the red "CAMPANHA ENCERRADA" banner instead of a champion banner.
**Fix Options:**
- Option A: In `GameContext.tsx`, when `tournamentMode === 'brasileirao'`, derive `isChampion` from the final standings (`brasilRounds[last].standingsAfterRound[0].isUser`).
- Option B: In `result/page.tsx`, compute an effective `isChampion` that checks Brasileirão standings for that mode.
Option A is cleaner — add a `setBrasileiraoChampion` call inside `startBrasileirao` or when the user navigates from `/brasileirao` to `/result`.

---

#### ✅ B5 — `copa-group/page.tsx:274,287` — Ordinal suffix logic broken for non-1st/2nd positions
**File:** `frontend/src/app/copa-group/page.tsx`
**Lines:** 274, 287
**Problem:** 
- Qualified banner (line 274): `${userPosition === 0 ? "ST" : "ND"}` — 3rd place would show "3ND" instead of "3RD"; 4th would show "4ND".
- Eliminated banner (line 287): `${userPosition === 2 ? "RD" : "TH"}` — 1st place would show "1TH", 2nd would show "2TH".
These two branches contradict each other and neither is correct beyond the first two positions.
**Fix:** Use a proper ordinal helper:
```typescript
function ordinal(n: number) {
  if (n === 1) return "ST"; if (n === 2) return "ND"; if (n === 3) return "RD"; return "TH";
}
```
Then use `${userPosition + 1}${ordinal(userPosition + 1)}` in both banners.

---

#### ✅ B6 — `tournament.ts` — `generateOnlineTradicional` missing manager bonus in `simulateMatch` calls
**File:** `frontend/src/utils/tournament.ts`
**Problem:** The `simulateMatch` function signature in `tournament.ts` takes `homeManagerBonus` and `awayManagerBonus` as the last two parameters. The `generateOnlineTradicional` function omits these when calling `simulateMatch`, so all online Tradicional matches ignore manager bonuses entirely. This makes managers have zero effect in online mode.
**Fix:** Pass the correct `managerBonus` values when calling `simulateMatch` inside `generateOnlineTradicional`.

---

#### B7 — `draft/page.tsx` — World Cup draft skips last 2 player picks
**Status:** Root cause not yet identified.
**Problem:** In Copa do Mundo mode, the draft sequence jumps to manager selection before all 11 player slots are filled (skips the last 2 picks).
**Likely cause:** `drawNextTeam()` for Copa do Mundo only includes national team players. If a drawn team has fewer than 11 selectable players for the remaining slots (due to position overlap), the "free reroll" fires automatically and may incorrectly skip rounds. Investigate `drawNextTeam` logic and the condition `if (!currentDraftTeam && draftRound < 11)` in `draft/page.tsx:74`.

---

### 🟡 TRANSLATION GAPS

All items below are text visible to the user that is hardcoded in Portuguese without EN equivalents, violating the project's PT/EN requirement from CLAUDE.md.

#### ✅ T1 — `tournament/page.tsx:127` — Simulation mode toggle button
**Current:** `"Trocar para Simulação {X}"` (PT only)
**Fix:** Add lang check: `lang === "pt" ? "Trocar para Simulação X" : "Switch to X Simulation"`

---

#### ✅ T2 — `knockout/page.tsx:229` — Simulation mode toggle button
Same issue as T1. Both tournament and knockout pages have this identical PT-only button.
**Fix:** Same lang check pattern.

---

#### ✅ T3 — `draft/page.tsx:298` — Chemistry info button label
**Current:** `"COMO FUNCIONA O ENTROSAMENTO?"` (hardcoded PT)
**Fix:** Add to `tDraft` translation object: `chemBtn: "COMO FUNCIONA O ENTROSAMENTO?"` / `"HOW DOES CHEMISTRY WORK?"`

---

#### ✅ T4 — `draft/page.tsx:343,345,349,369,373` — Online waiting UI strings
All strings in the post-draft online waiting panel are hardcoded Portuguese:
- Line 343: `"Mostrar Resultados"` → `"Show Results"`
- Line 345: `"Aguardando o host mostrar os resultados..."` → `"Waiting for host to show results..."`
- Line 349: `"Aguardando outros jogadores..."` → `"Waiting for other players..."`
- Line 369: `"Pronto"` → `"Ready"`
- Line 373: `"Montando..."` → `"Building..."`
**Fix:** Add these to `tDraft` translation object.

---

#### ✅ T5 — `draft/page.tsx:551,562` — Player position assignment banners
**Current:**
- `"ESCOLHA A POSIÇÃO NO CAMPO PARA {name}"` (PT only)
- `"TROCAR POSIÇÃO DE {name}"` (PT only)
- `"CANCELAR"` (×2)
**Fix:** Add to `tDraft`: `choosePos`, `swapPos`, `cancel` keys with EN equivalents.

---

#### ✅ T6 — `draft/page.tsx:592-631` — Chemistry modal (entirely PT)
The entire chemistry explanation modal is in Portuguese:
- Title: `"Como funciona o Entrosamento?"`
- 6 tier descriptions (Verde/Green, Amarelo/Yellow, Laranja/Orange, etc.)
- Manager bonus section title and description
- Close button: `"Entendi"` → `"Got it"`
**Fix:** Replace all modal content with lang-aware strings. Either use `tDraft` or a local `tChem` object.

---

#### ✅ T7 — `draft/page.tsx:533-543` — Sector strength labels
**Current:** `"ATA:"`, `"MEI:"` displayed as PT abbreviations regardless of lang.
**Fix:** Use lang-aware labels: EN → `"ATK:"`, `"MID:"`, `"DEF:"` / PT → `"ATA:"`, `"MEI:"`, `"DEF:"`.

---

#### ✅ T8 — `copa-group/page.tsx` — Multiple PT-only strings
- Line 38-39: `"GRUPO {name}"` → `lang === "pt" ? "GRUPO" : "GROUP"`, `"SEU GRUPO"` → `"YOUR GROUP"`
- Line 47: `"Seleção"` table header → `lang === "pt" ? "Seleção" : "Team"`
- Line 84: `"Resultados"` section label → `lang === "pt" ? "Resultados" : "Results"`
(Note: the simulation mode toggle button on line 209-212 is already correctly translated.)

---

#### T9 — `online/page.tsx` — Entire page is Portuguese only
The entire online lobby browser page uses hardcoded PT strings with no language switching:
- Page title, tab labels, input labels, room list, room mode badges, create form, ranked modal — all PT.
**Fix:** Add `useLanguage()` and translate all visible text. This is a large but important fix since this is a core user-facing page.

---

#### T10 — `lobby/[id]/page.tsx` — Entire page is Portuguese only
Same issue as T9. All lobby UI text is hardcoded PT:
- "Conectando ao servidor...", "Entrar na Sala", "Carregando Sala...", "Chat Global", "Jogadores na Sala", "Iniciar Jogo", "Cancelar", "Sair", "Aguardando Host...", etc.
- All `alert()` messages (lines 62, 68, 113, 145) are PT strings.
- Kick confirmation modal text is all PT.
**Fix:** Add `useLanguage()` and translate. Also consider replacing `alert()` calls with inline error/toast notifications.

---

### 🔵 UX / QUALITY IMPROVEMENTS

#### U1 — `online/page.tsx` & `lobby/[id]/page.tsx` — `alert()` and `confirm()` dialogs
**Problem:** Several flows use browser `alert()` and `confirm()` for critical feedback (kick, cancel room, nickname validation, join errors). These are intrusive, can be blocked by browsers, and are language-unaware.
**Fix:** Replace with inline error messages, styled modals (the kick modal pattern already exists and is well-designed — extend it to other confirmations), or a toast notification system.

---

#### U2 — `copa-group/page.tsx` — Group table column headers not user-friendly
The group table uses football stat abbreviations (`J`, `V`, `E`, `D`, `SG`, `Pts`) which are Portuguese abbreviations. EN users may not know `V` = Wins, `E` = Draws, `D` = Losses, `SG` = Goal Difference.
**Fix:** For EN lang, use `GP` (games played), `W`, `D`, `L`, `GD`, `Pts` — or add tooltips showing the full label on hover.

---

#### U3 — `tournament/page.tsx` — "Qualified (Top 16)" label in TRANSLATIONS is hardcoded number
The `qualified_label` translation key says "Qualified (Top 16)" but this label also appears in the copa-group flow. In Copa do Mundo, only the top 2 per group qualify — a different threshold. This may cause a confusing mismatch if the label is ever reused across modes.
**Status:** Low priority since copa-group has its own qualification display. Monitor for reuse.

---

#### ✅ U4 — `result/page.tsx` — Brasileirão champion badge text
**Problem:** The result page `championBadge` translation is `"🏆 CAMPEÃO DO MUNDO!"` / `"🏆 WORLD CHAMPION!"`. For Brasileirão champions this is wrong — they're not world champion. Should show `"🏆 CAMPEÃO BRASILEIRO!"` / `"🏆 BRAZILIAN CHAMPION!"` for Brasileirão mode.
**Fix:** Make `championBadge` text mode-aware (same pattern as `tournamentTitle` already done on that page).

---

#### U5 — `online/page.tsx` — Difficulty selector hidden for Guerra mode but could be shown for Louco/Copa
Currently, the difficulty selector only shows when `mode === "tradicional"`. In `generateOnlineGuerra`, difficulty is irrelevant (pure PvP bracket). But for online Copa do Mundo and Brasileirão in Tradicional mode, difficulty IS passed through correctly. No bug, but worth confirming that `generateOnlineTradicional` handles Copa/Brasileirão AI team pools correctly (it receives `allTeams` which is computed mode-aware in draft/page.tsx).

---

#### U6 — `lobby/[id]/page.tsx` — Chat "Send" button is PT-only
Line 378: Button label `"Enviar"` hardcoded PT. Minor but inconsistent.
**Fix:** Translate with `useLanguage()`.

---

### 🟣 ARCHITECTURE / TECHNICAL DEBT

#### A1 — `simulation.ts` — `simulateMatch` function appears unused
The `simulateMatch` export in `simulation.ts` (simple Poisson implementation) is not called anywhere — `tournament.ts` has its own internal `simulateMatch` with sector-based calculation. Confirm and remove if unused to avoid confusion.

---

#### A2 — `constants.ts` — TRANSLATIONS object incomplete
Many pages bypass `TRANSLATIONS` entirely and use inline `lang === "pt" ? "..." : "..."` ternaries. This creates two translation patterns in the same codebase, making it hard to audit coverage. Long-term: consolidate all user-facing strings into `TRANSLATIONS` or a dedicated i18n file.

---

#### ✅ A3 — `draft/page.tsx:164` — TODO comment left in production code
Line 164: `// [TODO O RESTANTE DO CÓDIGO PERMANECE IDENTICO]` — this appears to be a leftover refactoring comment. Remove it.

---

#### A4 — `GameContext.tsx` — `startLeaguePhase` copa-do-mundo routing
When `tournamentMode === 'copa-do-mundo'` and the user somehow reaches `/tournament` (e.g., after a browser refresh that restores `phase === "league"`), `startLeaguePhase` runs instead of the Copa group stage, generating an incorrect tournament. The draft page correctly routes Copa do Mundo to `/copa-group`, but the `tournament/page.tsx` doesn't guard against this. Low priority since normal flow prevents it, but worth adding a redirect guard.

---

## 🗓️ Priority Suggestion

| Priority | Issues |
|----------|--------|
| **High (bugs)** | B4 (Brasileirão champion), B2 (draft animation), B7 (World Cup draft skip), B5 (ordinal suffix), B6 (online manager bonus) |
| **Medium (translation)** | T9 (online page), T10 (lobby page), T6 (chemistry modal), T4 (online waiting UI), T5 (position banners) |
| **Low (UX/debt)** | U1 (alerts), U4 (champion badge text), T1/T2/T3/T7/T8 (smaller strings), B3 (stale positions), A1/A2/A3/A4 |

---
---

## 📋 Open Issues (Audit Findings — 2026-06-23)

> Second audit, run after the auth system (Postgres + JWT + bcrypt), the Hall da
> Fama ranking, and the **online Brasileirão / Copa do Mundo** generators were
> added. Findings are grouped: **build-blocking → security → bugs → UX → debt.**
> The "🔴 SEC" group is the most important — the ranking system is currently
> trivially exploitable.

---

### ⛔ BUILD-BLOCKING

#### N0 — `GameContext.tsx:341` — `as const` applied to an expression (TS compile error)
**File:** `frontend/src/context/GameContext.tsx`
**Line:** 341
**Problem:** `tournamentMode: (data.tournamentMode || 'super-mundial') as const` — `as const` can only be applied to a literal, not to a `||` expression. `tsc --noEmit` fails with:
`TS1355: A 'const' assertions can only be applied to references to enum members, or string, number, boolean, array, or object literals.`
This is in **uncommitted** code and will break `npm run build`.
**Fix:** Cast the type instead of using `as const`, e.g.
`tournamentMode: (data.tournamentMode || 'super-mundial') as TournamentMode,`
(or annotate the variable above and assign it). Confirm `TournamentMode` is imported/exported from `types`.

---

### 🔴 SECURITY (server — ranking is exploitable)

#### SEC1 — `routes/auth.js:146` — Client controls rating `delta` (ranking forgery) 🔥
**File:** `server/routes/auth.js` (`PATCH /api/auth/rating`) + `frontend/src/app/result/page.tsx:62-76`
**Problem:** The rating gain is computed **entirely on the client** (`calcRating` in `result/page.tsx`) and sent as `{ delta }`. The server applies it verbatim: `UPDATE users SET rating = GREATEST(0, rating + $1)`. Any authenticated user can `curl` the endpoint with `{ "delta": 999999 }` and instantly top the Hall da Fama. There is no server-side notion of what actually happened in the match.
**Fix:** The server must compute the delta itself. Send the *match facts* (result, difficulty, isRanked, isChampion, isHardcore, online?) to `POST /api/auth/matches`, validate them, and derive the rating change server-side using the same formula `calcRating` uses today. Remove the client-supplied `delta` path entirely (or restrict it). Even then it is forgeable (see SEC2), but it closes the trivial "set my own number" hole.

---

#### SEC2 — `routes/auth.js:99` — Match results are fully client-supplied
**File:** `server/routes/auth.js` (`POST /api/auth/matches`)
**Problem:** `goals_for`, `goals_against`, `result`, `opponent` all come from the client with no cross-check against an authoritative simulation. A user can POST a fabricated 38-win Brasileirão. For **online** ranked games this matters most: the host already runs the simulation (`generateOnline*` in `tournament.ts`) and emits results to everyone — that result set is the only trustworthy record, and it never reaches the server.
**Fix (online ranked):** Have the **host** (or, better, the server) be the source of truth. Either move `generateOnline*` to the server, or have the host POST the canonical per-player results which the server then validates/attributes by socket identity. Offline ranked games are inherently unverifiable client-side — consider marking offline rating gains as provisional or capping them.

---

#### SEC3 — `server/index.js:71,104` — Lobby rating is client-supplied (`data.rating`)
**Problem:** `createRoom`/`joinRoom` store `rating: data.rating ?? null` straight from the client payload, and this is broadcast in the room and shown on lobby player cards (`feat: show player rating in lobby player cards`). A client can advertise any rating. Cosmetic today, but misleading in a ranked context.
**Fix:** Look up the authoritative rating from the DB using the player's auth token / user id at join time, rather than trusting the socket payload. This requires associating the socket with an authenticated user (see SEC6).

---

#### SEC4 — `routes/auth.js` — No rate limiting on `/login`, `/register`
**Problem:** No throttling on auth endpoints → brute-force of passwords and mass account/registration spam are possible. `bcrypt` cost 10 also makes unthrottled `/login` a cheap CPU-DoS vector.
**Fix:** Add `express-rate-limit` (or equivalent) on `/login` and `/register`, e.g. a few attempts/min/IP. Consider a minimum-strength password rule beyond the current 6-char minimum.

---

#### SEC5 — `db.js` / `routes/auth.js` — `JWT_SECRET` not validated at startup
**Problem:** If `JWT_SECRET` is undefined, `jwt.sign` throws at request time (500s) and, worse, a weak/empty secret silently produces forgeable tokens. There is no startup assertion that required env vars (`JWT_SECRET`, `DATABASE_URL`) exist.
**Fix:** Validate required env vars on boot and exit with a clear message if missing. Document them in CLAUDE.md's "Environment Variables" section (currently only `PORT`/`FRONTEND_URL` are listed — the auth system added `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`).

---

#### SEC6 — `server/index.js` — Socket connections are unauthenticated
**Problem:** The Socket.IO layer trusts whatever `nickname`/`rating` the client sends; it is not tied to a JWT-verified user. Combined with SEC3, a player can impersonate another's nickname/rating in lobbies (the in-room duplicate-nickname check is only per-room and case-insensitive, not identity-based).
**Fix:** Pass the JWT in the socket handshake (`io.use` middleware), verify it, and derive `nickname`/`rating`/`userId` server-side. Lower priority than SEC1/SEC2 but underpins a trustworthy ranked mode.

---

### 🔴 BUGS

#### N1 — `tournament.ts:998` — Online Copa do Mundo R16 pairs same-group teams
**File:** `frontend/src/utils/tournament.ts` (`generateOnlineCopa`, **uncommitted**)
**Problem:** `qualifiedTeams` is built group-by-group as `[A1, A2, B1, B2, …]`, then the knockout pairs `remaining[i]` vs `remaining[i+1]` → **A1 plays A2 in the Round of 16**, B1 vs B2, etc. That is not a valid World Cup bracket — group winners and runners-up should cross (A1 vs B2, …). The **offline** path already does this correctly in `GameContext.tsx:530-539` ("authentic FIFA cross-matching"). The online generator is inconsistent and wrong.
**Fix:** Apply the same reorder used offline before seeding the bracket:
```
[A1,B2, C1,D2, E1,F2, G1,H2, B1,A2, D1,C2, F1,E2, H1,G2]
```
i.e. reorder `qualifiedTeams` (indices `0,3,4,7,8,11,12,15, 2,1,6,5,10,9,14,13`) before the knockout loop in `generateOnlineCopa`.

---

#### N2 — `result/page.tsx:49,62-76` — Rating re-awarded on page refresh
**File:** `frontend/src/app/result/page.tsx`
**Problem:** Duplicate-submission guard is `ratingSubmitted = useRef(false)`, which resets to `false` on every mount. Game state (`stats`, `isChampion`, `isRanked`) is persisted to `localStorage` by `GameContext` and restored on refresh. So **reloading `/result` re-runs the effect and PATCHes the rating delta again** — repeatedly. A user can farm rating by spamming refresh on a winning result. (Compounds SEC1.)
**Fix:** Persist a "rating already submitted for this game" flag (e.g. a per-game id in `localStorage`, or clear the ranked stats after submission). Ideally moot once the server computes deltas idempotently per match record (SEC1/SEC2).

---

#### N3 — `tournament.ts:703` — Offline knockout `simulateMatch` omits manager bonuses
**File:** `frontend/src/utils/tournament.ts` (`generateKnockoutRounds`, line ~703)
**Problem:** This `simulateMatch(...)` call stops at `...t2.players` and does **not** pass `homeManagerBonus`/`awayManagerBonus`. So managers have zero effect in the offline knockout stage (they *do* count in the league/group `simulateMatch` calls, e.g. line 659, which pass the bonuses). This is the same class of bug as the already-fixed B6 (online Tradicional), but in the offline knockout path it is still present.
**Fix:** Pass `t1.managerBonus ?? 0, t2.managerBonus ?? 0` as the final two args, matching the group-stage calls.

---

#### N4 — B7 (World Cup draft skip) — still open from the 2026-06-19 audit
Carried forward; root cause not yet identified. See B7 above. With the new online Copa generator now live, this offline draft bug becomes more visible — worth prioritizing.

---

### 🔵 UX / QUALITY

#### N5 — `result/page.tsx` — Silent failure on rating submission
The `fetch(...).catch(() => {})` swallows all errors. If the server is down or the token expired, the user's rating silently isn't recorded with no feedback. Surface a small inline "couldn't save result" notice (lang-aware) and/or retry.

#### N6 — Hall da Fama has no tie-break / pagination and shows raw rating only
`GET /api/auth/hall-da-fama` orders by `rating DESC LIMIT 10` with no secondary sort (ties are arbitrary) and exposes only nickname+rating. Consider a deterministic tie-break (e.g. `id ASC`) and showing games-played so a 1-win 100-rating account doesn't outrank a proven player. Tie into a min-games-played gate for ranking eligibility.

#### N7 — Auth error messages are PT-only (server-originated)
All `routes/auth.js` messages ("Nickname e senha são obrigatórios.", etc.) are Portuguese and shown verbatim in the EN UI (`login`/`register` pages render `data.message`). This re-introduces the PT/EN gap the project rule forbids, but server-side. **Fix:** Return stable error *codes* from the server and translate on the client, or send both languages.

---

### 🟣 ARCHITECTURE / TECHNICAL DEBT

#### N8 — No test suite exists, despite the TASKS.md testing rule
The top-of-file rule says "implement tests to verify your fixes," but there is **no test infrastructure** in either `frontend/` or `server/` (server `npm test` is the default `exit 1` stub). The simulation/tournament logic (`simulation.ts`, `tournament.ts`) and the rating formula (`calcRating`) are pure functions — ideal, high-value unit-test targets. **Recommendation:** add Vitest/Jest to `frontend`, Jest/node:test + Supertest to `server`; start by pinning `calcRating`, `generateOnline*` standings math, and the auth endpoints.

#### N9 — `server/index.js` — Rooms are in-memory only (no persistence, single-instance)
All room/lobby state lives in the `rooms` object. A server restart or a second instance (horizontal scaling behind a load balancer) drops/splits all rooms, and Socket.IO has no shared adapter (e.g. Redis). Fine for a single small instance; a blocker for scaling. Document the constraint and, if scaling is planned, add the `@socket.io/redis-adapter`.

#### N10 — Duplicated simulation glue between offline and online generators
`generateOnlineBrasileirao`, `generateOnlineCopa`, `generateCopaGroups`, and `generateKnockoutRounds` each re-implement near-identical standings-update closures, bot-mapping, and bracket loops (and N1/N3 show they've already drifted apart). Extract shared helpers (`makeStandingsRow`, `updateStandings`, `seedWorldCupBracket`, `mapHumansAndBots`) so offline and online stay in lock-step. This is the root cause behind N1 (cross-seed missing online) and N3 (manager bonus missing offline).

#### N11 — `tournament.ts` missing trailing newline / file hygiene
The uncommitted `generateOnlineCopa` ends with `\ No newline at end of file`. Minor, but add the trailing newline to keep diffs clean.

---

## 🗓️ Priority Suggestion (2026-06-23 findings)

| Priority | Issues |
|----------|--------|
| **Blocker** | N0 (build fails — `as const`) |
| **Critical (security)** | SEC1 (client sets own rating), SEC2 (forged match results), N2 (refresh re-awards rating) |
| **High (bugs)** | N1 (online Copa same-group R16), N3 (offline knockout ignores managers), B7 (carry-over) |
| **Medium** | SEC3/SEC4/SEC5/SEC6 (lobby spoof, rate limit, env validation, socket auth), N7 (PT-only server errors) |
| **Low (UX/debt)** | N5, N6, N8 (tests), N9 (in-memory rooms), N10 (dedup generators), N11 |

---
---

## ✅ Resolution Log (implemented 2026-06-23, branch `audit-fixes-2026-06-23`)

Worked through the open backlog. Status of every open item below.

### Done

| Item | What was done | Commit theme |
|------|---------------|--------------|
| **N0** | Fixed `as const`-on-expression TS error in `GameContext` (build was broken) | online bug fixes |
| **N1** | Online Copa do Mundo now applies FIFA cross-matching in R16 (matches offline) | online bug fixes |
| **N3** | Online Tradicional knockout legs now pass manager bonuses (offline `generateKnockoutRounds` already did — original finding mislocated the line) | online bug fixes |
| **N11** | Trailing newline added to `tournament.ts` | online bug fixes |
| **SEC1** | Rating delta is now computed **server-side** from match-outcome facts; client no longer sends a raw `delta` | security |
| **N2** | Ranked rating applied at most once per stable `gameId` via new `rating_events` table (idempotent). Note: refresh was already partly mitigated because `GameContext` doesn't restore a `phase==='result'` save — server idempotency makes it robust regardless | security |
| **SEC4** | Dependency-free per-IP rate limiter on `/login` and `/register` | security |
| **SEC5** | Startup env validation (`JWT_SECRET`, `DATABASE_URL`) — fail fast | security |
| **SEC3** | Client-supplied lobby rating is sanitized/clamped server-side (display-only) | security (partial) |
| **N8** | Rating formula extracted to `server/lib/rating.js` with `node:test` coverage; `npm test` wired to `node --test` (server only) | security |
| **N7** | Auth endpoints return stable error `code`s; client maps them to PT/EN | i18n |
| **T9** | `online/page.tsx` fully translated (PT/EN dictionary) | i18n |
| **T10 / U6** | `lobby/[id]/page.tsx` fully translated incl. chat **Send** button + alerts | i18n |
| **A1** | Removed dead `simulateMatch` / `poissonRandom` from `simulation.ts` | cleanup |
| **A4** | `/tournament` redirect guard for copa-do-mundo / brasileirao | cleanup |
| **N5** | Ranked-result save failures now show a translated notice (+ allow retry) | ux |
| **N6** | Hall da Fama deterministic tie-break (`rating DESC, id ASC`) | ux |
| **U2** | Already resolved in a prior pass (copa-group headers are lang-aware) | — |

### Investigated — no change made

- **B7 (World Cup draft skip):** Conclusively **not reproducible in current code.** The suspected mechanism (auto free-reroll skipping picks) cannot occur: `drawNextTeam()` only sets `currentDraftTeam`/`currentDraftManagers` — it never advances `draftRound`, which increments solely on a real pick (`assignPlayerToSlot`) or manager pick. National-team squads each have 11 players covering all live position codes. Likely fixed by the earlier position refactor or originally misdiagnosed. **Recommend closing** unless it reproduces interactively (capture mode + formation + exact step).

### Deliberately deferred (larger / higher-risk than a backlog pass should change)

- **SEC2 (forged match results):** Full fix needs a server-authoritative simulation (move `generateOnline*` server-side or host-attestation). SEC1 + input bounds (`MAX_MATCHES`, integer/non-negative checks) close the trivial holes; the rest is a project, not a patch.
- **SEC6 (socket auth):** Binding sockets to a verified JWT requires recreating sockets on token change + async DB lookups in the handshake, touching the delicate mobile-reconnect path (untestable here). Foundational work; SEC3 sanitization is the safe interim step.
- **N9 (in-memory rooms / Redis adapter), N10 (dedup online vs offline generators), A2 (consolidate all strings into one i18n source), U1 (replace remaining `alert`/`confirm` with a toast system):** refactors/infra, not bugs. Alerts are at least translated now.
- **U3 / U5:** monitor-only, no code change required.

### Verification

- `npx tsc --noEmit` (frontend) — clean.
- `npm test` (server) — 6/6 pass (rating formula).
- `node --check` on all changed server files — clean.
- ⚠️ New DB table `rating_events` added to `server/db.sql` — **run the updated `db.sql` against the database** before deploying the rating endpoint.
