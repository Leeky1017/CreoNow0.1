import { Button } from "../primitives/Button";
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
          <Button
            variant="ghost"
            size="md"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* Dialog body is empty — title + description cover the content */}
      <span />
    </Dialog>
  );
}
