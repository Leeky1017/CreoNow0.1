import React from "react";

/**
 * Content for a single version pane.
 */
export type VersionContent = {
  /** Unique identifier */
  id: string;
  /** Display label (e.g., "Version from 2h ago") */
  label: string;
  /** The text content for this version */
  content: string;
  /** Optional timestamp */
  timestamp?: Date;
  /** Version type for styling */
  type?: "auto" | "manual" | "current";
};

type VersionPaneProps = {
  /** Version data */
  version: VersionContent;
  /** Callback when scrolled */
  onScroll?: (scrollTop: number) => void;
  /** External scroll top to sync */
  scrollTop?: number;
};

/**
 * VersionPane displays a single version's content.
 *
 * Features:
 * - Version label header
 * - Scrollable content area
 * - Monospace font for content
 * - Scroll sync support
 */
export function VersionPane(props: VersionPaneProps): JSX.Element {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const isInternalScroll = React.useRef(false);

  // Sync scroll from external source
  React.useEffect(() => {
    if (
      props.scrollTop !== undefined &&
      contentRef.current &&
      !isInternalScroll.current
    ) {
      contentRef.current.scrollTop = props.scrollTop;
    }
  }, [props.scrollTop]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>): void => {
    isInternalScroll.current = true;
    props.onScroll?.(e.currentTarget.scrollTop);
    // Reset flag after a short delay
    setTimeout(() => {
      isInternalScroll.current = false;
    }, 50);
  };

  return (
    <div
      data-testid={`version-pane-${props.version.id}`}
      className="flex flex-col h-full border border-[var(--color-separator)] rounded-lg overflow-hidden bg-[var(--color-bg-surface)]"
    >
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-3 bg-[var(--color-bg-raised)] border-b border-[var(--color-separator)] shrink-0">
        <div className="flex items-center gap-2">
          {/* Version type indicator */}
          {props.version.type === "current" && (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_6px_var(--color-success-subtle)]" />
          )}
          <span className="text-xs font-medium text-[var(--color-fg-default)]">
            {props.version.label}
          </span>
        </div>
        {props.version.type && (
          <span className="text-(--text-label) text-[var(--color-fg-subtle)] uppercase tracking-wide">
            {props.version.type === "current"
              ? "Current"
              : props.version.type === "auto"
                ? "Auto"
                : "Manual"}
          </span>
        )}
      </div>

      {/* Content */}
      <div
        data-testid={`version-pane-content-${props.version.id}`}
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 font-[var(--font-family-mono)] text-xs leading-6 text-[var(--color-fg-muted)] whitespace-pre-wrap"
      >
        {props.version.content}
      </div>
    </div>
  );
}
