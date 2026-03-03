/**
 * S4: VersionHistoryContainer formatTimestamp determinism test
 *
 * Verifies that formatTimestamp accepts an injected `now` parameter so
 * that version age labels are deterministic in tests.
 *
 * Red: formatTimestamp is not exported from VersionHistoryContainer.tsx →
 *      import resolves to undefined → TypeError when invoked.
 */
import { describe, it, expect } from "vitest";

import { formatTimestamp } from "../VersionHistoryContainer";

describe("formatTimestamp (VersionHistory) — deterministic now injection", () => {
  const fixedNow = 1_700_000_060_000;

  it('returns "Just now" for timestamps within 60s of injected now', () => {
    const createdAt = fixedNow - 30_000; // 30 s before
    const result = formatTimestamp(createdAt, fixedNow);
    expect(result).toBe("Just now");
  });

  it("returns minutes-ago for timestamps within 1 h of injected now", () => {
    const createdAt = fixedNow - 5 * 60_000; // 5 min before
    const result = formatTimestamp(createdAt, fixedNow);
    expect(result).toBe("5m ago");
  });

  it("returns time-of-day for timestamps within 24 h of injected now", () => {
    const createdAt = fixedNow - 3 * 3_600_000; // 3 h before
    const result = formatTimestamp(createdAt, fixedNow);
    // Should return a time string like "HH:MM AM/PM"
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});
