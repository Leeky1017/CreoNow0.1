import type { PreferenceStore, PreferenceKey } from "../../lib/preferences";
import { defaultGeneralSettings, type GeneralSettings } from "./SettingsGeneral";

/**
 * Maps GeneralSettings keys to PreferenceKey strings.
 */
const SETTINGS_KEY_MAP: Record<keyof GeneralSettings, PreferenceKey> = {
  focusMode: "creonow.settings.focusMode",
  typewriterScroll: "creonow.settings.typewriterScroll",
  smartPunctuation: "creonow.settings.smartPunctuation",
  localAutoSave: "creonow.settings.localAutoSave",
  backupInterval: "creonow.settings.backupInterval",
  defaultTypography: "creonow.settings.defaultTypography",
  interfaceScale: "creonow.settings.interfaceScale",
};

/**
 * Load all General settings from PreferenceStore, falling back to defaults.
 */
export function loadGeneralSettings(store: PreferenceStore): GeneralSettings {
  const result = { ...defaultGeneralSettings };

  for (const [field, prefKey] of Object.entries(SETTINGS_KEY_MAP) as Array<
    [keyof GeneralSettings, PreferenceKey]
  >) {
    const stored = store.get(prefKey);
    if (stored !== null) {
      (result as Record<string, unknown>)[field] = stored;
    }
  }

  return result;
}

/**
 * Save a single General setting to PreferenceStore.
 */
export function saveGeneralSetting<K extends keyof GeneralSettings>(
  store: PreferenceStore,
  key: K,
  value: GeneralSettings[K],
): void {
  const prefKey = SETTINGS_KEY_MAP[key];
  if (prefKey) {
    store.set(prefKey, value);
  }
}

/**
 * Save all General settings to PreferenceStore.
 */
export function saveGeneralSettings(
  store: PreferenceStore,
  settings: GeneralSettings,
): void {
  for (const [field, prefKey] of Object.entries(SETTINGS_KEY_MAP) as Array<
    [keyof GeneralSettings, PreferenceKey]
  >) {
    store.set(prefKey, settings[field]);
  }
}
