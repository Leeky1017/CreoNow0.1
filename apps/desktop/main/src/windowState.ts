import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Persisted window position and size.
 */
export type WindowState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const STATE_FILENAME = "window-state.json";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;

export const WINDOW_STATE_DEFAULTS: WindowState = {
  x: 0,
  y: 0,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
};

/**
 * Validate that a parsed value has the correct WindowState shape.
 */
function isValidWindowState(value: unknown): value is WindowState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.x === "number" &&
    Number.isFinite(obj.x) &&
    typeof obj.y === "number" &&
    Number.isFinite(obj.y) &&
    typeof obj.width === "number" &&
    Number.isFinite(obj.width) &&
    obj.width > 0 &&
    typeof obj.height === "number" &&
    Number.isFinite(obj.height) &&
    obj.height > 0
  );
}

/**
 * Load persisted window state from `<userDataDir>/window-state.json`.
 *
 * Returns `null` when the file is missing, corrupted, or has an invalid shape.
 * The caller should fall back to default dimensions in that case.
 */
export function loadWindowState(userDataDir: string): WindowState | null {
  try {
    const filePath = path.join(userDataDir, STATE_FILENAME);
    const raw = readFileSync(filePath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!isValidWindowState(parsed)) {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
      width: parsed.width,
      height: parsed.height,
    };
  } catch {
    // File missing (ENOENT), permission error, or JSON parse failure — all
    // treated as "no saved state".
    return null;
  }
}

/**
 * Persist window state to `<userDataDir>/window-state.json`.
 *
 * Writes atomically via `writeFileSync` (overwrites existing file).
 */
export function saveWindowState(
  userDataDir: string,
  state: WindowState,
): void {
  const filePath = path.join(userDataDir, STATE_FILENAME);
  writeFileSync(filePath, JSON.stringify(state), "utf8");
}

/**
 * Create a debounced version of `saveWindowState`.
 *
 * Uses `setTimeout` internally with a configurable delay.
 * Returns a disposable object so the caller can flush/cancel on shutdown.
 */
export function createDebouncedSaveWindowState(
  userDataDir: string,
  delayMs: number = 500,
): {
  save: (state: WindowState) => void;
  flush: () => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: WindowState | null = null;

  function flush(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending !== null) {
      saveWindowState(userDataDir, pending);
      pending = null;
    }
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    pending = null;
  }

  function save(state: WindowState): void {
    pending = state;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(flush, delayMs);
  }

  return { save, flush, cancel };
}
