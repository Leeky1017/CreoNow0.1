/**
 * DeleteConfirmDialog component
 *
 * A confirmation dialog for deleting a character.
 * Shows a warning message and requires explicit confirmation.
 * Refactored to use ConfirmDialog composite.
 */
import { ConfirmDialog } from "../../components/composites/ConfirmDialog";

export interface DeleteConfirmDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Name of the character to delete */
  characterName: string;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
}

/**
 * DeleteConfirmDialog - Confirmation dialog for character deletion
 *
 * Built on ConfirmDialog composite with destructive styling.
 * Maintains the same external API for backward compatibility.
 *
 * @example
 * ```tsx
 * <DeleteConfirmDialog
 *   open={showDeleteConfirm}
 *   onOpenChange={setShowDeleteConfirm}
 *   characterName={character.name}
 *   onConfirm={() => deleteCharacter(character.id)}
 * />
 * ```
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  characterName,
  onConfirm,
}: DeleteConfirmDialogProps): JSX.Element {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      title="Delete Character"
      description={`Are you sure you want to delete "${characterName}"? This action cannot be undone. All their data, including relationships and chapter appearances, will be removed.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      destructive
      onConfirm={handleConfirm}
      onCancel={() => onOpenChange(false)}
    />
  );
}

