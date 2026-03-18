import { i18n } from "../../i18n";

// =============================================================================
// Types
// =============================================================================

export type TFunction = (
  key: string,
  options?: Record<string, unknown>,
) => string;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format timestamp to relative time string using i18n keys.
 *
 * Why: Relative time strings ("just now", "5 minutes ago") vary by locale.
 */
export function formatRelativeTime(
  timestamp: number,
  t: TFunction,
  now: number = Date.now(),
): string {
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t("dashboard.time.justNow");
  if (minutes < 60) return t("dashboard.time.minutesAgo", { count: minutes });
  if (hours < 24) return t("dashboard.time.hoursAgo", { count: hours });
  if (days < 7) return t("dashboard.time.daysAgo", { count: days });

  return formatDate(timestamp);
}

/**
 * Format timestamp to short date string.
 *
 * Why: Uses i18n.language so the month name matches the user's locale.
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const locale = i18n.language === "zh-CN" ? "zh-CN" : i18n.language;
  const month = date.toLocaleString(locale, { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Map project stage to an i18n-keyed display label.
 */
export function formatStageTag(
  stage: "outline" | "draft" | "revision" | "final" | undefined,
  t: TFunction,
): string {
  switch (stage) {
    case "outline":
      return t("dashboard.stage.outline");
    case "draft":
      return t("dashboard.stage.draft");
    case "revision":
      return t("dashboard.stage.revision");
    case "final":
      return t("dashboard.stage.final");
    default:
      return t("dashboard.stage.default");
  }
}
