/**
 * DeleteConfirmDialog component
 *
 * A confirmation dialog for deleting a character.
 * Shows a warning message and requires explicit confirmation.
 */
import { Dialog, Button } from "../../components/primitives";

import { TriangleAlert } from "lucide-react";
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
 * Warning icon
 */
function WarningIcon() {
  return <TriangleAlert size={24} strokeWidth={1.5} className="text-[var(--color-warning)]" />;
}

/**
 * DeleteConfirmDialog - Confirmation dialog for character deletion
 *
 * Features:
 * - Warning icon and message
 * - Displays character name in message
 * - Cancel and Delete buttons
 * - Delete button uses danger variant
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Character"
      description={`Are you sure you want to delete "${characterName}"? This action cannot be undone.`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div className="shrink-0 p-2 rounded-full bg-[var(--color-warning)]/10">
          <WarningIcon />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
            Deleting <strong className="text-[var(--color-fg-default)]">{characterName}</strong> will
            remove all their data, including relationships and chapter appearances.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
