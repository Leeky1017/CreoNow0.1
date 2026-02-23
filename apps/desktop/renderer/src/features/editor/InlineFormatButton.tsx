import React from "react";
import { createToggleButtonA11yProps } from "./a11y";

export interface InlineFormatButtonProps {
  /** Button label for accessibility */
  label: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Whether the button is currently active */
  isActive?: boolean;
  /** Whether the button is currently disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: () => void;
  /** Icon element */
  children: React.ReactNode;
  /** Optional test id */
  testId?: string;
  /** Optional extra classes for layout context */
  className?: string;
}

/**
 * Shared inline formatting action button used by toolbar and bubble menu.
 *
 * Why: bubble menu and fixed toolbar must keep interaction and visual behavior
 * consistent for the same mark actions.
 */
export function InlineFormatButton({
  label,
  shortcut,
  isActive,
  disabled,
  onClick,
  children,
  testId,
  className,
}: InlineFormatButtonProps): JSX.Element {
  const title = shortcut ? `${label} (${shortcut})` : label;

  return (
    <button
      type="button"
      data-testid={testId}
      title={title}
      {...createToggleButtonA11yProps({ label, pressed: isActive })}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]
        transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none
        ${isActive ? "bg-[var(--color-bg-selected)] text-[var(--color-fg-default)]" : "text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg-default)]"}
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
        ${className ?? ""}
      `}
    >
      {children}
    </button>
  );
}
