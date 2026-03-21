import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { IpcError, IpcResponseData } from "@shared/types/ipc-generated";
import { SystemDialog } from "../../components/features/AiDialogs/SystemDialog";
import { Dialog, Text } from "../../components/primitives";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { i18n } from "../../i18n";
import { invoke } from "../../lib/ipcClient";
import { getHumanErrorMessage } from "../../lib/errorMessages";
import { Button } from "../../components/primitives/Button";
import { Input } from "../../components/primitives/Input";
import { Textarea } from "../../components/primitives/Textarea";
import { Select } from "../../components/primitives/Select";
import { Label } from "../../components/primitives/Label";

export type CustomSkillListItem =
  IpcResponseData<"skill:custom:list">["items"][number];

type SkillFormState = {
  name: string;
  description: string;
  promptTemplate: string;
  inputType: "selection" | "document";
  scope: "global" | "project";
  enabled: boolean;
  contextRulesText: string;
};

type CustomSkillContextRules = Record<string, string | number | boolean>;

const DEFAULT_FORM: SkillFormState = {
  name: "",
  description: "",
  promptTemplate: "",
  inputType: "selection",
  scope: "project",
  enabled: true,
  contextRulesText: "{}",
};

function buildSkillDraftFromDescription(
  description: string,
): Pick<
  SkillFormState,
  "name" | "description" | "promptTemplate" | "inputType" | "contextRulesText"
> {
  const normalized = description.trim();
  const shortName =
    normalized.slice(0, 16) || i18n.t("ai.skillManager.aiGeneratedSkill");

  return {
    name: shortName,
    description: normalized,
    promptTemplate: `请根据以下要求处理文本：${normalized}\n\n原文：{{input}}`,
    inputType: normalized.includes("续写") ? "document" : "selection",
    contextRulesText: JSON.stringify({ style_guide: true }, null, 2),
  };
}

function parseContextRulesText(
  text: string,
):
  | { ok: true; data: CustomSkillContextRules }
  | { ok: false; message: string } {
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {
        ok: false,
        message: i18n.t("ai.skillManager.contextRulesMustBeObject"),
      };
    }
    return { ok: true, data: parsed as CustomSkillContextRules };
  } catch {
    return {
      ok: false,
      message: i18n.t("ai.skillManager.contextRulesInvalidJson"),
    };
  }
}

function readFieldName(error: IpcError): string | null {
  const details = error.details;
  if (!details || typeof details !== "object") {
    return null;
  }
  const fieldName = (details as { fieldName?: unknown }).fieldName;
  return typeof fieldName === "string" ? fieldName : null;
}

// ============================================================================
// Extracted sub-components
// ============================================================================

/**
 * SkillFormFields – the form inputs for creating/editing a custom skill.
 */
