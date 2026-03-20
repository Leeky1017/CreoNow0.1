import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/primitives/Button";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Textarea } from "../../components/primitives/Textarea";
import { Text } from "../../components/primitives/Text";
import {
  useTemplateStore,
  type TemplateStructure,
} from "../../stores/templateStore";
import { TemplateListItem, TemplateAddItemInput } from "./TemplateMetadataForm";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (templateId: string) => void;
}

/** Dialog for creating custom project templates */
export function CreateTemplateDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTemplateDialogProps): JSX.Element {
  const { t } = useTranslation();
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
        setError(t("projects.template.nameRequired"));
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
        setError(
          err instanceof Error
            ? err.message
            : t("projects.template.createFailed"),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      name,
      description,
      folders,
      files,
      createTemplate,
      onCreated,
      onOpenChange,
      t,
    ],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("projects.template.title")}
      description={t("projects.template.description")}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("projects.template.cancel")}
          </Button>
          <Button
            data-testid="create-template-submit"
            variant="primary"
            size="sm"
            loading={submitting}
            type="submit"
            form={formId}
          >
            {submitting
              ? t("projects.template.creating")
              : t("projects.template.createTemplate")}
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
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized label */}
          <label className="block mb-2">
            <Text size="small" color="muted">
              {t("projects.template.templateName")}{" "}
              <span className="text-[var(--color-error)]">*</span>
            </Text>
          </label>
          <Input
            data-testid="create-template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder={t("projects.template.namePlaceholder")}
            fullWidth
            error={!!error && !name.trim()}
          />
        </div>

        {/* Description */}
        <div>
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized label */}
          <label className="block mb-2">
            <Text size="small" color="muted">
              {t("projects.template.templateDescription")}{" "}
              <span className="opacity-50 text-xs">
                ({t("projects.template.optional")})
              </span>
            </Text>
          </label>
          <Textarea
            data-testid="create-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("projects.template.descriptionPlaceholder")}
            fullWidth
            rows={2}
          />
        </div>

        {/* Initial Folders */}
        <div>
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized label */}
          <label className="block mb-2">
            <Text size="small" color="muted">
              {t("projects.template.initialFolders")}{" "}
              <span className="opacity-50 text-xs">
                ({t("projects.template.optional")})
              </span>
            </Text>
          </label>
          <div className="space-y-2">
            {folders.map((folder) => (
              <TemplateListItem
                key={folder}
                value={folder}
                onRemove={() => handleRemoveFolder(folder)}
                disabled={submitting}
              />
            ))}
            <TemplateAddItemInput
              placeholder={t("projects.template.folderPlaceholder")}
              onAdd={handleAddFolder}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Initial Files */}
        <div>
          {/* eslint-disable-next-line creonow/no-native-html-element -- specialized label */}
          <label className="block mb-2">
            <Text size="small" color="muted">
              {t("projects.template.initialFiles")}{" "}
              <span className="opacity-50 text-xs">
                ({t("projects.template.optional")})
              </span>
            </Text>
          </label>
          <div className="space-y-2">
            {files.map((file) => (
              <TemplateListItem
                key={file}
                value={file}
                onRemove={() => handleRemoveFile(file)}
                disabled={submitting}
              />
            ))}
            <TemplateAddItemInput
              placeholder={t("projects.template.filePlaceholder")}
              onAdd={handleAddFile}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Text
            size="small"
            color="muted"
            as="div"
            className="text-[var(--color-error)]"
          >
            {error}
          </Text>
        )}
      </form>
    </Dialog>
  );
}
