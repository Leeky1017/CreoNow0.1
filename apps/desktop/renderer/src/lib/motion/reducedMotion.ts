export const PREFERS_REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type ReducedMotionMatchMedia = (
  query: string,
) => Pick<MediaQueryList, "matches">;

/**
 * Read reduced-motion preference in a safe way for test/runtime.
 */
export function readPrefersReducedMotion(
  matchMedia: ReducedMotionMatchMedia | undefined =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia.bind(window)
      : undefined,
): boolean {
  if (!matchMedia) {
    return false;
  }
  return matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
}

/**
 * Resolve motion duration token to 0ms when reduced-motion is active.
 */
export function resolveReducedMotionDuration(
  prefersReducedMotion: boolean,
  durationToken: string,
): string {
  return prefersReducedMotion ? "0ms" : durationToken;
}

/**
 * Resolve paired enter/exit durations for animation libs (e.g. tippy).
 */
export function resolveReducedMotionDurationPair(
  prefersReducedMotion: boolean,
  durationPair: [number, number],
): [number, number] {
  return prefersReducedMotion ? [0, 0] : durationPair;
}

/**
 * Deterministic matchMedia mock helper for reduced-motion tests.
 */
export function createReducedMotionMatchMediaMock(initialMatches: boolean): {
  matchMedia: (query: string) => MediaQueryList;
  setMatches: (nextMatches: boolean) => void;
} {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mediaQueryList: MediaQueryList = {
    media: PREFERS_REDUCED_MOTION_QUERY,
    get matches() {
      return matches;
    },
    onchange: null,
    addEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type !== "change" || typeof listener !== "function") {
        return;
      }
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    },
    removeEventListener: (
      type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      if (type !== "change" || typeof listener !== "function") {
        return;
      }
      listeners.delete(listener as (event: MediaQueryListEvent) => void);
    },
    dispatchEvent: (event: Event) => {
      listeners.forEach((listener) =>
        listener(event as unknown as MediaQueryListEvent),
      );
      return true;
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  };

  return {
    matchMedia: () => mediaQueryList,
    setMatches: (nextMatches: boolean) => {
      matches = nextMatches;
      const event = {
        media: PREFERS_REDUCED_MOTION_QUERY,
        matches: nextMatches,
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
      mediaQueryList.onchange?.(event);
    },
  };
}
