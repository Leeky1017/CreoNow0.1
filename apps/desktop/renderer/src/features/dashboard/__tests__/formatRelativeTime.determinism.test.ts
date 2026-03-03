/**
 * S1: Dashboard formatRelativeTime determinism test
 *
 * Verifies that formatRelativeTime accepts an injected `now` parameter
 * so that test output is deterministic and independent of the real clock.
 *
 * Red: formatRelativeTime is not exported from DashboardPage.tsx →
 *      import resolves to undefined → TypeError when invoked.
 */
import { describe, it, expect } from "vitest";

import { formatRelativeTime } from "../DashboardPage";

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const mockT: TFunction = (key, options) => {
  if (key === "dashboard.time.justNow") return "Just now";
  if (key === "dashboard.time.minutesAgo")
    return `${options?.count} minutes ago`;
  if (key === "dashboard.time.hoursAgo") return `${options?.count} hours ago`;
  if (key === "dashboard.time.daysAgo") return `${options?.count} days ago`;
  return key;
};

describe("formatRelativeTime (Dashboard) — deterministic now injection", () => {
  const fixedNow = 1_700_000_060_000;

  it('returns "Just now" for timestamps within 60s of injected now', () => {
    const timestamp = fixedNow - 30_000; // 30 s before fixedNow
    const result = formatRelativeTime(timestamp, mockT, fixedNow);
    expect(result).toBe("Just now");
  });

  it("returns minutes-ago for timestamps within 1 h of injected now", () => {
    const timestamp = fixedNow - 5 * 60_000; // 5 min before
    const result = formatRelativeTime(timestamp, mockT, fixedNow);
    expect(result).toBe("5 minutes ago");
  });

  it("returns hours-ago for timestamps within 24 h of injected now", () => {
    const timestamp = fixedNow - 3 * 3_600_000; // 3 h before
    const result = formatRelativeTime(timestamp, mockT, fixedNow);
    expect(result).toBe("3 hours ago");
  });

  it("returns days-ago for timestamps within 7 d of injected now", () => {
    const timestamp = fixedNow - 2 * 86_400_000; // 2 d before
    const result = formatRelativeTime(timestamp, mockT, fixedNow);
    expect(result).toBe("2 days ago");
  });
});
