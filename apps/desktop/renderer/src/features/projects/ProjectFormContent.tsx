import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
import { getHumanErrorMessage } from "../../lib/errorMessages";
import type { IpcErrorCode } from "@shared/types/ipc-generated";
import { Plus } from "lucide-react";
import { Button } from "../../components/primitives/Button";
import { Label } from "../../components/primitives/Label";

export interface ProjectFormContentProps {
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

export function ProjectFormContent({
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
}: ProjectFormContentProps): JSX.Element {
  const { t } = useTranslation();
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
    [
      coverImage,
      cropArea,
      description,
      initialType,
      name,
      onSubmit,
      templateId,
    ],
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
        <Label className="block mb-2">
          <Text size="small" color="muted">
            {t("projects.create.projectNameLabel")}{" "}
            <span className="text-[var(--color-error)]">{"*"}</span>
          </Text>
        </Label>
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
            {t("projects.create.nameRequired")}
          </Text>
        )}
      </div>

      {/* Template Selection */}
      <div>
        <Label className="block mb-2">
          <Text size="small" color="muted">
            {t("projects.create.templateLabel")}
          </Text>
        </Label>

        <RadioGroupRoot
          value={templateId}
          onValueChange={setTemplateId}
          className="grid grid-cols-2 gap-3"
        >
          {presetOptions.map((opt) => (
            <RadioCardItem
              key={opt.value}
              value={opt.value}
              label={opt.label}
            />
          ))}
        </RadioGroupRoot>

        {hasCustomTemplates && (
          <div className="mt-4">
            <Text size="small" color="muted" as="div" className="mb-2">
              {t("projects.create.yourTemplates")}
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

        <div className="mt-3">
          <Button
            type="button"
            onClick={onOpenCreateTemplate}
            className="h-10 px-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-sm text-[var(--color-fg-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-fg-default)] transition-colors"
          >
            <Plus size={16} strokeWidth={1.5} />
            {t("projects.create.createTemplateButton")}
          </Button>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="block mb-2">
          <Text size="small" color="muted">
            {t("projects.create.descriptionLabel")}{" "}
            <span className="opacity-50 text-xs">
              {t("projects.create.optionalHint")}
            </span>
          </Text>
        </Label>
        <Textarea
          data-testid="create-project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("projects.create.descriptionPlaceholder")}
          fullWidth
          rows={2}
        />
      </div>

      {/* Cover Image */}
      <div>
        <Label className="block mb-2">
          <Text size="small" color="muted">
            {t("projects.create.coverImageLabel")}{" "}
            <span className="opacity-50 text-xs">
              {t("projects.create.optionalHint")}
            </span>
          </Text>
        </Label>
        <ImageUpload
          value={coverImage}
          onChange={setCoverImage}
          onError={setImageError}
          placeholder={t("projects.create.imagePlaceholder")}
          hint="PNG, JPG up to 5MB"
        />
        {coverImage && (
          <ImageCropper file={coverImage} onCropChange={setCropArea} />
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
          role="alert"
          className="text-[var(--color-text-error)]"
        >
          {getHumanErrorMessage(
            lastError as { code: IpcErrorCode; message: string },
          )}
        </Text>
      )}

      {/* 审计：v1-13 #027 KEEP */}
      {/* eslint-disable-next-line creonow/no-native-html-element -- 技术原因：<input type="hidden"> 是表单语义元素，无对应 Primitive 组件 */}
      <input type="hidden" data-submitting={submitting} />
    </form>
  );
}
