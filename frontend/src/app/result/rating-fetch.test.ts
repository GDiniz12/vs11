import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Simulate the rating fetch chain from result/page.tsx.
// We extract the observable outcomes (ratingError, ratingUpdated) without
// needing React so we can cover all three branches of the fixed logic:
//
//   1. Server returns !ok               → error shown, retry allowed
//   2. Server returns ok, JSON invalid  → silent (points already saved)
//   3. Server returns ok, JSON valid    → rating updated locally, no error
// ---------------------------------------------------------------------------

type Outcome = { ratingError: boolean; ratingUpdated: boolean; ratingReset: boolean };

async function simulateFetchChain(
  mockFetch: () => Promise<{ ok: boolean; json: () => Promise<any> }>
): Promise<Outcome> {
  let ratingError = false;
  let ratingUpdated = false;
  let ratingReset = false;

  try {
    const res = await mockFetch();
    if (!res.ok) {
      ratingError = true;
      ratingReset = true;
      return { ratingError, ratingUpdated, ratingReset };
    }
    // JSON parse failure must NOT propagate to the error banner
    const data = await res.json().catch(() => null);
    if (data?.user) ratingUpdated = true;
  } catch {
    ratingError = true;
    ratingReset = true;
  }

  return { ratingError, ratingUpdated, ratingReset };
}

describe("result page — rating fetch chain", () => {
  it("shows error and resets ratingSubmitted on non-200 response", async () => {
    const out = await simulateFetchChain(async () => ({
      ok: false,
      json: async () => ({ message: "Server error" }),
    }));
    expect(out.ratingError).toBe(true);
    expect(out.ratingReset).toBe(true);
    expect(out.ratingUpdated).toBe(false);
  });

  it("does NOT show error when server returns 200 but JSON is unparseable (false-error fix)", async () => {
    const out = await simulateFetchChain(async () => ({
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected end of JSON input"); },
    }));
    expect(out.ratingError).toBe(false);
    expect(out.ratingReset).toBe(false);
    expect(out.ratingUpdated).toBe(false); // can't update locally, but points are saved server-side
  });

  it("updates rating locally when server returns 200 with valid JSON", async () => {
    const out = await simulateFetchChain(async () => ({
      ok: true,
      json: async () => ({ user: { id: 1, nickname: "Alice", rating: 1234 } }),
    }));
    expect(out.ratingError).toBe(false);
    expect(out.ratingUpdated).toBe(true);
  });

  it("shows error on network failure (fetch throws)", async () => {
    const out = await simulateFetchChain(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(out.ratingError).toBe(true);
    expect(out.ratingReset).toBe(true);
  });
});
