import { useTranslation } from "react-i18next";

/**
 * ZenModeStatus props
 */
export interface ZenModeStatusProps {
  /** Word count */
  wordCount: number;
  /** Save status text */
  saveStatus: string;
  /** Read time in minutes */
  readTimeMinutes: number;
  /** Current time (optional) */
  currentTime?: string;
}

/**
 * Separator dot component for status items
 */
function StatusDot(): JSX.Element {
  return (
    <span
      className="w-1 h-1 rounded-full"
      style={{ backgroundColor: "var(--color-fg-placeholder)" }}
      aria-hidden="true"
    />
  );
}

/**
 * ZenModeStatus - Bottom status bar for zen mode
 *
 * Shows word count, save status, and read time.
 * Hidden by default, only appears when hovering near the bottom of the screen.
 */
export function ZenModeStatus({
  wordCount,
  saveStatus,
  readTimeMinutes,
  currentTime,
}: ZenModeStatusProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      data-testid="zen-status-area"
      className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center pb-8 opacity-0 hover:opacity-100 transition-opacity"
      style={{
        zIndex: "var(--z-popover)",
        transitionDuration: "var(--duration-slow)",
        transitionTimingFunction: "var(--ease-default)",
      }}
    >
      <div
        data-testid="zen-status-bar"
        className="flex items-center gap-6 px-4 py-2 rounded-full"
        style={{
          backgroundColor: "var(--color-zen-statusbar-bg)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Word count */}
        <span
          data-testid="zen-word-count"
          className="text-xs tabular-nums"
          style={{
            fontFamily: "var(--font-family-ui)",
            color: "var(--color-fg-muted)",
          }}
        >
          {t("zenMode.status.wordCount", { count: wordCount })}
        </span>

        <StatusDot />

        {/* Save status */}
        <span
          data-testid="zen-save-status"
          className="text-xs"
          style={{
            fontFamily: "var(--font-family-ui)",
            color: "var(--color-fg-muted)",
          }}
        >
          {saveStatus}
        </span>

        <StatusDot />

        {/* Read time */}
        <span
          data-testid="zen-read-time"
          className="text-xs"
          style={{
            fontFamily: "var(--font-family-ui)",
            color: "var(--color-fg-muted)",
          }}
        >
          {t("zenMode.status.readTime", { minutes: readTimeMinutes })}
        </span>

        {/* Current time (optional) */}
        {currentTime && (
          <>
            <StatusDot />
            <span
              data-testid="zen-time"
              className="text-xs tabular-nums"
              style={{
                fontFamily: "var(--font-family-ui)",
                color: "var(--color-fg-muted)",
              }}
            >
              {currentTime}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
