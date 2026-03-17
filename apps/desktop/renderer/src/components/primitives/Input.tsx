import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show error state styling */
  error?: boolean;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Base input styles (design spec §6.2)
 *
 * - Height: 40px
 * - Padding: 0 12px
 * - Border radius: --radius-sm (4px)
 * - Font size: 13px
 */
const baseStyles = [
  "h-10",
  "px-3",
  "text-[13px]",
  "leading-10",
  "rounded-[var(--radius-sm)]",
  "bg-[var(--color-bg-surface)]",
  "text-[var(--color-fg-default)]",
  "border",
  "border-[var(--color-border-default)]",
  "placeholder:text-[var(--color-fg-placeholder)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
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
 * Input component following design spec §6.2
 *
 * Single-line text input with proper focus and error states.
 * Supports ref forwarding for focus management.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text..." />
 * <Input error placeholder="Invalid input" />
 * <Input disabled value="Disabled" />
 * <Input ref={inputRef} /> // Ref forwarding
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { error = false, fullWidth = false, className = "", ...props },
    ref,
  ) {
    const classes = [
      baseStyles,
      error ? errorStyles : "",
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // eslint-disable-next-line creonow/no-native-html-element -- Primitive: Input wraps native <input>
    return <input ref={ref} className={classes} {...props} />;
  },
);
