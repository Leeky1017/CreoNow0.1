import type { SkillListItem } from "../../stores/aiStore";

import { useTranslation } from "react-i18next";
import { Text } from "../../components/primitives";
import { Tooltip } from "../../components/primitives/Tooltip";
import { resolveSkillsForPicker } from "./scopeResolver";

import { Plus } from "lucide-react";
import { Button } from "../../components/primitives/Button";

/**
 * SkillItemRow – renders one skill entry with optional action buttons.
 */
function SkillItemRow(props: {
  item: SkillListItem;
  selected: boolean;
  subtitle: string;
  onSelect: () => void;
  actionButtons?: JSX.Element;
}): JSX.Element {
  const disabled = !props.item.enabled || !props.item.valid;

  return (
    <div
      className="flex items-center gap-1"
      data-testid={`ai-skill-row-${props.item.id}`}
    >
      <Button
        type="button"
        data-testid={`ai-skill-${props.item.id}`}
        disabled={disabled}
        onClick={props.onSelect}
        className={`
          flex-1 flex flex-col gap-0.5 text-left px-2.5 py-2 rounded-[10px] border
          transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
          ${
            props.selected
              ? "border-[var(--color-border-accent)] bg-[var(--color-bg-base)]"
              : "border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
          }
          ${
            disabled
              ? "text-[var(--color-fg-muted)] opacity-50 cursor-not-allowed"
              : "text-[var(--color-fg-default)] cursor-pointer hover:border-[var(--color-border-hover)]"
          }
        `}
      >
        <Text
          size="small"
          weight="semibold"
          color={disabled ? "muted" : "default"}
        >
          {props.item.name}
        </Text>
        <Text size="tiny" color="muted">
          {props.subtitle}
        </Text>
      </Button>
      {props.actionButtons}
    </div>
  );
}

/**
 * SkillPicker renders grouped skill entries and scope controls.
 */
