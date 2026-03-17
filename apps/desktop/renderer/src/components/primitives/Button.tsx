import React from "react";

/**
 * Button variants as defined in design spec §6.1
 *
 * - primary: Main CTA, solid fill
 * - secondary: Secondary actions, bordered
 * - ghost: Lightweight actions, no border
 * - danger: Destructive actions, red tinted
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/**
 * Button sizes as defined in design spec §6.1
 *
 * | Size | Height | H-Padding | Font Size | Border Radius |
 * |------|--------|-----------|-----------|---------------|
 * | sm   | 28px   | 12px      | 12px      | --radius-sm   |
 * | md   | 36px   | 16px      | 13px      | --radius-md   |
 * | lg   | 44px   | 20px      | 14px      | --radius-md   |
 */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Base styles shared by all button variants
 */
const baseStyles = [
  "inline-flex",
  "items-center",
  "justify-center",
  "gap-2",
  "font-medium",
  "cursor-pointer",
  "select-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  // Overflow handling (design spec: 文字过长使用 text-ellipsis 截断)
  "overflow-hidden",
  "max-w-full",
  // Focus visible uses outline (design spec §3.5)
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  // Disabled state
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
].join(" ");

/**
 * Variant-specific styles (design spec §6.1)
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--color-fg-default)]",
    "text-[var(--color-fg-inverse)]",
    "border-0",
    "hover:bg-[var(--color-fg-muted)]",
    "active:bg-[var(--color-fg-subtle)]",
  ].join(" "),
  secondary: [
    "bg-transparent",
    "text-[var(--color-fg-default)]",
    "border",
    "border-[var(--color-border-default)]",
    "hover:border-[var(--color-border-hover)]",
    "hover:bg-[var(--color-bg-hover)]",
    "active:bg-[var(--color-bg-active)]",
  ].join(" "),
  ghost: [
    "bg-transparent",
    "text-[var(--color-fg-muted)]",
    "border-0",
    "hover:bg-[var(--color-bg-hover)]",
    "hover:text-[var(--color-fg-default)]",
    "active:bg-[var(--color-bg-active)]",
  ].join(" "),
  danger: [
    "bg-transparent",
    "text-[var(--color-error)]",
    "border",
    "border-[var(--color-error)]",
    "hover:bg-[var(--color-error-subtle)]",
    "active:bg-[var(--color-error-subtle)]",
  ].join(" "),
};

/**
 * Size-specific styles (design spec §6.1)
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs rounded-[var(--radius-sm)]",
  md: "h-9 px-4 text-[13px] rounded-[var(--radius-md)]",
  lg: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
};

/**
 * Loading spinner component
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
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
 * Button component following design spec §6.1
 *
 * Supports multiple variants (primary, secondary, ghost, danger) and sizes (sm, md, lg).
 * Implements proper focus-visible states using outline as per §3.5.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Save</Button>
 * <Button variant="secondary" size="sm" loading>Saving...</Button>
 * <Button variant="danger">Delete</Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ): JSX.Element {
    const isDisabled = disabled || loading;

    const classes = [
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      // eslint-disable-next-line creonow/no-native-html-element -- Primitive: Button wraps native <button>
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={classes}
        {...props}
      >
        {loading && <Spinner />}
        <span className="inline-flex items-center gap-2 truncate">
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";
