import React, { useState, useCallback } from "react";

import { Button } from "../../components/primitives/Button";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Textarea } from "../../components/primitives/Textarea";
import { Text } from "../../components/primitives/Text";
import { useTemplateStore, type TemplateStructure } from "../../stores/templateStore";

import { X } from "lucide-react";
// =============================================================================
// Types
// =============================================================================

interface CreateTemplateDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when template is created successfully */
  onCreated?: (templateId: string) => void;
}

// =============================================================================
// Folder/File List Item
// =============================================================================

interface ListItemProps {
  value: string;
  onRemove: () => void;
  disabled?: boolean;
}

function ListItem({ value, onRemove, disabled }: ListItemProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)]">
      <span className="flex-1 text-sm text-[var(--color-fg-default)] truncate">
        {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="text-[var(--color-fg-muted)] hover:text-[var(--color-error)] transition-colors disabled:opacity-50"
        aria-label={`Remove ${value}`}
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// =============================================================================
// Add Item Input
// =============================================================================

interface AddItemInputProps {
  placeholder: string;
  onAdd: (value: string) => void;
  disabled?: boolean;
}

function AddItemInput({ placeholder, onAdd, disabled }: AddItemInputProps): JSX.Element {
  const [value, setValue] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
  }, [value, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        className="flex-1"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleAdd}
        disabled={disabled || !value.trim()}
      >
        Add
      </Button>
    </div>
  );
}

// =============================================================================
// CreateTemplateDialog Component
// =============================================================================

/**
 * Dialog for creating custom project templates
 *
 * Allows users to define:
 * - Template name (required)
 * - Description (optional)
 * - Initial folders
 * - Initial files
 */
export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTemplateDialogProps): JSX.Element {
  const createTemplate = useTemplateStore((s) => s.createTemplate);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formId = "create-template-form";

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setFolders([]);
      setFiles([]);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  const handleAddFolder = useCallback((folder: string) => {
    setFolders((prev) => {
      if (prev.includes(folder)) return prev;
      return [...prev, folder];
    });
  }, []);

  const handleRemoveFolder = useCallback((folder: string) => {
    setFolders((prev) => prev.filter((f) => f !== folder));
  }, []);

  const handleAddFile = useCallback((file: string) => {
    setFiles((prev) => {
      if (prev.includes(file)) return prev;
      return [...prev, file];
    });
  }, []);

  const handleRemoveFile = useCallback((file: string) => {
    setFiles((prev) => prev.filter((f) => f !== file));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedName = name.trim();
      if (!trimmedName) {
        setError("Template name is required");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const structure: TemplateStructure = {
          folders,
          files: files.map((path) => ({ path })),
        };

        const template = await createTemplate({
          name: trimmedName,
          description: description.trim() || undefined,
          structure,
        });

        onCreated?.(template.id);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create template");
      } finally {
        setSubmitting(false);
      }
    },
    [name, description, folders, files, createTemplate, onCreated, onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Template"
      description="Create a reusable template for new projects."
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            data-testid="create-template-submit"
            variant="primary"
            size="sm"
            loading={submitting}
            type="submit"
            form={formId}
          >
            {submitting ? "Creating..." : "Create Template"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        data-testid="create-template-dialog"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Template Name */}
        <div>
          <label className="block mb-2">
            <Text size="small" color="muted">
              Template Name <span className="text-[var(--color-error)]">*</span>
            </Text>
          </label>
          <Input
            data-testid="create-template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g., Sci-Fi Novel"
            fullWidth
            error={!!error && !name.trim()}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2">
            <Text size="small" color="muted">
              Description{" "}
              <span className="opacity-50 text-xs">(Optional)</span>
            </Text>
          </label>
          <Textarea
            data-testid="create-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this template..."
            fullWidth
            rows={2}
          />
        </div>

        {/* Initial Folders */}
        <div>
          <label className="block mb-2">
            <Text size="small" color="muted">
              Initial Folders{" "}
              <span className="opacity-50 text-xs">(Optional)</span>
            </Text>
          </label>
          <div className="space-y-2">
            {folders.map((folder) => (
              <ListItem
                key={folder}
                value={folder}
                onRemove={() => handleRemoveFolder(folder)}
                disabled={submitting}
              />
            ))}
            <AddItemInput
              placeholder="e.g., chapters"
              onAdd={handleAddFolder}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Initial Files */}
        <div>
          <label className="block mb-2">
            <Text size="small" color="muted">
              Initial Files{" "}
              <span className="opacity-50 text-xs">(Optional)</span>
            </Text>
          </label>
          <div className="space-y-2">
            {files.map((file) => (
              <ListItem
                key={file}
                value={file}
                onRemove={() => handleRemoveFile(file)}
                disabled={submitting}
              />
            ))}
            <AddItemInput
              placeholder="e.g., outline.md"
              onAdd={handleAddFile}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Text size="small" color="muted" as="div" className="text-[var(--color-error)]">
            {error}
          </Text>
        )}
      </form>
    </Dialog>
  );
}
