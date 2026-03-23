/**
 * Loading state variants
 *
 * - spinner: Centered spinner animation
 * - skeleton: Content skeleton placeholder
 * - progress: Top progress bar (2px, animated)
 * - inline: Small inline spinner for buttons/text
 */
export type LoadingVariant =
  | "spinner"
  | "skeleton"
  | "progress"
  | "inline"
  | "brand";

/**
 * Skeleton element types for content placeholders
 */
export type SkeletonType =
  | "text"
  | "title"
  | "paragraph"
  | "avatar"
  | "card"
  | "list";

export interface LoadingStateProps {
  /** Loading display variant */
  variant?: LoadingVariant;
  /** Custom loading text (for spinner variant) */
  text?: string;
  /** Size of the spinner (sm: 16px, md: 24px, lg: 32px) */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
}

export interface SkeletonProps {
  /** Type of skeleton element */
  type?: SkeletonType;
  /** Number of skeleton lines (for paragraph type) */
  lines?: number;
  /** Custom width (e.g., "100%", "200px") */
  width?: string;
  /** Custom height (e.g., "40px") */
  height?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface ProgressBarProps {
  /** Whether the progress is indeterminate (animated) */
  indeterminate?: boolean;
  /** Progress value (0-100) for determinate mode */
  value?: number;
  /** Accessible label */
  "aria-label"?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Size mappings for spinner
 */
const spinnerSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
} as const;

/**
 * Spinner SVG component
 *
 * Animated circular spinner following design spec §12.2.
 * Uses CSS variables for theming.
 */
function Spinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}): JSX.Element {
  return (
    <svg
      className={[
        "animate-spin",
        spinnerSizes[size],
        "text-[var(--color-fg-muted)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Progress bar component (design spec §12.2)
 *
 * Top progress bar: 2px height, at top of container, animated scroll.
 */
export function ProgressBar({
  indeterminate = true,
  value = 0,
  "aria-label": ariaLabel = "Loading progress",
  className = "",
}: ProgressBarProps): JSX.Element {
  return (
    <div
      className={[
        "h-0.5 w-full overflow-hidden",
        "bg-[var(--color-bg-hover)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      {indeterminate ? (
        <div
          className={[
            "h-full w-1/3",
            "bg-[var(--color-fg-muted)]",
            "animate-[progress-indeterminate_1.5s_ease-in-out_infinite]",
          ].join(" ")}
          style={{
            // Fallback animation using transform if CSS keyframes not available
            animation: "progress-indeterminate 1.5s ease-in-out infinite",
          }}
        />
      ) : (
        <div
          className="h-full bg-[var(--color-fg-default)] transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)]"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  );
}

/**
 * Skeleton component (design spec §12.2)
 *
 * Content skeleton: use --color-bg-hover for placeholder blocks
 * to simulate content shape during loading.
 */
export function Skeleton({
  type = "text",
  lines = 3,
  width,
  height,
  className = "",
}: SkeletonProps): JSX.Element {
  const baseStyles = [
    "bg-[var(--color-bg-hover)]",
    "rounded-[var(--radius-sm)]",
    "animate-pulse",
  ].join(" ");

  switch (type) {
    case "title":
      return (
        <div
          className={[baseStyles, "h-6 w-3/4", className]
            .filter(Boolean)
            .join(" ")}
          style={{ width, height }}
        />
      );

    case "paragraph":
      return (
        <div className={["space-y-2", className].filter(Boolean).join(" ")}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={[
                baseStyles,
                "h-4",
                // Last line is shorter for natural look
                index === lines - 1 ? "w-2/3" : "w-full",
              ].join(" ")}
            />
          ))}
        </div>
      );

    case "avatar":
      return (
        <div
          className={[
            "bg-[var(--color-bg-hover)]",
            "rounded-full",
            "animate-pulse",
            "h-10 w-10",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ width, height }}
        />
      );

    case "card":
      return (
        <div
          className={[
            "bg-[var(--color-bg-surface)]",
            "border border-[var(--color-border-default)]",
            "rounded-[var(--radius-xl)]",
            "p-6",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="space-y-4">
            <div className={[baseStyles, "h-5 w-1/2"].join(" ")} />
            <div className="space-y-2">
              <div className={[baseStyles, "h-4 w-full"].join(" ")} />
              <div className={[baseStyles, "h-4 w-4/5"].join(" ")} />
              <div className={[baseStyles, "h-4 w-3/5"].join(" ")} />
            </div>
          </div>
        </div>
      );

    case "list":
      return (
        <div className={["space-y-3", className].filter(Boolean).join(" ")}>
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={[baseStyles, "h-8 w-8 shrink-0 rounded-full"].join(
                  " ",
                )}
              />
              <div className="flex-1 space-y-2">
                <div className={[baseStyles, "h-4 w-3/4"].join(" ")} />
                <div className={[baseStyles, "h-3 w-1/2"].join(" ")} />
              </div>
            </div>
          ))}
        </div>
      );

    case "text":
    default:
      return (
        <div
          className={[baseStyles, "h-4", className].filter(Boolean).join(" ")}
          style={{ width: width ?? "100%", height }}
        />
      );
  }
}

/**
 * Brand spinner sizes (CSS-only animation from main.css)
 */
const brandSizes = {
  sm: { container: "w-6 h-6", letter: "text-xs" },
  md: { container: "w-10 h-10", letter: "text-lg" },
  lg: { container: "w-14 h-14", letter: "text-2xl" },
} as const;

/**
 * LoadingState component following design spec §12.2
 *
 * Displays loading indicators for async operations. Supports multiple
 * variants for different loading scenarios.
 *
 * @example
 * ```tsx
 * // Centered spinner with text
 * <LoadingState variant="spinner" text="Loading..." />
 *
 * // Progress bar at top of container
 * <LoadingState variant="progress" />
 *
 * // Inline spinner (for buttons)
 * <LoadingState variant="inline" size="sm" />
 *
 * // Brand spinner (CreoNow "C" letter pulse)
 * <LoadingState variant="brand" size="lg" />
 *
 * // Skeleton placeholders
 * <Skeleton type="paragraph" lines={4} />
 * <Skeleton type="card" />
 * <Skeleton type="list" lines={3} />
 * ```
 */
export function LoadingState({
  variant = "spinner",
  text,
  size = "md",
  className = "",
}: LoadingStateProps): JSX.Element {
  switch (variant) {
    case "progress":
      return <ProgressBar className={className} />;

    case "inline":
      return <Spinner size={size} className={className} />;

    case "skeleton":
      return (
        <div role="status" className={className}>
          <Skeleton type="paragraph" />
        </div>
      );

    case "brand": {
      const bs = brandSizes[size];
      return (
        <div
          role="status"
          data-size={size}
          className={[
            "flex flex-col items-center justify-center gap-3",
            "py-12",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={`brand-spinner ${bs.container}`}>
            <span className={`brand-spinner-letter ${bs.letter}`}>C</span>
          </div>
          {text && (
            <span className="text-[13px] text-[var(--color-fg-muted)]">
              {text}
            </span>
          )}
        </div>
      );
    }

    case "spinner":
    default:
      return (
        <div
          role="status"
          data-size={size}
          className={[
            "flex flex-col items-center justify-center gap-3",
            "py-12",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Spinner size={size} />
          {text && (
            <span className="text-[13px] text-[var(--color-fg-muted)]">
              {text}
            </span>
          )}
        </div>
      );
  }
}
