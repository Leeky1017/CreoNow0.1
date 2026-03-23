import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { Dialog, Text } from "../../components/primitives";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { Button } from "../../components/primitives/Button";
import { Textarea } from "../../components/primitives/Textarea";
import type {
  CustomSkillListItem,
  SkillFormState,
} from "./skill-manager.types";
import {
  DEFAULT_FORM,
  buildSkillDraftFromDescription,
  parseContextRulesText,
  readFieldName,
} from "./skill-manager-utils";
import { SkillFormFields } from "./SkillFormFields";
import { SkillItemList } from "./SkillItemList";
export type { CustomSkillListItem } from "./skill-manager.types";
/**
 * SkillManagerDialog provides custom skill CRUD + AI-assisted drafting.
 *
 * Why: P2 requires a dedicated management surface for manual create/edit/delete,
 * AI-assisted draft generation, and inline validation feedback.
 */
export function SkillManagerDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  onSaved?: () => Promise<void> | void;
}): JSX.Element {
  const [items, setItems] = useState<CustomSkillListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<SkillFormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { confirm, dialogProps } = useConfirmDialog();
  const { t } = useTranslation();

  const title = useMemo(
    () =>
      editingId
        ? t("ai.skillManager.editTitle")
        : t("ai.skillManager.createTitle"),
    [editingId, t],
  );

  async function loadCustomSkills(): Promise<void> {
    setLoading(true);
    const listed = await invoke("skill:custom:list", {});
    if (!listed.ok) {
      setFormError(getHumanErrorMessage(listed.error));
      setLoading(false);
      return;
    }
    setItems(listed.data.items);
    setLoading(false);
  }

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const timer = setTimeout(() => {
      void loadCustomSkills();
    }, 0);
    return () => {
      clearTimeout(timer);
    };
  }, [props.open]);

  function resetForm(): void {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setFormError(null);
    setFieldErrors({});
  }

  async function handleAiGenerate(): Promise<void> {
    const prompt = aiDescription.trim();
    if (prompt.length === 0) {
      setFormError(t("ai.skillManager.enterDescriptionFirst"));
      return;
    }

    const generated = await invoke("ai:chat:send", {
      message: prompt,
      projectId: props.projectId ?? "skill-manager",
    });
    if (!generated.ok) {
      setFormError(getHumanErrorMessage(generated.error));
      return;
    }

    const draft = buildSkillDraftFromDescription(generated.data.echoed);
    setForm((prev) => ({
      ...prev,
      ...draft,
    }));
    setFormError(null);
    setFieldErrors({});
  }

  async function handleDelete(item: CustomSkillListItem): Promise<void> {
    const confirmed = await confirm({
      title: t("ai.skillManager.confirmDeleteTitle", { name: item.name }),
      description: t("ai.skillManager.irreversible"),
      primaryLabel: t("ai.skillManager.delete"),
      secondaryLabel: t("ai.skillManager.cancel"),
    });
    if (!confirmed) {
      return;
    }

    const deleted = await invoke("skill:custom:delete", { id: item.id });
    if (!deleted.ok) {
      setFormError(getHumanErrorMessage(deleted.error));
      return;
    }

    await loadCustomSkills();
    await props.onSaved?.();

    if (editingId === item.id) {
      resetForm();
    }
  }

  function handleEdit(item: CustomSkillListItem): void {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      promptTemplate: item.promptTemplate,
      inputType: item.inputType,
      scope: item.scope,
      enabled: item.enabled,
      contextRulesText: JSON.stringify(item.contextRules, null, 2),
    });
    setFormError(null);
    setFieldErrors({});
  }

  async function handleSubmit(): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const parsedRules = parseContextRulesText(form.contextRulesText);
    if (!parsedRules.ok) {
      setFieldErrors({ contextRules: parsedRules.message });
      setSubmitting(false);
      return;
    }

    if (editingId) {
      const updated = await invoke("skill:custom:update", {
        id: editingId,
        name: form.name,
        description: form.description,
        promptTemplate: form.promptTemplate,
        inputType: form.inputType,
        contextRules: parsedRules.data,
        scope: form.scope,
        enabled: form.enabled,
      });
      if (!updated.ok) {
        const fieldName = readFieldName(updated.error);
        if (fieldName) {
          setFieldErrors({ [fieldName]: getHumanErrorMessage(updated.error) });
        } else {
          setFormError(getHumanErrorMessage(updated.error));
        }
        setSubmitting(false);
        return;
      }
    } else {
      const created = await invoke("skill:custom:create", {
        name: form.name,
        description: form.description,
        promptTemplate: form.promptTemplate,
        inputType: form.inputType,
        contextRules: parsedRules.data,
        scope: form.scope,
        enabled: form.enabled,
      });
      if (!created.ok) {
        const fieldName = readFieldName(created.error);
        if (fieldName) {
          setFieldErrors({ [fieldName]: getHumanErrorMessage(created.error) });
        } else {
          setFormError(getHumanErrorMessage(created.error));
        }
        setSubmitting(false);
        return;
      }
    }

    await loadCustomSkills();
    await props.onSaved?.();
    resetForm();
    setSubmitting(false);
  }

  return (
    <>
      <Dialog
        open={props.open}
        onOpenChange={(nextOpen) => {
          props.onOpenChange(nextOpen);
          if (!nextOpen) {
            resetForm();
          }
        }}
        title={t("ai.skillManager.dialogTitle")}
        description={t("ai.skillManager.dialogDescription")}
        footer={
          <>
            <Button
              type="button"
              className="px-3 py-2 rounded border border-[var(--color-border-default)] text-[var(--color-fg-default)]"
              onClick={resetForm}
              data-testid="skill-manager-reset"
            >
              {t("ai.skillManager.reset")}
            </Button>
            <Button
              type="button"
              className="px-3 py-2 rounded bg-[var(--color-accent-emphasis)] text-[var(--color-fg-on-emphasis)] disabled:opacity-50"
              onClick={() => void handleSubmit()}
              disabled={submitting}
              data-testid="skill-manager-save"
            >
              {submitting
                ? t("ai.skillManager.saving")
                : editingId
                  ? t("ai.skillManager.saveChanges")
                  : t("ai.skillManager.createSkill")}
            </Button>
          </>
        }
      >
        <div className="space-y-4" data-testid="skill-manager-dialog">
          <section className="space-y-2">
            <Text size="tiny" color="muted" className="uppercase tracking-wide">
              {t("ai.skillManager.aiAssisted")}
            </Text>
            <Textarea
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder={t("ai.skillManager.aiPlaceholder")}
              className="w-full min-h-20 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2 text-sm"
              data-testid="skill-manager-ai-description"
            />
            <Button
              type="button"
              className="px-3 py-2 rounded border border-[var(--color-border-default)] text-[var(--color-fg-default)]"
              onClick={() => void handleAiGenerate()}
              data-testid="skill-manager-ai-generate"
            >
              {t("ai.skillManager.aiGenerateConfig")}
            </Button>
          </section>

          <SkillFormFields
            heading={title}
            form={form}
            onFormChange={setForm}
            fieldErrors={fieldErrors}
          />

          {formError && (
            <div
              className="rounded border border-[var(--color-error)]/40 bg-[var(--color-error-subtle)] p-2 text-xs text-[var(--color-error)]"
              data-testid="skill-form-error"
            >
              {formError}
            </div>
          )}

          <SkillItemList
            items={items}
            loading={loading}
            onEdit={handleEdit}
            onDelete={(item) => void handleDelete(item)}
          />
        </div>
      </Dialog>

      <SystemDialog {...dialogProps} />
    </>
  );
}
