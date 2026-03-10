import { create } from "zustand";

export const VERSION_SHOW_AI_MARKS_KEY = "creonow.editor.showAiMarks" as const;

type VersionPreferencesState = {
  showAiMarks: boolean;
  setShowAiMarks: (enabled: boolean) => boolean;
};

/**
 * Read AI mark preference from local storage with a safe fallback.
 *
 * Why: settings persistence must be deterministic and resilient to malformed data.
 */
function readShowAiMarksPreference(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage === "undefined"
  ) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(VERSION_SHOW_AI_MARKS_KEY);
    if (raw === null) {
      return false;
    }
    const parsed = JSON.parse(raw) as unknown;
    return parsed === true;
  } catch (error) {
    console.error("Failed to read AI marks preference", { error });
    return false;
  }
}

/**
 * Persist AI mark preference into local storage.
 *
 * Why: version history rendering must survive app restarts.
 */
function writeShowAiMarksPreference(enabled: boolean): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.localStorage === "undefined"
  ) {
    return false;
  }

  try {
    window.localStorage.setItem(
      VERSION_SHOW_AI_MARKS_KEY,
      JSON.stringify(enabled),
    );
    return true;
  } catch (error) {
    console.error("Failed to persist AI marks preference", { error });
    return false;
  }
}

/**
 * Global store for version-history display preferences.
 *
 * Why: settings dialog and version history panel need a shared state source.
 */
export const useVersionPreferencesStore = create<VersionPreferencesState>(
  (set) => ({
    showAiMarks: readShowAiMarksPreference(),
    setShowAiMarks: (enabled) => {
      const persisted = writeShowAiMarksPreference(enabled);
      if (persisted) {
        set({ showAiMarks: enabled });
      }
      return persisted;
    },
  }),
);
