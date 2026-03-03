/**
 * S5: AnalyticsPage date-range determinism test
 *
 * Verifies that the date-range computation (utcDateKey) can be driven
 * by an injected `now` value, yielding stable from/to keys.
 *
 * Red: computeDateRange is not exported (doesn't exist yet) →
 *      import resolves to undefined → TypeError when invoked.
 */
import { describe, it, expect } from "vitest";

import { computeDateRange } from "../AnalyticsPage";

describe("computeDateRange (Analytics) — deterministic now injection", () => {
  it("computes stable 7-day range with injected now", () => {
    // 2026-03-01T12:00:00Z
    const fixedNow = new Date("2026-03-01T12:00:00Z").getTime();
    const { from, to } = computeDateRange(fixedNow);

    expect(to).toBe("2026-03-01");
    expect(from).toBe("2026-02-23");
  });

  it("handles epoch boundary correctly", () => {
    // 1970-01-08T00:00:00Z — exactly 7 days after epoch
    const fixedNow = 7 * 24 * 60 * 60 * 1000;
    const { from, to } = computeDateRange(fixedNow);

    expect(to).toBe("1970-01-08");
    expect(from).toBe("1970-01-02");
  });
});
