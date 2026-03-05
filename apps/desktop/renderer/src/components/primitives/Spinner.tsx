import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Spinner sizes
 *
 * | Size | Diameter |
 * |------|----------|
 * | xs   | 12px     |
 * | sm   | 16px     |
 * | md   | 24px     |
 * | lg   | 32px     |
 * | xl   | 48px     |
 */
export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Size of the spinner */
  size?: SpinnerSize;
  /** Custom label for accessibility */
  label?: string;
}

/**
 * Size-specific styles (width/height in pixels)
 */
const sizeMap: Record<SpinnerSize, number> = {
  xs: 12,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

/**
 * Spinner component for loading states
 *
 * Uses a circular animation with CSS animate-spin.
 * Accessible with proper aria-label.
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 * <Spinner size="lg" label="Loading content..." />
 * ```
 */
export function Spinner({
  size = "md",
  label,
  className = "",
  ...props
}: SpinnerProps): JSX.Element {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('primitives.spinner.loading');
  const dimension = sizeMap[size];

  const classes = ["animate-spin", "text-current", className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={classes}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={dimension}
      height={dimension}
      role="status"
      aria-label={resolvedLabel}
      {...props}
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
