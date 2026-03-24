import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show error state styling */
  error?: boolean;
  /** Full width textarea */
  fullWidth?: boolean;
}

/**
 * Base textarea styles (similar to Input, design spec §6.2)
 *
 * - Padding: 12px
 * - Border radius: --radius-sm (4px)
 * - Font size: 13px
 * - Min height: 80px
 */
const baseStyles = [
  "min-h-20",
  "p-3",
  "text-(--text-body)",
  "leading-[1.5]",
  "rounded-[var(--radius-sm)]",
  "bg-[var(--color-bg-surface)]",
  "text-[var(--color-fg-default)]",
  "border",
  "border-[var(--color-border-default)]",
  "placeholder:text-[var(--color-fg-placeholder)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "resize-y",
  // Hover state
  "hover:border-[var(--color-border-hover)]",
  // Focus-visible state (design spec §7.2)
  "focus-visible:border-[var(--color-border-focus)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  // Disabled state
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
  "disabled:resize-none",
].join(" ");

/**
 * Error state styles
 */
const errorStyles = [
  "border-[var(--color-error)]",
  "hover:border-[var(--color-error)]",
  "focus-visible:border-[var(--color-error)]",
].join(" ");

/**
 * Textarea component following design spec §6.2
 *
 * Multi-line text input with proper focus and error states.
 *
 * @example
 * ```tsx
 * <Textarea placeholder="Enter description..." rows={4} />
 * <Textarea error placeholder="Invalid content" />
 * <Textarea disabled value="Read only" />
 * ```
 */
export function Textarea({
  error = false,
  fullWidth = false,
  className = "",
  ...props
}: TextareaProps): JSX.Element {
  const classes = [
    baseStyles,
    error ? errorStyles : "",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // eslint-disable-next-line creonow/no-native-html-element -- Primitive: Textarea wraps native <textarea>
  return <textarea className={classes} {...props} />;
}
