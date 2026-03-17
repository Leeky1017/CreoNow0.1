import { useTranslation } from "react-i18next";
import { Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { Slider } from "../../components/primitives/Slider";

/* eslint-disable creonow/no-native-html-element -- theme selection buttons */

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
  "bg-[var(--color-separator)]",
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
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

type TFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Accent color options
 * intentional: theme preview swatches — hex values are the actual color choices
 */
function getAccentColors(t: TFunction) {
  return [
    { value: "#ffffff", label: t('settingsDialog.appearance.colorWhite') },
    { value: "#3b82f6", label: t('settingsDialog.appearance.colorBlue') },
    { value: "#22c55e", label: t('settingsDialog.appearance.colorGreen') },
    { value: "#f97316", label: t('settingsDialog.appearance.colorOrange') },
    { value: "#8b5cf6", label: t('settingsDialog.appearance.colorPurple') },
    { value: "#ec4899", label: t('settingsDialog.appearance.colorPink') },
  ];
}

/**
 * Theme preview component
 */
function ThemePreview({ mode }: { mode: ThemeMode }): JSX.Element {
  const isDark = mode === "dark" || mode === "system";
  // intentional: theme preview swatch — hex values represent actual theme appearance
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
  const { t } = useTranslation();
  const updateSetting = <K extends keyof AppearanceSettings>(
    key: K,
    value: AppearanceSettings[K],
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const themes: { mode: ThemeMode; label: string }[] = [
    { mode: "light", label: t('settingsDialog.appearance.themeLight') },
    { mode: "dark", label: t('settingsDialog.appearance.themeDark') },
    { mode: "system", label: t('settingsDialog.appearance.themeSystem') },
  ];

  const accentColors = getAccentColors(t);

  return (
    // eslint-disable-next-line creonow/no-hardcoded-dimension -- settings content width per design spec
    <div className="max-w-[560px]">
      {/* Header */}
      <h1 className="text-2xl font-normal text-[var(--color-fg-default)] mb-2 tracking-tight">
        {t('settingsDialog.appearance.title')}
      </h1>
      <p className="text-[var(--color-fg-subtle)] text-sm mb-12 font-light">
        {t('settingsDialog.appearance.subtitle')}
      </p>

      {/* Theme Selection */}
      <div className="mb-14">
        <h4 className={sectionLabelStyles}>{t('settingsDialog.appearance.theme')}</h4>

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
        <h4 className={sectionLabelStyles}>{t('settingsDialog.appearance.accentColor')}</h4>

        <div className="flex gap-3">
          {accentColors.map(({ value, label }) => {
            const isSelected = settings.accentColor === value;
            return (
              <Tooltip key={value} content={label}>
                <button
                  type="button"
                  onClick={() => updateSetting("accentColor", value)}
                  className={`w-8 h-8 rounded-full border-2 transition-[box-shadow,transform] duration-[var(--duration-fast)] ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface)] ring-[var(--color-ring-focus)]"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: value }}
                  aria-label={t('settingsDialog.appearance.selectAccentColor', { color: label })}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className={dividerStyles} />

      {/* Font Size */}
      <div className="mb-6">
        <h4 className={sectionLabelStyles}>{t('settingsDialog.appearance.fontSize')}</h4>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Text size="small" color="muted">
              {t('settingsDialog.appearance.editorFontSize')}
            </Text>
            <Text size="small" color="default" weight="medium">
              {t('settingsDialog.appearance.fontSizePx', { size: settings.fontSize })}
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
