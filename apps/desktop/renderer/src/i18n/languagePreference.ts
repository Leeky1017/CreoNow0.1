/**
 * Language preference persistence — localStorage-only, no i18n dependency.
 *
 * Reading and writing are intentionally decoupled from the i18n instance
 * to avoid circular imports (index.ts → languagePreference → index.ts).
 * Callers that need to hot-switch the UI language should also call
 * `i18n.changeLanguage(lng)` after `setLanguagePreference(lng)`.
 */

const STORAGE_KEY = "creonow-language";
const DEFAULT_LANGUAGE = "zh-CN";

/**
 * Read the persisted language preference from localStorage.
 * Falls back to `"zh-CN"` when absent, corrupted, or localStorage
 * is unavailable.
 */
export function getLanguagePreference(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "zh-CN") {
      return stored;
    }
    return DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Persist the language choice to localStorage.
 * Silently fails when localStorage is unavailable.
 */
export function setLanguagePreference(lng: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // localStorage may be unavailable in some environments
  }
}
