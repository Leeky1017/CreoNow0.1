const APP_ID = "creonow" as const;
const CURRENT_VERSION = "1" as const;

export type PreferenceCategory = "layout" | "editor" | "theme" | "recent";

export type PreferenceKey =
  | `${typeof APP_ID}.layout.${
      | "sidebarWidth"
      | "panelWidth"
      | "sidebarCollapsed"
      | "panelCollapsed"
      | "activeRightPanel"
      | "activeLeftPanel"
      | "activePanel"
      | "activePanelTab"}`
  | `${typeof APP_ID}.theme.${"mode"}`
  | `${typeof APP_ID}.editor.${"showAiMarks"}`
  | `${typeof APP_ID}.onboarding.${"completed"}`
  | `${typeof APP_ID}.settings.${
      | "focusMode"
      | "typewriterScroll"
      | "smartPunctuation"
      | "localAutoSave"
      | "backupInterval"
      | "defaultFont"
      | "interfaceScale"
      | "language"
      | "accentColor"
      | "fontSize"}`
  | `${typeof APP_ID}.version`;

export interface PreferenceStore {
  /**
   * Sync read for UI-critical state.
   * MUST remain sync to keep drag interactions deterministic.
   */
  get<T>(key: PreferenceKey): T | null;

  /**
   * Sync write for UI-critical state.
   * Values MUST be JSON-serializable.
   */
  set<T>(key: PreferenceKey, value: T): void;

  /** Remove a single preference key. */
  remove(key: PreferenceKey): void;

  /**
   * Clear only CreoNow-owned keys.
   * Must not wipe unrelated localStorage keys.
   */
  clear(): void;
}

function isCreonowKey(key: string): key is PreferenceKey {
  return (
    key === `${APP_ID}.version` ||
    key.startsWith(`${APP_ID}.layout.`) ||
    key.startsWith(`${APP_ID}.theme.`) ||
    key.startsWith(`${APP_ID}.editor.`) ||
    key.startsWith(`${APP_ID}.onboarding.`) ||
    key.startsWith(`${APP_ID}.settings.`)
  );
}

function parseVersion(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }
  if (raw === CURRENT_VERSION) {
    return raw;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

/**
 * Create a PreferenceStore backed by the given Storage.
 *
 * Why: keep renderer layout persistence local and sync for E2E determinism.
 */
export function createPreferenceStore(storage: Storage): PreferenceStore {
  function clearCreonowKeys(): void {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k && isCreonowKey(k)) {
        keys.push(k);
      }
    }
    for (const k of keys) {
      storage.removeItem(k);
    }
  }

  function migrate(): void {
    const versionKey = `${APP_ID}.version` as const;
    try {
      const storedVersion = parseVersion(storage.getItem(versionKey));
      if (storedVersion !== CURRENT_VERSION) {
        clearCreonowKeys();
        storage.setItem(versionKey, CURRENT_VERSION);
      }
    } catch (error) {
      console.error("PreferenceStore.migrate failed", { error });
    }
  }

  migrate();

  return {
    get<T>(key: PreferenceKey): T | null {
      const raw = storage.getItem(key);
      if (raw === null) {
        return null;
      }
      try {
        return JSON.parse(raw) as T;
      } catch (error) {
        console.error("PreferenceStore.get failed to parse value", {
          key,
          error,
        });
        storage.removeItem(key);
        return null;
      }
    },
    set<T>(key: PreferenceKey, value: T): void {
      try {
        storage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error("PreferenceStore.set failed", { key, error });
      }
    },
    remove(key: PreferenceKey): void {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.error("PreferenceStore.remove failed", { key, error });
      }
    },
    clear(): void {
      try {
        clearCreonowKeys();
        storage.setItem(`${APP_ID}.version`, CURRENT_VERSION);
      } catch (error) {
        console.error("PreferenceStore.clear failed", { error });
      }
    },
  };
}
