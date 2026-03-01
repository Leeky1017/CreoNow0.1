import React, { useState, useEffect, useCallback, useMemo } from "react";

import { Button } from "../../components/primitives/Button";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Textarea } from "../../components/primitives/Textarea";
import { Text } from "../../components/primitives/Text";
import {
  RadioCardItem,
  RadioGroupRoot,
} from "../../components/primitives/Radio";
import { ImageUpload } from "../../components/primitives/ImageUpload";
import {
  ImageCropper,
  type CropArea,
} from "../../components/composites/ImageCropper";
import { useProjectStore } from "../../stores/projectStore";
import { useTemplateStore } from "../../stores/templateStore";
import { CreateTemplateDialog } from "./CreateTemplateDialog";

// =============================================================================
// Types
// =============================================================================

interface CreateProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
}

interface FormContentProps {
  formId: string;
  initialName?: string;
  initialDescription?: string;
  initialType?: "novel" | "screenplay" | "media";
  defaultTemplateId: string;
  presetOptions: Array<{ value: string; label: string }>;
  customOptions: Array<{ value: string; label: string }>;
  hasCustomTemplates: boolean;
  lastError: { code: string; message: string } | null;
  onSubmit: (data: {
    name: string;
    type?: "novel" | "screenplay" | "media";
    templateId: string;
    description: string;
    coverImage: File | null;
    cropArea: CropArea | null;
  }) => Promise<void>;
  onOpenCreateTemplate: () => void;
}

function mapPresetToBuiltInTemplateId(presetId: string): string {
  switch (presetId) {
    case "preset-novel":
      return "novel";
    case "preset-short":
      return "short-story";
    case "preset-script":
      return "screenplay";
    case "preset-other":
      return "custom";
    default:
      return presetId;
  }
}

// =============================================================================
// Form Content Component
// =============================================================================