export function SkillPicker(props: {
  open: boolean;
  items: SkillListItem[];
  selectedSkillId: string;
  onOpenChange: (open: boolean) => void;
  onSelectSkillId: (skillId: string) => void;
  onOpenSettings?: () => void;
  onToggleSkill?: (skillId: string, enabled: boolean) => void;
  onUpdateScope?: (skillId: string, scope: "global" | "project") => void;
  onCreateSkill?: () => void;
}): JSX.Element | null {
  const { t } = useTranslation();

  function scopeLabel(scope: SkillListItem["scope"]): string {
    if (scope === "builtin") {
      return t("ai.skillPicker.builtin");
    }
    if (scope === "global") {
      return t("ai.skillPicker.global");
    }
    return t("ai.skillPicker.project");
  }

  if (!props.open) {
    return null;
  }

  const grouped = resolveSkillsForPicker(props.items);
  const hasCustomSkills =
    grouped.global.length > 0 || grouped.project.length > 0;

  return (
    <>
      <div
        role="presentation"
        onClick={() => props.onOpenChange(false)}
        className="fixed inset-0 z-[var(--z-dropdown)]"
      />

      <div
        role="dialog"
        aria-label={t("ai.skillPicker.ariaLabel")}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full left-0 right-0 mb-1 p-2.5 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-center justify-between">
          <Text size="label" color="muted">
            SKILL
          </Text>

          <Tooltip content="SKILL Settings">
            <Button
              type="button"
              className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
              onClick={() => {
                props.onOpenSettings?.();
              }}
              aria-label={t("ai.skillPicker.openSettings")}
            >
              <Plus size={16} strokeWidth={1.5} />
            </Button>
          </Tooltip>
        </div>

        <div className="mt-2 max-h-72 overflow-auto space-y-3">
          <section>
            <Text size="tiny" color="muted" className="uppercase tracking-wide">
              {t("ai.skillPicker.builtinSkills")}
            </Text>
            <div className="mt-1.5 space-y-1.5">
              {grouped.builtin.map((item) => {
                const selected = item.id === props.selectedSkillId;
                const subtitle = !item.enabled
                  ? "Disabled"
                  : !item.valid
                    ? "Invalid"
                    : item.isProjectOverride
                      ? t("ai.skillPicker.projectOverride")
                      : scopeLabel(item.scope);

                return (
                  <SkillItemRow
                    key={item.id}
                    item={item}
                    selected={selected}
                    subtitle={subtitle}
                    onSelect={() => props.onSelectSkillId(item.id)}
                    actionButtons={
                      props.onToggleSkill ? (
                        <Button
                          type="button"
                          data-testid={`ai-skill-toggle-${item.id}`}
                          className="px-2 py-1 text-(--text-label) rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                          onClick={() =>
                            props.onToggleSkill?.(item.id, !item.enabled)
                          }
                        >
                          {item.enabled
                            ? t("ai.skillPicker.disable")
                            : t("ai.skillPicker.enable")}
                        </Button>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </section>

          <section>
            <Text size="tiny" color="muted" className="uppercase tracking-wide">
              {t("ai.skillPicker.customSkills")}
            </Text>

            {!hasCustomSkills ? (
              <div className="mt-1.5 p-2 rounded-[10px] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
                <Text size="small" color="muted">
                  {t("ai.skillPicker.noCustomSkillsHint")}
                </Text>
                <Button
                  type="button"
                  className="mt-2 px-2 py-1 text-(--text-status) rounded border border-[var(--color-border-default)] text-[var(--color-fg-default)]"
                  onClick={() => {
                    if (props.onCreateSkill) {
                      props.onCreateSkill();
                      return;
                    }
                    props.onOpenSettings?.();
                  }}
                >
                  {t("ai.skillPicker.createSkill")}
                </Button>
              </div>
            ) : (
              <div className="mt-1.5 space-y-2">
                <div>
                  <Text size="tiny" color="muted">
                    {t("ai.skillPicker.globalSkills")}
                  </Text>
                  {grouped.global.length === 0 ? (
                    <Text size="tiny" color="muted" className="mt-1 block">
                      {t("ai.skillPicker.noGlobalSkills")}
                    </Text>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {grouped.global.map((item) => {
                        const selected = item.id === props.selectedSkillId;
                        const subtitle = !item.enabled
                          ? "Disabled"
                          : !item.valid
                            ? "Invalid"
                            : scopeLabel(item.scope);

                        return (
                          <SkillItemRow
                            key={item.id}
                            item={item}
                            selected={selected}
                            subtitle={subtitle}
                            onSelect={() => props.onSelectSkillId(item.id)}
                            actionButtons={
                              <>
                                {props.onUpdateScope && (
                                  <Button
                                    type="button"
                                    data-testid={`ai-skill-demote-${item.id}`}
                                    className="px-2 py-1 text-(--text-label) rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                    onClick={() =>
                                      props.onUpdateScope?.(item.id, "project")
                                    }
                                  >
                                    {t("ai.skillPicker.demoteToProject")}
                                  </Button>
                                )}
                                {props.onToggleSkill && (
                                  <Button
                                    type="button"
                                    data-testid={`ai-skill-toggle-${item.id}`}
                                    className="px-2 py-1 text-(--text-label) rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                    onClick={() =>
                                      props.onToggleSkill?.(
                                        item.id,
                                        !item.enabled,
                                      )
                                    }
                                  >
                                    {item.enabled
                                      ? t("ai.skillPicker.disable")
                                      : t("ai.skillPicker.enable")}
                                  </Button>
                                )}
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Text size="tiny" color="muted">
                    {t("ai.skillPicker.projectSkills")}
                  </Text>
                  {grouped.project.length === 0 ? (
                    <Text size="tiny" color="muted" className="mt-1 block">
                      {t("ai.skillPicker.noProjectSkills")}
                    </Text>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {grouped.project.map((item) => {
                        const selected = item.id === props.selectedSkillId;
                        const subtitle = !item.enabled
                          ? "Disabled"
                          : !item.valid
                            ? "Invalid"
                            : item.isProjectOverride
                              ? t("ai.skillPicker.projectOverride")
                              : scopeLabel(item.scope);

                        return (
                          <SkillItemRow
                            key={item.id}
                            item={item}
                            selected={selected}
                            subtitle={subtitle}
                            onSelect={() => props.onSelectSkillId(item.id)}
                            actionButtons={
                              <>
                                {props.onUpdateScope && (
                                  <Button
                                    type="button"
                                    data-testid={`ai-skill-promote-${item.id}`}
                                    className="px-2 py-1 text-(--text-label) rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                    onClick={() =>
                                      props.onUpdateScope?.(item.id, "global")
                                    }
                                  >
                                    {t("ai.skillPicker.promoteToGlobal")}
                                  </Button>
                                )}
                                {props.onToggleSkill && (
                                  <Button
                                    type="button"
                                    data-testid={`ai-skill-toggle-${item.id}`}
                                    className="px-2 py-1 text-(--text-label) rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                    onClick={() =>
                                      props.onToggleSkill?.(
                                        item.id,
                                        !item.enabled,
                                      )
                                    }
                                  >
                                    {item.enabled
                                      ? t("ai.skillPicker.disable")
                                      : t("ai.skillPicker.enable")}
                                  </Button>
                                )}
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
