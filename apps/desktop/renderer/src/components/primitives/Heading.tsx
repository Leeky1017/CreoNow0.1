import React from "react";

/**
 * Heading level variants based on design spec §4.2 Typography
 *
 * | Level | Font | Size | Weight | Line Height | Letter Spacing |
 * |-------|------|------|--------|-------------|----------------|
 * | h1    | ui   | 24px | 600    | 1.2         | -0.02em        |
 * | h2    | ui   | 16px | 600    | 1.3         | -0.01em        |
 * | h3    | ui   | 14px | 500    | 1.4         | 0              |
 * | h4    | ui   | 13px | 500    | 1.4         | 0              |
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4";

/**
 * Heading color variants
 */
export type HeadingColor = "default" | "muted" | "subtle";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Heading level (semantic and visual) */
  level?: HeadingLevel;
  /** Visual style override (renders different level than semantic) */
  as?: HeadingLevel;
  /** Text color */
  color?: HeadingColor;
  /** Heading content */
  children: React.ReactNode;
}

/**
 * Level-specific styles (design spec §4.2)
 *
 * Uses exact values from spec rather than Tailwind defaults:
 * - h1: 24px, 600, 1.2, -0.02em
 * - h2: 16px, 600, 1.3, -0.01em
 * - h3: 14px, 500, 1.4, 0
 * - h4: 13px, 500, 1.4, 0
 */
const levelStyles: Record<HeadingLevel, string> = {
  h1: "text-2xl font-semibold leading-[1.2] tracking-[-0.02em]",
  h2: "text-base font-semibold leading-[1.3] tracking-[-0.01em]",
  h3: "text-sm font-medium leading-[1.4] tracking-normal",
  h4: "text-(--text-body) font-medium leading-[1.4] tracking-normal",
};

/**
 * Color-specific styles
 */
const colorStyles: Record<HeadingColor, string> = {
  default: "text-[var(--color-fg-default)]",
  muted: "text-[var(--color-fg-muted)]",
  subtle: "text-[var(--color-fg-subtle)]",
};

/**
 * Heading component following design spec §4.2 Typography
 *
 * Provides semantic heading elements with consistent styling.
 * Use for page titles, section headers, and card titles.
 *
 * @example
 * ```tsx
 * <Heading level="h1">Page Title</Heading>
 * <Heading level="h2">Section Header</Heading>
 * <Heading level="h3" color="muted">Card Title</Heading>
 *
 * // Use `as` to override visual style while keeping semantics
 * <Heading level="h2" as="h1">Visually Large but Semantic H2</Heading>
 * ```
 */
export function Heading({
  level = "h2",
  as,
  color = "default",
  className = "",
  children,
  ...props
}: HeadingProps): JSX.Element {
  const Component = level;
  const visualLevel = as ?? level;

  const classes = [
    "font-[var(--font-family-ui)]",
    levelStyles[visualLevel],
    colorStyles[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
