import React from "react";

/**
 * Card variants as defined in design spec §6.3
 *
 * - default: Standard card with subtle border
 * - raised: Card with elevation shadow (for floating elements)
 * - bordered: Card with prominent border
 */
export type CardVariant =
  | "default"
  | "raised"
  | "bordered"
  | "bento"
  | "compact";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Enable hover effect (border highlight, optional shadow) */
  hoverable?: boolean;
  /** Remove padding for custom layouts */
  noPadding?: boolean;
  /** Card content */
  children: React.ReactNode;
}

/**
 * Base card styles (design spec §6.3)
 *
 * - Border radius: --radius-xl (16px)
 * - Padding: var(--space-section-gap) (24px)
 * - Background: --color-bg-surface
 */
const baseStyles = [
  "rounded-[var(--radius-xl)]",
  "bg-[var(--color-bg-surface)]",
  "transition-all",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
].join(" ");

/**
 * Variant-specific styles (design spec §5.2)
 *
 * Note: Cards default to NO shadow per design spec §5.2.
 * Shadows are reserved for floating elements (popover/dropdown/modal).
 */
const variantStyles: Record<CardVariant, string> = {
  default: "border border-[var(--color-border-default)]",
  raised: "border border-[var(--color-border-default)] shadow-md",
  bordered: "border-2 border-[var(--color-border-default)]",
  bento: [
    "rounded-[var(--radius-2xl)]",
    "border",
    "border-[var(--color-border-default)]",
    "transition-colors",
    "duration-[var(--duration-normal)]",
  ].join(" "),
  compact: [
    "rounded-[var(--radius-md)]",
    "border",
    "border-[var(--color-border-default)]",
  ].join(" "),
};

/**
 * Hover styles (design spec §6.3)
 *
 * - Border color change
 * - MAY add --shadow-sm for clickable cards
 */
const hoverableStyles = [
  "cursor-pointer",
  "hover:border-[var(--color-border-hover)]",
  "hover:shadow-sm",
].join(" ");

/**
 * Card component following design spec §6.3
 *
 * Container component with consistent styling for content grouping.
 * Supports multiple variants and optional hover effects.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here.</p>
 * </Card>
 *
 * <Card variant="raised" hoverable onClick={handleClick}>
 *   Clickable elevated card
 * </Card>
 * ```
 */
export function Card({
  variant = "default",
  hoverable = false,
  noPadding = false,
  className = "",
  children,
  ...props
}: CardProps): JSX.Element {
  const paddingClass = noPadding
    ? ""
    : variant === "bento"
      ? "p-[var(--space-8)]"
      : variant === "compact"
        ? "p-[var(--space-3)] space-y-[var(--space-1)]"
        : "p-[var(--space-section-gap)]";

  const classes = [
    baseStyles,
    variantStyles[variant],
    hoverable ? hoverableStyles : "",
    paddingClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
