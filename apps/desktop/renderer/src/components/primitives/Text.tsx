import React from "react";

/**
 * Text size variants based on design spec §4.2 Typography
 *
 * | Variant    | Font  | Size | Weight | Line Height | Letter Spacing |
 * |------------|-------|------|--------|-------------|----------------|
 * | body       | ui    | 13px | 400    | 1.5         | 0              |
 * | bodyLarge  | body  | 16px | 400    | 1.8         | 0              |
 * | small      | ui    | 12px | 400    | 1.4         | 0              |
 * | tiny       | ui    | 11px | 400    | 1.2         | 0              |
 * | label      | ui    | 10px | 500    | 1.2         | 0.1em          |
 * | code       | mono  | 13px | 400    | 1.5         | 0              |
 */
export type TextSize =
  | "body"
  | "bodyLarge"
  | "small"
  | "tiny"
  | "label"
  | "code";

/**
 * Text color variants
 */
export type TextColor =
  | "default"
  | "muted"
  | "subtle"
  | "placeholder"
  | "error"
  | "success"
  | "warning"
  | "info";

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Typography size variant */
  size?: TextSize;
  /** Text color */
  color?: TextColor;
  /** Render as different element */
  as?: "span" | "p" | "div" | "label";
  /** Font weight override */
  weight?: "normal" | "medium" | "semibold" | "bold";
  /** Text content */
  children: React.ReactNode;
}

/**
 * Size-specific styles (design spec §4.2)
 *
 * Uses exact values from spec:
 * - body: 13px, 400, 1.5
 * - bodyLarge: 16px, 400, 1.8 (editor body)
 * - small: 12px, 400, 1.4
 * - tiny: 11px, 400, 1.2
 * - label: 10px, 500, 1.2, 0.1em uppercase
 * - code: 13px, 400, 1.5
 */
const sizeStyles: Record<TextSize, string> = {
  body: "text-(--text-body) leading-[1.5] font-normal font-[var(--font-family-ui)]",
  bodyLarge:
    "text-base leading-[1.8] font-normal font-[var(--font-family-body)]",
  small: "text-xs leading-[1.4] font-normal font-[var(--font-family-ui)]",
  tiny: "text-(--text-status) leading-[1.2] font-normal font-[var(--font-family-ui)]",
  label:
    "text-(--text-label) leading-[1.2] font-medium tracking-[0.1em] uppercase font-[var(--font-family-ui)]",
  code: "text-(--text-mono) leading-[1.5] font-normal font-[var(--font-family-mono)]",
};

/**
 * Color-specific styles
 */
const colorStyles: Record<TextColor, string> = {
  default: "text-[var(--color-fg-default)]",
  muted: "text-[var(--color-fg-muted)]",
  subtle: "text-[var(--color-fg-subtle)]",
  placeholder: "text-[var(--color-fg-placeholder)]",
  error: "text-[var(--color-error)]",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  info: "text-[var(--color-info)]",
};

/**
 * Font weight styles
 */
const weightStyles: Record<NonNullable<TextProps["weight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/**
 * Text component following design spec §4.2 Typography
 *
 * Provides consistent text styling across the application.
 * Use for body text, labels, captions, and code snippets.
 *
 * @example
 * ```tsx
 * <Text>Default body text</Text>
 * <Text size="small" color="muted">Secondary info</Text>
 * <Text size="label">SECTION LABEL</Text>
 * <Text size="code">console.log("Hello")</Text>
 * ```
 */
export function Text({
  size = "body",
  color = "default",
  as: Component = "span",
  weight,
  className = "",
  children,
  ...props
}: TextProps): JSX.Element {
  const classes = [
    sizeStyles[size],
    colorStyles[color],
    weight ? weightStyles[weight] : "",
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
