import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface CommandItemProps {
  /** Optional icon displayed before the label */
  icon?: React.ReactNode;
  /** Command label text */
  label: string;
  /** Override label rendering with custom React content (e.g. highlighted text) */
  labelContent?: React.ReactNode;
  /** Optional keyboard shortcut hint */
  hint?: string;
  /** Callback when the command is selected */
  onSelect?: () => void;
  /** Whether this item is in active/highlighted state */
  active?: boolean;
  /** Mouse enter handler (e.g. for hover-based active state tracking) */
  onMouseEnter?: () => void;
  /** Additional CSS class */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
  /** data-index for keyboard navigation tracking */
  "data-index"?: number;
}

// =============================================================================
// Styles
// =============================================================================

const baseStyles = [
  "relative",
  "h-10",
  "flex",
  "items-center",
  "px-3",
  "rounded-[var(--radius-sm)]",
  "cursor-pointer",
  "mb-0.5",
  "transition-colors",
  "duration-[var(--duration-fast)]",
].join(" ");

const activeStyles = [
  "bg-[color:var(--color-bg-hover)]",
  "text-[color:var(--color-fg-default)]",
].join(" ");

const inactiveStyles = [
  "text-[color:var(--color-fg-muted)]",
  "hover:bg-[color:var(--color-bg-hover)]",
  "hover:text-[color:var(--color-fg-default)]",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * CommandItem — a reusable command palette item composite.
 *
 * Provides a consistent command entry with:
 * - Icon (optional)
 * - Label text
 * - Keyboard shortcut hint (optional)
 * - Active/highlighted visual state
 * - Active indicator bar
 *
 * Used by CommandPalette for rendering individual command options.
 */
export function CommandItem({
  icon,
  label,
  labelContent,
  hint,
  onSelect,
  active = false,
  onMouseEnter,
  className = "",
  "data-testid": testId,
  "data-index": dataIndex,
}: CommandItemProps): JSX.Element {
  return (
    <div
      role="option"
      aria-selected={active}
      data-testid={testId}
      data-index={dataIndex}
      className={`${baseStyles} ${active ? activeStyles : inactiveStyles} ${className}`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      tabIndex={0}
    >
      {/* Active indicator bar */}
      {active && (
        <div className="absolute left-0 top-2.5 bottom-2.5 w-0.5 bg-[var(--color-accent-blue)] rounded-r-sm" />
      )}

      {/* Icon */}
      {icon && (
        <div className="w-4 h-4 mr-3 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}

      {/* Label */}
      <span className="flex-1 text-[13px] truncate">{labelContent ?? label}</span>

      {/* Shortcut hint */}
      {hint && (
        <div
          className={`ml-2 px-1.5 py-0.5 text-[11px] rounded bg-[color:var(--color-bg-selected)] border border-[color:var(--color-separator)] ${
            active
              ? "text-[color:var(--color-fg-default)] border-[color:var(--color-border-default)]"
              : "text-[color:var(--color-fg-muted)]"
          }`}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
