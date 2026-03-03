/**
 * S2: ProjectSwitcher formatRelativeTime determinism test
 *
 * Verifies that formatRelativeTime accepts an injected `now` parameter
 * so that the relative time label is deterministic.
 *
 * Red: formatRelativeTime is not exported from ProjectSwitcher.tsx →
 *      import resolves to undefined → TypeError when invoked.
 */
import { describe, it, expect } from "vitest";

import { formatRelativeTime } from "../ProjectSwitcher";

describe("formatRelativeTime (ProjectSwitcher) — deterministic now injection", () => {
  const fixedNow = 1_700_000_060_000;

  it('returns "just now" for timestamps within 60s of injected now', () => {
    const updatedAt = fixedNow - 30_000; // 30 s before
    const result = formatRelativeTime(updatedAt, fixedNow);
    expect(result).toBe("just now");
  });

  it("returns minutes-ago for timestamps within 1 h of injected now", () => {
    const updatedAt = fixedNow - 5 * 60_000; // 5 min before
    const result = formatRelativeTime(updatedAt, fixedNow);
    expect(result).toBe("5m ago");
  });

  it("returns hours-ago for timestamps within 24 h of injected now", () => {
    const updatedAt = fixedNow - 3 * 3_600_000; // 3 h before
    const result = formatRelativeTime(updatedAt, fixedNow);
    expect(result).toBe("3h ago");
  });

  it("returns days-ago for timestamps >= 24 h before injected now", () => {
    const updatedAt = fixedNow - 2 * 86_400_000; // 2 d before
    const result = formatRelativeTime(updatedAt, fixedNow);
    expect(result).toBe("2d ago");
  });
});
