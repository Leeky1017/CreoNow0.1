/**
 * Language preference persistence backed by the shared PreferenceStore key.
 *
 * Why: language selection must use the same persistence channel as the rest of
 * Settings → General, rather than an ad-hoc standalone localStorage key.
 */

import { createPreferenceStore } from "../lib/preferences";

const DEFAULT_LANGUAGE = "zh-CN" as const;
const LANGUAGE_KEY = "creonow.settings.language" as const;

function createBrowserPreferenceStore() {
  return createPreferenceStore(localStorage);
}

/**
 * Read the persisted language preference from the shared PreferenceStore.
 * Falls back to `"zh-CN"` when absent, corrupted, or localStorage is
 * unavailable.
 */
export function getLanguagePreference(): string {
  try {
    const stored = createBrowserPreferenceStore().get<string>(LANGUAGE_KEY);
    if (stored === "en" || stored === "zh-CN") {
      return stored;
    }
    return DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Persist the language choice through the shared PreferenceStore.
 * Silently fails when localStorage is unavailable.
 */
export function setLanguagePreference(lng: string): void {
  try {
    createBrowserPreferenceStore().set(LANGUAGE_KEY, lng);
  } catch {
    // localStorage may be unavailable in some environments
  }
}