function FormContent({
  formId,
  initialName,
  initialDescription,
  initialType,
  defaultTemplateId,
  presetOptions,
  customOptions,
  hasCustomTemplates,
  lastError,
  onSubmit,
  onOpenCreateTemplate,
}: FormContentProps): JSX.Element {
  const [name, setName] = useState(initialName ?? "");
  const [templateId, setTemplateId] = useState(defaultTemplateId);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [nameError, setNameError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const selectableTemplateIds = useMemo(
    () => new Set([...presetOptions, ...customOptions].map((opt) => opt.value)),
    [customOptions, presetOptions],
  );

  useEffect(() => {
    if (initialName !== undefined) {
      setName(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (initialDescription !== undefined) {
      setDescription(initialDescription);
    }
  }, [initialDescription]);

  useEffect(() => {
    if (initialType === "screenplay" && presetOptions.length >= 3) {
      setTemplateId(presetOptions[2].value);
      return;
    }
    if (initialType === "media" && presetOptions.length >= 4) {
      setTemplateId(presetOptions[3].value);
      return;
    }
    if (initialType === "novel" && presetOptions.length >= 1) {
      setTemplateId(presetOptions[0].value);
    }
  }, [initialType, presetOptions]);

  useEffect(() => {
    if (!defaultTemplateId) {
      return;
    }
    if (templateId.length > 0 && selectableTemplateIds.has(templateId)) {
      return;
    }
    setTemplateId(defaultTemplateId);
  }, [defaultTemplateId, selectableTemplateIds, templateId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate name
      const trimmedName = name.trim();
      if (!trimmedName) {
        setNameError(true);
        return;
      }

      setNameError(false);
      setSubmitting(true);

      try {
        await onSubmit({
          name: trimmedName,
          type: initialType,
          templateId,
          description,
          coverImage,
          cropArea,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [coverImage, cropArea, description, initialType, name, onSubmit, templateId],
  );

  return (
    <form
      id={formId}
      data-testid="create-project-dialog"
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-6"
    >
      {/* Project Name */}
      <div>
        <label className="block mb-2">
          <Text size="small" color="muted">
            Project Name <span className="text-[var(--color-error)]">*</span>
          </Text>
        </label>
        <Input
          data-testid="create-project-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(false);
          }}
          autoFocus
          placeholder="e.g., The Silent Echo"
          fullWidth
          error={nameError}
          className={nameError ? "animate-shake" : ""}
        />
        {nameError && (
          <Text
            size="small"
            color="muted"
            as="div"
            className="mt-1 text-[var(--color-error)]"
          >
            Project name is required
          </Text>
        )}
      </div>

      {/* Template Selection */}
      <div>
        <label className="block mb-2">
          <Text size="small" color="muted">
            Template
          </Text>
        </label>

        <RadioGroupRoot
          value={templateId}
          onValueChange={setTemplateId}
          className="grid grid-cols-2 gap-3"
        >
          {/* Preset Templates */}
          {presetOptions.map((opt) => (
            <RadioCardItem
              key={opt.value}
              value={opt.value}
              label={opt.label}
            />
          ))}
        </RadioGroupRoot>

        {/* Custom Templates */}
        {hasCustomTemplates && (
          <div className="mt-4">
            <Text size="small" color="muted" as="div" className="mb-2">
              Your Templates
            </Text>
            <RadioGroupRoot
              value={templateId}
              onValueChange={setTemplateId}
              className="grid grid-cols-2 gap-3"
            >
              {customOptions.map((opt) => (
                <RadioCardItem
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                />
              ))}
            </RadioGroupRoot>
          </div>
        )}

        {/* Create Template Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={onOpenCreateTemplate}
            className="h-10 px-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-sm text-[var(--color-fg-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-fg-default)] transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Template
          </button>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block mb-2">
          <Text size="small" color="muted">
            Description <span className="opacity-50 text-xs">(Optional)</span>
          </Text>
        </label>
        <Textarea
          data-testid="create-project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of your project..."
          fullWidth
          rows={2}
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block mb-2">
          <Text size="small" color="muted">
            Cover Image <span className="opacity-50 text-xs">(Optional)</span>
          </Text>
        </label>
        <ImageUpload
          value={coverImage}
          onChange={setCoverImage}
          onError={setImageError}
          placeholder="Click or drag image to upload"
          hint="PNG, JPG up to 5MB"
        />
        {coverImage && (
          <ImageCropper
            file={coverImage}
            onCropChange={setCropArea}
          />
        )}
        {imageError && (
          <Text
            size="small"
            color="muted"
            as="div"
            className="mt-1 text-[var(--color-error)]"
          >
            {imageError}
          </Text>
        )}
      </div>

      {/* Error Message */}
      {lastError && (
        <Text
          size="small"
          color="muted"
          as="div"
          className="text-[var(--color-error)]"
        >
          {lastError.code}: {lastError.message}
        </Text>
      )}

      {/* Submit button state indicator (hidden, used by parent) */}
      <input type="hidden" data-submitting={submitting} />
    </form>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * CreateProjectDialog - Full-featured dialog for creating new projects
 *
 * Features:
 * - Project name (required)
 * - Template selection (preset + custom)
 * - Description (optional)
 * - Cover image (optional)
 * - Create Template entry point
 */
export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps): JSX.Element {
  // Project store
  const createAndSetCurrent = useProjectStore((s) => s.createAndSetCurrent);
  const createAiAssistDraft = useProjectStore((s) => s.createAiAssistDraft);
  const clearError = useProjectStore((s) => s.clearError);
  const lastError = useProjectStore((s) => s.lastError);

  // Template store
  const presets = useTemplateStore((s) => s.presets);
  const customs = useTemplateStore((s) => s.customs);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);

  // CreateTemplateDialog state
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [mode, setMode] = useState<"manual" | "ai-assist">("manual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<{
    name: string;
    type: "novel" | "screenplay" | "media";
    description: string;
    chapterOutlines: string[];
    characters: string[];
  } | null>(null);

  const formId = "create-project-form";

  // Compute default template ID
  const defaultTemplateId = useMemo(
    () => (presets.length > 0 ? presets[0].id : ""),
    [presets],
  );

  // Build options for RadioCardGroup
  const presetOptions = useMemo(
    () => presets.map((t) => ({ value: t.id, label: t.name })),
    [presets],
  );

  const customOptions = useMemo(
    () => customs.map((t) => ({ value: t.id, label: t.name })),
    [customs],
  );

  const hasCustomTemplates = customs.length > 0;

  // Load templates on mount
  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  // Clear error when dialog closes
  useEffect(() => {
    if (!open) {
      clearError();
      setMode("manual");
      setAiPrompt("");
      setAiGenerating(false);
      setAiErrorMessage(null);
      setAiDraft(null);
      setSubmitError(null);
    }
  }, [open, clearError]);

  const handleSubmit = useCallback(
    async (data: {
      name: string;
      type?: "novel" | "screenplay" | "media";
      templateId: string;
      description?: string;
    }) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const selectedPreset = presets.find(
          (preset) => preset.id === data.templateId,
        );
        const selectedCustom = customs.find(
          (custom) => custom.id === data.templateId,
        );
        const template = selectedCustom
          ? {
              kind: "custom" as const,
              structure: {
                folders: selectedCustom.structure.folders,
                files: selectedCustom.structure.files.map((file) => ({
                  path: file.path,
                  ...(file.content === undefined
                    ? {}
                    : { content: file.content }),
                })),
              },
            }
          : selectedPreset
            ? {
                kind: "builtin" as const,
                id: mapPresetToBuiltInTemplateId(selectedPreset.id),
              }
            : undefined;

        const res = await createAndSetCurrent({
          name: data.name,
          type: data.type,
          description: data.description,
          template,
        });

        if (!res.ok) {
          setSubmitError({
            code: res.error.code,
            message: res.error.message,
          });
          console.error("[CreateProjectDialog] createProject failed:", {
            operation: "createAndSetCurrent",
            code: res.error.code,
            message: res.error.message,
            error: res.error,
          });
          setSubmitting(false);
          return;
        }

        setSubmitError(null);
        setSubmitting(false);
        onOpenChange(false);
      } catch (error) {
        const code =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          typeof error.code === "string"
            ? error.code
            : "INTERNAL_ERROR";
        const message =
          error instanceof Error && error.message.length > 0
            ? error.message
            : "项目创建失败，请重试";
        setSubmitError({ code, message });
        console.error("[CreateProjectDialog] createProject failed:", {
          operation: "createAndSetCurrent",
          code,
          message,
          error,
        });
        setSubmitting(false);
      }
    },
    [createAndSetCurrent, customs, onOpenChange, presets],
  );

  const handleAiGenerate = useCallback(async () => {
    if (aiPrompt.trim().length === 0) {
      setAiErrorMessage("请先输入创作意图");
      return;
    }

    setAiGenerating(true);
    setAiErrorMessage(null);
    try {
      const res = await createAiAssistDraft({ prompt: aiPrompt });
      if (!res.ok) {
        setAiErrorMessage("AI 辅助创建暂时不可用，请手动创建或稍后重试");
        return;
      }

      setAiDraft(res.data);
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, createAiAssistDraft]);

  const handleTemplateCreated = useCallback(
    (_id: string) => {
      // Template selection is handled inside FormContent
      // Refresh templates
      void loadTemplates();
    },
    [loadTemplates],
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title="Create New Project"
        description="Start a new writing project with a template."
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
              data-testid="create-project-submit"
              variant="primary"
              size="sm"
              loading={submitting}
              type="submit"
              form={formId}
            >
              {submitting ? "Creating…" : "Create Project"}
            </Button>
          </>
        }
      >
        {open ? (
          <div className="space-y-4">
            <div role="tablist" aria-label="创建模式" className="flex gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "manual"}
                onClick={() => setMode("manual")}
                className="h-8 px-3 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border-default)]"
              >
                手动创建
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ai-assist"}
                onClick={() => setMode("ai-assist")}
                className="h-8 px-3 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border-default)]"
              >
                AI 辅助
              </button>
            </div>

            {mode === "manual" ? (
              <FormContent
                formId={formId}
                initialName={aiDraft?.name}
                initialDescription={aiDraft?.description}
                initialType={aiDraft?.type}
                defaultTemplateId={defaultTemplateId}
                presetOptions={presetOptions}
                customOptions={customOptions}
                hasCustomTemplates={hasCustomTemplates}
                lastError={submitError ?? lastError}
                onSubmit={handleSubmit}
                onOpenCreateTemplate={() => setCreateTemplateOpen(true)}
              />
            ) : (
              <div className="space-y-4">
                <Textarea
                  data-testid="create-project-ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="例如：帮我创建一部校园推理小说，主角是高中女生侦探"
                  rows={4}
                  fullWidth
                />
                <Button
                  data-testid="create-project-ai-generate"
                  variant="secondary"
                  size="sm"
                  loading={aiGenerating}
                  onClick={() => void handleAiGenerate()}
                >
                  {aiGenerating ? "生成中…" : "生成草案"}
                </Button>

                {aiErrorMessage ? (
                  <Text
                    size="small"
                    color="muted"
                    as="div"
                    className="text-[var(--color-error)]"
                  >
                    {aiErrorMessage}
                  </Text>
                ) : null}

                {aiDraft ? (
                  <div className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border-default)] p-3">
                    <Text size="small" color="default">
                      {aiDraft.name}（{aiDraft.type}）
                    </Text>
                    <Text size="small" color="muted">
                      章节：{aiDraft.chapterOutlines.length}，角色：
                      {aiDraft.characters.length}
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMode("manual")}
                    >
                      使用此草案继续手动创建
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </Dialog>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
