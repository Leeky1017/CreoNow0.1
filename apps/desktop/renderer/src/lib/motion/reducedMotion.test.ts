import { describe, expect, it } from "vitest";

import {
  createReducedMotionMatchMediaMock,
  resolveReducedMotionDuration,
  resolveReducedMotionDurationPair,
} from "./reducedMotion";

describe("reduced motion helpers", () => {
  it("returns 0ms duration when reduced-motion is enabled", () => {
    expect(resolveReducedMotionDuration(true, "var(--duration-slow)")).toBe(
      "0ms",
    );
  });

  it("keeps token duration when reduced-motion is disabled", () => {
    expect(resolveReducedMotionDuration(false, "var(--duration-slow)")).toBe(
      "var(--duration-slow)",
    );
  });

  it("returns deterministic tippy duration pair", () => {
    expect(resolveReducedMotionDurationPair(true, [100, 100])).toEqual([0, 0]);
    expect(resolveReducedMotionDurationPair(false, [100, 100])).toEqual([
      100, 100,
    ]);
  });

  it("exposes mutable matchMedia mock for tests", () => {
    const mock = createReducedMotionMatchMediaMock(false);
    const mql = mock.matchMedia("(prefers-reduced-motion: reduce)");
    expect(mql.matches).toBe(false);

    mock.setMatches(true);
    expect(mql.matches).toBe(true);
  });
});
