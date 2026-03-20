/**
 * UI accent color palette — the set of user-selectable accent colors.
 *
 * Each entry maps to a registered `--color-accent-*` Design Token in tokens.css.
 * The `value` field is the concrete hex color persisted in user preferences.
 * The `token` field is the CSS variable name for referencing from stylesheets.
 * The `labelKey` is the i18n key for the human-readable color name.
 */
export const ACCENT_PALETTE = [
  {
    id: "white",
    value: "#ffffff",
    token: "--color-accent-white",
    labelKey: "settingsDialog.appearance.colorWhite",
  },
  {
    id: "blue",
    value: "#3b82f6",
    token: "--color-accent-blue",
    labelKey: "settingsDialog.appearance.colorBlue",
  },
  {
    id: "green",
    value: "#22c55e",
    token: "--color-accent-green",
    labelKey: "settingsDialog.appearance.colorGreen",
  },
  {
    id: "orange",
    value: "#f97316",
    token: "--color-accent-orange",
    labelKey: "settingsDialog.appearance.colorOrange",
  },
  {
    id: "purple",
    value: "#8b5cf6",
    token: "--color-accent-purple",
    labelKey: "settingsDialog.appearance.colorPurple",
  },
  {
    id: "pink",
    value: "#ec4899",
    token: "--color-accent-pink",
    labelKey: "settingsDialog.appearance.colorPink",
  },
] as const;

/** Default accent color (first palette entry) */
export const DEFAULT_ACCENT_COLOR = ACCENT_PALETTE[0].value;
