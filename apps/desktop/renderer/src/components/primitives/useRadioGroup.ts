/**
 * Shared types and styles for Radio components.
 *
 * Extracted from Radio.tsx to satisfy AC-18 (≤200 lines per file).
 */

export interface RadioOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Whether the option is disabled */
  disabled?: boolean;
}

export interface RadioCardOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Whether the option is disabled */
  disabled?: boolean;
}

/**
 * Size-specific styles
 */
export const sizeStyles = {
  sm: {
    radio: "w-4 h-4",
    label: "text-xs",
    description: "text-(--text-label)",
    gap: "gap-2",
  },
  md: {
    radio: "w-5 h-5",
    label: "text-sm",
    description: "text-xs",
    gap: "gap-3",
  },
} as const;

export type RadioSize = keyof typeof sizeStyles;

/**
 * Shared radio indicator styles
 */
export const radioItemStyles = [
  "rounded-[var(--radius-full)]",
  "border",
  "border-[var(--color-border-default)]",
  "bg-transparent",
  "flex",
  "items-center",
  "justify-center",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "hover:border-[var(--color-border-hover)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "data-[state=checked]:border-[var(--color-fg-default)]",
  "disabled:opacity-50",
  "disabled:cursor-not-allowed",
] as const;
