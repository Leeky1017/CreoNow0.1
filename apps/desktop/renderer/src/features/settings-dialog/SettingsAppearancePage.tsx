import { Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { Slider } from "../../components/primitives/Slider";

/**
 * Theme mode types
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Appearance settings state
 */
export interface AppearanceSettings {
  themeMode: ThemeMode;
  accentColor: string;
  fontSize: number;
}

/**
 * SettingsAppearancePage props
 */
export interface SettingsAppearancePageProps {
  /** Current settings values */
  settings: AppearanceSettings;
  /** Callback when settings change */
  onSettingsChange: (settings: AppearanceSettings) => void;
}

/**
 * Section label styles
 */
const sectionLabelStyles = [
  "text-[10px]",
  "uppercase",
  "tracking-[0.15em]",
  "text-[var(--color-fg-placeholder)]",
  "font-semibold",
  "mb-6",
].join(" ");

/**
 * Divider styles
 */
const dividerStyles = [
  "w-full",
  "h-px",
  "bg-[var(--color-border-default)]",
  "my-12",
].join(" ");

/**
 * Theme button styles
 */
const themeButtonBaseStyles = [
  "flex",
  "flex-col",
  "items-center",
  "gap-2",
  "px-6",
  "py-4",
  "rounded-[var(--radius-md)]",
  "border",
  "cursor-pointer",
  "transition-all",
  "duration-[var(--duration-fast)]",
].join(" ");

/**
 * Accent color options
 */
const accentColors = [
  { value: "#ffffff", label: "White" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

/**
 * Theme preview component
 */
function ThemePreview({ mode }: { mode: ThemeMode }): JSX.Element {
  const isDark = mode === "dark" || mode === "system";
  const bgColor = isDark ? "#0f0f0f" : "#ffffff";
  const fgColor = isDark ? "#ffffff" : "#1a1a1a";
  const mutedColor = isDark ? "#666666" : "#888888";

  return (
    <div
      className="w-16 h-12 rounded border border-[var(--color-border-default)] overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Mini preview content */}
      <div className="p-1.5">
        <div
          className="h-1 w-8 rounded-sm mb-1"
          style={{ backgroundColor: fgColor }}
        />
        <div
          className="h-0.5 w-12 rounded-sm mb-0.5"
          style={{ backgroundColor: mutedColor }}
        />
        <div
          className="h-0.5 w-10 rounded-sm"
          style={{ backgroundColor: mutedColor }}
        />
      </div>
    </div>
  );
}

/**
 * SettingsAppearancePage component
 *
 * Appearance settings page with theme selection, accent color, and font size controls.
 */
export function SettingsAppearancePage({
  settings,
  onSettingsChange,
}: SettingsAppearancePageProps): JSX.Element {
  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const themes: { mode: ThemeMode; label: string }[] = [
    { mode: "light", label: "Light" },
    { mode: "dark", label: "Dark" },
    { mode: "system", label: "System" },
  ];

  return (
    <div className="max-w-[560px]">
      {/* Header */}
      <h1 className="text-2xl font-normal text-[var(--color-fg-default)] mb-2 tracking-tight">
        Appearance
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        Personalize the look and feel of your workspace.
      </p>

      {/* Theme Selection */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>Theme</h4>

        <div className="flex gap-4">
          {themes.map(({ mode, label }) => {
            const isSelected = settings.themeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => updateSetting("themeMode", mode)}
                className={`${themeButtonBaseStyles} ${
                  isSelected
                    ? "border-[var(--color-fg-default)] bg-[var(--color-bg-selected)]"
                    : "border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]"
                }`}
              >
                <ThemePreview mode={mode} />
                <Text
                  size="small"
                  color={isSelected ? "default" : "muted"}
                  weight={isSelected ? "medium" : "normal"}
                >
                  {label}
                </Text>
              </button>
            );
          })}
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Accent Color */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>Accent Color</h4>

        <div className="flex gap-3">
          {accentColors.map(({ value, label }) => {
            const isSelected = settings.accentColor === value;
            return (
              <Tooltip key={value} content={label}>
                <button
                  type="button"
                  onClick={() => updateSetting("accentColor", value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-[var(--duration-fast)] ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface)] ring-[var(--color-ring-focus)]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: value }}
                  aria-label={`Select ${label} accent color`}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Font Size */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>Font Size</h4>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Text size="small" color="muted">
              Editor font size
            </Text>
            <Text size="small" color="default" weight="medium">
              {settings.fontSize}px
            </Text>
          </div>
          <Slider
            min={12}
            max={24}
            step={1}
            value={settings.fontSize}
            onValueChange={(value) => updateSetting("fontSize", value)}
            showLabels
            formatLabel={(v) => `${v}px`}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Default appearance settings
 */
export const defaultAppearanceSettings: AppearanceSettings = {
  themeMode: "dark",
  accentColor: "#ffffff",
  fontSize: 16,
};
