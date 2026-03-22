import React from "react";

// =============================================================================
// Types
// =============================================================================

export interface EmptyStateProps {
  /** Optional icon displayed above the title */
  icon?: React.ReactNode;
  /** Optional illustration (takes priority over icon when both provided) */
  illustration?: React.ReactNode;
  /** Main title text describing the empty state */
  title: string;
  /** Optional description providing additional context */
  description?: string;
  /** Optional action slot (typically a button) */
  action?: React.ReactNode;
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
  "items-center",
  "justify-center",
  "gap-3",
  "p-6",
  "text-center",
].join(" ");

const iconStyles = [
  "text-[color:var(--color-fg-muted)]",
  "[&>svg]:w-12",
  "[&>svg]:h-12",
].join(" ");

const titleStyles = [
  "text-sm",
  "font-semibold",
  "text-[color:var(--color-fg-default)]",
].join(" ");

const descriptionStyles = [
  "text-xs",
  "text-[color:var(--color-fg-muted)]",
  // eslint-disable-next-line creonow/no-hardcoded-dimension -- Composite: max-width for text readability
  "max-w-[240px]",
  "leading-relaxed",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * EmptyState — a reusable composite for displaying empty content states.
 *
 * Provides a consistent empty state layout with:
 * - Icon (optional): muted color, 48px size
 * - Title: semibold text
 * - Description (optional): muted helper text
 * - Action (optional): slot for a CTA button
 *
 * Used by FileTreePanel, CharacterCardList, and other panels to
 * display a consistent "no content" message with optional actions.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<FolderOpen />}
 *   title="暂无文件"
 *   description="开始创建你的第一个文件"
 *   action={<Button onClick={onCreate}>新建文件</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className = "",
  "data-testid": testId,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      data-testid={testId}
      className={`${containerStyles} ${className}`}
      role="status"
    >
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : (
        icon && <div className={iconStyles}>{icon}</div>
      )}
      <h3 className={titleStyles}>{title}</h3>
      {description && <p className={descriptionStyles}>{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
