import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface PanelContainerProps {
  /** Panel title displayed in the header */
  title: string;
  /** Optional icon displayed before the title */
  icon?: React.ReactNode;
  /** Optional action buttons rendered on the right side of the header */
  actions?: React.ReactNode;
  /** Panel body content */
  children: React.ReactNode;
  /** Additional CSS class for the outer container */
  className?: string;
  /** data-testid for testing */
  "data-testid"?: string;
}

// =============================================================================
// Styles
// =============================================================================

const containerStyles = [
  "flex",
  "flex-col",
  "h-full",
  "min-h-0",
  "bg-[color:var(--color-bg-surface)]",
].join(" ");

const headerStyles = [
  "flex",
  "items-center",
  "justify-between",
  "p-3",
  "border-b",
  "border-[color:var(--color-separator)]",
].join(" ");

const titleGroupStyles = [
  "flex",
  "items-center",
  "gap-2",
  "text-(--text-body)",
  "text-[color:var(--color-fg-muted)]",
  "font-medium",
].join(" ");

const bodyStyles = ["flex-1", "overflow-auto", "min-h-0"].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * PanelContainer — a reusable panel composite with header + body.
 *
 * Provides a consistent panel layout with:
 * - Header: icon (optional) + title + action buttons (optional)
 * - Body: flex-1 scrollable content area
 *
 * Used by AiPanel, SearchPanel, FileTreePanel, and other sidebar panels.
 */
export function PanelContainer({
  title,
  icon,
  actions,
  children,
  className = "",
  "data-testid": testId,
}: PanelContainerProps): JSX.Element {
  return (
    <section data-testid={testId} className={`${containerStyles} ${className}`}>
      <div className={headerStyles}>
        <div className={titleGroupStyles}>
          {icon && <span className="flex items-center">{icon}</span>}
          <span>{title}</span>
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      <div className={bodyStyles}>{children}</div>
    </section>
  );
}
