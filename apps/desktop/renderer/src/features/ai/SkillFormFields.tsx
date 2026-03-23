import { useTranslation } from "react-i18next";

import { Text } from "../../components/primitives";
import { Checkbox } from "../../components/primitives/Checkbox";
import { Input } from "../../components/primitives/Input";
import { Label } from "../../components/primitives/Label";
import { Select } from "../../components/primitives/Select";
import { Textarea } from "../../components/primitives/Textarea";

import type { SkillFormState } from "./skill-manager.types";

/**
 * SkillFormFields – the form inputs for creating/editing a custom skill.
 */
export function SkillFormFields(props: {
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
              {
                value: "selection",
                label: t("ai.skillManager.inputTypeSelection"),
              },
              {
                value: "document",
                label: t("ai.skillManager.inputTypeDocument"),
              },
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

      <Checkbox
        checked={props.form.enabled}
        onCheckedChange={(val) =>
          props.onFormChange((prev) => ({
            ...prev,
            enabled: val === true,
          }))
        }
        label={t("ai.skillManager.enableSkill")}
        data-testid="skill-form-enabled"
      />
    </section>
  );
}
