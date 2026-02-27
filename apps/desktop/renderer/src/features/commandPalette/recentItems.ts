const STORAGE_KEY = "creonow.commandPalette.recent";

export const MAX_RECENT_COMMANDS = 20;

function normalizeCommandId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function resolveStorage(provided?: Storage): Storage | null {
  if (provided) {
    return provided;
  }
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

/**
 * Read recent command IDs from local storage.
 *
 * Why: command palette needs a stable, renderer-local history list that
 * survives reloads without relying on main-process state.
 */
export function readRecentCommandIds(args?: {
  limit?: number;
  storage?: Storage;
}): string[] {
  const storage = resolveStorage(args?.storage);
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const ids = parsed
      .map((item) => normalizeCommandId(item))
      .filter((item): item is string => item !== null);
    const uniqueIds = Array.from(new Set(ids));
    const limit = Math.max(0, args?.limit ?? MAX_RECENT_COMMANDS);
    return uniqueIds.slice(0, limit);
  } catch (error) {
    console.error("COMMAND_PALETTE_RECENT_READ_FAILED", error);
    return [];
  }
}

/**
 * Record a command ID into recent history (newest first, deduplicated).
 *
 * Why: a single write path keeps capacity policy and ordering deterministic.
 */
export function recordRecentCommandId(
  commandId: string,
  args?: { storage?: Storage; limit?: number },
): void {
  const storage = resolveStorage(args?.storage);
  const normalizedCommandId = normalizeCommandId(commandId);
  if (!storage || !normalizedCommandId) {
    return;
  }

  try {
    const limit = Math.max(1, args?.limit ?? MAX_RECENT_COMMANDS);
    const existing = readRecentCommandIds({ storage, limit });
    const withoutCurrent = existing.filter(
      (item) => item !== normalizedCommandId,
    );
    const next = [normalizedCommandId, ...withoutCurrent].slice(0, limit);
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.error("COMMAND_PALETTE_RECENT_WRITE_FAILED", error);
  }
}
