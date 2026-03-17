/**
 * Fake timer utilities for deterministic time-dependent tests.
 *
 * Usage:
 *   import { useFakeTimer, advanceDays } from '../helpers/fake-timer'
 *
 *   beforeEach(() => useFakeTimer())
 *   afterEach(() => vi.useRealTimers())
 *
 *   it('should decay after 30 days', () => {
 *     advanceDays(30)
 *     // ...assertions
 *   })
 */
import { vi } from "vitest";

/** Activate Vitest fake timers with a fixed base date. */
export function useFakeTimer(
  baseDate: Date = new Date("2025-01-01T00:00:00Z"),
) {
  vi.useFakeTimers();
  vi.setSystemTime(baseDate);
}

/** Advance fake clock by N milliseconds. */
export function advanceMs(ms: number) {
  vi.advanceTimersByTime(ms);
}

/** Advance fake clock by N seconds. */
export function advanceSeconds(seconds: number) {
  advanceMs(seconds * 1_000);
}

/** Advance fake clock by N days. */
export function advanceDays(days: number) {
  advanceMs(days * 24 * 60 * 60 * 1_000);
}

/** Return a Date that is `days` days ago from now (works with both real and fake timers). */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1_000);
}
