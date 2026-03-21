import { useTranslation } from "react-i18next";

import { Button } from "../../components/primitives/Button";
import { Dialog } from "../../components/primitives/Dialog";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { ProjectFormContent } from "./ProjectFormContent";
import { AiAssistSection } from "./AiAssistSection";
import { useCreateProject } from "./useCreateProject";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps): JSX.Element {
  const { t } = useTranslation();
  const formId = "create-project-form";

  const {
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
  } = useCreateProject(open, onOpenChange, t);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("projects.create.dialogTitle")}
        description={t("projects.create.dialogDescription")}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("projects.create.cancel")}
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
            <div
              role="tablist"
              aria-label={t("projects.create.modeLabel")}
              className="flex gap-2"
            >
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                role="tab"
                aria-selected={mode === "manual"}
                onClick={() => setMode("manual")}
                className="h-8 px-3 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border-default)]"
              >
                {t("projects.create.manualCreate")}
              </button>
              {/* eslint-disable-next-line creonow/no-native-html-element -- specialized button */}
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ai-assist"}
                onClick={() => setMode("ai-assist")}
                className="h-8 px-3 text-xs rounded-[var(--radius-sm)] border border-[var(--color-border-default)]"
              >
                {t("projects.create.aiAssisted")}
              </button>
            </div>

            {mode === "manual" ? (
              <ProjectFormContent
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
              <AiAssistSection
                aiPrompt={aiPrompt}
                setAiPrompt={setAiPrompt}
                aiGenerating={aiGenerating}
                aiErrorMessage={aiErrorMessage}
                aiDraft={aiDraft}
                onGenerate={() => void handleAiGenerate()}
                onUseDraft={() => setMode("manual")}
              />
            )}
          </div>
        ) : null}
      </Dialog>

      <CreateTemplateDialog
        open={createTemplateOpen}
        onOpenChange={setCreateTemplateOpen}
        onCreated={handleTemplateCreated}
      />
    </>
  );
}
