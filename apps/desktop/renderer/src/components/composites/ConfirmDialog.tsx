import React from "react";
import { Dialog } from "../primitives/Dialog";

// =============================================================================
// Types
// =============================================================================

export interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Description text explaining the action */
  description: string;
  /** Label for the confirm button */
  confirmLabel: string;
  /** Label for the cancel button */
  cancelLabel: string;
  /** Whether the action is destructive (applies danger styling to confirm) */
  destructive?: boolean;
  /** Callback when the user confirms */
  onConfirm: () => void;
  /** Callback when the user cancels */
  onCancel: () => void;
  /** Controlled open state */
  open: boolean;
}

// =============================================================================
// Styles
// =============================================================================

const confirmBaseStyles = [
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "rounded-[var(--radius-md)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

const confirmDefaultStyles = [
  "bg-[var(--color-fg-default)]",
  "text-[var(--color-fg-inverse)]",
  "hover:bg-[var(--color-fg-muted)]",
].join(" ");

const confirmDestructiveStyles = [
  "destructive",
  "bg-[var(--color-error)]",
  "text-[var(--color-fg-inverse)]",
  "hover:bg-[var(--color-error)]/90",
].join(" ");

const cancelStyles = [
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "rounded-[var(--radius-md)]",
  "bg-transparent",
  "text-[var(--color-fg-muted)]",
  "hover:bg-[var(--color-bg-hover)]",
  "hover:text-[var(--color-fg-default)]",
  "transition-colors",
  "duration-[var(--duration-fast)]",
  "focus-visible:outline",
  "focus-visible:outline-[length:var(--ring-focus-width)]",
  "focus-visible:outline-offset-[var(--ring-focus-offset)]",
  "focus-visible:outline-[var(--color-ring-focus)]",
].join(" ");

// =============================================================================
// Component
// =============================================================================

/**
 * ConfirmDialog — a reusable confirmation dialog composite.
 *
 * Built on top of the Dialog primitive, providing a standard
 * confirmation pattern with:
 * - Title and description
 * - Confirm and Cancel buttons
 * - Optional destructive styling (red confirm button)
 *
 * Used for delete confirmations, irreversible actions, etc.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="Delete project?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   destructive
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
  open,
}: ConfirmDialogProps): JSX.Element {
  const confirmClassName = destructive
    ? `${confirmBaseStyles} ${confirmDestructiveStyles}`
    : `${confirmBaseStyles} ${confirmDefaultStyles}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      title={title}
      description={description}
      closeOnEscape
      closeOnOverlayClick
      footer={
        <>
          <button
            type="button"
            className={cancelStyles}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {/* Dialog body is empty — title + description cover the content */}
      <span />
    </Dialog>
  );
}
