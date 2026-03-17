import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface SidebarItemProps {
  /** Optional icon displayed before the label */
  icon?: React.ReactNode;
  /** Item label text */
  label: string;
  /** Whether this item is in active/selected state */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional trailing content (e.g. badge, count) */
  trailing?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
}

// =============================================================================
// Styles
// =============================================================================

const baseStyles = [
  "flex",
  "items-center",
  "gap-2",
  "px-3",
  "h-8",
  "rounded-[var(--radius-sm)]",
  "text-[13px]",
  "text-[color:var(--color-fg-default)]",
  "cursor-pointer",
  "select-none",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "ease-[var(--ease-default)]",
  "hover:bg-[color:var(--color-bg-hover)]",
  "active:bg-[color:var(--color-bg-active)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[-2px]",
  "focus-visible:outline-[var(--color-ring-focus)]",
  "overflow-hidden",
  "min-w-0",
].join(" ");

const activeStyles = "bg-[color:var(--color-bg-selected)]";

// =============================================================================
// Component
// =============================================================================

/**
 * SidebarItem — a reusable sidebar list item composite.
 *
 * Provides a consistent sidebar entry with:
 * - Icon (optional)
 * - Label text (truncated)
 * - Active/selected visual state
 * - Trailing content slot (badges, counts)
 *
 * Used by FileTreePanel, OutlinePanel, and similar sidebar sections.
 */
export function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
  trailing,
  className = "",
  "data-testid": testId,
}: SidebarItemProps): JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={testId}
      data-active={active}
      className={`${baseStyles} ${active ? activeStyles : ""} ${className}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {icon && <span className="flex items-center shrink-0">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
      {trailing && (
        <span className="flex items-center shrink-0">{trailing}</span>
      )}
    </div>
  );
}
