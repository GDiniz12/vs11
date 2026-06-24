import { describe, it, expect } from "vitest";
import { generateOnlineBrasileirao, generateOnlineCopa } from "./tournament";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makePlayer(name: string, overall: number, teamKey = "flamengo-2019") {
  return { name, overall, positions: ["CA"], nationality: "🇧🇷", teamKey, teamName: "Flamengo" };
}

function makeHumanTeam(nickname: string, overallAvg = 85) {
  const players = Array.from({ length: 11 }, (_, i) => makePlayer(`P${i}`, overallAvg));
  return { nickname, strength: overallAvg, chemistry: 80, tactic: "balanced", players, managerBonus: 0 };
}

function makeBotTeamData(name: string, overallAvg = 80) {
  const key = name.toLowerCase().replace(/\s/g, "-") + "-2000";
  const players = Array.from({ length: 11 }, (_, i) => makePlayer(`B${i}`, overallAvg, key));
  return { name, players };
}

// Provide 40 bot teams so the generators can slice down to whatever they need
const BOT_POOL = Array.from({ length: 40 }, (_, i) => makeBotTeamData(`Bot${i}`));

// ---------------------------------------------------------------------------
// generateOnlineBrasileirao
// ---------------------------------------------------------------------------

describe("generateOnlineBrasileirao", () => {
  it("generates exactly 38 rounds (19 home + 19 away)", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineBrasileirao(human, BOT_POOL, "medium");
    expect(result.brasilRounds).toHaveLength(38);
  });

  it("each round has exactly 10 matches", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineBrasileirao(human, BOT_POOL, "medium");
    for (const round of result.brasilRounds) {
      expect(round.allMatches).toHaveLength(10);
    }
  });

  it("standingsAfterRound entries do NOT include the players array (payload fix)", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineBrasileirao(human, BOT_POOL, "medium");
    for (const round of result.brasilRounds) {
      for (const entry of round.standingsAfterRound) {
        // players field must be absent — its inclusion was causing ~900 KB payloads
        // that silently exceeded Socket.IO's default 1 MB buffer limit
        expect(Object.prototype.hasOwnProperty.call(entry, "players")).toBe(false);
      }
    }
  });

  it("final table entries also have no players field", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineBrasileirao(human, BOT_POOL, "medium");
    for (const entry of result.table) {
      expect(Object.prototype.hasOwnProperty.call(entry, "players")).toBe(false);
    }
  });

  it("serialised payload stays under 5 MB", () => {
    const humans = Array.from({ length: 4 }, (_, i) => makeHumanTeam(`Player${i}`));
    const result = generateOnlineBrasileirao(humans, BOT_POOL, "medium");
    const bytes = JSON.stringify(result).length;
    expect(bytes).toBeLessThan(5 * 1024 * 1024);
  });

  it("playerMatches keys match human nicknames", () => {
    const nicks = ["Alice", "Bob"];
    const humans = nicks.map(makeHumanTeam);
    const result = generateOnlineBrasileirao(humans, BOT_POOL, "medium");
    for (const nick of nicks) {
      expect(result.playerMatches).toHaveProperty(nick);
      // Each human plays 38 matches (one per round)
      expect(result.playerMatches[nick]).toHaveLength(38);
    }
  });

  it("isUser is true for ALL humans in standings (host-side flag, must be remapped per-client)", () => {
    // This test documents the known behaviour: the host marks every non-bot as
    // isUser:true. setOnlineTournamentState must remap to t.name === nickname
    // so non-champion humans don't see themselves as champion.
    const humans = [makeHumanTeam("Alice"), makeHumanTeam("Bob")];
    const result = generateOnlineBrasileirao(humans, BOT_POOL, "medium");
    const lastRound = result.brasilRounds[result.brasilRounds.length - 1];
    const humanEntries = lastRound.standingsAfterRound.filter((t: any) => t.isUser);
    // Both humans are marked isUser — the page must NOT rely on this flag alone
    expect(humanEntries.length).toBe(2);
  });

  it("final table: table[0] is the champion (highest points)", () => {
    const humans = [makeHumanTeam("Alice"), makeHumanTeam("Bob")];
    const result = generateOnlineBrasileirao(humans, BOT_POOL, "medium");
    const winner = result.table[0];
    // Everyone else must have fewer or equal points
    for (const t of result.table.slice(1)) {
      expect(winner.points).toBeGreaterThanOrEqual(t.points);
    }
  });
});

// ---------------------------------------------------------------------------
// generateOnlineCopa — group stage correctness
// ---------------------------------------------------------------------------

describe("generateOnlineCopa", () => {
  it("generates 8 groups", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineCopa(human, BOT_POOL, "medium");
    expect(result.copaGroups).toHaveLength(8);
  });

  it("each group has exactly 4 teams", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineCopa(human, BOT_POOL, "medium");
    for (const g of result.copaGroups) {
      expect(g.teams).toHaveLength(4);
    }
  });

  it("each group has exactly 6 matches (C(4,2) = 6, not 8)", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineCopa(human, BOT_POOL, "medium");
    for (const g of result.copaGroups) {
      expect(g.matches).toHaveLength(6);
    }
  });

  it("user's group stage entry in playerMatches has exactly 3 matches", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineCopa(human, BOT_POOL, "medium");
    // playerMatches includes group + knockout, but the group portion is 3 matches
    const userAllMatches = result.playerMatches["Alice"];
    const userGroup = result.copaGroups.find(g => g.teams.some((t: any) => t.name === "Alice"));
    const userGroupMatches = (userGroup?.matches ?? []).filter(
      (m: any) => m.homeTeam === "Alice" || m.awayTeam === "Alice"
    );
    // Should be exactly 3 group stage matches (plays each of the other 3 group teams once)
    expect(userGroupMatches).toHaveLength(3);
    // The group portion is a strict subset of all player matches
    expect(userAllMatches.length).toBeGreaterThanOrEqual(userGroupMatches.length);
  });

  it("userGroupMatches derived from copaGroups does not include knockout matches", () => {
    const human = [makeHumanTeam("Alice")];
    const result = generateOnlineCopa(human, BOT_POOL, "medium");
    const userGroup = result.copaGroups.find((g: any) => g.teams.some((t: any) => t.name === "Alice"));
    const userGroupMatches = (userGroup?.matches ?? []).filter(
      (m: any) => m.homeTeam === "Alice" || m.awayTeam === "Alice"
    );
    const knockoutMatches = result.knockoutRounds.filter(
      (r: any) => r.leg1.homeTeam === "Alice" || r.leg1.awayTeam === "Alice"
    );
    // Group-derived matches must not overlap with knockout matches
    for (const gm of userGroupMatches) {
      const inKnockout = knockoutMatches.some(
        (r: any) => r.leg1.homeTeam === gm.homeTeam && r.leg1.awayTeam === gm.awayTeam
      );
      expect(inKnockout).toBe(false);
    }
  });
});
