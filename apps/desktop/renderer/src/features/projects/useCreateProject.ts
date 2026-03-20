import { useState, useEffect, useCallback, useMemo } from "react";
import type { TFunction } from "i18next";
import type { CropArea } from "../../components/composites/ImageCropper";
import { useProjectStore } from "../../stores/projectStore";
import { useTemplateStore } from "../../stores/templateStore";
import type { AiDraft } from "./AiAssistSection";

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

export function useCreateProject(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  t: TFunction,
) {
  const createAndSetCurrent = useProjectStore((s) => s.createAndSetCurrent);
  const createAiAssistDraft = useProjectStore((s) => s.createAiAssistDraft);
  const clearError = useProjectStore((s) => s.clearError);
  const lastError = useProjectStore((s) => s.lastError);

  const presets = useTemplateStore((s) => s.presets);
  const customs = useTemplateStore((s) => s.customs);
  const loadTemplates = useTemplateStore((s) => s.loadTemplates);

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
  const [aiDraft, setAiDraft] = useState<AiDraft | null>(null);

  const defaultTemplateId = useMemo(
    () => (presets.length > 0 ? presets[0].id : ""),
    [presets],
  );

  const presetOptions = useMemo(
    () => presets.map((t) => ({ value: t.id, label: t.name })),
    [presets],
  );

  const customOptions = useMemo(
    () => customs.map((t) => ({ value: t.id, label: t.name })),
    [customs],
  );

  const hasCustomTemplates = customs.length > 0;

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

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
      coverImage?: File | null;
      cropArea?: CropArea | null;
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
          coverImage: data.coverImage ?? null,
          cropArea: data.cropArea ?? null,
        });

        if (!res.ok) {
          setSubmitError({ code: res.error.code, message: res.error.message });
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
            : t("projects.create.createFailed");
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
    [createAndSetCurrent, customs, onOpenChange, presets, t],
  );

  const handleAiGenerate = useCallback(async () => {
    if (aiPrompt.trim().length === 0) {
      setAiErrorMessage(t("projects.create.enterIntentFirst"));
      return;
    }
    setAiGenerating(true);
    setAiErrorMessage(null);
    try {
      const res = await createAiAssistDraft({ prompt: aiPrompt });
      if (!res.ok) {
        setAiErrorMessage(t("projects.create.aiUnavailable"));
        return;
      }
      setAiDraft(res.data);
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, createAiAssistDraft, t]);

  const handleTemplateCreated = useCallback(
    (_id: string) => {
      void loadTemplates();
    },
    [loadTemplates],
  );

  return {
    lastError,
    createTemplateOpen,
    setCreateTemplateOpen,
    submitting,
    submitError,
    mode,
    setMode,
    aiPrompt,
    setAiPrompt,
    aiGenerating,
    aiErrorMessage,
    aiDraft,
    defaultTemplateId,
    presetOptions,
    customOptions,
    hasCustomTemplates,
    handleSubmit,
    handleAiGenerate,
    handleTemplateCreated,
  };
}