function SkillFormFields(props: {
  heading: string;
  form: SkillFormState;
  onFormChange: React.Dispatch<React.SetStateAction<SkillFormState>>;
  fieldErrors: Record<string, string>;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <Text size="tiny" color="muted" className="uppercase tracking-wide">
        {props.heading}
      </Text>

      <Label className="block text-xs text-[var(--color-fg-muted)]">
        {t("ai.skillManager.fieldName")}
        <Input
          value={props.form.name}
          onChange={(e) =>
            props.onFormChange((prev) => ({ ...prev, name: e.target.value }))
          }
          className="mt-1 w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2 text-sm"
          data-testid="skill-form-name"
        />
        {props.fieldErrors.name && (
          <span className="mt-1 block text-xs text-[var(--color-error)]">
            {props.fieldErrors.name}
          </span>
        )}
      </Label>

      <Label className="block text-xs text-[var(--color-fg-muted)]">
        {t("ai.skillManager.fieldDescription")}
        <Input
          value={props.form.description}
          onChange={(e) =>
            props.onFormChange((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          className="mt-1 w-full rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2 text-sm"
          data-testid="skill-form-description"
        />
        {props.fieldErrors.description && (
          <span className="mt-1 block text-xs text-[var(--color-error)]">
            {props.fieldErrors.description}
          </span>
        )}
      </Label>

      <Label className="block text-xs text-[var(--color-fg-muted)]">
        {t("ai.skillManager.fieldPromptTemplate")}
        <Textarea
          value={props.form.promptTemplate}
          onChange={(e) =>
            props.onFormChange((prev) => ({
              ...prev,
              promptTemplate: e.target.value,
            }))
          }
          placeholder={t("ai.skillManager.promptPlaceholder")}
          className="mt-1 w-full min-h-20 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2 text-sm"
          data-testid="skill-form-prompt-template"
        />
        {props.fieldErrors.promptTemplate && (
          <span
            className="mt-1 block text-xs text-[var(--color-error)]"
            data-testid="skill-form-error-promptTemplate"
          >
            {props.fieldErrors.promptTemplate}
          </span>
        )}
      </Label>

      <div className="grid grid-cols-2 gap-2">
        <div className="block text-xs text-[var(--color-fg-muted)]">
          <Label className="block text-xs text-[var(--color-fg-muted)] mb-1">
            {t("ai.skillManager.fieldInputType")}
          </Label>
          <Select
            value={props.form.inputType}
            onValueChange={(val) =>
              props.onFormChange((prev) => ({
                ...prev,
                inputType: val as "selection" | "document",
              }))
            }
            options={[
              { value: "selection", label: t("ai.skillManager.inputTypeSelection") },
              { value: "document", label: t("ai.skillManager.inputTypeDocument") },
            ]}
            className="mt-1 w-full text-sm"
            data-testid="skill-form-input-type"
            fullWidth
          />
        </div>

        <div className="block text-xs text-[var(--color-fg-muted)]">
          <Label className="block text-xs text-[var(--color-fg-muted)] mb-1">
            {t("ai.skillManager.fieldScope")}
          </Label>
          <Select
            value={props.form.scope}
            onValueChange={(val) =>
              props.onFormChange((prev) => ({
                ...prev,
                scope: val as "global" | "project",
              }))
            }
            options={[
              { value: "project", label: t("ai.skillManager.scopeProject") },
              { value: "global", label: t("ai.skillManager.scopeGlobal") },
            ]}
            className="mt-1 w-full text-sm"
            data-testid="skill-form-scope"
            fullWidth
          />
        </div>
      </div>

      <Label className="block text-xs text-[var(--color-fg-muted)]">
        {t("ai.skillManager.fieldContextRules")}
        <Textarea
          value={props.form.contextRulesText}
          onChange={(e) =>
            props.onFormChange((prev) => ({
              ...prev,
              contextRulesText: e.target.value,
            }))
          }
          className="mt-1 w-full min-h-16 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-2 text-sm"
          data-testid="skill-form-context-rules"
        />
        {props.fieldErrors.contextRules && (
          <span className="mt-1 block text-xs text-[var(--color-error)]">
            {props.fieldErrors.contextRules}
          </span>
        )}
      </Label>

      <Label className="flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
        {/* eslint-disable-next-line creonow/no-native-html-element -- <input type="checkbox"> 无对应 Primitive */}
        <input
          type="checkbox"
          checked={props.form.enabled}
          onChange={(e) =>
            props.onFormChange((prev) => ({
              ...prev,
              enabled: e.target.checked,
            }))
          }
          data-testid="skill-form-enabled"
        />
        {t("ai.skillManager.enableSkill")}
      </Label>
    </section>
  );
}

/**
 * SkillItemList – the existing custom skill list with edit/delete buttons.
 */
function SkillItemList(props: {
  items: CustomSkillListItem[];
  loading: boolean;
  onEdit: (item: CustomSkillListItem) => void;
  onDelete: (item: CustomSkillListItem) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <section className="space-y-2">
      <Text size="tiny" color="muted" className="uppercase tracking-wide">
        {t("ai.skillManager.customSkillList")}
      </Text>
      {props.loading ? (
        <Text size="small" color="muted">
          {t("ai.skillManager.loading")}
        </Text>
      ) : props.items.length === 0 ? (
        <Text size="small" color="muted">
          {t("ai.skillManager.noCustomSkills")}
        </Text>
      ) : (
        <div className="space-y-2" data-testid="skill-manager-list">
          {props.items.map((item) => (
            <div
              key={item.id}
              className="rounded border border-[var(--color-border-default)] p-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Text size="small" weight="semibold">
                    {item.name}
                  </Text>
                  <Text size="tiny" color="muted">
                    {item.scope === "project"
                      ? t("ai.skillManager.scopeProject")
                      : t("ai.skillManager.scopeGlobal")}{" "}
                    · {item.inputType}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="px-2 py-1 rounded border border-[var(--color-border-default)] text-xs"
                    onClick={() => props.onEdit(item)}
                    data-testid={`skill-item-edit-${item.id}`}
                  >
                    {t("ai.skillManager.edit")}
                  </Button>
                  <Button
                    type="button"
                    className="px-2 py-1 rounded border border-[var(--color-error)]/30 text-xs text-[var(--color-error)]"
                    onClick={() => props.onDelete(item)}
                    data-testid={`skill-item-delete-${item.id}`}
                  >
                    {t("ai.skillManager.delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// Main component
// ============================================================================

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
