import type { SkillListItem } from "../../stores/aiStore";

import { Text } from "../../components/primitives";
import { resolveSkillsForPicker } from "./scopeResolver";

function scopeLabel(scope: SkillListItem["scope"]): string {
  if (scope === "builtin") {
    return "内置";
  }
  if (scope === "global") {
    return "全局";
  }
  return "项目";
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
        aria-label="SKILL"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-full left-0 right-0 mb-1 p-2.5 z-[var(--z-popover)] bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)]"
      >
        <div className="flex items-center justify-between">
          <Text size="label" color="muted">
            SKILL
          </Text>

          <button
            type="button"
            title="SKILL Settings"
            className="w-5 h-5 flex items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
            onClick={() => {
              props.onOpenSettings?.();
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="mt-2 max-h-72 overflow-auto space-y-3">
          <section>
            <Text size="tiny" color="muted" className="uppercase tracking-wide">
              内置技能
            </Text>
            <div className="mt-1.5 space-y-1.5">
              {grouped.builtin.map((item) => {
                const selected = item.id === props.selectedSkillId;
                const disabled = !item.enabled || !item.valid;
                const subtitle = !item.enabled
                  ? "Disabled"
                  : !item.valid
                    ? "Invalid"
                    : item.isProjectOverride
                      ? "项目级覆盖"
                      : scopeLabel(item.scope);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-1"
                    data-testid={`ai-skill-row-${item.id}`}
                  >
                    <button
                      type="button"
                      data-testid={`ai-skill-${item.id}`}
                      disabled={disabled}
                      onClick={() => props.onSelectSkillId(item.id)}
                      className={`
                        flex-1 flex flex-col gap-0.5 text-left px-2.5 py-2 rounded-[10px] border
                        transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
                        ${
                          selected
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
                        {item.name}
                      </Text>

                      <Text size="tiny" color="muted">
                        {subtitle}
                      </Text>
                    </button>

                    {props.onToggleSkill && (
                      <button
                        type="button"
                        data-testid={`ai-skill-toggle-${item.id}`}
                        className="px-2 py-1 text-[10px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                        onClick={() =>
                          props.onToggleSkill?.(item.id, !item.enabled)
                        }
                      >
                        {item.enabled ? "停用" : "启用"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <Text size="tiny" color="muted" className="uppercase tracking-wide">
              自定义技能
            </Text>

            {!hasCustomSkills ? (
              <div className="mt-1.5 p-2 rounded-[10px] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
                <Text size="small" color="muted">
                  暂无自定义技能，点击创建或用自然语言描述需求
                </Text>
                <button
                  type="button"
                  className="mt-2 px-2 py-1 text-[11px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-default)]"
                  onClick={() => {
                    if (props.onCreateSkill) {
                      props.onCreateSkill();
                      return;
                    }
                    props.onOpenSettings?.();
                  }}
                >
                  创建技能
                </button>
              </div>
            ) : (
              <div className="mt-1.5 space-y-2">
                <div>
                  <Text size="tiny" color="muted">
                    全局技能
                  </Text>
                  {grouped.global.length === 0 ? (
                    <Text size="tiny" color="muted" className="mt-1 block">
                      暂无全局技能
                    </Text>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {grouped.global.map((item) => {
                        const selected = item.id === props.selectedSkillId;
                        const disabled = !item.enabled || !item.valid;
                        const subtitle = !item.enabled
                          ? "Disabled"
                          : !item.valid
                            ? "Invalid"
                            : scopeLabel(item.scope);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-1"
                          >
                            <button
                              type="button"
                              data-testid={`ai-skill-${item.id}`}
                              disabled={disabled}
                              onClick={() => props.onSelectSkillId(item.id)}
                              className={`
                                flex-1 flex flex-col gap-0.5 text-left px-2.5 py-2 rounded-[10px] border
                                transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
                                ${
                                  selected
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
                                {item.name}
                              </Text>
                              <Text size="tiny" color="muted">
                                {subtitle}
                              </Text>
                            </button>

                            {props.onUpdateScope && (
                              <button
                                type="button"
                                data-testid={`ai-skill-demote-${item.id}`}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                onClick={() =>
                                  props.onUpdateScope?.(item.id, "project")
                                }
                              >
                                降级为项目
                              </button>
                            )}

                            {props.onToggleSkill && (
                              <button
                                type="button"
                                data-testid={`ai-skill-toggle-${item.id}`}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                onClick={() =>
                                  props.onToggleSkill?.(item.id, !item.enabled)
                                }
                              >
                                {item.enabled ? "停用" : "启用"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <Text size="tiny" color="muted">
                    项目技能
                  </Text>
                  {grouped.project.length === 0 ? (
                    <Text size="tiny" color="muted" className="mt-1 block">
                      暂无项目技能
                    </Text>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      {grouped.project.map((item) => {
                        const selected = item.id === props.selectedSkillId;
                        const disabled = !item.enabled || !item.valid;
                        const subtitle = !item.enabled
                          ? "Disabled"
                          : !item.valid
                            ? "Invalid"
                            : item.isProjectOverride
                              ? "项目级覆盖"
                              : scopeLabel(item.scope);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-1"
                          >
                            <button
                              type="button"
                              data-testid={`ai-skill-${item.id}`}
                              disabled={disabled}
                              onClick={() => props.onSelectSkillId(item.id)}
                              className={`
                                flex-1 flex flex-col gap-0.5 text-left px-2.5 py-2 rounded-[10px] border
                                transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]
                                ${
                                  selected
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
                                {item.name}
                              </Text>
                              <Text size="tiny" color="muted">
                                {subtitle}
                              </Text>
                            </button>

                            {props.onUpdateScope && (
                              <button
                                type="button"
                                data-testid={`ai-skill-promote-${item.id}`}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                onClick={() =>
                                  props.onUpdateScope?.(item.id, "global")
                                }
                              >
                                提升为全局
                              </button>
                            )}

                            {props.onToggleSkill && (
                              <button
                                type="button"
                                data-testid={`ai-skill-toggle-${item.id}`}
                                className="px-2 py-1 text-[10px] rounded border border-[var(--color-border-default)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg-default)]"
                                onClick={() =>
                                  props.onToggleSkill?.(item.id, !item.enabled)
                                }
                              >
                                {item.enabled ? "停用" : "启用"}
                              </button>
                            )}
                          </div>
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
