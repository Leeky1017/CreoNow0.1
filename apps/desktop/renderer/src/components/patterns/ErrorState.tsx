import { useTranslation } from "react-i18next";
import { Button, Text, Heading } from "../primitives";

/**
 * Error severity levels
 *
 * - error: Critical errors requiring attention (red)
 * - warning: Non-critical issues (yellow/orange)
 * - info: Informational messages (blue)
 */
export type ErrorSeverity = "error" | "warning" | "info";

/**
 * Error display variants
 *
 * - inline: Small inline error message (below inputs)
 * - banner: Full-width banner at top/bottom of container
 * - card: Standalone error card with icon and actions
 * - fullPage: Full page error state
 */
export type ErrorVariant = "inline" | "banner" | "card" | "fullPage";

export interface ErrorStateProps {
  /** Display variant */
  variant?: ErrorVariant;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Error title/heading */
  title?: string;
  /** Error message/description */
  message: string;
  /** Primary action label (e.g., "Retry", "Dismiss") */
  actionLabel?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action label */
  secondaryActionLabel?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Severity color mappings using CSS variables
 */
const severityColors: Record<
  ErrorSeverity,
  { text: string; bg: string; border: string; icon: string }
> = {
  error: {
    text: "text-[var(--color-error)]",
    bg: "bg-[var(--color-error-subtle)]",
    border: "border-[var(--color-error)]",
    icon: "text-[var(--color-error)]",
  },
  warning: {
    text: "text-[var(--color-warning)]",
    bg: "bg-[var(--color-warning-subtle)]",
    border: "border-[var(--color-warning)]",
    icon: "text-[var(--color-warning)]",
  },
  info: {
    text: "text-[var(--color-info)]",
    bg: "bg-[var(--color-info-subtle)]",
    border: "border-[var(--color-info)]",
    icon: "text-[var(--color-info)]",
  },
};

/**
 * Icon component for different severity levels
 */
function SeverityIcon({
  severity,
  className = "",
}: {
  severity: ErrorSeverity;
  className?: string;
}): JSX.Element {
  const baseClasses = ["w-5 h-5", severityColors[severity].icon, className]
    .filter(Boolean)
    .join(" ");

  switch (severity) {
    case "error":
      return (
        <svg
          className={baseClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path strokeLinecap="round" strokeWidth="1.5" d="M12 8v4" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      );
    case "warning":
      return (
        <svg
          className={baseClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      );
    case "info":
      return (
        <svg
          className={baseClasses}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path strokeLinecap="round" strokeWidth="1.5" d="M12 16v-4" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
        </svg>
      );
  }
}

/**
 * Close/dismiss button
 */
function DismissButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    // eslint-disable-next-line creonow/no-native-html-element -- Pattern: DismissButton is a small inline icon control
    <button
      type="button"
      onClick={onClick}
      className={[
        "p-1",
        "rounded-[var(--radius-sm)]",
        "text-[var(--color-fg-muted)]",
        "hover:text-[var(--color-fg-default)]",
        "hover:bg-[var(--color-bg-hover)]",
        "transition-colors duration-[var(--duration-fast)]",
        "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
        "focus-visible:outline-offset-[var(--ring-focus-offset)]",
        "focus-visible:outline-[var(--color-ring-focus)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={t("patterns.errorState.close")}
    >
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}

/**
 * Inline error variant (design spec §12.3)
 *
 * Used below input fields for validation errors.
 */
function InlineError({
  message,
  severity,
  className = "",
}: {
  message: string;
  severity: ErrorSeverity;
  className?: string;
}): JSX.Element {
  return (
    <div
      className={[
        "flex items-center gap-1.5",
        "mt-1.5",
        severityColors[severity].text,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      data-severity={severity}
    >
      <SeverityIcon severity={severity} className="w-3.5 h-3.5 shrink-0" />
      <Text
        size="small"
        color={
          severity === "error"
            ? "error"
            : severity === "warning"
              ? "warning"
              : "info"
        }
      >
        {message}
      </Text>
    </div>
  );
}

/**
 * Banner error variant
 *
 * Full-width banner for page-level or section-level errors.
 */
function BannerError({
  title,
  message,
  severity,
  actionLabel,
  onAction,
  dismissible,
  onDismiss,
  className = "",
}: Omit<ErrorStateProps, "variant">): JSX.Element {
  const colors = severityColors[severity ?? "error"];

  return (
    <div
      className={[
        "flex items-start gap-3",
        "px-4 py-3",
        colors.bg,
        "border-l-2",
        colors.border,
        "rounded-r-[var(--radius-sm)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      data-severity={severity ?? "error"}
    >
      <SeverityIcon
        severity={severity ?? "error"}
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {title && (
          <Text size="body" weight="medium" className="mb-0.5">
            {title}
          </Text>
        )}
        <Text size="small" color="muted">
          {message}
        </Text>
        {actionLabel && onAction && (
          // eslint-disable-next-line creonow/no-native-html-element -- Pattern: inline text link action
          <button
            type="button"
            onClick={onAction}
            className={[
              "mt-2 text-[12px] font-medium underline",
              colors.text,
              "hover:opacity-80",
              "focus-visible:outline focus-visible:outline-[length:var(--ring-focus-width)]",
              "focus-visible:outline-offset-[var(--ring-focus-offset)]",
              "focus-visible:outline-[var(--color-ring-focus)]",
            ].join(" ")}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {dismissible && onDismiss && <DismissButton onClick={onDismiss} />}
    </div>
  );
}

/**
 * Card error variant
 *
 * Standalone error card with icon, message, and actions.
 */
function CardError({
  title,
  message,
  severity,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: Omit<
  ErrorStateProps,
  "variant" | "dismissible" | "onDismiss"
>): JSX.Element {
  const colors = severityColors[severity ?? "error"];

  return (
    <div
      className={[
        "flex flex-col items-center text-center",
        "px-6 py-8",
        "bg-[var(--color-bg-surface)]",
        "border border-[var(--color-border-default)]",
        "rounded-[var(--radius-xl)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      data-severity={severity ?? "error"}
    >
      {/* Icon container */}
      <div
        className={[
          "flex items-center justify-center",
          "w-12 h-12 mb-4",
          "rounded-full",
          colors.bg,
        ].join(" ")}
      >
        <SeverityIcon severity={severity ?? "error"} className="w-6 h-6" />
      </div>

      {/* Title */}
      {title && (
        <Heading level="h3" className="mb-2">
          {title}
        </Heading>
      )}

      {/* Message */}
      <Text size="body" color="muted" as="p" className="mb-6 max-w-xs">
        {message}
      </Text>

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <div className="flex items-center gap-3">
          {onAction && actionLabel && (
            <Button
              variant={severity === "error" ? "danger" : "primary"}
              size="md"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button variant="ghost" size="md" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full page error variant
 *
 * Centered error display for full-page error states.
 */
function FullPageError({
  title,
  message,
  severity,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
}: Omit<
  ErrorStateProps,
  "variant" | "dismissible" | "onDismiss"
>): JSX.Element {
  const { t } = useTranslation();
  const colors = severityColors[severity ?? "error"];

  return (
    <div
      className={[
        "flex flex-col items-center justify-center",
        "min-h-[24rem] p-8",
        "text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
      data-severity={severity ?? "error"}
    >
      {/* Large icon */}
      <div
        className={[
          "flex items-center justify-center",
          "w-16 h-16 mb-6",
          "rounded-full",
          colors.bg,
        ].join(" ")}
      >
        <SeverityIcon severity={severity ?? "error"} className="w-8 h-8" />
      </div>

      {/* Title */}
      <Heading level="h2" className="mb-3">
        {title ?? t("patterns.errorState.defaultTitle")}
      </Heading>

      {/* Message */}
      <Text size="body" color="muted" as="p" className="mb-8 max-w-sm">
        {message}
      </Text>

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <div className="flex items-center gap-4">
          {onAction && actionLabel && (
            <Button
              variant={severity === "error" ? "danger" : "primary"}
              size="lg"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button variant="secondary" size="lg" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ErrorState component following design spec §12.3
 *
 * Displays error, warning, or info messages in various formats.
 * Supports inline validation errors, banners, cards, and full-page errors.
 *
 * @example
 * ```tsx
 * // Inline error (below input)
 * <ErrorState variant="inline" message="此字段为必填项" />
 *
 * // Banner error (top of section)
 * <ErrorState
 *   variant="banner"
 *   severity="warning"
 *   title="连接不稳定"
 *   message="部分功能可能受影响"
 *   dismissible
 *   onDismiss={handleDismiss}
 * />
 *
 * // Card error with actions
 * <ErrorState
 *   variant="card"
 *   title="加载失败"
 *   message="无法加载数据，请重试"
 *   actionLabel="重试"
 *   onAction={handleRetry}
 * />
 *
 * // Full page error
 * <ErrorState
 *   variant="fullPage"
 *   title="页面不存在"
 *   message="您访问的页面可能已被删除或移动"
 *   actionLabel="返回首页"
 *   onAction={goHome}
 * />
 * ```
 */
export function ErrorState({
  variant = "inline",
  severity = "error",
  ...props
}: ErrorStateProps): JSX.Element {
  switch (variant) {
    case "inline":
      return (
        <InlineError
          message={props.message}
          severity={severity}
          className={props.className}
        />
      );

    case "banner":
      return <BannerError severity={severity} {...props} />;

    case "card":
      return <CardError severity={severity} {...props} />;

    case "fullPage":
      return <FullPageError severity={severity} {...props} />;

    default:
      return (
        <InlineError
          message={props.message}
          severity={severity}
          className={props.className}
        />
      );
  }
}
