import React from "react";
import { useTranslation } from "react-i18next";

// =============================================================================
// Types
// =============================================================================

/** Visual variant for the InfoBar */
export type InfoBarVariant = "info" | "warning" | "error" | "success";

export interface InfoBarProps {
  /** Visual variant that drives the color scheme */
  variant: InfoBarVariant;
  /** Message text to display */
  message: string;
  /** Optional action slot (typically a button or link) */
  action?: React.ReactNode;
  /** Whether the bar can be dismissed */
  dismissible?: boolean;
  /** Callback when the dismiss button is clicked */
  onDismiss?: () => void;
  /** Additional CSS class for the outer container */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
}

// =============================================================================
// Styles
// =============================================================================

const baseStyles = [
  "flex",
  "items-center",
  "gap-3",
  "px-3",
  "py-2",
  "text-xs",
  "rounded-[var(--radius-md)]",
  "border",
].join(" ");

/**
 * Variant styles using design tokens.
 *
 * Each variant uses semantic CSS variables for border, background,
 * and text colors to respect dark/light theme switching.
 */
const variantStyles: Record<InfoBarVariant, string> = {
  info: [
    "infobar-info",
    "border-[var(--color-info)]",
    "bg-[var(--color-info)]/10",
    "text-[var(--color-fg-default)]",
  ].join(" "),
  warning: [
    "infobar-warning",
    "border-[var(--color-warning)]",
    "bg-[var(--color-warning)]/10",
    "text-[var(--color-fg-default)]",
  ].join(" "),
  error: [
    "infobar-error",
    "border-[var(--color-error)]",
    "bg-[var(--color-error)]/10",
    "text-[var(--color-fg-default)]",
  ].join(" "),
  success: [
    "infobar-success",
    "border-[var(--color-success)]",
    "bg-[var(--color-success)]/10",
    "text-[var(--color-fg-default)]",
  ].join(" "),
};

const dismissButtonStyles = [
  "ml-auto",
  "shrink-0",
  "p-1",
  "rounded-[var(--radius-sm)]",
  "text-[var(--color-fg-muted)]",
  "hover:text-[var(--color-fg-default)]",
  "hover:bg-[var(--color-bg-hover)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * InfoBar — a panel-level notification bar composite.
 *
 * Displays contextual messages within panels with variant-driven styling:
 * - info: blue accent
 * - warning: yellow/amber accent
 * - error: red accent
 * - success: green accent
 *
 * Supports optional action slots and dismissibility.
 * Not a Toast — InfoBar is persistent inline content within a panel.
 *
 * @example
 * ```tsx
 * <InfoBar
 *   variant="warning"
 *   message="Disk space running low"
 *   action={<Button size="sm" variant="ghost">Manage</Button>}
 *   dismissible
 *   onDismiss={() => setShowWarning(false)}
 * />
 * ```
 */
export function InfoBar({
  variant,
  message,
  action,
  dismissible = false,
  onDismiss,
  className = "",
  "data-testid": testId,
}: InfoBarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div
      data-testid={testId}
      role="status"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <span className="flex-1">{message}</span>
      {action && <div className="shrink-0">{action}</div>}
      {dismissible && (
        // eslint-disable-next-line creonow/no-native-html-element -- Composite: dismiss button is an icon-only inline control
        <button
          type="button"
          aria-label={t('workbench.infoBar.dismiss')}
          className={dismissButtonStyles}
          onClick={onDismiss}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4L12 12M12 4L4 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
