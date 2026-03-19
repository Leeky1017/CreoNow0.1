import React from "react";

/**
 * Badge variants as defined in design spec
 *
 * - default: 默认灰色背景
 * - success: 成功状态（绿色）
 * - warning: 警告状态（橙色）
 * - error: 错误状态（红色）
 * - info: 信息状态（蓝色）
 */
export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pill";

/**
 * Badge sizes
 *
 * | Size | Height | Font Size | Padding |
 * |------|--------|-----------|---------|
 * | sm   | 18px   | 10px      | 4px 6px |
 * | md   | 22px   | 12px      | 4px 8px |
 */
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Badge content */
  children: React.ReactNode;
}

/**
 * Base styles shared by all badge variants
 */
const baseStyles = [
  "inline-flex",
  "items-center",
  "justify-center",
  "font-medium",
  "select-none",
  "rounded-[var(--radius-full)]",
  "whitespace-nowrap",
].join(" ");

/**
 * Variant-specific styles
 */
const variantStyles: Record<BadgeVariant, string> = {
  default: ["bg-[var(--color-bg-hover)]", "text-[var(--color-fg-muted)]"].join(
    " ",
  ),
  success: [
    "bg-[var(--color-success-subtle)]",
    "text-[var(--color-success)]",
  ].join(" "),
  warning: [
    "bg-[var(--color-warning-subtle)]",
    "text-[var(--color-warning)]",
  ].join(" "),
  error: ["bg-[var(--color-error-subtle)]", "text-[var(--color-error)]"].join(
    " ",
  ),
  info: ["bg-[var(--color-info-subtle)]", "text-[var(--color-info)]"].join(" "),
  pill: [
    "bg-[var(--color-bg-hover)]",
    "text-[var(--color-fg-muted)]",
    "uppercase",
    "tracking-[var(--tracking-wide)]",
    "font-[var(--weight-semibold)]",
    "rounded-[var(--radius-full)]",
  ].join(" "),
};

/**
 * Size-specific styles
 */
const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-[18px] px-1.5 text-[var(--text-label-size)]",
  md: "h-[22px] px-2 text-[var(--text-caption-size)]",
};

/**
 * Pill variant 使用独立的尺寸（设计稿：padding 6px 14px）
 */
const pillSizeStyles: Record<BadgeSize, string> = {
  sm: "py-1 px-2.5 text-[var(--text-label-size)]",
  md: "py-1.5 px-3.5 text-[var(--text-label-size)]",
};

/**
 * Badge component for displaying status indicators, labels, or counts
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error" size="sm">3</Badge>
 * ```
 */
export function Badge({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps): JSX.Element {
  const resolvedSizeStyles =
    variant === "pill" ? pillSizeStyles[size] : sizeStyles[size];

  const classes = [
    baseStyles,
    variantStyles[variant],
    resolvedSizeStyles,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
