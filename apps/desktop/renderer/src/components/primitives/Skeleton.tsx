import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Skeleton variants
 *
 * - text: 单行文本占位
 * - circular: 圆形占位（头像等）
 * - rectangular: 矩形占位（图片、卡片等）
 */
export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width (CSS value, e.g., "100%", "200px") */
  width?: string | number;
  /** Height (CSS value, e.g., "20px", "100%") */
  height?: string | number;
  /** Enable animation */
  animate?: boolean;
}

/**
 * Base styles for skeleton
 */
const baseStyles = [
  "bg-[var(--color-bg-hover)]",
  "overflow-hidden",
  "relative",
].join(" ");

/**
 * Animation styles using a shimmer effect
 */
const animationStyles = [
  "before:absolute",
  "before:inset-0",
  "before:bg-gradient-to-r",
  "before:from-transparent",
  "before:via-[var(--color-bg-active)]",
  "before:to-transparent",
  "before:animate-shimmer",
].join(" ");

/**
 * Variant-specific styles
 */
const variantStyles: Record<SkeletonVariant, string> = {
  text: "rounded-[var(--radius-sm)]",
  circular: "rounded-[var(--radius-full)]",
  rectangular: "rounded-[var(--radius-md)]",
};

/**
 * Default dimensions for each variant
 */
const defaultDimensions: Record<
  SkeletonVariant,
  { width: string; height: string }
> = {
  text: { width: "100%", height: "1em" },
  circular: { width: "40px", height: "40px" },
  rectangular: { width: "100%", height: "100px" },
};

/**
 * Skeleton component for loading placeholder
 *
 * Displays a placeholder with optional shimmer animation
 * while content is loading.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" height={200} />
 * ```
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  animate = true,
  className = "",
  style,
  ...props
}: SkeletonProps): JSX.Element {
  const { t } = useTranslation();
  const defaults = defaultDimensions[variant];

  const computedWidth =
    width !== undefined
      ? typeof width === "number"
        ? `${width}px`
        : width
      : defaults.width;

  const computedHeight =
    height !== undefined
      ? typeof height === "number"
        ? `${height}px`
        : height
      : defaults.height;

  const classes = [
    baseStyles,
    variantStyles[variant],
    animate ? animationStyles : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      style={{
        width: computedWidth,
        height: computedHeight,
        ...style,
      }}
      role="progressbar"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t("primitives.skeleton.loading")}
      {...props}
    />
  );
}
