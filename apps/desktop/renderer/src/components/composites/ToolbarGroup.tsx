import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface ToolbarGroupProps {
  /** Toolbar items (buttons, icons, etc.) */
  children: React.ReactNode;
  /** Whether to render a separator (border-right) after this group */
  separator?: boolean;
  /** Additional CSS class for the outer container */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
}

// =============================================================================
// Styles
// =============================================================================

const groupStyles = [
  "flex",
  "flex-row",
  "items-center",
  "gap-1",
].join(" ");

const separatorStyles = [
  "w-px",
  "h-4",
  "bg-[color:var(--color-separator)]",
  "ml-1",
  "shrink-0",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * ToolbarGroup — a reusable toolbar button group composite.
 *
 * Provides a consistent horizontal group of toolbar items with:
 * - Flex row layout with consistent gap
 * - Optional visual separator (vertical line) after the group
 *
 * Used by EditorToolbar, DiffHeader, and other toolbar areas.
 *
 * @example
 * ```tsx
 * <ToolbarGroup separator>
 *   <Button variant="ghost" size="sm">Bold</Button>
 *   <Button variant="ghost" size="sm">Italic</Button>
 * </ToolbarGroup>
 * ```
 */
export function ToolbarGroup({
  children,
  separator = false,
  className = "",
  "data-testid": testId,
}: ToolbarGroupProps): JSX.Element {
  return (
    <div
      className={`${groupStyles} ${className}`}
      data-testid={testId}
      role="group"
    >
      {children}
      {separator && <div className={separatorStyles} aria-hidden="true" />}
    </div>
  );
}
